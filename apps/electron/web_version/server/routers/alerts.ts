import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { events, insights, parentAlerts } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Sistema de Alertas Contextualizados
 * Gera alertas automáticos baseados em padrões de eventos e insights
 */
export const alertsRouter = router({
  /**
   * Gerar alertas automáticos para um aluno
   */
  generateStudentAlerts: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        studentId: z.number().int().positive(),
        classId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem gerar alertas",
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
        // Obter eventos do aluno
        const studentEvents = await db
          .select()
          .from(events)
          .where(
            and(
              eq(events.periodId, input.periodId),
              eq(events.studentId, input.studentId)
            )
          );

        const alerts: any[] = [];

        // Regra 1: Atrasos frequentes (3+ atrasos)
        const lateArrivals = studentEvents.filter(
          (e) => e.eventType === "late_arrival"
        ).length;
        if (lateArrivals >= 3) {
          alerts.push({
            type: "frequent_late_arrivals",
            title: "Atrasos Frequentes",
            description: `Aluno registrou ${lateArrivals} atrasos neste período`,
            severity: lateArrivals >= 5 ? "high" : "medium",
            recommendation: "Conversar com o aluno e responsáveis sobre pontualidade",
          });
        }

        // Regra 2: Faltas frequentes (3+ faltas)
        const absences = studentEvents.filter(
          (e) => e.eventType === "absence"
        ).length;
        if (absences >= 3) {
          alerts.push({
            type: "frequent_absences",
            title: "Faltas Frequentes",
            description: `Aluno registrou ${absences} faltas neste período`,
            severity: absences >= 5 ? "critical" : "high",
            recommendation: "Contatar responsáveis para investigar motivo das faltas",
          });
        }

        // Regra 3: Saídas não autorizadas
        const unauthorizedExits = studentEvents.filter(
          (e) => e.eventType === "unauthorized_exit"
        ).length;
        if (unauthorizedExits > 0) {
          alerts.push({
            type: "unauthorized_exit",
            title: "Saída Não Autorizada",
            description: `Aluno registrou ${unauthorizedExits} saída(s) não autorizada(s)`,
            severity: "critical",
            recommendation: "Ação imediata necessária - contatar responsáveis",
          });
        }

        // Regra 4: Saídas da escola
        const schoolExits = studentEvents.filter(
          (e) => e.eventType === "school_exit"
        ).length;
        if (schoolExits > 0) {
          alerts.push({
            type: "school_exit",
            title: "Saída da Escola",
            description: `Aluno saiu da escola ${schoolExits} vez(es)`,
            severity: "critical",
            recommendation: "Ação imediata necessária - verificar autorização",
          });
        }

        // Regra 5: Tempo excessivo no banheiro (média > 15 minutos)
        const bathroomVisits = studentEvents.filter(
          (e) => e.eventType === "bathroom_visit" && e.duration
        );
        if (bathroomVisits.length > 0) {
          const avgBathroomTime =
            bathroomVisits.reduce((sum, e) => sum + (e.duration || 0), 0) /
            bathroomVisits.length;

          if (avgBathroomTime > 15) {
            alerts.push({
              type: "excessive_bathroom_time",
              title: "Tempo Excessivo no Banheiro",
              description: `Tempo médio: ${Math.round(avgBathroomTime)} minutos`,
              severity: "medium",
              recommendation: "Monitorar padrão de comportamento",
            });
          }
        }

        // Regra 6: Aglomerações frequentes
        const groupings = studentEvents.filter(
          (e) => e.eventType === "grouping"
        ).length;
        if (groupings >= 5) {
          alerts.push({
            type: "frequent_grouping",
            title: "Aglomerações Frequentes",
            description: `Aluno participou de ${groupings} aglomerações`,
            severity: "low",
            recommendation: "Monitorar possível influência negativa",
          });
        }

        return {
          success: true,
          totalAlerts: alerts.length,
          alerts,
          message: `${alerts.length} alertas gerados`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Alerts] Erro ao gerar alertas:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar alertas",
        });
      }
    }),

  /**
   * Criar alerta para enviar aos pais
   */
  createParentAlert: protectedProcedure
    .input(
      z.object({
        studentId: z.number().int().positive(),
        parentPhone: z.string().min(10),
        parentEmail: z.string().email().optional(),
        messageType: z.enum(["sms", "email", "whatsapp"]),
        content: z.string(),
        insightId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar alertas para pais",
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
        await db.insert(parentAlerts).values({
          studentId: input.studentId,
          insightId: input.insightId || null,
          parentPhone: input.parentPhone,
          parentEmail: input.parentEmail || null,
          messageType: input.messageType,
          content: input.content,
          status: "pending",
          sentBy: ctx.user.id,
          sentAt: null,
        });

        return {
          success: true,
          message: "Alerta criado com sucesso",
        };
      } catch (error) {
        console.error("[Alerts] Erro ao criar alerta para pais:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar alerta",
        });
      }
    }),

  /**
   * Listar alertas pendentes para envio
   */
  getPendingAlerts: protectedProcedure
    .input(
      z.object({
        messageType: z.enum(["sms", "email", "whatsapp"]).optional(),
        limit: z.number().int().positive().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar alertas",
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
        const conditions: any[] = [eq(parentAlerts.status, "pending")];

        if (input.messageType) {
          conditions.push(eq(parentAlerts.messageType, input.messageType));
        }

        const whereClause =
          conditions.length > 1 ? and(...conditions) : conditions[0];
        const pendingAlerts = await db
          .select()
          .from(parentAlerts)
          .where(whereClause)
          .limit(input.limit);

        // Agrupar por tipo de mensagem
        const byMessageType = {
          sms: pendingAlerts.filter((a) => a.messageType === "sms").length,
          email: pendingAlerts.filter((a) => a.messageType === "email").length,
          whatsapp: pendingAlerts.filter((a) => a.messageType === "whatsapp")
            .length,
        };

        return {
          totalPending: pendingAlerts.length,
          byMessageType,
          alerts: pendingAlerts.map((a) => ({
            id: a.id,
            studentId: a.studentId,
            parentPhone: a.parentPhone,
            parentEmail: a.parentEmail,
            messageType: a.messageType,
            content: a.content,
            createdAt: a.createdAt,
          })),
        };
      } catch (error) {
        console.error("[Alerts] Erro ao listar alertas pendentes:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar alertas",
        });
      }
    }),

  /**
   * Marcar alerta como enviado
   */
  markAlertAsSent: protectedProcedure
    .input(z.object({ alertId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem atualizar alertas",
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
        // Verificar se alerta existe
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

        // Atualizar status
        await db
          .update(parentAlerts)
          .set({
            status: "sent",
            sentAt: new Date(),
          })
          .where(eq(parentAlerts.id, input.alertId));

        return {
          success: true,
          message: "Alerta marcado como enviado",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Alerts] Erro ao marcar alerta como enviado:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar alerta",
        });
      }
    }),

  /**
   * Obter estatísticas de alertas
   */
  getAlertStats: protectedProcedure
    .query(async ({ ctx }) => {
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
        const allAlerts = await db.select().from(parentAlerts);

        return {
          total: allAlerts.length,
          pending: allAlerts.filter((a) => a.status === "pending").length,
          sent: allAlerts.filter((a) => a.status === "sent").length,
          delivered: allAlerts.filter((a) => a.status === "delivered").length,
          failed: allAlerts.filter((a) => a.status === "failed").length,
          read: allAlerts.filter((a) => a.status === "read").length,
          byMessageType: {
            sms: allAlerts.filter((a) => a.messageType === "sms").length,
            email: allAlerts.filter((a) => a.messageType === "email").length,
            whatsapp: allAlerts.filter((a) => a.messageType === "whatsapp")
              .length,
          },
        };
      } catch (error) {
        console.error("[Alerts] Erro ao obter estatísticas:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter estatísticas",
        });
      }
    }),
});
