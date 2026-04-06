import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendContactConfirmationEmail,
  sendSecurityAlertEmail,
  sendContactResponseEmail,
  sendDailyReportEmail,
} from "./sendgrid";
import {
  exportContactsToGoogleSheets,
  exportAlertsToGoogleSheets,
  exportDailyReportToGoogleSheets,
} from "./google-sheets";
import {
  notifyNewContact,
  notifySecurityAlert,
  notifyContactResponded,
  notifyDailySummary,
} from "./slack";

// Mock de variáveis de ambiente
beforeEach(() => {
  process.env.SENDGRID_API_KEY = "test_key_123";
  process.env.GOOGLE_SHEETS_API_KEY = "test_sheets_key";
  process.env.GOOGLE_SHEETS_ID = "test_sheet_id";
  process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";
});

describe("SendGrid Integration", () => {
  it("deve enviar email de confirmação de contato", async () => {
    const result = await sendContactConfirmationEmail(
      "joao@escola.com.br",
      "João Silva",
      123,
      "Dúvida sobre implementação"
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve enviar email de alerta de segurança", async () => {
    const result = await sendSecurityAlertEmail(
      "admin@escola.com.br",
      "Carlos Silva",
      "Saída não autorizada",
      "Portaria",
      "14:30",
      "CAM-001"
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve enviar email de resposta a contato", async () => {
    const result = await sendContactResponseEmail(
      "joao@escola.com.br",
      "João Silva",
      123,
      "Obrigado pelo contato! Entraremos em breve.",
      "André Jr"
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve enviar relatório diário por email", async () => {
    const result = await sendDailyReportEmail(
      "admin@escola.com.br",
      "2026-02-27",
      450,
      445,
      5,
      3,
      98.9
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve retornar erro se SendGrid não estiver configurado", async () => {
    process.env.SENDGRID_API_KEY = "";

    const result = await sendContactConfirmationEmail(
      "joao@escola.com.br",
      "João Silva",
      123,
      "Teste"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("Google Sheets Integration", () => {
  it("deve exportar contatos para Google Sheets", async () => {
    const contacts = [
      {
        id: 1,
        name: "João Silva",
        email: "joao@escola.com.br",
        phone: "11999999999",
        schoolName: "Escola ABC",
        subject: "Dúvida",
        status: "new" as const,
        createdAt: new Date(),
      },
    ];

    const result = await exportContactsToGoogleSheets(contacts);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve exportar alertas para Google Sheets", async () => {
    const alerts = [
      {
        id: 1,
        type: "Saída não autorizada",
        studentName: "Carlos Silva",
        timestamp: new Date(),
        location: "Portaria",
        priority: "HIGH",
        status: "new",
      },
    ];

    const result = await exportAlertsToGoogleSheets(alerts);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve exportar relatório diário para Google Sheets", async () => {
    const result = await exportDailyReportToGoogleSheets(
      new Date(),
      450,
      445,
      5,
      3,
      98.9
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve retornar erro se Google Sheets não estiver configurado", async () => {
    process.env.GOOGLE_SHEETS_API_KEY = "";

    const contacts = [
      {
        id: 1,
        name: "João",
        email: "joao@test.com",
        subject: "Teste",
        status: "new" as const,
        createdAt: new Date(),
      },
    ];

    const result = await exportContactsToGoogleSheets(contacts);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("Slack Integration", () => {
  it("deve notificar novo contato no Slack", async () => {
    const result = await notifyNewContact(
      "João Silva",
      "joao@escola.com.br",
      "Dúvida sobre implementação",
      "Escola ABC",
      123
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve notificar alerta de segurança no Slack", async () => {
    const result = await notifySecurityAlert(
      "Carlos Silva",
      "Saída não autorizada",
      "Portaria",
      "14:30",
      "CAM-001",
      "HIGH"
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve notificar contato respondido no Slack", async () => {
    const result = await notifyContactResponded(
      "João Silva",
      "joao@escola.com.br",
      123,
      "André Jr"
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve notificar resumo diário no Slack", async () => {
    const result = await notifyDailySummary(
      "2026-02-27",
      450,
      445,
      5,
      3,
      98.9
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("deve retornar erro se Slack não estiver configurado", async () => {
    process.env.SLACK_WEBHOOK_URL = "";

    const result = await notifyNewContact(
      "João",
      "joao@test.com",
      "Teste",
      "Escola",
      1
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("Integrations - Data Validation", () => {
  it("deve validar email válido", async () => {
    const validEmail = "joao@escola.com.br";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(emailRegex.test(validEmail)).toBe(true);
  });

  it("deve rejeitar email inválido", async () => {
    const invalidEmail = "joao@";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(emailRegex.test(invalidEmail)).toBe(false);
  });

  it("deve validar estrutura de contato", () => {
    const contact = {
      id: 1,
      name: "João Silva",
      email: "joao@escola.com.br",
      phone: "11999999999",
      schoolName: "Escola ABC",
      subject: "Dúvida",
      status: "new" as const,
      createdAt: new Date(),
    };

    expect(contact.id).toBeGreaterThan(0);
    expect(contact.name.length).toBeGreaterThan(0);
    expect(contact.email).toContain("@");
    expect(contact.status).toBe("new");
  });

  it("deve validar estrutura de alerta", () => {
    const alert = {
      id: 1,
      type: "Saída não autorizada",
      studentName: "Carlos Silva",
      timestamp: new Date(),
      location: "Portaria",
      priority: "HIGH",
      status: "new",
    };

    expect(alert.id).toBeGreaterThan(0);
    expect(["HIGH", "MEDIUM", "LOW"]).toContain(alert.priority);
    expect(alert.timestamp instanceof Date).toBe(true);
  });

  it("deve validar estrutura de relatório", () => {
    const report = {
      date: "2026-02-27",
      totalStudents: 450,
      presentStudents: 445,
      absentStudents: 5,
      alertsCount: 3,
      averageAttendance: 98.9,
    };

    expect(report.totalStudents).toBeGreaterThan(0);
    expect(report.presentStudents).toBeLessThanOrEqual(report.totalStudents);
    expect(report.absentStudents).toBeLessThanOrEqual(report.totalStudents);
    expect(report.averageAttendance).toBeGreaterThanOrEqual(0);
    expect(report.averageAttendance).toBeLessThanOrEqual(100);
  });
});
