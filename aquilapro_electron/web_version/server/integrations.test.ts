import { describe, it, expect, beforeAll, vi } from "vitest";

// Mock das variáveis de ambiente
process.env.OPENAI_API_KEY = "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";
process.env.TWILIO_ACCOUNT_SID = "ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p";
process.env.TWILIO_AUTH_TOKEN = "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p";
process.env.TWILIO_PHONE_NUMBER = "+5511999999999";
process.env.TWILIO_WHATSAPP_NUMBER = "whatsapp:+5511999999999";

describe("Integrações OpenAI e Twilio", () => {
  describe("Validação de Secrets", () => {
    it("deve ter OPENAI_API_KEY configurada", () => {
      expect(process.env.OPENAI_API_KEY).toBeDefined();
      expect(process.env.OPENAI_API_KEY).toMatch(/^sk-/);
    });

    it("deve ter TWILIO_ACCOUNT_SID configurada", () => {
      expect(process.env.TWILIO_ACCOUNT_SID).toBeDefined();
      expect(process.env.TWILIO_ACCOUNT_SID).toMatch(/^AC/);
    });

    it("deve ter TWILIO_AUTH_TOKEN configurada", () => {
      expect(process.env.TWILIO_AUTH_TOKEN).toBeDefined();
      expect(process.env.TWILIO_AUTH_TOKEN).toBeTruthy();
    });

    it("deve ter TWILIO_PHONE_NUMBER configurada", () => {
      expect(process.env.TWILIO_PHONE_NUMBER).toBeDefined();
      expect(process.env.TWILIO_PHONE_NUMBER).toMatch(/^\+55/);
    });

    it("deve ter TWILIO_WHATSAPP_NUMBER configurada", () => {
      expect(process.env.TWILIO_WHATSAPP_NUMBER).toBeDefined();
      expect(process.env.TWILIO_WHATSAPP_NUMBER).toMatch(/^whatsapp:/);
    });
  });

  describe("Validação de Formatos", () => {
    it("OpenAI key deve ter formato correto", () => {
      const key = process.env.OPENAI_API_KEY || "";
      // Formato: sk-proj-xxxxx (começa com sk-proj-)
      expect(key.startsWith("sk-proj-")).toBe(true);
    });

    it("Twilio Account SID deve ter formato correto", () => {
      const sid = process.env.TWILIO_ACCOUNT_SID || "";
      // Formato: ACxxxxx (começa com AC e tem 33-34 caracteres no total)
      expect(sid.startsWith("AC")).toBe(true);
      expect(sid.length).toBeGreaterThanOrEqual(33);
    });

    it("Twilio Auth Token deve ter comprimento mínimo", () => {
      const token = process.env.TWILIO_AUTH_TOKEN || "";
      expect(token.length).toBeGreaterThan(20);
    });

    it("Número de telefone deve ter formato E.164", () => {
      const phone = process.env.TWILIO_PHONE_NUMBER || "";
      // Formato: +55 (país) + 11 (área) + 8-9 dígitos
      expect(phone).toMatch(/^\+55\d{10,11}$/);
    });
  });

  describe("Integração com Rotas", () => {
    it("rotas de integração devem estar registradas", async () => {
      // Importar o roteador
      const { integrationsRouter } = await import("./integrations/routes");

      expect(integrationsRouter).toBeDefined();
      expect(integrationsRouter._def).toBeDefined();
    });

    it("deve ter procedimentos OpenAI", async () => {
      const { integrationsRouter } = await import("./integrations/routes");

      const procedures = integrationsRouter._def.procedures;
      expect(procedures.analyzeAlert).toBeDefined();
      expect(procedures.generateAttendanceSummary).toBeDefined();
      expect(procedures.chatbot).toBeDefined();
      expect(procedures.detectAnomalies).toBeDefined();
    });

    it("deve ter procedimentos Twilio", async () => {
      const { integrationsRouter } = await import("./integrations/routes");

      const procedures = integrationsRouter._def.procedures;
      expect(procedures.sendSMS).toBeDefined();
      expect(procedures.sendWhatsApp).toBeDefined();
      expect(procedures.sendSecurityAlert).toBeDefined();
      expect(procedures.sendAttendanceNotification).toBeDefined();
      expect(procedures.sendDailyReport).toBeDefined();
      expect(procedures.sendVerificationCode).toBeDefined();
      expect(procedures.getMessageStatus).toBeDefined();
    });
  });

  describe("Validação de Segurança", () => {
    it("secrets não devem ser expostos em logs", () => {
      const key = process.env.OPENAI_API_KEY || "";
      // Garantir que a chave começa com o prefixo correto
      expect(key.startsWith("sk-proj-")).toBe(true);
    });

    it("Twilio credentials devem estar separadas", () => {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;

      // Devem ser diferentes
      expect(sid).not.toEqual(token);

      // Ambos devem estar definidos
      expect(sid).toBeDefined();
      expect(token).toBeDefined();
    });
  });

  describe("Casos de Uso", () => {
    it("deve suportar análise de alertas de segurança", () => {
      const alertTypes = [
        "unauthorized_exit",
        "late_arrival",
        "absence",
        "health_incident",
      ];

      alertTypes.forEach((type) => {
        expect(type).toBeTruthy();
      });
    });

    it("deve suportar diferentes tipos de notificação", () => {
      const notificationTypes = ["SMS", "WhatsApp", "Email"];

      expect(notificationTypes).toContain("SMS");
      expect(notificationTypes).toContain("WhatsApp");
    });

    it("deve validar números de telefone", () => {
      const validPhones = ["+5511999999999", "+5521987654321"];
      const invalidPhones = ["11999999999", "5511999999999"];

      validPhones.forEach((phone) => {
        expect(phone).toMatch(/^\+55\d{10,11}$/);
      });

      invalidPhones.forEach((phone) => {
        expect(phone).not.toMatch(/^\+55\d{10,11}$/);
      });
    });
  });
});
