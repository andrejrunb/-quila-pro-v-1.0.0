import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { academicPeriods, schedules, classes } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Períodos Acadêmicos (Bimestres, Trimestres, etc.)
 * Gerencia os períodos letivos da escola
 */
export const periodsRouter = router({
  /**
   * Criar novo período acadêmico
   */
  create: protectedProcedure
    .input(
      z.object({
        schoolId: z.number().int().positive(),
        name: z.string().min(1).max(255),
        periodType: z.enum(["bimester", "trimester", "semester", "annual"]),
        startDate: z.date(),
        endDate: z.date(),
        dataRetentionDays: z.number().int().positive().default(30),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar se usuário é admin
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar períodos",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Validar datas
      if (input.startDate >= input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Data de início deve ser anterior à data de fim",
        });
      }

      try {
        await db.insert(academicPeriods).values({
          schoolId: input.schoolId,
          name: input.name,
          periodType: input.periodType,
          startDate: input.startDate,
          endDate: input.endDate,
          dataRetentionDays: input.dataRetentionDays,
        });

        return {
          success: true,
          message: `Período "${input.name}" criado com sucesso`,
        };
      } catch (error) {
        console.error("[Periods] Erro ao criar período:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar período acadêmico",
        });
      }
    }),

  /**
   * Listar períodos por escola
   */
  list: protectedProcedure
    .input(z.object({ schoolId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar períodos",
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
        const periods = await db
          .select()
          .from(academicPeriods)
          .where(eq(academicPeriods.schoolId, input.schoolId));

        return periods;
      } catch (error) {
        console.error("[Periods] Erro ao listar períodos:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar períodos",
        });
      }
    }),

  /**
   * Obter período por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar períodos",
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
        const period = await db
          .select()
          .from(academicPeriods)
          .where(eq(academicPeriods.id, input.id))
          .limit(1);

        if (period.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Período não encontrado",
          });
        }

        return period[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Periods] Erro ao obter período:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter período",
        });
      }
    }),

  /**
   * Atualizar período
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        dataRetentionDays: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem atualizar períodos",
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
        if (input.name !== undefined) updateData.name = input.name;
        if (input.startDate !== undefined) updateData.startDate = input.startDate;
        if (input.endDate !== undefined) updateData.endDate = input.endDate;
        if (input.dataRetentionDays !== undefined)
          updateData.dataRetentionDays = input.dataRetentionDays;

        if (Object.keys(updateData).length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nenhum campo para atualizar",
          });
        }

        await db
          .update(academicPeriods)
          .set(updateData)
          .where(eq(academicPeriods.id, input.id));

        return {
          success: true,
          message: "Período atualizado com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Periods] Erro ao atualizar período:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar período",
        });
      }
    }),

  /**
   * Deletar período
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem deletar períodos",
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
        // Verificar se há eventos associados
        const period = await db
          .select()
          .from(academicPeriods)
          .where(eq(academicPeriods.id, input.id))
          .limit(1);

        if (period.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Período não encontrado",
          });
        }

        await db.delete(academicPeriods).where(eq(academicPeriods.id, input.id));

        return {
          success: true,
          message: "Período deletado com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Periods] Erro ao deletar período:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar período",
        });
      }
    }),

  /**
   * Obter período ativo (data atual está dentro do período)
   */
  getActive: protectedProcedure
    .input(z.object({ schoolId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar períodos",
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
        const now = new Date();
        const activePeriods = await db
          .select()
          .from(academicPeriods)
          .where(
            and(
              eq(academicPeriods.schoolId, input.schoolId),
              lte(academicPeriods.startDate, now),
              gte(academicPeriods.endDate, now)
            )
          );

        return activePeriods.length > 0 ? activePeriods[0] : null;
      } catch (error) {
        console.error("[Periods] Erro ao obter período ativo:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter período ativo",
        });
      }
    }),
});
