import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { events } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Eventos Coletados
 * Registra todos os eventos detectados pelo sistema
 */
export const eventsRouter = router({
  /**
   * Registrar novo evento
   */
  create: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        studentId: z.number().int().positive(),
        classId: z.number().int().positive(),
        roomId: z.number().int().positive().optional(),
        eventType: z.enum([
          "arrival",
          "late_arrival",
          "absence",
          "room_exit",
          "bathroom_visit",
          "grouping",
          "unauthorized_exit",
          "school_exit",
          "presence",
        ]),
        duration: z.number().int().positive().optional(),
        timestamp: z.date(),
        metadata: z.record(z.string(), z.any()).optional(),
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
          roomId: input.roomId,
          eventType: input.eventType,
          duration: input.duration,
          timestamp: input.timestamp,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        });

        return {
          success: true,
          message: "Evento registrado com sucesso",
        };
      } catch (error) {
        console.error("[Events] Erro ao registrar evento:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar evento",
        });
      }
    }),

  /**
   * Listar eventos por aluno
   */
  listByStudent: protectedProcedure
    .input(
      z.object({
        studentId: z.number().int().positive(),
        periodId: z.number().int().positive().optional(),
        eventType: z.enum([
          "arrival",
          "late_arrival",
          "absence",
          "room_exit",
          "bathroom_visit",
          "grouping",
          "unauthorized_exit",
          "school_exit",
          "presence",
        ]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar eventos",
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
        const conditions: any[] = [eq(events.studentId, input.studentId)];

        if (input.periodId) {
          conditions.push(eq(events.periodId, input.periodId));
        }

        if (input.eventType) {
          conditions.push(eq(events.eventType, input.eventType));
        }

        const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
        const result = await db
          .select()
          .from(events)
          .where(whereClause);

        return result.map((event) => ({
          ...event,
          metadata: event.metadata ? JSON.parse(event.metadata) : null,
        }));
      } catch (error) {
        console.error("[Events] Erro ao listar eventos:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar eventos",
        });
      }
    }),

  /**
   * Listar eventos por turma
   */
  listByClass: protectedProcedure
    .input(
      z.object({
        classId: z.number().int().positive(),
        periodId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar eventos",
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
        const conditions: any[] = [eq(events.classId, input.classId)];

        if (input.periodId) {
          conditions.push(eq(events.periodId, input.periodId));
        }

        const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
        const result = await db
          .select()
          .from(events)
          .where(whereClause);

        return result.map((event) => ({
          ...event,
          metadata: event.metadata ? JSON.parse(event.metadata) : null,
        }));
      } catch (error) {
        console.error("[Events] Erro ao listar eventos:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar eventos",
        });
      }
    }),

  /**
   * Listar eventos por periodo de tempo
   */
  listByDateRange: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        startDate: z.date(),
        endDate: z.date(),
        eventType: z.enum([
          "arrival",
          "late_arrival",
          "absence",
          "room_exit",
          "bathroom_visit",
          "grouping",
          "unauthorized_exit",
          "school_exit",
          "presence",
        ]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar eventos",
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
        const conditions: any[] = [
          eq(events.periodId, input.periodId),
          gte(events.timestamp, input.startDate),
          lte(events.timestamp, input.endDate),
        ];

        if (input.eventType) {
          conditions.push(eq(events.eventType, input.eventType));
        }

        const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
        const result = await db
          .select()
          .from(events)
          .where(whereClause);

        return result.map((event) => ({
          ...event,
          metadata: event.metadata ? JSON.parse(event.metadata) : null,
        }));
      } catch (error) {
        console.error("[Events] Erro ao listar eventos por periodo:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar eventos por periodo",
        });
      }
    }),

  /**
   * Obter estatisticas de eventos por tipo
   */
  getStats: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        studentId: z.number().int().positive().optional(),
        classId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar estatisticas",
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

        if (input.studentId) {
          conditions.push(eq(events.studentId, input.studentId));
        }

        if (input.classId) {
          conditions.push(eq(events.classId, input.classId));
        }

        const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
        const result = await db
          .select()
          .from(events)
          .where(whereClause);

        // Contar eventos por tipo
        const stats: Record<string, number> = {};
        result.forEach((event) => {
          stats[event.eventType] = (stats[event.eventType] || 0) + 1;
        });

        return {
          totalEvents: result.length,
          eventsByType: stats,
          averageDuration: result.reduce((sum, e) => sum + (e.duration || 0), 0) / result.length || 0,
        };
      } catch (error) {
        console.error("[Events] Erro ao obter estatisticas:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter estatisticas",
        });
      }
    }),

  /**
   * Deletar evento
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem deletar eventos",
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
        const event = await db
          .select()
          .from(events)
          .where(eq(events.id, input.id))
          .limit(1);

        if (event.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Evento nao encontrado",
          });
        }

        await db.delete(events).where(eq(events.id, input.id));

        return {
          success: true,
          message: "Evento deletado com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Events] Erro ao deletar evento:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar evento",
        });
      }
    }),
});
