import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  analyzeSecurityAlert,
  generateAttendanceSummary,
  chatbotResponse,
  detectAnomalies,
} from "./openai";
import {
  sendSMS,
  sendWhatsApp,
  sendSecurityAlert,
  sendAttendanceNotification,
  sendDailyReport,
  sendVerificationCode,
  getMessageStatus,
} from "./twilio";

export const integrationsRouter = router({
  // ============ OpenAI Routes ============

  /**
   * Analisar um alerta de segurança com IA
   */
  analyzeAlert: protectedProcedure
    .input(z.object({ alertDescription: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const analysis = await analyzeSecurityAlert(input.alertDescription);
        return { success: true, analysis };
      } catch (error) {
        return { success: false, error: "Falha ao analisar alerta" };
      }
    }),

  /**
   * Gerar resumo de presença com IA
   */
  generateAttendanceSummary: protectedProcedure
    .input(
      z.object({
        totalStudents: z.number(),
        presentStudents: z.number(),
        absentStudents: z.number(),
        lateStudents: z.number(),
        date: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const summary = await generateAttendanceSummary(input);
        return { success: true, summary };
      } catch (error) {
        return { success: false, error: "Falha ao gerar resumo" };
      }
    }),

  /**
   * Chatbot de suporte
   */
  chatbot: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const response = await chatbotResponse(input.message);
        return { success: true, response };
      } catch (error) {
        return { success: false, error: "Falha ao processar mensagem" };
      }
    }),

  /**
   * Detectar anomalias em presença
   */
  detectAnomalies: protectedProcedure
    .input(
      z.object({
        studentName: z.string(),
        lastWeekAttendance: z.array(z.number()),
        averageAttendance: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await detectAnomalies(input);
        return { success: true, analysis };
      } catch (error) {
        return { success: false, error: "Falha ao detectar anomalias" };
      }
    }),

  // ============ Twilio Routes ============

  /**
   * Enviar SMS
   */
  sendSMS: protectedProcedure
    .input(z.object({ toNumber: z.string(), message: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const messageSid = await sendSMS(input.toNumber, input.message);
        return { success: true, messageSid };
      } catch (error) {
        return { success: false, error: "Falha ao enviar SMS" };
      }
    }),

  /**
   * Enviar WhatsApp
   */
  sendWhatsApp: protectedProcedure
    .input(z.object({ toNumber: z.string(), message: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const messageSid = await sendWhatsApp(input.toNumber, input.message);
        return { success: true, messageSid };
      } catch (error) {
        return { success: false, error: "Falha ao enviar WhatsApp" };
      }
    }),

  /**
   * Enviar alerta de segurança
   */
  sendSecurityAlert: protectedProcedure
    .input(
      z.object({
        parentPhone: z.string(),
        studentName: z.string(),
        alertType: z.enum([
          "unauthorized_exit",
          "late_arrival",
          "absence",
          "health_incident",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const messageSid = await sendSecurityAlert(
          input.parentPhone,
          input.studentName,
          input.alertType
        );
        return { success: true, messageSid };
      } catch (error) {
        return { success: false, error: "Falha ao enviar alerta" };
      }
    }),

  /**
   * Enviar notificação de presença
   */
  sendAttendanceNotification: protectedProcedure
    .input(
      z.object({
        parentWhatsApp: z.string(),
        studentName: z.string(),
        arrivalTime: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const messageSid = await sendAttendanceNotification(
          input.parentWhatsApp,
          input.studentName,
          input.arrivalTime
        );
        return { success: true, messageSid };
      } catch (error) {
        return { success: false, error: "Falha ao enviar notificação" };
      }
    }),

  /**
   * Enviar relatório diário
   */
  sendDailyReport: protectedProcedure
    .input(
      z.object({
        parentWhatsApp: z.string(),
        studentName: z.string(),
        attendanceData: z.object({
          presentDays: z.number(),
          absentDays: z.number(),
          lateDays: z.number(),
          attendanceRate: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const messageSid = await sendDailyReport(
          input.parentWhatsApp,
          input.studentName,
          input.attendanceData
        );
        return { success: true, messageSid };
      } catch (error) {
        return { success: false, error: "Falha ao enviar relatório" };
      }
    }),

  /**
   * Enviar código de verificação
   */
  sendVerificationCode: protectedProcedure
    .input(z.object({ phoneNumber: z.string(), verificationCode: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const messageSid = await sendVerificationCode(
          input.phoneNumber,
          input.verificationCode
        );
        return { success: true, messageSid };
      } catch (error) {
        return { success: false, error: "Falha ao enviar código" };
      }
    }),

  /**
   * Obter status de mensagem
   */
  getMessageStatus: protectedProcedure
    .input(z.object({ messageSid: z.string() }))
    .query(async ({ input }) => {
      try {
        const status = await getMessageStatus(input.messageSid);
        return { success: true, status };
      } catch (error) {
        return { success: false, error: "Falha ao obter status" };
      }
    }),
});
