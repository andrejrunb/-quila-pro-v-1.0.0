import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as contactDb from "../db/contacts";
import { notifyOwner } from "../_core/notification";
import { sendSMS } from "./twilio";
import { handleNewContactWorkflow, handleContactResponseWorkflow } from "./contact-workflow";

/**
 * Schema de validação para submissão de contato
 */
const createContactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(255),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  schoolName: z.string().optional(),
  subject: z.string().min(5, "Assunto deve ter pelo menos 5 caracteres").max(255),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
});

export const contactRouter = router({
  /**
   * Criar uma nova submissão de contato (público)
   */
  submit: publicProcedure
    .input(createContactSchema)
    .mutation(async ({ input }) => {
      try {
        // Criar submissão no banco de dados
        const submission = await contactDb.createContactSubmission({
          name: input.name,
          email: input.email,
          phone: input.phone,
          schoolName: input.schoolName,
          subject: input.subject,
          message: input.message,
          status: "new",
        });

        if (!submission) {
          throw new Error("Erro ao criar submissão");
        }

        // Notificar o owner via SMS
        const ownerPhone = process.env.OWNER_PHONE || "+5561999623099";
        try {
          await sendSMS(
            ownerPhone,
            `Novo contato recebido!\n\nNome: ${input.name}\nEmail: ${input.email}\nAssunto: ${input.subject}\n\nAcesse o painel para responder.`
          );
        } catch (error) {
          console.error("Erro ao enviar SMS de notificação:", error);
        }

        // Notificar via sistema de notificações
        await notifyOwner({
          title: "Novo Contato Recebido",
          content: `${input.name} (${input.email}) enviou uma mensagem sobre: ${input.subject}`,
        });

        // Executar workflow (Manus notify, SendGrid, Slack)
        handleNewContactWorkflow(
          submission.id,
          input.name,
          input.email,
          input.subject,
          input.schoolName || "Não informada",
          input.message,
          input.phone
        ).catch(error => {
          console.error("Erro no workflow de contato:", error);
        });

        return {
          success: true,
          id: submission.id,
          message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
        };
      } catch (error) {
        console.error("[API] Erro ao submeter contato:", error);
        throw new Error("Erro ao enviar mensagem. Tente novamente.");
      }
    }),

  /**
   * Obter todas as submissões (apenas admin)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Acesso negado");
    }

    return await contactDb.getAllContactSubmissions();
  }),

  /**
   * Obter submissões por status (apenas admin)
   */
  listByStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(["new", "read", "responded", "archived"]),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Acesso negado");
      }

      return await contactDb.getContactSubmissionsByStatus(input.status);
    }),

  /**
   * Obter uma submissão por ID (apenas admin)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Acesso negado");
      }

      return await contactDb.getContactSubmissionById(input.id);
    }),

  /**
   * Atualizar status de uma submissão (apenas admin)
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "read", "responded", "archived"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Acesso negado");
      }

      const success = await contactDb.updateContactSubmissionStatus(
        input.id,
        input.status
      );

      return { success };
    }),

  /**
   * Responder a uma submissão de contato (apenas admin)
   */
  respond: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        responseMessage: z.string().min(10, "Resposta deve ter pelo menos 10 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Acesso negado");
      }

      try {
        // Obter submissão original
        const submission = await contactDb.getContactSubmissionById(input.id);
        if (!submission) {
          throw new Error("Submissão não encontrada");
        }

        // Atualizar com resposta
        const success = await contactDb.respondToContactSubmission(
          input.id,
          input.responseMessage,
          ctx.user.id
        );

        if (!success) {
          throw new Error("Erro ao salvar resposta");
        }

        // Enviar resposta via SMS
        if (submission.phone) {
          try {
            await sendSMS(
              submission.phone,
              `Resposta de Áquila Pro:\n\n${input.responseMessage}`
            );
          } catch (error) {
            console.error("Erro ao enviar SMS de resposta:", error);
          }
        }

        // Executar workflow de resposta (SendGrid, Slack)
        handleContactResponseWorkflow(
          input.id,
          submission.name,
          submission.email,
          input.responseMessage,
          ctx.user.name || "Admin"
        ).catch(error => {
          console.error("Erro no workflow de resposta:", error);
        });

        return { success: true };
      } catch (error) {
        console.error("[API] Erro ao responder contato:", error);
        throw error;
      }
    }),

  /**
   * Deletar uma submissão (apenas admin)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Acesso negado");
      }

      const success = await contactDb.deleteContactSubmission(input.id);
      return { success };
    }),
});

export default contactRouter;
