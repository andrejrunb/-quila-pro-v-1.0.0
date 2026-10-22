#!/usr/bin/env node
/**
 * ÁQUILA PRO — REA Swarm Multi-Portal Scanner
 * Vasculha a superfície técnica, formulários de autenticação, scripts, rotas de API
 * e metadados estruturais dos 6 portais alvo:
 *  1. https://positivoon.com.br/
 *  2. https://siga.activesoft.com.br/login/
 *  3. https://csc.iweb.jrsistemas.net.br/Login/Redirect/65
 *  4. https://pt.khanacademy.org/
 *  5. https://albus.org/
 *  6. https://wordwall.net/
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TARGETS = [
  { id: 'positivo_on', name: 'Positivo On', url: 'https://positivoon.com.br/', category: 'LMS / Sistema de Ensino' },
  { id: 'activesoft_siga', name: 'Activesoft SigaWeb', url: 'https://siga.activesoft.com.br/login/', category: 'ERP Acadêmico & Notas' },
  { id: 'jrsistemas_csc', name: 'JR Sistemas iWeb CSC', url: 'https://csc.iweb.jrsistemas.net.br/Login/Redirect/65', category: 'CSC / Gestão & Atendimento' },
  { id: 'khan_academy', name: 'Khan Academy Brasil', url: 'https://pt.khanacademy.org/', category: 'Maestria 5 Níveis & Tutor Socrático' },
  { id: 'albus_ai', name: 'Albus AI Canvas', url: 'https://albus.org/', category: 'Quadro Infinito de Conhecimento IA' },
  { id: 'wordwall', name: 'Wordwall Interactive', url: 'https://wordwall.net/', category: 'Motor de Jogos Pedagógicos & Templates' }
];

const OUT_DIR = 'c:/aquila/logs/rea_har_captures';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function inspectPortal(target) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(target.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      redirect: 'follow'
    });
    clearTimeout(timeout);

    const html = await res.text();
    const sha256 = crypto.createHash('sha256').update(html).digest('hex');

    // Extrair títulos, forms, inputs, scripts e endpoints de API embutidos
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : target.name;

    const forms = [...html.matchAll(/<form[^>]*action=["']?([^"'\s>]+)["']?[^>]*>/gi)].map(m => m[1]);
    const inputs = [...html.matchAll(/<input[^>]*name=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    const scripts = [...html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]).slice(0, 15);
    const apiHints = [...new Set([...html.matchAll(/["'](\/api\/[^"'<>]+|https?:\/\/[^"'<>]*api[^"'<>]*)["']/gi)].map(m => m[1]))].slice(0, 20);

    return {
      id: target.id,
      name: target.name,
      category: target.category,
      requestedUrl: target.url,
      finalUrl: res.url,
      status: res.status,
      latencyMs: Date.now() - start,
      contentBytes: Buffer.byteLength(html, 'utf8'),
      sha256,
      title,
      serverHeader: res.headers.get('server') || 'protected',
      forms: [...new Set(forms)],
      inputFields: [...new Set(inputs)],
      scriptBundles: scripts,
      discoveredApiEndpoints: apiHints,
      inspectedAt: new Date().toISOString()
    };
  } catch (err) {
    return {
      id: target.id,
      name: target.name,
      category: target.category,
      requestedUrl: target.url,
      status: 'ERR_PROTECTED_OR_TIMEOUT',
      latencyMs: Date.now() - start,
      error: err.message,
      inspectedAt: new Date().toISOString()
    };
  }
}

async function runSwarmScan() {
  console.log('🦅 [REA-SWARM] Iniciando varredura paralela dos 6 portais alvo...');
  const results = await Promise.all(TARGETS.map(inspectPortal));
  const report = {
    engine: 'morluto/rea + api-anything Sovereign Swarm v6.7.0',
    timestamp: new Date().toISOString(),
    totalTargets: TARGETS.length,
    targets: results
  };
  const outPath = path.join(OUT_DIR, 'swarm_scan_report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`✅ [REA-SWARM] Relatório salvo em: ${outPath}`);
  for (const r of results) {
    console.log(` - [${r.id}] Status: ${r.status} | Latência: ${r.latencyMs}ms | Inputs: ${(r.inputFields || []).join(', ') || 'SPA/Dynamic'} | Scripts: ${(r.scriptBundles || []).length}`);
  }
}

runSwarmScan();
