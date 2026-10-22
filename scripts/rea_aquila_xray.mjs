#!/usr/bin/env node
/**
 * ÁQUILA PRO — REA Sovereign X-Ray & Web Harvester Engine
 * Baseado em morluto/rea (rea-agents) + api-anything
 *
 * Funções:
 * 1. Auditoria de Código, Segurança IPC e Infraestrutura Electron (analyze-javascript-application)
 * 2. Inspeção Forense de Bancos SQLite (inspect-sqlite-database)
 * 3. Captura HAR e Engenharia Reversa de API-Surface de Portais Externos (inspect-web-network-capture)
 *    - Bancos de Questões e Imagens (ENEM, UEG, UniRV, UFG, UFMG, UnB)
 *    - Portais Escolares (Activesoft SigaWeb)
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'c:/aquila';
const REPORTS_DIR = path.join(ROOT_DIR, 'logs', 'rea_evidence');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function runReaCommand(argsString, outputFilename) {
  console.log(`\n[REA-ENGINE] Executando: rea ${argsString}`);
  try {
    const out = execSync(`npx --no-install rea-agents ${argsString}`, {
      cwd: ROOT_DIR,
      maxBuffer: 100 * 1024 * 1024,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    if (outputFilename) {
      const targetPath = path.join(REPORTS_DIR, outputFilename);
      fs.writeFileSync(targetPath, out, 'utf-8');
      console.log(`[REA-ENGINE] Evidência salva em: ${targetPath} (${(out.length / 1024).toFixed(1)} KB)`);
    }
    return JSON.parse(out);
  } catch (err) {
    console.error(`[REA-ENGINE] Aviso na execução:`, err.message);
    return null;
  }
}

async function main() {
  const mode = process.argv[2] || 'full-audit';
  console.log(`================================================================`);
  console.log(`🦅 ÁQUILA PRO × MORLUTO/REA — SOVEREIGN X-RAY (${mode.toUpperCase()})`);
  console.log(`================================================================`);

  // 1. Verificar capacidades do REA no host
  const caps = runReaCommand('capabilities --json', 'rea_capabilities.json');
  if (caps) {
    console.log(`[1/3] Capacidades REA detectadas com sucesso.`);
  }

  // 2. Auditar Banco de Dados de Questões e Maestria (SQLite Snapshot)
  const dbPath = path.join(ROOT_DIR, 'apps/electron/src/database/pedagogical_scaffolding.db');
  if (fs.existsSync(dbPath)) {
    const copyPath = path.join(REPORTS_DIR, 'pedagogical_scaffolding_snapshot.sqlite');
    fs.copyFileSync(dbPath, copyPath);
    const dbAudit = runReaCommand(
      `inspect-sqlite-database "${copyPath}" --schema-scope database --json`,
      'sqlite_pedagogical_audit.json'
    );
    if (dbAudit) {
      console.log(`[2/3] Banco SQLite (pedagogical_scaffolding.db) auditado pelo REA.`);
    }
  }

  // 3. Auditar Código & Segurança do Bundle Electron do Áquila Pro
  const electronDist = path.join(ROOT_DIR, 'apps/electron/dist');
  if (fs.existsSync(electronDist)) {
    const jsEvidencePath = path.join(REPORTS_DIR, 'aquila_electron_evidence.json');
    const jsAudit = runReaCommand(
      `analyze-javascript-application "${electronDist}" --json`,
      'aquila_electron_evidence.json'
    );
    if (jsAudit && fs.existsSync(jsEvidencePath)) {
      const viewReqPath = path.join(REPORTS_DIR, 'aquila_summary_view_req.json');
      const rawEvidence = JSON.parse(fs.readFileSync(jsEvidencePath, 'utf-8'));
      fs.writeFileSync(
        viewReqPath,
        JSON.stringify({
          source: { kind: 'inline', evidence: rawEvidence },
          view: { kind: 'summary' }
        }),
        'utf-8'
      );
      runReaCommand(`inspect-analysis-view "${viewReqPath}" --json`, 'aquila_electron_summary.json');
      console.log(`[3/3] Grafo de Segurança e Módulos Electron auditado pelo REA.`);
    }
  }
}

main().catch(console.error);
