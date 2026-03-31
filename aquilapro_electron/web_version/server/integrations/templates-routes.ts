import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as templatesDb from "../db/templates";

const smsTemplateInput = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  alertType: z.enum(["unauthorized_exit", "late_arrival", "absence", "health_incident", "custom"]),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  variables: z.string().optional(),
});

const whatsappTemplateInput = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  notificationType: z.enum([
    "attendance_confirmation",
    "daily_report",
    "alert",
    "reminder",
    "custom",
  ]),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  variables: z.string().optional(),
});

export const templatesRouter = router({
  // SMS Templates
  sms: router({
    list: protectedProcedure.query(async () => {
      try {
        return await templatesDb.getAllSmsTemplates();
      } catch (error) {
        console.error("Erro ao listar SMS templates:", error);
        return [];
      }
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      try {
        return await templatesDb.getSmsTemplateById(input.id);
      } catch (error) {
        console.error("Erro ao obter SMS template:", error);
        return null;
      }
    }),

    getByType: protectedProcedure
      .input(z.object({ alertType: z.string() }))
      .query(async ({ input }) => {
        try {
          return await templatesDb.getSmsTemplatesByType(input.alertType);
        } catch (error) {
          console.error("Erro ao obter SMS templates por tipo:", error);
          return [];
        }
      }),

    create: protectedProcedure.input(smsTemplateInput).mutation(async ({ input, ctx }) => {
      try {
        return await templatesDb.createSmsTemplate({
          ...input,
          createdBy: ctx.user.id,
          isActive: 1,
        });
      } catch (error) {
        console.error("Erro ao criar SMS template:", error);
        throw new Error("Falha ao criar template");
      }
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: smsTemplateInput.partial() }))
      .mutation(async ({ input }) => {
        try {
          return await templatesDb.updateSmsTemplate(input.id, input.data);
        } catch (error) {
          console.error("Erro ao atualizar SMS template:", error);
          throw new Error("Falha ao atualizar template");
        }
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try {
        return await templatesDb.deleteSmsTemplate(input.id);
      } catch (error) {
        console.error("Erro ao deletar SMS template:", error);
        throw new Error("Falha ao deletar template");
      }
    }),

    toggleStatus: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          return await templatesDb.toggleSmsTemplateStatus(input.id);
        } catch (error) {
          console.error("Erro ao alternar status do SMS template:", error);
          throw new Error("Falha ao alternar status");
        }
      }),
  }),

  // WhatsApp Templates
  whatsapp: router({
    list: protectedProcedure.query(async () => {
      try {
        return await templatesDb.getAllWhatsappTemplates();
      } catch (error) {
        console.error("Erro ao listar WhatsApp templates:", error);
        return [];
      }
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      try {
        return await templatesDb.getWhatsappTemplateById(input.id);
      } catch (error) {
        console.error("Erro ao obter WhatsApp template:", error);
        return null;
      }
    }),

    getByType: protectedProcedure
      .input(z.object({ notificationType: z.string() }))
      .query(async ({ input }) => {
        try {
          return await templatesDb.getWhatsappTemplatesByType(input.notificationType);
        } catch (error) {
          console.error("Erro ao obter WhatsApp templates por tipo:", error);
          return [];
        }
      }),

    create: protectedProcedure.input(whatsappTemplateInput).mutation(async ({ input, ctx }) => {
      try {
        return await templatesDb.createWhatsappTemplate({
          ...input,
          createdBy: ctx.user.id,
          isActive: 1,
        });
      } catch (error) {
        console.error("Erro ao criar WhatsApp template:", error);
        throw new Error("Falha ao criar template");
      }
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: whatsappTemplateInput.partial() }))
      .mutation(async ({ input }) => {
        try {
          return await templatesDb.updateWhatsappTemplate(input.id, input.data);
        } catch (error) {
          console.error("Erro ao atualizar WhatsApp template:", error);
          throw new Error("Falha ao atualizar template");
        }
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try {
        return await templatesDb.deleteWhatsappTemplate(input.id);
      } catch (error) {
        console.error("Erro ao deletar WhatsApp template:", error);
        throw new Error("Falha ao deletar template");
      }
    }),

    toggleStatus: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          return await templatesDb.toggleWhatsappTemplateStatus(input.id);
        } catch (error) {
          console.error("Erro ao alternar status do WhatsApp template:", error);
          throw new Error("Falha ao alternar status");
        }
      }),
  }),

  // Message Logs
  logs: router({
    getRecent: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        try {
          return await templatesDb.getRecentMessageLogs(input.limit);
        } catch (error) {
          console.error("Erro ao obter logs recentes:", error);
          return [];
        }
      }),

    getByStatus: protectedProcedure
      .input(z.object({ status: z.string() }))
      .query(async ({ input }) => {
        try {
          return await templatesDb.getMessageLogsByStatus(input.status);
        } catch (error) {
          console.error("Erro ao obter logs por status:", error);
          return [];
        }
      }),

    getStats: protectedProcedure.query(async () => {
      try {
        return await templatesDb.getMessageLogStats();
      } catch (error) {
        console.error("Erro ao obter estatísticas de logs:", error);
        return { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };
      }
    }),
  }),
});
