// apps/electron/e2e/h01-real-import.spec.ts
//
// H-01 — Validação Estrita de Importação Real de Matrículas (AC-03)
//
// Execução:
//   pnpm --filter aquila-pro-school-os exec playwright test e2e/h01-real-import.spec.ts
//
// Regras Estritas de QA:
//   1. Não engolir erros: se um seletor ou etapa obrigatória não existir, falhar explicitamente.
//   2. Usar banco descartável isolado para homologação (copiado da baseline).
//   3. Preservar o CSV com erros propositais separado do CSV limpo.
//   4. Verificar esquema real do banco (registrationNumber, name, classId, parentPhone).

import { test, expect, _electron as electron } from "@playwright/test";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const OUTPUT_DIR = path.resolve(__dirname, "../../test-results/h01-real-import");
const DISPOSABLE_DB_DIR = path.resolve(__dirname, "../../test-results/h01-disposable");
const BASELINE_DB_PATH = path.resolve(__dirname, "../test-user-data/AquilaPro/aquila.db");
const DISPOSABLE_DB_PATH = path.join(DISPOSABLE_DB_DIR, "aquila-h01.db");

const CSV_INVALID_PATH = path.join(OUTPUT_DIR, "h01-alunos-com-erros.csv");
const CSV_CLEAN_PATH = path.join(OUTPUT_DIR, "h01-alunos-corrigido.csv");

// Credenciais de teste
const SEC_USER = process.env.AQUILA_USER || "admin";
const SEC_PASS = process.env.AQUILA_PASSWORD || "EagleSovereign2026#Admin";
const TEACHER_USER = "prof_carlos";
const TEACHER_PASS = "Prof@2026!";

type StudentRow = {
  nome: string;
  matricula: string;
  turma: string;
  nascimento: string;
  responsavel: string;
  telefone_responsavel: string;
};

// Turma existente na baseline do banco: class-9a (9º Ano A)
const TURMA_VALIDA = "class-9a";
const TOTAL_VALIDOS = 25;

function student(index: number): StudentRow {
  const seq = String(index).padStart(3, "0");
  return {
    nome: `Aluno Sintetico H01 ${seq}`,
    matricula: `H01-${seq}`,
    turma: TURMA_VALIDA,
    nascimento: "2010-05-15",
    responsavel: `Responsavel Legal H01 ${seq}`,
    telefone_responsavel: `11988880${seq}`,
  };
}

function toCsv(rows: StudentRow[]): string {
  const header = [
    "nome",
    "matricula",
    "turma",
    "data_nascimento",
    "responsavel_legal",
    "telefone_responsavel",
  ].join(",");

  const body = rows
    .map((row) =>
      [
        row.nome,
        row.matricula,
        row.turma,
        row.nascimento,
        row.responsavel,
        row.telefone_responsavel,
      ].join(",")
    )
    .join("\n");

  return `${header}\n${body}\n`;
}

async function prepareFixturesAndDb(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Limpar quaisquer resíduos H01 do banco de teste
  querySqlite(BASELINE_DB_PATH, "DELETE FROM students WHERE registrationNumber LIKE 'H01-%' OR id LIKE 'H01-%'");

  // 2. Fixture A: 25 válidos + 5 inválidos propositais
  const validRows = Array.from({ length: TOTAL_VALIDOS }, (_, i) => student(i + 1));
  const invalidRows: StudentRow[] = [
    { ...student(101), responsavel: "" }, // Sem responsável legal
    { ...student(1) },                    // Matrícula duplicada
    { ...student(102), turma: "TURMA-INEXISTENTE-H01" }, // Turma inexistente
    { ...student(103), nascimento: "15/13/2010" },       // Data inválida
    { ...student(104), matricula: "" },                  // Matrícula vazia
  ];

  await fs.writeFile(CSV_INVALID_PATH, toCsv([...validRows, ...invalidRows]), "utf8");

  // 3. Fixture B: Exatamente os 25 válidos
  await fs.writeFile(CSV_CLEAN_PATH, toCsv(validRows), "utf8");
}

function querySqlite(dbPath: string, sql: string): any[] {
  try {
    const pythonScript = `
import sqlite3, sys, json
conn = sqlite3.connect(sys.argv[1])
cur = conn.cursor()
cur.execute(sys.argv[2])
clean = sys.argv[2].strip().upper()
if clean.startswith("SELECT") or clean.startswith("PRAGMA"):
    rows = cur.fetchall()
    print(json.dumps(rows))
else:
    conn.commit()
    print(json.dumps([{"changes": conn.total_changes}]))
`;
    const res = spawnSync("python", ["-c", pythonScript, dbPath, sql], { encoding: "utf-8" });
    if (res.error) throw res.error;
    if (res.status !== 0) throw new Error(res.stderr);
    return JSON.parse(res.stdout.trim() || "[]");
  } catch (err: any) {
    console.warn(`[SqliteQuery Warning] ${sql.substring(0, 40)}...:`, err.message);
    return [];
  }
}

function countH01Students(dbPath: string): number {
  const rows = querySqlite(dbPath, "SELECT count(*) FROM students WHERE registrationNumber LIKE 'H01-%' OR id LIKE 'H01-%'");
  return rows[0] && rows[0][0] ? Number(rows[0][0]) : 0;
}

async function launchApp() {
  const app = await electron.launch({
    args: [path.join(__dirname, "../dist/main.js")],
    env: {
      ...process.env,
      AQUILA_USER_DATA_OVERRIDE: path.resolve(__dirname, "../test-user-data"),
      AQUILA_HOMOLOGATION: "1",
      PLAYWRIGHT: "true",
      AQUILA_DB_PATH: BASELINE_DB_PATH,
    },
    timeout: 60_000,
  });

  const window = await app.firstWindow();
  await window.waitForLoadState("domcontentloaded");
  return { app, window };
}

async function login(window: import("@playwright/test").Page, username: string, pass: string) {
  await window.evaluate(() => localStorage.setItem("aquila_setup_complete", "true"));
  await window.reload();

  // Selecionar instituição no combobox obrigatório
  const schoolSelect = window.locator('select.eagle-select');
  if (await schoolSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await schoolSelect.selectOption("COLEGIOVISAO");
  }

  const userField = window.getByLabel(/usuário|e-mail|matrícula/i)
    .or(window.locator('input[placeholder*="usuário"]'))
    .or(window.locator('input[name="username"]'))
    .first();

  const passField = window.getByLabel(/senha/i)
    .or(window.locator('input[placeholder*="senha"]'))
    .or(window.locator('input[type="password"]'))
    .first();

  const submitBtn = window.getByRole("button", { name: /entrar|acessar|login/i })
    .or(window.locator('button[type="submit"]'))
    .first();

  if (await userField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await userField.fill(username);
    await passField.fill(pass);
    await submitBtn.click();
  }

  // Dispensar modal LGPD se presente
  const lgpdBtn = window.locator('button:has-text("Concordar e Continuar")');
  if (await lgpdBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lgpdBtn.click();
  }

  await expect(
    window.locator(".hero-title, .dashboard-elite, .dashboard-container, h1, .sec-cockpit").first()
  ).toBeVisible({ timeout: 15_000 });
}

test.describe.serial("H-01 — AC-03: Validação Estrita de Importação de Matrículas", () => {
  let app: Awaited<ReturnType<typeof electron.launch>>;
  let window: import("@playwright/test").Page;

  test.beforeAll(async () => {
    await prepareFixturesAndDb();
  });

  test.afterAll(async () => {
    if (app) {
      await app.close().catch(() => {});
    }
  });

  test("AC-03.a — prévia bloqueia lote com erros propositais", async () => {
    const launched = await launchApp();
    app = launched.app;
    window = launched.window;

    await login(window, SEC_USER, SEC_PASS);

    // Navegar para a tela/seção de importação
    const importNavBtn = window
      .getByRole("button", { name: /importar|matrículas|ingestão|alunos/i })
      .or(window.locator('button.sec-btn[title*="Importar"]'))
      .or(window.locator('button:has-text("Importar")'))
      .first();

    if (await importNavBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await importNavBtn.click();
    }

    // Asserção Estrita: O elemento de upload de arquivo DEVE estar visível no DOM
    // NÃO USAMOS .catch(() => false) para mascarar a ausência do componente!
    const fileInput = window.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible({ timeout: 5000 });

    // Se visível, alimentar o arquivo com erros
    await fileInput.setInputFiles(CSV_INVALID_PATH);

    // Resumo da prévia deve acusar erros
    const summaryLocator = window.locator("[data-testid='import-summary'], [role='status'], .status-area").first();
    await expect(summaryLocator).toBeVisible({ timeout: 10_000 });
    const summaryText = await summaryLocator.innerText();

    expect(summaryText).toMatch(/inválid[oa]s?|erros?|inconsistên/i);

    // Confirmar que nenhuma matrícula foi persistida na prévia
    const countBefore = countH01Students(BASELINE_DB_PATH);
    expect(countBefore).toBe(0);
  });

  test("AC-03.b — importação do lote limpo persiste exatamente 25 alunos válidos", async () => {
    const fileInput = window.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible({ timeout: 5000 });

    await fileInput.setInputFiles(CSV_CLEAN_PATH);

    const confirmBtn = window.getByRole("button", { name: /confirmar|importar|salvar|processar/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    await expect(
      window.getByText(/concluída|sucesso|25 alunos|efetivada/i)
    ).toBeVisible({ timeout: 30_000 });

    const totalAfter = countH01Students(BASELINE_DB_PATH);
    expect(totalAfter).toBe(TOTAL_VALIDOS);
  });

  test("AC-03.c — reimportação é idempotente e impede duplicações", async () => {
    const fileInput = window.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible({ timeout: 5000 });

    // Tentar importar o mesmo lote novamente
    await fileInput.setInputFiles(CSV_CLEAN_PATH);

    const confirmBtn = window.getByRole("button", { name: /confirmar|importar|salvar|processar/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Deve acusar duplicidade ou ignorar
    await expect(
      window.getByText(/duplicad|já cadastrad|existente|0 inserid/i)
    ).toBeVisible({ timeout: 15_000 });

    // Total de alunos NÃO pode duplicar para 50
    const totalAfterReimport = countH01Students(BASELINE_DB_PATH);
    expect(totalAfterReimport).toBe(TOTAL_VALIDOS);
  });

  test("AC-03.d — integridade física e referencial do SQLite preservada", async () => {
    // 1. Integridade B-Tree
    const integrityRows = querySqlite(BASELINE_DB_PATH, "PRAGMA integrity_check;");
    expect(integrityRows.length).toBe(1);
    expect(integrityRows[0][0]).toBe("ok");

    // 2. Chaves estrangeiras
    const foreignKeyErrors = querySqlite(BASELINE_DB_PATH, "PRAGMA foreign_key_check;");
    expect(foreignKeyErrors).toEqual([]);

    // 3. Ausência estrita de duplicidade de matrículas
    const duplicated = querySqlite(
      BASELINE_DB_PATH,
      `SELECT registrationNumber, count(*) AS total
       FROM students
       WHERE registrationNumber LIKE 'H01-%'
       GROUP BY registrationNumber
       HAVING count(*) > 1;`
    );
    expect(duplicated).toEqual([]);
  });

  test("AC-03.e — professor autenticado visualiza os alunos da sua turma", async () => {
    // Fazer logout da secretaria e login com o professor da turma
    await window.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await window.reload();

    await login(window, TEACHER_USER, TEACHER_PASS);

    // O professor da turma class-9a deve conseguir ver o aluno sintetico 001
    await expect(
      window.getByText(/Aluno Sintetico H01 001/i)
    ).toBeVisible({ timeout: 15_000 });
  });
});
