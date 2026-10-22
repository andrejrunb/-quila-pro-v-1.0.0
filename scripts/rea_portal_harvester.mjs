#!/usr/bin/env node
/**
 * ÁQUILA PRO — REA Web Portal Harvester (HAR ➔ REA API-Surface ➔ Banco de Questões/Imagens & Activesoft)
 *
 * Como funciona:
 * 1. Abre uma URL alvo via Playwright gravando todas as requisições e respostas em HAR 1.2 (com binários/imagens em base64).
 * 2. Executa `rea inspect-web-network-capture <arquivo.har> har --json` para validar integridade,
 *    extrair `binary_fields` (imagens, diagramas, anexos com SHA-256) e redigir credenciais sensíveis.
 * 3. Projeta a superfície de API (`view: { kind: "api-surface" }`) via `rea inspect-analysis-view`,
 *    mapeando automaticamente todas as rotas REST/GraphQL do portal (Activesoft, INEP, UFG, UEG, UniRV, UFMG, UnB).
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'c:/aquila';
const HAR_DIR = path.join(ROOT_DIR, 'logs', 'rea_har_captures');
const IMAGES_BANK_DIR = path.join(ROOT_DIR, 'apps/electron/public/question-bank-images');

for (const dir of [HAR_DIR, IMAGES_BANK_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function analyzeHarWithRea(harPath, label = 'portal') {
  console.log(`[REA-HARVESTER] Analisando captura HAR com morluto/rea: ${harPath}`);
  const evidencePath = path.join(HAR_DIR, `${label}_rea_evidence.json`);
  const apiSurfaceReqPath = path.join(HAR_DIR, `${label}_api_surface_req.json`);
  const apiSurfaceOutPath = path.join(HAR_DIR, `${label}_api_surface.json`);

  try {
    const rawOut = execSync(`npx --no-install rea-agents inspect-web-network-capture "${harPath}" har --json`, {
      cwd: ROOT_DIR,
      maxBuffer: 100 * 1024 * 1024,
      encoding: 'utf-8'
    });
    fs.writeFileSync(evidencePath, rawOut, 'utf-8');
    const evidence = JSON.parse(rawOut);

    // Extrair a superfície de API (api-surface) via REA inspect-analysis-view
    fs.writeFileSync(
      apiSurfaceReqPath,
      JSON.stringify({
        source: { kind: 'inline', evidence },
        view: { kind: 'api-surface', offset: 0, limit: 100 }
      }),
      'utf-8'
    );

    const surfaceOut = execSync(`npx --no-install rea-agents inspect-analysis-view "${apiSurfaceReqPath}" --json`, {
      cwd: ROOT_DIR,
      maxBuffer: 50 * 1024 * 1024,
      encoding: 'utf-8'
    });
    fs.writeFileSync(apiSurfaceOutPath, surfaceOut, 'utf-8');

    console.log(`[REA-HARVESTER] Superfície de API extraída em: ${apiSurfaceOutPath}`);
    return {
      evidencePath,
      apiSurfaceOutPath,
      apiSurface: JSON.parse(surfaceOut)
    };
  } catch (err) {
    console.error(`[REA-HARVESTER] Erro ao processar HAR no REA:`, err.message);
    return null;
  }
}

if (process.argv[2] && process.argv[2].endsWith('.har')) {
  analyzeHarWithRea(path.resolve(process.argv[2]), process.argv[3] || 'session');
}
