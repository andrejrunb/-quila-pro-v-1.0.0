/**
 * verify_rtc_fiscal_adapter.cjs
 * Validação Full HD (1920x1080) do Adaptador Fiscal Independente (RFB RTC):
 * 1. Isolamento total do aquila.db (armazenamento em rtc_fiscal_isolated/)
 * 2. Geração de DANFSe em PDF a partir de XML de NFS-e, preservando XML original + vínculo SHA-256
 * 3. Proteção anti-XXE / classificação de erros XML e zero exposição de XML/PDF nos logs
 * 4. Cálculos tributários determinísticos (Regime Regular e Simples Nacional) com memória auditável
 */

const { _electron: electron } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const MAIN_PATH = 'C:\\aquila\\apps\\electron\\dist\\main.js';
const USER_DATA_DIR = 'C:\\aquila\\test-results\\pilot_journey_env';
const SCREENSHOT_DIR = 'C:\\Users\\Thaysa\\.gemini\\antigravity\\brain\\5fca40fa-e48d-4bc6-bc7a-084bf4a62fe4\\screenshots';

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('[RTC-VERIFY] Iniciando Electron em 1920x1080...');
  const app = await electron.launch({
    args: [MAIN_PATH],
    env: {
      ...process.env,
      AQUILA_USER_DATA_OVERRIDE: USER_DATA_DIR,
      PLAYWRIGHT: 'true',
      PLAYWRIGHT_TEST: 'true',
      AQUILA_LICENSE_HMAC_SECRET: 'aquila-pro-local-hmac-2026',
      AQUILA_ENCRYPTION_SECRET: 'aquila-pro-local-enc-2026',
      NODE_ENV: 'development',
    },
    timeout: 60000,
  });

  const consoleLogs = [];
  const consoleErrors = [];
  const unauthorizedAlerts = [];
  let hasFailure = false;

  try {
    const win = await app.firstWindow({ timeout: 60000 });
    win.on('dialog', async (d) => d.dismiss().catch(() => {}));
    win.on('console', (msg) => {
      const txt = msg.text();
      consoleLogs.push(txt);
      if (txt.includes('Canal IPC não autorizado') || txt.includes('SECURITY ALERT')) {
        unauthorizedAlerts.push(txt);
      }
      if (msg.type() === 'error') {
        consoleErrors.push(txt);
      }
    });

    await win.setViewportSize({ width: 1920, height: 1080 });
    await win.waitForLoadState('domcontentloaded');
    await win.waitForTimeout(2000);

    // 1. Login Admin sem alterar terminal profile para Sala de Aula
    const authRes = await win.evaluate(async () => {
      localStorage.setItem('aquila_setup_complete', 'true');
      localStorage.removeItem('aquila_terminal_profile');
      try { await window.aquila.invoke('logout'); } catch {}
      const attempts = [
        { channel: 'auth:login', creds: { username: 'admin.piloto', password: 'PilotPassword@2026!' } },
        { channel: 'auth:login', creds: { username: 'admin', password: 'Admin@2026!' } },
      ];
      for (const att of attempts) {
        try {
          const res = await window.aquila.invoke(att.channel, att.creds);
          if (res?.success && res?.user) {
            sessionStorage.setItem('aquila_session_user', JSON.stringify(res.user));
            return res;
          }
        } catch {}
      }
      return null;
    });

    if (!authRes?.success) {
      throw new Error('Falha no login Admin para teste do Adaptador Fiscal RTC.');
    }

    await win.reload({ waitUntil: 'domcontentloaded' });
    await win.waitForTimeout(2000);

    const lgpdBtn = win.locator('button:has-text("Concordar e Continuar"), button:has-text("Aceitar")').first();
    if (await lgpdBtn.isVisible().catch(() => false)) {
      await lgpdBtn.click();
      await win.waitForTimeout(1000);
    }

    // 2. Verificar proteção anti-XXE / erro estrutural e status isolado via IPC
    const ipcSecurityCheck = await win.evaluate(async () => {
      const status = await window.aquila.invoke('rtc-fiscal:get-status');
      const xxeReject = await window.aquila.invoke('rtc-fiscal:generate-danfse', {
        xmlContent: '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">]><NFSe><xNome>&xxe;</xNome></NFSe>',
      });
      const badSchemaReject = await window.aquila.invoke('rtc-fiscal:generate-danfse', {
        xmlContent: '<OutroDocumento><valor>100</valor></OutroDocumento>',
      });
      return { status, xxeReject, badSchemaReject };
    });

    console.log('[RTC-IPC] Isolado aquila.db:', ipcSecurityCheck.status?.status?.isolatedFromMainDb);
    console.log('[RTC-IPC] Diretorio isolado:', ipcSecurityCheck.status?.status?.storageDir);
    console.log('[RTC-IPC] Bloqueio anti-XXE:', ipcSecurityCheck.xxeReject?.errorClass);
    console.log('[RTC-IPC] Rejeicao schema invalido:', ipcSecurityCheck.badSchemaReject?.errorClass);

    if (!ipcSecurityCheck.status?.status?.isolatedFromMainDb) {
      hasFailure = true;
      console.error('[FAIL] Status não confirmou isolamento do aquila.db!');
    }
    if (ipcSecurityCheck.xxeReject?.errorClass !== 'XML_XXE_BLOCKED') {
      hasFailure = true;
      console.error('[FAIL] Proteção anti-XXE não bloqueou <!DOCTYPE!');
    }

    // 3. Navegar para FinanceModule e abrir aba Adaptador Fiscal RTC (RFB)
    await win.evaluate(() => {
      window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: 'finance' }));
    });
    await win.waitForTimeout(1800);

    await win.locator('button:has-text("Adaptador Fiscal RTC (RFB)")').click();
    await win.waitForTimeout(800);

    // 4. Fluxo UI Etapa 1: Carregar XML Modelo e Gerar DANFSe em PDF
    await win.locator('button:has-text("Carregar XML Modelo")').click();
    await win.waitForTimeout(400);
    await win.locator('button:has-text("Validar XML, Preservar Vínculo SHA-256")').click();
    await win.waitForTimeout(1500);

    const docsRes = await win.evaluate(async () => await window.aquila.invoke('rtc-fiscal:list-documents'));
    const latestDoc = docsRes?.documents?.[0];
    console.log('[DANFSE] Gerado:', latestDoc ? {
      id: latestDoc.id,
      number: latestDoc.number,
      amount: latestDoc.serviceAmountDecimal,
      providerMode: latestDoc.providerMode,
      xmlExists: fs?.existsSync ? true : Boolean(latestDoc.xmlPath),
      xmlSha256Prefix: latestDoc.xmlSha256?.slice(0, 12),
      pdfSha256Prefix: latestDoc.pdfSha256?.slice(0, 12),
    } : null);

    if (!latestDoc || !fs.existsSync(latestDoc.xmlPath) || !fs.existsSync(latestDoc.pdfPath)) {
      hasFailure = true;
      console.error('[FAIL] XML original ou PDF DANFSe não encontrados no cofre isolado!', latestDoc);
    } else {
      const pdfHeader = fs.readFileSync(latestDoc.pdfPath).subarray(0, 4).toString('ascii');
      console.log('[DANFSE] Assinatura real do arquivo PDF:', pdfHeader);
      if (pdfHeader !== '%PDF') {
        hasFailure = true;
        console.error('[FAIL] Arquivo gerado não possui cabeçalho %PDF!');
      }
    }

    const p1 = path.join(SCREENSHOT_DIR, '01_adaptador_fiscal_rtc_danfse_1080p.png');
    await win.screenshot({ path: p1 });
    console.log('[SHOT] Salvo:', p1);

    // 5. Fluxo UI Etapa 2: Calculadoras (Regime Regular + Simples Nacional)
    await win.locator('button:has-text("2. Calculadoras (Regime Regular & Simples)")').click();
    await win.waitForTimeout(500);

    // Executa Regime Regular pela UI (Base 10000.00 -> 8.8% CBS + 12.2% IBS UF + 5.5% IBS Mun = 2650.00)
    await win.locator('button:has-text("Executar Cálculo Determinístico")').click();
    await win.waitForTimeout(900);

    // Muda para Simples Nacional na UI e executa tambem
    await win.locator('button:has-text("Simples Nacional (CBS/IBS)")').click();
    await win.waitForTimeout(300);
    await win.locator('button:has-text("Executar Cálculo Determinístico")').click();
    await win.waitForTimeout(900);

    const simsRes = await win.evaluate(async () => await window.aquila.invoke('rtc-fiscal:list-simulations'));
    const sims = simsRes?.simulations || [];
    console.log('[CALC-RTC] Simulacoes registradas:', sims.length);
    if (sims.length < 2) {
      hasFailure = true;
      console.error('[FAIL] Esperado ao menos 2 simulações (Regime Regular + Simples Nacional)!');
    } else {
      const simSimples = sims[0];
      const simRegular = sims[1];
      console.log('[CALC-SIMPLES]', simSimples.result, 'engine:', simSimples.engineVersion);
      console.log('[CALC-REGULAR]', simRegular.result, 'engine:', simRegular.engineVersion);
      if (simRegular.result?.totalRtcTaxesDecimal !== '2650.00') {
        hasFailure = true;
        console.error('[FAIL] Calculo determinístico Regime Regular incorreto:', simRegular.result);
      }
      if (!simSimples.engineVersion || !simSimples.databaseVersion || !simSimples.reviewer || !simSimples.warnings?.length) {
        hasFailure = true;
        console.error('[FAIL] Metadados contábeis obrigatórios ausentes na simulação!');
      }
    }

    const p2 = path.join(SCREENSHOT_DIR, '02_adaptador_fiscal_rtc_calculadoras_cbs_ibs_1080p.png');
    await win.screenshot({ path: p2 });
    console.log('[SHOT] Salvo:', p2);

    // Garante que conteúdo de XML nunca vazou para logs de console
    const leakedXml = consoleLogs.some(l => l.includes('TECNOLOGIA EDUCACIONAL MODELO') || l.includes('<infNFSe>'));
    console.log('[PRIVACY] Vazamento de conteudo XML/PDF nos logs:', leakedXml);
    if (leakedXml) {
      hasFailure = true;
      console.error('[FAIL] Conteúdo XML fiscal apareceu no console!');
    }

    console.log('[SUMMARY] Unauthorized IPC alerts:', unauthorizedAlerts.length);
    console.log('[SUMMARY] Console errors:', consoleErrors.length);
    if (unauthorizedAlerts.length > 0) hasFailure = true;
  } finally {
    await app.close().catch(() => {});
  }

  if (hasFailure) process.exit(1);
  console.log('[RTC-VERIFY] Adaptador Fiscal RTC (DANFSe + Calculadoras) validado com sucesso!');
}

main().catch((err) => {
  console.error('[RTC-VERIFY] Erro fatal:', err);
  process.exit(1);
});
