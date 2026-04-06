/**
 * Router tRPC para Integração com API Python
 *
 * Conecta o frontend React com a API FastAPI do Áquila Pro
 * para reconhecimento facial, rastreamento de presença e análise
 */

import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import axios from "axios";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

// Schemas de validação
const RecognizeFrameSchema = z.object({
  imageData: z.string().describe("Imagem em base64"),
  scaleFactor: z.number().optional().default(0.25),
});

const RegisterLocationSchema = z.object({
  name: z.string().describe("Nome da localização"),
  locationType: z.string().describe("Tipo de localização"),
  description: z.string().optional(),
});

const RegisterStudentSchema = z.object({
  studentId: z.string().describe("ID do aluno"),
  classId: z.string().describe("ID da turma"),
});

const RecordEventSchema = z.object({
  studentId: z.string(),
  locationId: z.number(),
  eventType: z.string(),
});

const ProcessFrameTrackingSchema = z.object({
  locationId: z.number(),
  imageData: z.string(),
});

export const pythonIntegrationRouter = router({
  // ============================================================================
  // RECONHECIMENTO FACIAL
  // ============================================================================

  /**
   * Carrega o dataset de rostos conhecidos
   */
  loadDataset: publicProcedure.query(async () => {
    try {
      const response = await axios.post(
        `${PYTHON_API_URL}/api/facial-recognition/load-dataset`
      );

      return {
        success: true,
        message: response.data.message,
        numFaces: response.data.num_faces,
      };
    } catch (error) {
      console.error("Erro ao carregar dataset:", error);
      throw new Error("Falha ao carregar dataset de reconhecimento facial");
    }
  }),

  /**
   * Reconhece rostos em um frame
   */
  recognizeFrame: publicProcedure
    .input(RecognizeFrameSchema)
    .mutation(async ({ input }: { input: z.infer<typeof RecognizeFrameSchema> }) => {
      try {
        const response = await axios.post(
          `${PYTHON_API_URL}/api/facial-recognition/recognize-frame`,
          {
            image_data: input.imageData,
            scale_factor: input.scaleFactor,
          }
        );

        return {
          success: true,
          detections: response.data.detections,
          count: response.data.count,
        };
      } catch (error) {
        console.error("Erro ao reconhecer frame:", error);
        throw new Error("Falha ao reconhecer rostos no frame");
      }
    }),

  /**
   * Adiciona um novo rosto ao dataset
   */
  addFace: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        imageData: z.string(),
      })
    )
    .mutation(async ({ input }: { input: { studentId: string; imageData: string } }) => {
      try {
        // Converter base64 para buffer
        const buffer = Buffer.from(input.imageData, "base64");

        const formData = new FormData();
        formData.append("student_id", input.studentId);
        formData.append(
          "file",
          new Blob([buffer], { type: "image/jpeg" }),
          "face.jpg"
        );

        const response = await axios.post(
          `${PYTHON_API_URL}/api/facial-recognition/add-face`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        return {
          success: true,
          message: response.data.message,
          studentId: response.data.student_id,
        };
      } catch (error) {
        console.error("Erro ao adicionar rosto:", error);
        throw new Error("Falha ao adicionar rosto ao dataset");
      }
    }),

  /**
   * Obtém estatísticas do modelo de reconhecimento facial
   */
  getFacialRecognitionStats: publicProcedure.query(async () => {
    try {
      const response = await axios.get(
        `${PYTHON_API_URL}/api/facial-recognition/statistics`
      );

      return {
        success: true,
        statistics: response.data.statistics,
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      throw new Error("Falha ao obter estatísticas de reconhecimento facial");
    }
  }),

  // ============================================================================
  // RASTREAMENTO DE PRESENÇA
  // ============================================================================

  /**
   * Registra uma nova localização
   */
  registerLocation: protectedProcedure
    .input(RegisterLocationSchema)
    .mutation(async ({ input }: { input: z.infer<typeof RegisterLocationSchema> }) => {
      try {
        const response = await axios.post(
          `${PYTHON_API_URL}/api/presence/register-location`,
          {
            name: input.name,
            location_type: input.locationType,
            description: input.description,
          }
        );

        return {
          success: true,
          locationId: response.data.location_id,
          name: response.data.name,
          type: response.data.type,
        };
      } catch (error) {
        console.error("Erro ao registrar localização:", error);
        throw new Error("Falha ao registrar localização");
      }
    }),

  /**
   * Registra um aluno
   */
  registerStudent: protectedProcedure
    .input(RegisterStudentSchema)
    .mutation(async ({ input }: { input: z.infer<typeof RegisterStudentSchema> }) => {
      try {
        const response = await axios.post(
          `${PYTHON_API_URL}/api/presence/register-student`,
          {
            student_id: input.studentId,
            class_id: input.classId,
          }
        );

        return {
          success: true,
          studentId: response.data.student_id,
          classId: response.data.class_id,
        };
      } catch (error) {
        console.error("Erro ao registrar aluno:", error);
        throw new Error("Falha ao registrar aluno");
      }
    }),

  /**
   * Registra um evento de presença
   */
  recordEvent: protectedProcedure
    .input(RecordEventSchema)
    .mutation(async ({ input }: { input: z.infer<typeof RecordEventSchema> }) => {
      try {
        const response = await axios.post(
          `${PYTHON_API_URL}/api/presence/record-event`,
          {
            student_id: input.studentId,
            location_id: input.locationId,
            event_type: input.eventType,
          }
        );

        return {
          success: true,
          eventId: response.data.event_id,
          studentId: response.data.student_id,
          locationId: response.data.location_id,
          eventType: response.data.event_type,
          timestamp: response.data.timestamp,
        };
      } catch (error) {
        console.error("Erro ao registrar evento:", error);
        throw new Error("Falha ao registrar evento de presença");
      }
    }),

  /**
   * Obtém resumo diário de um aluno
   */
  getDailySummary: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        date: z.string().optional(),
      })
    )
    .query(async ({ input }: { input: { studentId: string; date?: string } }) => {
      try {
        const params = new URLSearchParams();
        if (input.date) {
          params.append("date", input.date);
        }

        const response = await axios.get(
          `${PYTHON_API_URL}/api/presence/daily-summary/${input.studentId}?${params}`
        );

        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error("Erro ao obter resumo diário:", error);
        throw new Error("Falha ao obter resumo diário");
      }
    }),

  // ============================================================================
  // RASTREAMENTO INTEGRADO
  // ============================================================================

  /**
   * Processa um frame com rastreamento integrado
   */
  processFrameTracking: publicProcedure
    .input(ProcessFrameTrackingSchema)
    .mutation(async ({ input }: { input: z.infer<typeof ProcessFrameTrackingSchema> }) => {
      try {
        const response = await axios.post(
          `${PYTHON_API_URL}/api/tracking/process-frame`,
          {
            location_id: input.locationId,
            image_data: input.imageData,
          }
        );

        return {
          success: true,
          events: response.data.events,
          count: response.data.count,
          timestamp: response.data.timestamp,
        };
      } catch (error) {
        console.error("Erro ao processar frame:", error);
        throw new Error("Falha ao processar frame com rastreamento");
      }
    }),

  /**
   * Obtém status de um aluno
   */
  getStudentStatus: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        locationId: z.number(),
      })
    )
    .query(async ({ input }: { input: { studentId: string; locationId: number } }) => {
      try {
        const response = await axios.get(
          `${PYTHON_API_URL}/api/tracking/student-status/${input.studentId}?location_id=${input.locationId}`
        );

        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error("Erro ao obter status do aluno:", error);
        throw new Error("Falha ao obter status do aluno");
      }
    }),

  /**
   * Verifica a saúde da API Python
   */
  healthCheck: publicProcedure.query(async () => {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/health`);

      return {
        status: response.data.status,
        systems: response.data.systems,
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      console.error("Erro ao verificar saúde da API:", error);
      return {
        status: "unhealthy",
        systems: {
          facial_recognition: false,
          presence_tracking: false,
          tracking_engine: false,
        },
        error: "Falha ao conectar com API Python",
      };
    }
  }),
});
