import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  studentMetrics,
  lateArrivals,
  absences,
  roomExits,
  studentComparisons,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";

export const portfolioRouter = router({
  /**
   * Obter métricas cumulativas do aluno
   */
  getMetrics: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        academicPeriodId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const metrics = await db
        .select()
        .from(studentMetrics)
        .where(
          and(
            eq(studentMetrics.studentId, input.studentId),
            eq(studentMetrics.academicPeriodId, input.academicPeriodId)
          )
        )
        .limit(1);

      if (!metrics.length) {
        return {
          presencePercentage: 0,
          totalDaysPresent: 0,
          totalDaysAbsent: 0,
          totalMinutesLate: 0,
          totalMinutesOutOfClass: 0,
          totalMinutesBathroom: 0,
          totalHoursInClass: 0,
          totalHoursOutOfClass: 0,
        };
      }

      const m = metrics[0];
      return {
        presencePercentage: m.presencePercentage,
        totalDaysPresent: m.totalDaysPresent,
        totalDaysAbsent: m.totalDaysAbsent,
        totalMinutesLate: m.totalMinutesLate,
        totalMinutesOutOfClass: m.totalMinutesOutOfClass,
        totalMinutesBathroom: m.totalMinutesBathroom,
        totalHoursInClass: m.totalHoursInClass,
        totalHoursOutOfClass: m.totalHoursOutOfClass,
      };
    }),

  /**
   * Obter histórico de atrasos
   */
  getLateArrivals: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(lateArrivals)
        .where(eq(lateArrivals.studentId, input.studentId))
        .orderBy(desc(lateArrivals.date))
        .limit(input.limit);
    }),

  /**
   * Obter histórico de faltas
   */
  getAbsences: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(absences)
        .where(eq(absences.studentId, input.studentId))
        .orderBy(desc(absences.date))
        .limit(input.limit);
    }),

  /**
   * Obter histórico de saídas de sala
   */
  getRoomExits: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(roomExits)
        .where(eq(roomExits.studentId, input.studentId))
        .orderBy(desc(roomExits.date))
        .limit(input.limit);
    }),

  /**
   * Obter comparativos do aluno
   */
  getComparisons: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        academicPeriodId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const comparisons = await db
        .select()
        .from(studentComparisons)
        .where(
          and(
            eq(studentComparisons.studentId, input.studentId),
            eq(studentComparisons.academicPeriodId, input.academicPeriodId)
          )
        )
        .limit(1);

      if (!comparisons.length) {
        return {
          classAveragePresence: 0,
          schoolAveragePresence: 0,
          classRankingPosition: 0,
          classRankingTotal: 0,
          classPercentile: 0,
          schoolPercentile: 0,
        };
      }

      const c = comparisons[0];
      return {
        classAveragePresence: c.classAveragePresence,
        schoolAveragePresence: c.schoolAveragePresence,
        classRankingPosition: c.classRankingPosition,
        classRankingTotal: c.classRankingTotal,
        classPercentile: c.classPercentile,
        schoolPercentile: c.schoolPercentile,
      };
    }),

  /**
   * Registrar atraso
   */
  recordLateArrival: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        classId: z.number(),
        date: z.string(),
        time: z.string(),
        durationMinutes: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(lateArrivals).values({
        studentId: input.studentId,
        classId: input.classId,
        date: input.date,
        time: input.time,
        durationMinutes: input.durationMinutes,
        reason: input.reason,
      });

      return { success: true };
    }),

  /**
   * Registrar falta
   */
  recordAbsence: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        classId: z.number(),
        date: z.string(),
        period: z.enum(["morning", "afternoon", "full"]),
        justified: z.boolean(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(absences).values({
        studentId: input.studentId,
        classId: input.classId,
        date: input.date,
        period: input.period,
        justified: input.justified ? 1 : 0,
        reason: input.reason,
      });

      return { success: true };
    }),

  /**
   * Registrar saída de sala
   */
  recordRoomExit: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        classId: z.number(),
        date: z.string(),
        exitTime: z.string(),
        returnTime: z.string().optional(),
        durationMinutes: z.number(),
        reason: z.enum([
          "bathroom",
          "nurse",
          "coordination",
          "teacher_request",
          "other",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(roomExits).values({
        studentId: input.studentId,
        classId: input.classId,
        date: input.date,
        exitTime: input.exitTime,
        returnTime: input.returnTime,
        durationMinutes: input.durationMinutes,
        reason: input.reason,
      });

      return { success: true };
    }),
});
