import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { periodsRouter } from "./periods";

// Mock do banco de dados
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../db", () => ({
  getDb: vi.fn(async () => mockDb),
}));

describe("Periods Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("deve criar um novo periodo com sucesso", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ insertId: 1 });
      mockDb.insert.mockReturnValue({ values: mockInsert });

      const caller = periodsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.create({
        schoolId: 1,
        name: "1o Bimestre",
        periodType: "bimester",
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-04-30"),
        dataRetentionDays: 30,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("1o Bimestre");
    });

    it("deve rejeitar criacao se usuario nao for admin", async () => {
      const caller = periodsRouter.createCaller({
        user: { role: "user", id: 1, name: "User", email: "user@test.com" },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.create({
          schoolId: 1,
          name: "1o Bimestre",
          periodType: "bimester",
          startDate: new Date("2026-02-01"),
          endDate: new Date("2026-04-30"),
        })
      ).rejects.toThrow("administradores");
    });

    it("deve rejeitar se data de inicio for posterior a data de fim", async () => {
      const caller = periodsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.create({
          schoolId: 1,
          name: "1o Bimestre",
          periodType: "bimester",
          startDate: new Date("2026-04-30"),
          endDate: new Date("2026-02-01"),
        })
      ).rejects.toThrow("anterior");
    });
  });

  describe("list", () => {
    it("deve listar periodos por escola", async () => {
      const mockPeriods = [
        {
          id: 1,
          schoolId: 1,
          name: "1o Bimestre",
          periodType: "bimester",
          startDate: new Date("2026-02-01"),
          endDate: new Date("2026-04-30"),
          dataRetentionDays: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockPeriods),
        }),
      });

      const caller = periodsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.list({ schoolId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("1o Bimestre");
    });
  });

  describe("getActive", () => {
    it("deve retornar periodo ativo", async () => {
      const now = new Date();
      const mockActivePeriod = {
        id: 1,
        schoolId: 1,
        name: "1o Bimestre",
        periodType: "bimester",
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        dataRetentionDays: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockActivePeriod]),
        }),
      });

      const caller = periodsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getActive({ schoolId: 1 });

      expect(result).not.toBeNull();
      expect(result?.name).toBe("1o Bimestre");
    });

    it("deve retornar null se nao houver periodo ativo", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const caller = periodsRouter.createCaller({
        user: { role: "admin", id: 1, name: "Admin", email: "admin@test.com" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getActive({ schoolId: 1 });

      expect(result).toBeNull();
    });
  });
});
