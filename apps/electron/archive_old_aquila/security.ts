import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import {
  securityEvents,
  detectedObjects,
  unknownPersons,
  securityAlerts,
  securityResponses,
  aglomerationEvents,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export const securityRouter = router({
  // ==================== DETECÇÃO DE VIOLÊNCIA E ARMAS ====================

  recordViolence: protectedProcedure
    .input(
      z.object({
        schoolId: z.number(),
        cameraId: z.number(),
        eventType: z.enum([
          "weapon_detected",
          "violence_detected",
          "threat_detected",
        ]),
        severity: z.enum(["critical", "high", "medium", "low"]),
        confidence: z.number().min(0).max(100),
        description: z.string().optional(),
        frameUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        location: z.string().optional(),
        detectedObjects: z
          .array(
            z.object({
              objectType: z.enum([
                "gun",
                "knife",
                "weapon_white",
                "explosive",
                "other_dangerous",
              ]),
              confidence: z.number().min(0).max(100),
              locationX: z.number().optional(),
              locationY: z.number().optional(),
              sizeWidth: z.number().optional(),
              sizeHeight: z.number().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Registrar evento de segurança
      const event = await db.insert(securityEvents).values({
        schoolId: input.schoolId,
        cameraId: input.cameraId,
        eventType: input.eventType,
        severity: input.severity,
        confidence: input.confidence,
        description: input.description,
        frameUrl: input.frameUrl,
        videoUrl: input.videoUrl,
        location: input.location,
        timestamp: new Date(),
      });

      const eventId = event[0].insertId;

      // Registrar objetos detectados
      if (input.detectedObjects && input.detectedObjects.length > 0) {
        for (const obj of input.detectedObjects) {
          await db.insert(detectedObjects).values({
            securityEventId: Number(eventId),
            objectType: obj.objectType,
            confidence: obj.confidence,
            locationX: obj.locationX,
            locationY: obj.locationY,
            sizeWidth: obj.sizeWidth,
            sizeHeight: obj.sizeHeight,
          });
        }
      }

      // Gerar alerta crítico
      const alert = await db.insert(securityAlerts).values({
        securityEventId: Number(eventId),
        alertType:
          input.eventType === "weapon_detected"
            ? "weapon_detected"
            : input.eventType === "violence_detected"
              ? "violence_active"
              : "threat_level_high",
        severity: input.severity,
        sentTo: "1", // será preenchido pela função de notificação
        sentVia: "sms",
        status: "pending",
      });

      return {
        eventId: Number(eventId),
        alertId: alert[0].insertId,
        severity: input.severity,
        confidence: input.confidence,
      };
    }),

  // ==================== DETECÇÃO DE PESSOAS DESCONHECIDAS ====================

  recordUnknownPerson: protectedProcedure
    .input(
      z.object({
        schoolId: z.number(),
        cameraId: z.number(),
        faceEncoding: z.string().optional(),
        location: z.string(),
        confidence: z.number().min(0).max(100),
        isSuspicious: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      // Verificar se pessoa já foi registrada
      const existing = await db
        .select()
        .from(unknownPersons)
        .where(
          and(
            eq(unknownPersons.schoolId, input.schoolId),
            eq(unknownPersons.faceEncoding, input.faceEncoding || "")
          )
        )
        .limit(1);

      let personId: number;

      if (existing.length > 0) {
        // Atualizar ocorrência existente
        personId = existing[0].id;
        await db
          .update(unknownPersons)
          .set({
            lastSeen: new Date(),
            totalOccurrences: (existing[0].totalOccurrences || 0) + 1,
            threatLevel: input.isSuspicious ? "high" : "medium",
          })
          .where(eq(unknownPersons.id, personId));
      } else {
        // Criar novo registro
        const result = await db.insert(unknownPersons).values({
          schoolId: input.schoolId,
          faceEncoding: input.faceEncoding,
          firstSeen: new Date(),
          lastSeen: new Date(),
          totalOccurrences: 1,
          threatLevel: input.isSuspicious ? "high" : "medium",
          status: "unknown",
        });
        personId = result[0].insertId as number;
      }

      // Registrar evento de segurança
      const event = await db.insert(securityEvents).values({
        schoolId: input.schoolId,
        cameraId: input.cameraId,
        eventType: "unknown_person",
        severity: input.isSuspicious ? "high" : "medium",
        confidence: input.confidence,
        description: `Pessoa desconhecida detectada em ${input.location}`,
        location: input.location,
        timestamp: new Date(),
      });

      const eventId = event[0].insertId;

      // Gerar alerta se suspeito
      let alertId = null;
      if (input.isSuspicious) {
        const alert = await db.insert(securityAlerts).values({
          securityEventId: Number(eventId),
          alertType: "unknown_person_suspicious",
          severity: "high",
          sentTo: "1",
          sentVia: "email",
          status: "pending",
        });
        alertId = alert[0].insertId;
      }

      return {
        personId,
        eventId: Number(eventId),
        alertId,
        isSuspicious: input.isSuspicious,
      };
    }),

  // ==================== DETECÇÃO DE AGLOMERAÇÃO ====================

  recordAglomeration: protectedProcedure
    .input(
      z.object({
        schoolId: z.number(),
        cameraId: z.number(),
        personCount: z.number().min(1),
        unknownCount: z.number().min(0),
        duration: z.number().min(1),
        confidence: z.number().min(0).max(100),
        location: z.string(),
        frameUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Registrar evento de aglomeração
      const aglomeration = await db.insert(aglomerationEvents).values({
        schoolId: input.schoolId,
        cameraId: input.cameraId,
        personCount: input.personCount,
        unknownCount: input.unknownCount,
        duration: input.duration,
        confidence: input.confidence,
        location: input.location,
        frameUrl: input.frameUrl,
        timestamp: new Date(),
      });

      const aglomerationId = aglomeration[0].insertId;

      // Registrar evento de segurança
      const event = await db.insert(securityEvents).values({
        schoolId: input.schoolId,
        cameraId: input.cameraId,
        eventType: "aglomeration_suspicious",
        severity: input.unknownCount > 2 ? "high" : "medium",
        confidence: input.confidence,
        description: `Aglomeração de ${input.personCount} pessoas (${input.unknownCount} desconhecidas) por ${input.duration}s`,
        location: input.location,
        frameUrl: input.frameUrl,
        timestamp: new Date(),
      });

      const eventId = event[0].insertId;

      // Gerar alerta
      const alert = await db.insert(securityAlerts).values({
        securityEventId: Number(eventId),
        alertType: "aglomeration_alert",
        severity: input.unknownCount > 2 ? "high" : "medium",
        sentTo: "1",
        sentVia: "panel",
        status: "pending",
      });

      return {
        aglomerationId: Number(aglomerationId),
        eventId: Number(eventId),
        alertId: alert[0].insertId,
      };
    }),

  // ==================== CONSULTAS ====================

  getActiveAlerts: protectedProcedure
    .input(
      z.object({
        schoolId: z.number(),
        severity: z.enum(["critical", "high", "medium", "low"]).optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const query = db
        .select()
        .from(securityAlerts)
        .innerJoin(
          securityEvents,
          eq(securityAlerts.securityEventId, securityEvents.id)
        )
        .where(
          and(
            eq(securityEvents.schoolId, input.schoolId),
            eq(securityAlerts.status, "pending")
          )
        );

      if (input.severity) {
        query.where(eq(securityAlerts.severity, input.severity));
      }

      const alerts = await query
        .orderBy(desc(securityAlerts.createdAt))
        .limit(input.limit);

      return {
        alerts: alerts.map((a) => ({
          alert: a.security_alerts,
          event: a.security_events,
        })),
        totalCount: alerts.length,
        criticalCount: alerts.filter(
          (a) => a.security_alerts.severity === "critical"
        ).length,
      };
    }),

  getSecurityEvents: protectedProcedure
    .input(
      z.object({
        schoolId: z.number(),
        eventType: z.string().optional(),
        severity: z.enum(["critical", "high", "medium", "low"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(securityEvents.schoolId, input.schoolId)];

      if (input.eventType) {
        conditions.push(eq(securityEvents.eventType, input.eventType as any));
      }
      if (input.severity) {
        conditions.push(eq(securityEvents.severity, input.severity));
      }
      if (input.startDate) {
        conditions.push(gte(securityEvents.timestamp, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(securityEvents.timestamp, input.endDate));
      }

      const events = await db
        .select()
        .from(securityEvents)
        .where(and(...conditions))
        .orderBy(desc(securityEvents.timestamp))
        .limit(input.limit);

      return {
        events,
        total: events.length,
      };
    }),

  getUnknownPersons: protectedProcedure
    .input(
      z.object({
        schoolId: z.number(),
        status: z
          .enum(["identified", "unknown", "banned", "flagged"])
          .optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(unknownPersons.schoolId, input.schoolId)];

      if (input.status) {
        conditions.push(eq(unknownPersons.status, input.status));
      }

      const persons = await db
        .select()
        .from(unknownPersons)
        .where(and(...conditions))
        .orderBy(desc(unknownPersons.lastSeen))
        .limit(input.limit);

      return {
        persons,
        totalCount: persons.length,
      };
    }),

  // ==================== AÇÕES ====================

  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(securityAlerts)
        .set({
          status: "acknowledged",
          acknowledgedBy: ctx.user.id,
          acknowledgedAt: new Date(),
        })
        .where(eq(securityAlerts.id, input.alertId));

      return { success: true };
    }),

  resolveEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        actionTaken: z.enum([
          "acknowledged",
          "investigating",
          "called_security",
          "called_police",
          "false_alarm",
          "resolved",
          "escalated",
        ]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Atualizar evento
      await db
        .update(securityEvents)
        .set({
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
        })
        .where(eq(securityEvents.id, input.eventId));

      // Registrar resposta
      await db.insert(securityResponses).values({
        securityAlertId: input.eventId, // será ajustado conforme necessário
        responderId: ctx.user.id,
        actionTaken: input.actionTaken,
        notes: input.notes,
        resolved: 1,
        resolvedAt: new Date(),
      });

      return { success: true };
    }),

  identifyUnknownPerson: protectedProcedure
    .input(
      z.object({
        personId: z.number(),
        name: z.string(),
        relationship: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(unknownPersons)
        .set({
          status: "identified",
          identifiedAs: input.name,
          identifiedBy: ctx.user.id,
          identifiedAt: new Date(),
        })
        .where(eq(unknownPersons.id, input.personId));

      return { success: true };
    }),

  // ==================== ESTATÍSTICAS ====================

  getSecurityStats: protectedProcedure
    .input(
      z.object({
        schoolId: z.number(),
        days: z.number().default(7),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const events = await db
        .select({
          eventType: securityEvents.eventType,
          count: sql<number>`COUNT(*)`,
        })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.schoolId, input.schoolId),
            gte(securityEvents.timestamp, startDate)
          )
        )
        .groupBy(securityEvents.eventType);

      const alerts = await db
        .select({
          severity: securityAlerts.severity,
          count: sql<number>`COUNT(*)`,
        })
        .from(securityAlerts)
        .where(gte(securityAlerts.createdAt, startDate))
        .groupBy(securityAlerts.severity);

      return {
        eventsByType: events,
        alertsBySeverity: alerts,
        period: `${input.days} dias`,
      };
    }),
});
