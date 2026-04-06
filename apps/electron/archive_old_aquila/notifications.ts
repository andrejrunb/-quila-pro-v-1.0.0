import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { parentAlerts, students, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

/**
 * Sistema de Notificações para Pais
 * Envia alertas via SMS, Email e WhatsApp
 */
export const notificationsRouter = router({
  /**
   * Enviar alerta para pais via SMS
   */
  sendSMSAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number().int().positive(),
        phoneNumber: z.string().min(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem enviar notificações",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados nao disponivel",
        });
      }

      try {
        // Obter alerta
        const alert = await db
          .select()
          .from(parentAlerts)
          .where(eq(parentAlerts.id, input.alertId))
          .limit(1);

        if (alert.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Alerta nao encontrado",
          });
        }

        const alertData = alert[0];

        // TODO: Integrar com Twilio para enviar SMS
        // const accountSid = process.env.TWILIO_ACCOUNT_SID;
        // const authToken = process.env.TWILIO_AUTH_TOKEN;
        // const client = twilio(accountSid, authToken);
        // await client.messages.create({
        //   body: alertData.content,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   to: input.phoneNumber,
        // });

        // Atualizar status
        await db
          .update(parentAlerts)
          .set({
            status: "sent",
            sentAt: new Date(),
          })
          .where(eq(parentAlerts.id, input.alertId));

        // Notificar coordenador
        await notifyOwner({
          title: "SMS Enviado",
          content: `Alerta SMS enviado para ${input.phoneNumber}`,
        });

        return {
          success: true,
          message: "SMS enviado com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Notifications] Erro ao enviar SMS:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar SMS",
        });
      }
    }),

  /**
   * Enviar alerta para pais via Email
   */
  sendEmailAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number().int().positive(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem enviar notificações",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados nao disponivel",
        });
      }

      try {
        // Obter alerta
        const alert = await db
          .select()
          .from(parentAlerts)
          .where(eq(parentAlerts.id, input.alertId))
          .limit(1);

        if (alert.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Alerta nao encontrado",
          });
        }

        const alertData = alert[0];

        // TODO: Integrar com SendGrid para enviar Email
        // const sgMail = require("@sendgrid/mail");
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // await sgMail.send({
        //   to: input.email,
        //   from: process.env.SENDGRID_FROM_EMAIL,
        //   subject: "Alerta de Segurança - Áquila Pro",
        //   html: `<p>${alertData.content}</p>`,
        // });

        // Atualizar status
        await db
          .update(parentAlerts)
          .set({
            status: "sent",
            sentAt: new Date(),
          })
          .where(eq(parentAlerts.id, input.alertId));

        // Notificar coordenador
        await notifyOwner({
          title: "Email Enviado",
          content: `Alerta enviado para ${input.email}`,
        });

        return {
          success: true,
          message: "Email enviado com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Notifications] Erro ao enviar email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar email",
        });
      }
    }),

  /**
   * Enviar alerta para pais via WhatsApp
   */
  sendWhatsAppAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number().int().positive(),
        phoneNumber: z.string().min(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem enviar notificações",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados nao disponivel",
        });
      }

      try {
        // Obter alerta
        const alert = await db
          .select()
          .from(parentAlerts)
          .where(eq(parentAlerts.id, input.alertId))
          .limit(1);

        if (alert.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Alerta nao encontrado",
          });
        }

        const alertData = alert[0];

        // TODO: Integrar com Twilio WhatsApp para enviar mensagem
        // const accountSid = process.env.TWILIO_ACCOUNT_SID;
        // const authToken = process.env.TWILIO_AUTH_TOKEN;
        // const client = twilio(accountSid, authToken);
        // await client.messages.create({
        //   body: alertData.content,
        //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        //   to: `whatsapp:${input.phoneNumber}`,
        // });

        // Atualizar status
        await db
          .update(parentAlerts)
          .set({
            status: "sent",
            sentAt: new Date(),
          })
          .where(eq(parentAlerts.id, input.alertId));

        // Notificar coordenador
        await notifyOwner({
          title: "WhatsApp Enviado",
          content: `Alerta WhatsApp enviado para ${input.phoneNumber}`,
        });

        return {
          success: true,
          message: "WhatsApp enviado com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Notifications] Erro ao enviar WhatsApp:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar WhatsApp",
        });
      }
    }),

  /**
   * Marcar notificação como entregue
   */
  markAsDelivered: protectedProcedure
    .input(z.object({ alertId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem atualizar notificações",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados nao disponivel",
        });
      }

      try {
        await db
          .update(parentAlerts)
          .set({
            status: "delivered",
          })
          .where(eq(parentAlerts.id, input.alertId));

        return {
          success: true,
          message: "Notificação marcada como entregue",
        };
      } catch (error) {
        console.error("[Notifications] Erro ao marcar como entregue:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar notificação",
        });
      }
    }),

  /**
   * Marcar notificação como lida
   */
  markAsRead: protectedProcedure
    .input(z.object({ alertId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem atualizar notificações",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados nao disponivel",
        });
      }

      try {
        await db
          .update(parentAlerts)
          .set({
            status: "read",
            readAt: new Date(),
          })
          .where(eq(parentAlerts.id, input.alertId));

        return {
          success: true,
          message: "Notificação marcada como lida",
        };
      } catch (error) {
        console.error("[Notifications] Erro ao marcar como lida:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar notificação",
        });
      }
    }),

  /**
   * Obter histórico de notificações
   */
  getNotificationHistory: protectedProcedure
    .input(
      z.object({
        studentId: z.number().int().positive().optional(),
        status: z
          .enum(["pending", "sent", "delivered", "failed", "read"])
          .optional(),
        limit: z.number().int().positive().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar histórico",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados nao disponivel",
        });
      }

      try {
        const conditions: any[] = [];

        if (input.studentId) {
          conditions.push(eq(parentAlerts.studentId, input.studentId));
        }

        if (input.status) {
          conditions.push(eq(parentAlerts.status, input.status));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const query = whereClause
          ? db.select().from(parentAlerts).where(whereClause)
          : db.select().from(parentAlerts);

        const notifications = await query.limit(input.limit);

        return {
          total: notifications.length,
          notifications: notifications.map((n) => ({
            id: n.id,
            studentId: n.studentId,
            messageType: n.messageType,
            content: n.content,
            status: n.status,
            sentAt: n.sentAt,
            readAt: n.readAt,
            createdAt: n.createdAt,
          })),
        };
      } catch (error) {
        console.error("[Notifications] Erro ao obter histórico:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter histórico",
        });
      }
    }),

  /**
   * Obter estatísticas de notificações
   */
  getNotificationStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem acessar estatísticas",
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados nao disponivel",
      });
    }

    try {
      const allNotifications = await db.select().from(parentAlerts);

      const byStatus = {
        pending: allNotifications.filter((n) => n.status === "pending").length,
        sent: allNotifications.filter((n) => n.status === "sent").length,
        delivered: allNotifications.filter((n) => n.status === "delivered")
          .length,
        failed: allNotifications.filter((n) => n.status === "failed").length,
        read: allNotifications.filter((n) => n.status === "read").length,
      };

      const byMessageType = {
        sms: allNotifications.filter((n) => n.messageType === "sms").length,
        email: allNotifications.filter((n) => n.messageType === "email").length,
        whatsapp: allNotifications.filter((n) => n.messageType === "whatsapp")
          .length,
      };

      // Calcular taxa de entrega
      const delivered = byStatus.delivered + byStatus.read;
      const total = allNotifications.length;
      const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

      return {
        total,
        byStatus,
        byMessageType,
        deliveryRate,
        averageReadTime: calculateAverageReadTime(allNotifications),
      };
    } catch (error) {
      console.error("[Notifications] Erro ao obter estatísticas:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao obter estatísticas",
      });
    }
  }),
});

/**
 * Calcular tempo médio de leitura
 */
function calculateAverageReadTime(notifications: any[]): number {
  const readNotifications = notifications.filter(
    (n) => n.status === "read" && n.sentAt && n.readAt
  );

  if (readNotifications.length === 0) return 0;

  const totalTime = readNotifications.reduce((sum, n) => {
    const sentTime = new Date(n.sentAt).getTime();
    const readTime = new Date(n.readAt).getTime();
    return sum + (readTime - sentTime);
  }, 0);

  // Retornar tempo médio em minutos
  return Math.round(totalTime / readNotifications.length / (1000 * 60));
}
