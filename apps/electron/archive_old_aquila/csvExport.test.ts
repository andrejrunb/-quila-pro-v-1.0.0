import { describe, expect, it } from "vitest";
import {
  convertToCSV,
  formatContactsForExport,
  generateFilename,
} from "./csvExport";

describe("CSV Export Utilities", () => {
  describe("convertToCSV", () => {
    it("deve converter array de objetos para CSV", () => {
      const data = [
        { id: 1, name: "João", email: "joao@test.com" },
        { id: 2, name: "Maria", email: "maria@test.com" },
      ];

      const csv = convertToCSV(data);
      expect(csv).toContain("id,name,email");
      expect(csv).toContain("1,João,joao@test.com");
      expect(csv).toContain("2,Maria,maria@test.com");
    });

    it("deve incluir headers por padrão", () => {
      const data = [{ id: 1, name: "João" }];
      const csv = convertToCSV(data, { includeHeaders: true });

      const lines = csv.split("\n");
      expect(lines[0]).toContain("id");
      expect(lines[0]).toContain("name");
    });

    it("deve omitir headers quando solicitado", () => {
      const data = [{ id: 1, name: "João" }];
      const csv = convertToCSV(data, { includeHeaders: false });

      const lines = csv.split("\n");
      expect(lines[0]).not.toContain("id");
      expect(lines[0]).toContain("1");
    });

    it("deve escapar valores com vírgulas", () => {
      const data = [{ id: 1, message: "Olá, mundo!" }];
      const csv = convertToCSV(data);

      expect(csv).toContain('"Olá, mundo!"');
    });

    it("deve escapar valores com aspas", () => {
      const data = [{ id: 1, message: 'Disse "olá"' }];
      const csv = convertToCSV(data);

      expect(csv).toContain('Disse ""olá""');
    });

    it("deve retornar string vazia para array vazio", () => {
      const csv = convertToCSV([]);
      expect(csv).toBe("");
    });

    it("deve usar delimitador customizado", () => {
      const data = [{ id: 1, name: "João" }];
      const csv = convertToCSV(data, { delimiter: ";" });

      expect(csv).toContain("id;name");
      expect(csv).toContain("1;João");
    });
  });

  describe("formatContactsForExport", () => {
    it("deve formatar contatos para exportação", () => {
      const contacts = [
        {
          id: 1,
          name: "João",
          email: "joao@test.com",
          phone: "11999999999",
          schoolName: "Escola ABC",
          subject: "Dúvida",
          message: "Tenho uma dúvida",
          status: "new",
          createdAt: new Date("2026-02-27"),
          responseMessage: undefined,
          respondedAt: undefined,
        },
      ];

      const formatted = formatContactsForExport(contacts);

      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toHaveProperty("ID", 1);
      expect(formatted[0]).toHaveProperty("Nome", "João");
      expect(formatted[0]).toHaveProperty("Email", "joao@test.com");
      expect(formatted[0]).toHaveProperty("Status", "Novo");
    });

    it("deve formatar status corretamente", () => {
      const contacts = [
        {
          id: 1,
          name: "João",
          email: "joao@test.com",
          subject: "Teste",
          message: "Teste",
          status: "responded",
          createdAt: new Date(),
        },
      ];

      const formatted = formatContactsForExport(contacts);
      expect(formatted[0]?.Status).toBe("Respondido");
    });

    it("deve incluir campos vazios quando não preenchidos", () => {
      const contacts = [
        {
          id: 1,
          name: "João",
          email: "joao@test.com",
          subject: "Teste",
          message: "Teste",
          status: "new",
          createdAt: new Date(),
        },
      ];

      const formatted = formatContactsForExport(contacts);
      expect(formatted[0]?.Telefone).toBe("");
      expect(formatted[0]?.Escola).toBe("");
    });
  });

  describe("generateFilename", () => {
    it("deve gerar nome de arquivo com timestamp", () => {
      const filename = generateFilename("contatos");
      expect(filename).toContain("contatos_");
      expect(filename).toContain(".csv");
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/); // YYYY-MM-DD
    });

    it("deve usar prefixo 'export' por padrão", () => {
      const filename = generateFilename();
      expect(filename).toContain("export_");
      expect(filename).toContain(".csv");
    });

    it("deve incluir hora no nome", () => {
      const filename = generateFilename("test");
      expect(filename).toMatch(/\d{2}-\d{2}-\d{2}/); // HH-MM-SS
    });
  });

  describe("Integração", () => {
    it("deve exportar contatos completos em CSV", () => {
      const contacts = [
        {
          id: 1,
          name: "João Silva",
          email: "joao@test.com",
          phone: "11999999999",
          schoolName: "Escola ABC",
          subject: "Informações",
          message: "Gostaria de saber mais",
          status: "new",
          createdAt: new Date("2026-02-27"),
          responseMessage: undefined,
          respondedAt: undefined,
        },
        {
          id: 2,
          name: "Maria Santos",
          email: "maria@test.com",
          phone: "11988888888",
          schoolName: "Escola XYZ",
          subject: "Suporte",
          message: "Preciso de ajuda",
          status: "responded",
          createdAt: new Date("2026-02-26"),
          responseMessage: "Obrigado pelo contato",
          respondedAt: new Date("2026-02-27"),
        },
      ];

      const formatted = formatContactsForExport(contacts);
      const csv = convertToCSV(formatted);

      expect(csv).toContain("João Silva");
      expect(csv).toContain("Maria Santos");
      expect(csv).toContain("Novo");
      expect(csv).toContain("Respondido");
    });
  });
});
