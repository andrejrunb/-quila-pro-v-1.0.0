import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { events, insights, students, classes } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

/**
 * Análise Pedagógica com IA
 * Gera insights sobre comportamento, engajamento e segurança dos alunos
 */
export const analysisRouter = router({
  /**
   * Gerar insights para um aluno
   */
  generateStudentInsights: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        studentId: z.number().int().positive(),
        classId: z.number().int().positive(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem gerar insights",
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
        // Obter dados do aluno
        const studentData = await db
          .select()
          .from(students)
          .where(eq(students.id, input.studentId))
          .limit(1);

        if (studentData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aluno nao encontrado",
          });
        }

        // Obter eventos do período
        const conditions: any[] = [
          eq(events.periodId, input.periodId),
          eq(events.studentId, input.studentId),
        ];

        if (input.startDate && input.endDate) {
          conditions.push(gte(events.timestamp, input.startDate));
          conditions.push(lte(events.timestamp, input.endDate));
        }

        const whereClause =
          conditions.length > 1 ? and(...conditions) : conditions[0];
        const studentEvents = await db
          .select()
          .from(events)
          .where(whereClause);

        // Calcular estatísticas
        const stats = {
          totalEvents: studentEvents.length,
          lateArrivals: studentEvents.filter(
            (e) => e.eventType === "late_arrival"
          ).length,
          absences: studentEvents.filter((e) => e.eventType === "absence")
            .length,
          roomExits: studentEvents.filter((e) => e.eventType === "room_exit")
            .length,
          bathroomVisits: studentEvents.filter(
            (e) => e.eventType === "bathroom_visit"
          ).length,
          unauthorizedExits: studentEvents.filter(
            (e) => e.eventType === "unauthorized_exit"
          ).length,
          schoolExits: studentEvents.filter((e) => e.eventType === "school_exit")
            .length,
          groupings: studentEvents.filter((e) => e.eventType === "grouping")
            .length,
          avgBathroomDuration:
            studentEvents
              .filter((e) => e.eventType === "bathroom_visit" && e.duration)
              .reduce((sum, e) => sum + (e.duration || 0), 0) /
              studentEvents.filter((e) => e.eventType === "bathroom_visit")
                .length || 0,
        };

        // Usar IA para gerar insights
        const aiPrompt = `
Analise os seguintes dados de um aluno e gere insights pedagógicos e de segurança:

Estatísticas do Período:
- Total de eventos: ${stats.totalEvents}
- Atrasos: ${stats.lateArrivals}
- Faltas: ${stats.absences}
- Saídas de sala: ${stats.roomExits}
- Visitas ao banheiro: ${stats.bathroomVisits}
- Saídas não autorizadas: ${stats.unauthorizedExits}
- Saídas da escola: ${stats.schoolExits}
- Aglomerações: ${stats.groupings}
- Tempo médio no banheiro: ${Math.round(stats.avgBathroomDuration)} minutos

Gere insights em JSON com os seguintes campos:
{
  "attendance": {
    "score": 0-100,
    "category": "attendance",
    "description": "descrição do padrão de assiduidade",
    "severity": "low|medium|high|critical"
  },
  "punctuality": {
    "score": 0-100,
    "category": "punctuality",
    "description": "descrição do padrão de pontualidade",
    "severity": "low|medium|high|critical"
  },
  "engagement": {
    "score": 0-100,
    "category": "engagement",
    "description": "descrição do nível de engajamento",
    "severity": "low|medium|high|critical"
  },
  "behavior": {
    "score": 0-100,
    "category": "behavior",
    "description": "descrição do comportamento",
    "severity": "low|medium|high|critical"
  },
  "security": {
    "score": 0-100,
    "category": "security",
    "description": "descrição de riscos de segurança",
    "severity": "low|medium|high|critical"
  }
}

Retorne APENAS o JSON, sem explicações adicionais.
        `;

        const aiResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Você é um especialista em análise pedagógica e segurança escolar. Analise dados de comportamento de alunos e gere insights estruturados em JSON.",
            },
            {
              role: "user",
              content: aiPrompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "student_insights",
              strict: false,
              schema: {
                type: "object",
                properties: {
                  attendance: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      category: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string" },
                    },
                  },
                  punctuality: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      category: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string" },
                    },
                  },
                  engagement: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      category: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string" },
                    },
                  },
                  behavior: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      category: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string" },
                    },
                  },
                  security: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      category: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        });

        // Parsear resposta da IA
        let aiInsights: any = {};
        try {
          const content = aiResponse.choices[0].message.content;
          aiInsights = typeof content === "string" ? JSON.parse(content) : content;
        } catch (e) {
          console.error("[Analysis] Erro ao parsear resposta da IA:", e);
          aiInsights = {
            attendance: {
              score: 50,
              category: "attendance",
              description: "Dados insuficientes para análise",
              severity: "low",
            },
          };
        }

        // Salvar insights no banco de dados
        const insightPromises = Object.values(aiInsights).map((insight: any) =>
          db.insert(insights).values({
            periodId: input.periodId,
            studentId: input.studentId,
            classId: input.classId,
            category: insight.category,
            score: Math.min(100, Math.max(0, insight.score || 50)),
            description: insight.description || "Sem descrição",
            recommendation: insight.recommendation,
            severity: insight.severity || "low",
          })
        );

        await Promise.all(insightPromises);

        return {
          success: true,
          insights: aiInsights,
          message: "Insights gerados com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Analysis] Erro ao gerar insights:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar insights",
        });
      }
    }),

  /**
   * Gerar insights para uma turma
   */
  generateClassInsights: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        classId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem gerar insights",
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
        // Obter todos os alunos da turma
        const classStudents = await db
          .select()
          .from(students)
          .where(eq(students.classId, input.classId));

        // Gerar insights para cada aluno
        const results = await Promise.all(
          classStudents.map((student) =>
            db
              .select()
              .from(events)
              .where(
                and(
                  eq(events.periodId, input.periodId),
                  eq(events.studentId, student.id)
                )
              )
          )
        );

        // Calcular estatísticas agregadas
        const allEvents = results.flat();
        const classStats = {
          totalStudents: classStudents.length,
          totalEvents: allEvents.length,
          avgLateArrivals:
            allEvents.filter((e) => e.eventType === "late_arrival").length /
            classStudents.length,
          avgAbsences:
            allEvents.filter((e) => e.eventType === "absence").length /
            classStudents.length,
          avgRoomExits:
            allEvents.filter((e) => e.eventType === "room_exit").length /
            classStudents.length,
        };

        return {
          success: true,
          classStats,
          message: "Insights da turma gerados com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Analysis] Erro ao gerar insights da turma:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar insights da turma",
        });
      }
    }),

  /**
   * Obter insights salvos de um aluno
   */
  getStudentInsights: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        studentId: z.number().int().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar insights",
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
        const studentInsights = await db
          .select()
          .from(insights)
          .where(
            and(
              eq(insights.periodId, input.periodId),
              eq(insights.studentId, input.studentId)
            )
          );

        return {
          insights: studentInsights,
          totalInsights: studentInsights.length,
          criticalCount: studentInsights.filter((i) => i.severity === "critical")
            .length,
          highCount: studentInsights.filter((i) => i.severity === "high").length,
        };
      } catch (error) {
        console.error("[Analysis] Erro ao obter insights:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter insights",
        });
      }
    }),

  /**
   * Obter insights críticos que requerem ação
   */
  getCriticalInsights: protectedProcedure
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
          message: "Apenas administradores podem acessar insights",
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
          eq(insights.periodId, input.periodId),
          eq(insights.severity, "critical"),
        ];

        if (input.classId) {
          conditions.push(eq(insights.classId, input.classId));
        }

        const whereClause =
          conditions.length > 1 ? and(...conditions) : conditions[0];
        const criticalInsights = await db
          .select()
          .from(insights)
          .where(whereClause);

        return {
          totalCritical: criticalInsights.length,
          insights: criticalInsights,
        };
      } catch (error) {
        console.error("[Analysis] Erro ao obter insights criticos:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter insights criticos",
        });
      }
    }),
});
