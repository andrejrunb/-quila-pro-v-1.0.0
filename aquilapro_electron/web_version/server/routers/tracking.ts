import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { events, schedules, students, classes } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Rastreamento de Eventos em Tempo Real
 * Sistema de coleta automática de eventos detectados pelas câmeras
 */
export const trackingRouter = router({
  /**
   * Registrar chegada de aluno
   */
  recordArrival: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        studentId: z.number().int().positive(),
        classId: z.number().int().positive(),
        timestamp: z.date(),
        roomId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem registrar eventos",
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
        // Obter horário de aula para verificar atraso
        const scheduleResult = await db
          .select()
          .from(schedules)
          .where(
            and(
              eq(schedules.classId, input.classId),
              eq(schedules.periodId, input.periodId)
            )
          )
          .limit(1);

        const schedule = scheduleResult[0];
        if (!schedule) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Grade horaria nao encontrada",
          });
        }

        // Verificar se é atraso
        const startTime = new Date(schedule.startTime);
        const isLateArrival = input.timestamp > startTime;

        await db.insert(events).values({
          periodId: input.periodId,
          studentId: input.studentId,
          classId: input.classId,
          roomId: input.roomId,
          eventType: isLateArrival ? "late_arrival" : "arrival",
          timestamp: input.timestamp,
          metadata: JSON.stringify({
            scheduleStartTime: schedule.startTime,
            minutesLate: isLateArrival
              ? Math.floor((input.timestamp.getTime() - startTime.getTime()) / 60000)
              : 0,
          }),
        });

        return {
          success: true,
          isLateArrival,
          message: isLateArrival
            ? "Chegada atrasada registrada"
            : "Chegada registrada",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Tracking] Erro ao registrar chegada:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar chegada",
        });
      }
    }),

  /**
   * Registrar ausência de aluno
   */
  recordAbsence: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        studentId: z.number().int().positive(),
        classId: z.number().int().positive(),
        timestamp: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem registrar eventos",
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
        await db.insert(events).values({
          periodId: input.periodId,
          studentId: input.studentId,
          classId: input.classId,
          eventType: "absence",
          timestamp: input.timestamp,
        });

        return {
          success: true,
          message: "Ausencia registrada",
        };
      } catch (error) {
        console.error("[Tracking] Erro ao registrar ausencia:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar ausencia",
        });
      }
    }),

  /**
   * Registrar saída de sala
   */
  recordRoomExit: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        studentId: z.number().int().positive(),
        classId: z.number().int().positive(),
        roomId: z.number().int().positive(),
        timestamp: z.date(),
        reason: z.enum(["bathroom", "unauthorized", "school_exit"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem registrar eventos",
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
        const eventType =
          input.reason === "bathroom"
            ? "bathroom_visit"
            : input.reason === "school_exit"
              ? "school_exit"
              : "room_exit";

        await db.insert(events).values({
          periodId: input.periodId,
          studentId: input.studentId,
          classId: input.classId,
          roomId: input.roomId,
          eventType,
          timestamp: input.timestamp,
          metadata: JSON.stringify({
            reason: input.reason || "unknown",
          }),
        });

        return {
          success: true,
          message: "Saida de sala registrada",
        };
      } catch (error) {
        console.error("[Tracking] Erro ao registrar saida:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar saida",
        });
      }
    }),

  /**
   * Registrar retorno à sala
   */
  recordRoomReturn: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        studentId: z.number().int().positive(),
        classId: z.number().int().positive(),
        roomId: z.number().int().positive(),
        exitTimestamp: z.date(),
        returnTimestamp: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem registrar eventos",
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
        const durationMinutes = Math.floor(
          (input.returnTimestamp.getTime() - input.exitTimestamp.getTime()) /
            60000
        );

        await db.insert(events).values({
          periodId: input.periodId,
          studentId: input.studentId,
          classId: input.classId,
          roomId: input.roomId,
          eventType: "presence",
          duration: durationMinutes,
          timestamp: input.returnTimestamp,
          metadata: JSON.stringify({
            exitTime: input.exitTimestamp,
            returnTime: input.returnTimestamp,
            durationMinutes,
          }),
        });

        return {
          success: true,
          durationMinutes,
          message: `Retorno registrado (${durationMinutes} minutos fora)`,
        };
      } catch (error) {
        console.error("[Tracking] Erro ao registrar retorno:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar retorno",
        });
      }
    }),

  /**
   * Detectar aglomeração (múltiplos alunos em mesmo local)
   */
  detectGrouping: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        roomId: z.number().int().positive(),
        studentIds: z.array(z.number().int().positive()),
        timestamp: z.date(),
        classId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem registrar eventos",
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
        // Registrar evento de aglomeração para cada aluno
        const promises = input.studentIds.map((studentId) =>
          db.insert(events).values({
            periodId: input.periodId,
            studentId,
            classId: input.classId,
            roomId: input.roomId,
            eventType: "grouping",
            timestamp: input.timestamp,
            metadata: JSON.stringify({
              groupSize: input.studentIds.length,
              groupMembers: input.studentIds,
            }),
          })
        );

        await Promise.all(promises);

        return {
          success: true,
          groupSize: input.studentIds.length,
          message: `Aglomeracao de ${input.studentIds.length} alunos registrada`,
        };
      } catch (error) {
        console.error("[Tracking] Erro ao detectar aglomeracao:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao detectar aglomeracao",
        });
      }
    }),

  /**
   * Obter resumo de eventos do dia
   */
  getDailySummary: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        classId: z.number().int().positive().optional(),
        date: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar resumos",
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
        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(input.date);
        endOfDay.setHours(23, 59, 59, 999);

        const conditions: any[] = [
          eq(events.periodId, input.periodId),
          gte(events.timestamp, startOfDay),
          lte(events.timestamp, endOfDay),
        ];

        if (input.classId) {
          conditions.push(eq(events.classId, input.classId));
        }

        const whereClause =
          conditions.length > 1 ? and(...conditions) : conditions[0];
        const dayEvents = await db
          .select()
          .from(events)
          .where(whereClause);

        // Contar eventos por tipo
        const summary: Record<string, number> = {
          total: dayEvents.length,
          arrivals: 0,
          late_arrivals: 0,
          absences: 0,
          room_exits: 0,
          bathroom_visits: 0,
          groupings: 0,
          unauthorized_exits: 0,
          school_exits: 0,
        };

        dayEvents.forEach((event) => {
          summary[event.eventType] = (summary[event.eventType] || 0) + 1;
        });

        // Calcular tempo médio fora de sala
        const exitEvents = dayEvents.filter(
          (e) => e.eventType === "room_exit" && e.duration
        );
        const avgExitDuration =
          exitEvents.length > 0
            ? exitEvents.reduce((sum, e) => sum + (e.duration || 0), 0) /
              exitEvents.length
            : 0;

        return {
          date: input.date,
          totalEvents: summary.total,
          eventsByType: summary,
          averageExitDuration: Math.round(avgExitDuration),
          criticalEvents: dayEvents.filter(
            (e) =>
              e.eventType === "unauthorized_exit" ||
              e.eventType === "school_exit"
          ).length,
        };
      } catch (error) {
        console.error("[Tracking] Erro ao obter resumo do dia:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter resumo do dia",
        });
      }
    }),

  /**
   * Obter alertas críticos (eventos que requerem ação imediata)
   */
  getCriticalAlerts: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        classId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar alertas",
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
        const conditions: any[] = [eq(events.periodId, input.periodId)];

        if (input.classId) {
          conditions.push(eq(events.classId, input.classId));
        }

        const whereClause =
          conditions.length > 1 ? and(...conditions) : conditions[0];
        const allEvents = await db
          .select()
          .from(events)
          .where(whereClause);

        // Filtrar eventos críticos
        const criticalEvents = allEvents.filter(
          (e) =>
            e.eventType === "unauthorized_exit" ||
            e.eventType === "school_exit"
        );

        return {
          totalCritical: criticalEvents.length,
          events: criticalEvents.map((e) => ({
            id: e.id,
            studentId: e.studentId,
            eventType: e.eventType,
            timestamp: e.timestamp,
            severity:
              e.eventType === "school_exit" ? "critical" : "high",
          })),
        };
      } catch (error) {
        console.error("[Tracking] Erro ao obter alertas criticos:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter alertas criticos",
        });
      }
    }),
});
