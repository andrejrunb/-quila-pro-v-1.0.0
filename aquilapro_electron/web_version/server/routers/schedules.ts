import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { schedules, classes, academicPeriods } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Grades Horárias
 * Gerencia os horários de aula por turma
 */
export const schedulesRouter = router({
  /**
   * Criar nova grade horária
   */
  create: protectedProcedure
    .input(
      z.object({
        classId: z.number().int().positive(),
        periodId: z.number().int().positive(),
        dayOfWeek: z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
        startTime: z.string().regex(/^\d{2}:\d{2}$/), // "07:00"
        endTime: z.string().regex(/^\d{2}:\d{2}$/), // "12:00"
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar grades horárias",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Validar horários
      const [startHour, startMin] = input.startTime.split(":").map(Number);
      const [endHour, endMin] = input.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Horário de início deve ser anterior ao horário de fim",
        });
      }

      try {
        await db.insert(schedules).values({
          classId: input.classId,
          periodId: input.periodId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
        });

        return {
          success: true,
          message: "Grade horária criada com sucesso",
        };
      } catch (error) {
        console.error("[Schedules] Erro ao criar grade horária:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar grade horária",
        });
      }
    }),

  /**
   * Listar grades horárias por turma e período
   */
  list: protectedProcedure
    .input(
      z.object({
        classId: z.number().int().positive(),
        periodId: z.number().int().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar grades horárias",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        const result = await db
          .select()
          .from(schedules)
          .where(
            and(
              eq(schedules.classId, input.classId),
              eq(schedules.periodId, input.periodId)
            )
          );

        return result;
      } catch (error) {
        console.error("[Schedules] Erro ao listar grades horárias:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar grades horárias",
        });
      }
    }),

  /**
   * Listar todas as grades horárias por período
   */
  listByPeriod: protectedProcedure
    .input(z.object({ periodId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar grades horárias",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        const result = await db
          .select()
          .from(schedules)
          .where(eq(schedules.periodId, input.periodId));

        return result;
      } catch (error) {
        console.error("[Schedules] Erro ao listar grades horárias:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar grades horárias",
        });
      }
    }),

  /**
   * Obter grade horária por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar grades horárias",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        const result = await db
          .select()
          .from(schedules)
          .where(eq(schedules.id, input.id))
          .limit(1);

        if (result.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Grade horária não encontrada",
          });
        }

        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Schedules] Erro ao obter grade horária:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter grade horária",
        });
      }
    }),

  /**
   * Atualizar grade horária
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem atualizar grades horárias",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        const updateData: Record<string, any> = {};
        if (input.startTime !== undefined) updateData.startTime = input.startTime;
        if (input.endTime !== undefined) updateData.endTime = input.endTime;

        if (Object.keys(updateData).length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nenhum campo para atualizar",
          });
        }

        await db.update(schedules).set(updateData).where(eq(schedules.id, input.id));

        return {
          success: true,
          message: "Grade horária atualizada com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Schedules] Erro ao atualizar grade horária:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar grade horária",
        });
      }
    }),

  /**
   * Deletar grade horária
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem deletar grades horárias",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        const schedule = await db
          .select()
          .from(schedules)
          .where(eq(schedules.id, input.id))
          .limit(1);

        if (schedule.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Grade horária não encontrada",
          });
        }

        await db.delete(schedules).where(eq(schedules.id, input.id));

        return {
          success: true,
          message: "Grade horária deletada com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Schedules] Erro ao deletar grade horária:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar grade horária",
        });
      }
    }),

  /**
   * Verificar se há aula em um horário específico
   */
  isClassTime: protectedProcedure
    .input(
      z.object({
        classId: z.number().int().positive(),
        periodId: z.number().int().positive(),
        dayOfWeek: z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
        time: z.string().regex(/^\d{2}:\d{2}$/), // "10:30"
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem verificar horários",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        const [hour, min] = input.time.split(":").map(Number);
        const timeInMinutes = hour * 60 + min;

        const result = await db
          .select()
          .from(schedules)
          .where(
            and(
              eq(schedules.classId, input.classId),
              eq(schedules.periodId, input.periodId),
              eq(schedules.dayOfWeek, input.dayOfWeek)
            )
          );

        const isClassTime = result.some((schedule) => {
          const [startHour, startMin] = schedule.startTime.split(":").map(Number);
          const [endHour, endMin] = schedule.endTime.split(":").map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;

          return timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
        });

        return {
          isClassTime,
          message: isClassTime
            ? "Há aula neste horário"
            : "Não há aula neste horário",
        };
      } catch (error) {
        console.error("[Schedules] Erro ao verificar horário de aula:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao verificar horário de aula",
        });
      }
    }),
});
