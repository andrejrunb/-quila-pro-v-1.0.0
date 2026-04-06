import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { eventsRouter } from "./events";

// Mock do banco de dados
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../db", () => ({
  getDb: vi.fn(async () => mockDb),
}));

describe("Events Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("deve registrar novo evento com sucesso", async () => {
      const mockInsert = vi.fn().mockResolvedValue({});
      mockDb.insert.mockReturnValue({ values: mockInsert });

      const caller = eventsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.create({
        periodId: 1,
        studentId: 1,
        classId: 1,
        eventType: "late_arrival",
        timestamp: new Date(),
        duration: 15,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("sucesso");
    });

    it("deve rejeitar criacao se usuario nao for admin", async () => {
      const caller = eventsRouter.createCaller({
        user: { role: "user", id: 1, name: "User", email: "user@test.com" },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.create({
          periodId: 1,
          studentId: 1,
          classId: 1,
          eventType: "late_arrival",
          timestamp: new Date(),
        })
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("listByStudent", () => {
    it("deve listar eventos de um aluno", async () => {
      const mockEvents = [
        {
          id: 1,
          periodId: 1,
          studentId: 1,
          classId: 1,
          roomId: null,
          eventType: "late_arrival",
          duration: 15,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockEvents),
        }),
      });

      const caller = eventsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.listByStudent({
        studentId: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe("late_arrival");
    });

    it("deve filtrar eventos por tipo", async () => {
      const mockEvents = [
        {
          id: 1,
          periodId: 1,
          studentId: 1,
          classId: 1,
          roomId: null,
          eventType: "late_arrival",
          duration: 15,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockEvents),
        }),
      });

      const caller = eventsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.listByStudent({
        studentId: 1,
        eventType: "late_arrival",
      });

      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe("late_arrival");
    });
  });

  describe("listByClass", () => {
    it("deve listar eventos de uma turma", async () => {
      const mockEvents = [
        {
          id: 1,
          periodId: 1,
          studentId: 1,
          classId: 1,
          roomId: null,
          eventType: "late_arrival",
          duration: 15,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          periodId: 1,
          studentId: 2,
          classId: 1,
          roomId: null,
          eventType: "absence",
          duration: null,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockEvents),
        }),
      });

      const caller = eventsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.listByClass({
        classId: 1,
      });

      expect(result).toHaveLength(2);
    });
  });

  describe("getStats", () => {
    it("deve retornar estatisticas de eventos", async () => {
      const mockEvents = [
        {
          id: 1,
          eventType: "late_arrival",
          duration: 15,
          periodId: 1,
          studentId: 1,
          classId: 1,
          roomId: null,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          eventType: "late_arrival",
          duration: 10,
          periodId: 1,
          studentId: 1,
          classId: 1,
          roomId: null,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
        },
        {
          id: 3,
          eventType: "absence",
          duration: null,
          periodId: 1,
          studentId: 1,
          classId: 1,
          roomId: null,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockEvents),
        }),
      });

      const caller = eventsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getStats({
        periodId: 1,
        studentId: 1,
      });

      expect(result.totalEvents).toBe(3);
      expect(result.eventsByType.late_arrival).toBe(2);
      expect(result.eventsByType.absence).toBe(1);
      expect(result.averageDuration).toBe(25 / 3);
    });
  });

  describe("delete", () => {
    it("deve deletar evento com sucesso", async () => {
      const mockEvent = [
        {
          id: 1,
          periodId: 1,
          studentId: 1,
          classId: 1,
          roomId: null,
          eventType: "late_arrival",
          duration: 15,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockEvent),
        }),
      });

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      const caller = eventsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.delete({ id: 1 });

      expect(result.success).toBe(true);
      expect(result.message).toContain("deletado");
    });

    it("deve rejeitar delecao de evento inexistente", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const caller = eventsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.delete({ id: 999 })).rejects.toThrow("nao encontrado");
    });
  });
});
