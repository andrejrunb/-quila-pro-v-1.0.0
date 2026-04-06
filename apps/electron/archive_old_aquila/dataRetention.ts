import { z } from "zod";
import { eq, and, lte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  events,
  insights,
  parentAlerts,
  dataExports,
  academicPeriods,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

/**
 * Gestão de Retenção de Dados por Bimestre
 * Exporta dados para HD e deleta automaticamente conforme política de retenção
 */
export const dataRetentionRouter = router({
  /**
   * Exportar dados de um período para arquivo
   */
  exportPeriodData: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        format: z.enum(["json", "csv"]).default("json"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem exportar dados",
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
        // Obter período
        const period = await db
          .select()
          .from(academicPeriods)
          .where(eq(academicPeriods.id, input.periodId))
          .limit(1);

        if (period.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Período nao encontrado",
          });
        }

        // Obter todos os dados do período
        const periodEvents = await db
          .select()
          .from(events)
          .where(eq(events.periodId, input.periodId));

        const periodInsights = await db
          .select()
          .from(insights)
          .where(eq(insights.periodId, input.periodId));

        const periodAlerts = await db
          .select()
          .from(parentAlerts)
          .where(eq(parentAlerts.status, "sent"));

        // Preparar dados para exportação
        const exportData = {
          period: period[0],
          events: periodEvents.map((e) => ({
            ...e,
            metadata: e.metadata ? JSON.parse(e.metadata) : null,
          })),
          insights: periodInsights,
          alerts: periodAlerts,
          exportDate: new Date(),
          totalEvents: periodEvents.length,
          totalInsights: periodInsights.length,
          totalAlerts: periodAlerts.length,
        };

        // Converter para formato solicitado
        let fileContent: string;
        let fileName: string;
        let contentType: string;

        if (input.format === "csv") {
          // Converter para CSV
          fileContent = convertToCSV(exportData);
          fileName = `periodo_${input.periodId}_${new Date().getTime()}.csv`;
          contentType = "text/csv";
        } else {
          // JSON
          fileContent = JSON.stringify(exportData, null, 2);
          fileName = `periodo_${input.periodId}_${new Date().getTime()}.json`;
          contentType = "application/json";
        }

        // Salvar em S3
        const { url } = await storagePut(
          `exports/${fileName}`,
          fileContent,
          contentType
        );

        // Registrar exportação no banco
        await db.insert(dataExports).values({
          periodId: input.periodId,
          schoolId: 1, // TODO: obter schoolId do contexto
          filePath: fileName,
          fileSize: fileContent.length,
          exportedBy: ctx.user.id,
        });

        return {
          success: true,
          fileName,
          url,
          totalRecords: periodEvents.length + periodInsights.length,
          message: "Dados exportados com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[DataRetention] Erro ao exportar dados:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao exportar dados",
        });
      }
    }),

  /**
   * Obter histórico de exportações
   */
  getExportHistory: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive().optional(),
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

        if (input.periodId) {
          conditions.push(eq(dataExports.periodId, input.periodId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const query = whereClause
          ? db.select().from(dataExports).where(whereClause)
          : db.select().from(dataExports);

        const exports = await query.limit(input.limit);

        return {
          total: exports.length,
          exports: exports.map((e) => ({
            id: e.id,
            periodId: e.periodId,
            filePath: e.filePath,
            fileSize: e.fileSize,
            exportedAt: e.exportedAt,
          })),
        };
      } catch (error) {
        console.error("[DataRetention] Erro ao obter histórico:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter histórico",
        });
      }
    }),

  /**
   * Deletar dados expirados de um período
   */
  deleteExpiredData: protectedProcedure
    .input(
      z.object({
        periodId: z.number().int().positive(),
        confirmDeletion: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem deletar dados",
        });
      }

      if (!input.confirmDeletion) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmação de deleção necessária",
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
        // Obter período
        const period = await db
          .select()
          .from(academicPeriods)
          .where(eq(academicPeriods.id, input.periodId))
          .limit(1);

        if (period.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Período nao encontrado",
          });
        }

        // Verificar se período expirou
        const periodData = period[0];
        const expirationDate = new Date(periodData.endDate);
        expirationDate.setDate(
          expirationDate.getDate() + (periodData.dataRetentionDays || 30)
        );

        if (new Date() < expirationDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Período ainda não expirou. Expiração em: ${expirationDate.toLocaleDateString("pt-BR")}`,
          });
        }

        // Contar registros antes de deletar
        const eventsToDelete = await db
          .select()
          .from(events)
          .where(eq(events.periodId, input.periodId));

        const insightsToDelete = await db
          .select()
          .from(insights)
          .where(eq(insights.periodId, input.periodId));

        // Deletar dados
        await db.delete(events).where(eq(events.periodId, input.periodId));
        await db.delete(insights).where(eq(insights.periodId, input.periodId));

        return {
          success: true,
          deletedEvents: eventsToDelete.length,
          deletedInsights: insightsToDelete.length,
          message: `${eventsToDelete.length + insightsToDelete.length} registros deletados`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[DataRetention] Erro ao deletar dados:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar dados",
        });
      }
    }),

  /**
   * Obter status de retenção de dados
   */
  getRetentionStatus: protectedProcedure
    .input(z.object({ periodId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar status",
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
        // Obter período
        const period = await db
          .select()
          .from(academicPeriods)
          .where(eq(academicPeriods.id, input.periodId))
          .limit(1);

        if (period.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Período nao encontrado",
          });
        }

        const periodData = period[0];

        // Contar registros
        const eventCount = await db
          .select()
          .from(events)
          .where(eq(events.periodId, input.periodId));

        const insightCount = await db
          .select()
          .from(insights)
          .where(eq(insights.periodId, input.periodId));

        // Calcular data de expiração
        const expirationDate = new Date(periodData.endDate);
        expirationDate.setDate(
          expirationDate.getDate() + (periodData.dataRetentionDays || 30)
        );

        const now = new Date();
        const daysUntilExpiration = Math.ceil(
          (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Obter exportações
        const exports = await db
          .select()
          .from(dataExports)
          .where(eq(dataExports.periodId, input.periodId));

        return {
          period: {
            id: periodData.id,
            name: periodData.name,
            startDate: periodData.startDate,
            endDate: periodData.endDate,
          },
          dataRetention: {
            retentionDays: periodData.dataRetentionDays,
            expirationDate,
            daysUntilExpiration,
            isExpired: daysUntilExpiration <= 0,
          },
          records: {
            events: eventCount.length,
            insights: insightCount.length,
            total: eventCount.length + insightCount.length,
          },
          exports: {
            totalExports: exports.length,
            lastExport: exports.length > 0 ? exports[exports.length - 1].exportedAt : null,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[DataRetention] Erro ao obter status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter status",
        });
      }
    }),

  /**
   * Listar períodos com dados expirados
   */
  getExpiredPeriods: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem acessar períodos expirados",
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
      const allPeriods = await db.select().from(academicPeriods);

      const expiredPeriods = allPeriods.filter((p) => {
        const expirationDate = new Date(p.endDate);
        expirationDate.setDate(
          expirationDate.getDate() + (p.dataRetentionDays || 30)
        );
        return new Date() >= expirationDate;
      });

      return {
        total: expiredPeriods.length,
        periods: expiredPeriods.map((p) => {
          const expirationDate = new Date(p.endDate);
          expirationDate.setDate(
            expirationDate.getDate() + (p.dataRetentionDays || 30)
          );
          return {
            id: p.id,
            name: p.name,
            endDate: p.endDate,
            expirationDate,
          };
        }),
      };
    } catch (error) {
      console.error("[DataRetention] Erro ao listar períodos expirados:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar períodos expirados",
      });
    }
  }),
});

/**
 * Converter dados para CSV
 */
function convertToCSV(data: any): string {
  const lines: string[] = [];

  // Cabeçalho de informações do período
  lines.push("# EXPORTAÇÃO DE DADOS - ÁQUILA PRO");
  lines.push(`# Período: ${data.period.name}`);
  lines.push(`# Data de Exportação: ${data.exportDate}`);
  lines.push(`# Total de Eventos: ${data.totalEvents}`);
  lines.push(`# Total de Insights: ${data.totalInsights}`);
  lines.push("");

  // Eventos
  if (data.events.length > 0) {
    lines.push("## EVENTOS");
    lines.push(
      "ID,Aluno ID,Turma ID,Tipo,Duração (min),Data/Hora,Sala ID"
    );
    data.events.forEach((e: any) => {
      lines.push(
        `${e.id},${e.studentId},${e.classId},${e.eventType},${e.duration || ""},${e.timestamp},${e.roomId || ""}`
      );
    });
    lines.push("");
  }

  // Insights
  if (data.insights.length > 0) {
    lines.push("## INSIGHTS");
    lines.push(
      "ID,Aluno ID,Turma ID,Categoria,Score,Severidade,Descrição"
    );
    data.insights.forEach((i: any) => {
      lines.push(
        `${i.id},${i.studentId},${i.classId},${i.category},${i.score},${i.severity},"${i.description}"`
      );
    });
    lines.push("");
  }

  // Alertas
  if (data.alerts.length > 0) {
    lines.push("## ALERTAS PARA PAIS");
    lines.push("ID,Aluno ID,Tipo de Mensagem,Status,Data de Envio");
    data.alerts.forEach((a: any) => {
      lines.push(
        `${a.id},${a.studentId},${a.messageType},${a.status},${a.sentAt || ""}`
      );
    });
  }

  return lines.join("\n");
}
