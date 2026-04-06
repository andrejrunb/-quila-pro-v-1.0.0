import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

// Mock do banco de dados
vi.mock("../db/contacts", () => ({
  createContactSubmission: vi.fn(async (data) => ({
    id: 1,
    ...data,
    status: "new",
    createdAt: new Date(),
  })),
  getAllContactSubmissions: vi.fn(async () => []),
  getContactSubmissionsByStatus: vi.fn(async () => []),
  getContactSubmissionById: vi.fn(async (id) => ({
    id,
    name: "João Silva",
    email: "joao@example.com",
    phone: "+5511999999999",
    schoolName: "Escola ABC",
    subject: "Demonstração",
    message: "Mensagem de teste",
    status: "new",
    respondedBy: null,
    responseMessage: null,
    createdAt: new Date(),
    respondedAt: null,
  })),
  updateContactSubmissionStatus: vi.fn(async () => true),
  respondToContactSubmission: vi.fn(async () => true),
  deleteContactSubmission: vi.fn(async () => true),
}));

// Mock do Twilio
vi.mock("./twilio", () => ({
  sendSMS: vi.fn(async () => "SM123456"),
}));

// Mock do sistema de notificações
vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createAdminContext(): TrpcContext {
  const adminUser: User = {
    id: 1,
    openId: "admin-user",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("Contact Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("contact.submit", () => {
    it("deve enviar um contato com dados válidos", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contact.submit({
        name: "João Silva",
        email: "joao@example.com",
        phone: "+5511999999999",
        schoolName: "Escola ABC",
        subject: "Demonstração do Sistema",
        message: "Gostaria de agendar uma demonstração do Áquila Pro.",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.message).toContain("sucesso");
    });

    it("deve rejeitar contato sem nome", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.contact.submit({
          name: "",
          email: "joao@example.com",
          phone: "+5511999999999",
          schoolName: "Escola ABC",
          subject: "Demonstração",
          message: "Mensagem de teste com mais de 10 caracteres.",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar contato com email inválido", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.contact.submit({
          name: "João Silva",
          email: "email-invalido",
          phone: "+5511999999999",
          schoolName: "Escola ABC",
          subject: "Demonstração",
          message: "Mensagem de teste com mais de 10 caracteres.",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar contato com assunto muito curto", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.contact.submit({
          name: "João Silva",
          email: "joao@example.com",
          phone: "+5511999999999",
          schoolName: "Escola ABC",
          subject: "Oi",
          message: "Mensagem de teste com mais de 10 caracteres.",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar contato com mensagem muito curta", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.contact.submit({
          name: "João Silva",
          email: "joao@example.com",
          phone: "+5511999999999",
          schoolName: "Escola ABC",
          subject: "Demonstração",
          message: "Curto",
        })
      ).rejects.toThrow();
    });
  });

  describe("contact.list", () => {
    it("deve rejeitar acesso sem autenticação", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.contact.list()).rejects.toThrow();
    });

    it("deve permitir acesso para admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contact.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("contact.updateStatus", () => {
    it("deve rejeitar acesso sem autenticação", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.contact.updateStatus({
          id: 1,
          status: "read",
        })
      ).rejects.toThrow();
    });

    it("deve permitir atualização para admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contact.updateStatus({
        id: 1,
        status: "read",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("contact.respond", () => {
    it("deve rejeitar acesso sem autenticação", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.contact.respond({
          id: 1,
          responseMessage: "Obrigado pelo contato!",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar resposta muito curta", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.contact.respond({
          id: 1,
          responseMessage: "Oi",
        })
      ).rejects.toThrow();
    });

    it("deve permitir resposta para admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contact.respond({
        id: 1,
        responseMessage: "Obrigado pelo contato! Entraremos em contato em breve.",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("contact.delete", () => {
    it("deve rejeitar acesso sem autenticação", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.contact.delete({ id: 1 })).rejects.toThrow();
    });

    it("deve permitir deleção para admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contact.delete({ id: 1 });
      expect(result.success).toBe(true);
    });
  });
});
