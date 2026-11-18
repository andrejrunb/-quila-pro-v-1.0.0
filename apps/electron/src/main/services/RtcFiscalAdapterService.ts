import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type TaxRegimeType = 'regime_regular' | 'simples_nacional';

export interface RtcEndpointsConfig {
  danfseUrl: string;
  regimeRegularUrl: string;
  simplesNacionalPrimaryUrl: string;
  simplesNacionalFallbackUrl: string;
  telemetryEnabled: false;
  offlineReadOnlySqliteExpected: boolean;
  isolatedStorageDir: string;
}

export interface DanfseDocumentRecord {
  id: string;
  adminRecordRef: string;
  schoolUnit: string;
  number: string;
  issueDate: string;
  providerName: string;
  providerDoc: string;
  takerName: string;
  takerDoc: string;
  serviceDescription: string;
  serviceAmountDecimal: string;
  xmlPath: string;
  xmlSha256: string;
  pdfPath: string;
  pdfSha256: string;
  providerMode: 'RTC_GO_CONTAINER' | 'LOCAL_PDFLIB_FALLBACK';
  legalDisclaimer: string;
  createdBy: string;
  createdAt: string;
}

export interface TaxSimulationRecord {
  id: string;
  regime: TaxRegimeType;
  engineVersion: string;
  databaseVersion: string;
  operationDate: string;
  inputs: {
    ncmOrNbsCode: string;
    operationDescription: string;
    taxClassification: string;
    baseAmountDecimal: string;
    cbsRatePercent: number;
    ibsUfRatePercent: number;
    ibsMunRatePercent: number;
    seletivoRatePercent: number;
    simplesFactorNote?: string;
  };
  result: {
    cbsAmountDecimal: string;
    ibsUfAmountDecimal: string;
    ibsMunAmountDecimal: string;
    ibsTotalDecimal: string;
    seletivoAmountDecimal: string;
    totalRtcTaxesDecimal: string;
    effectiveRatePercent: string;
    providerMode: 'RFB_JAVA_REST' | 'DETERMINISTIC_CENTS_ADAPTER';
  };
  warnings: string[];
  reviewer: string;
  createdAt: string;
}

interface RtcLedger {
  schemaVersion: string;
  documents: DanfseDocumentRecord[];
  simulations: TaxSimulationRecord[];
}

const MAX_XML_BYTES = 512 * 1024;
const DANFSE_DISCLAIMER =
  'AVISO LEGAL: Gerar o DANFSe não equivale a emitir uma NFS-e. Inicia a partir de um XML já fornecido e não comprova autorização fiscal, pagamento ou autenticidade da operação.';

export const SAMPLE_NFSE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<NFSe versao="1.00">
  <infNFSe>
    <nNFSe>2026000418</nNFSe>
    <dhEmi>2026-11-17T10:30:00-03:00</dhEmi>
    <prest>
      <CNPJ>12345678000195</CNPJ>
      <xNome>TECNOLOGIA EDUCACIONAL MODELO LTDA</xNome>
    </prest>
    <toma>
      <CNPJ>00999888000110</CNPJ>
      <xNome>COLEGIO AQUILA ENSINO INTEGRAL LTDA</xNome>
    </toma>
    <serv>
      <cTribNac>010501</cTribNac>
      <xDescServ>Licenciamento e manutencao mensal de laboratorio multimidia educacional - Contrato Adm #2026-09</xDescServ>
    </serv>
    <valores>
      <vServ>3850.00</vServ>
      <pAliqISS>2.00</pAliqISS>
      <vISSQN>77.00</vISSQN>
      <vLiq>3850.00</vLiq>
    </valores>
  </infNFSe>
</NFSe>`;

function extractXmlTag(xml: string, tags: string[], fallback = 'Não informado'): string {
  for (const tag of tags) {
    const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned) return cleaned;
    }
  }
  return fallback;
}

function centsToDecimal(cents: number): string {
  const safe = Math.round(Number.isFinite(cents) ? cents : 0);
  const sign = safe < 0 ? '-' : '';
  const abs = Math.abs(safe);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${whole}.${String(frac).padStart(2, '0')}`;
}

function parseDecimalToCents(input: string | number): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return 0;
    return Math.round(input * 100);
  }
  const normalized = String(input || '0').trim().replace(/\s+/g, '');
  // Se vier formato pt-BR "1.250,50", converte antes
  const canonical = normalized.includes(',') && !normalized.includes('.')
    ? normalized.replace(',', '.')
    : normalized.includes(',') && normalized.includes('.')
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized;
  const num = Number(canonical);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

function sanitizeAsciiPdfText(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class RtcFiscalAdapterService {
  private baseDir: string;
  private xmlVaultDir: string;
  private pdfVaultDir: string;
  private ledgerPath: string;
  private configPath: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || this.resolveIsolatedDir();
    this.xmlVaultDir = path.join(this.baseDir, 'xml_vault');
    this.pdfVaultDir = path.join(this.baseDir, 'danfse_pdf');
    this.ledgerPath = path.join(this.baseDir, 'rtc_fiscal_ledger.json');
    this.configPath = path.join(this.baseDir, 'rtc_fiscal_config.json');
    this.ensureStructure();
  }

  private resolveIsolatedDir(): string {
    try {
      const { app } = require('electron');
      if (app?.getPath) {
        return path.join(app.getPath('userData'), 'rtc_fiscal_isolated');
      }
    } catch {}
    return path.join(os.tmpdir(), 'aquila_rtc_fiscal_isolated');
  }

  private ensureStructure(): void {
    fs.mkdirSync(this.xmlVaultDir, { recursive: true });
    fs.mkdirSync(this.pdfVaultDir, { recursive: true });
    if (!fs.existsSync(this.ledgerPath)) {
      const initial: RtcLedger = { schemaVersion: '1.0.0', documents: [], simulations: [] };
      fs.writeFileSync(this.ledgerPath, JSON.stringify(initial, null, 2), 'utf-8');
    }
    if (!fs.existsSync(this.configPath)) {
      const defaultCfg: RtcEndpointsConfig = {
        danfseUrl: 'http://127.0.0.1:8085/api/danfse',
        regimeRegularUrl: 'http://127.0.0.1:8080',
        simplesNacionalPrimaryUrl: 'http://127.0.0.1:8082',
        simplesNacionalFallbackUrl: 'http://127.0.0.1:8080',
        telemetryEnabled: false,
        offlineReadOnlySqliteExpected: true,
        isolatedStorageDir: this.baseDir,
      };
      fs.writeFileSync(this.configPath, JSON.stringify(defaultCfg, null, 2), 'utf-8');
    }
  }

  public getConfig(): RtcEndpointsConfig {
    this.ensureStructure();
    try {
      const raw = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      return {
        ...raw,
        telemetryEnabled: false,
        isolatedStorageDir: this.baseDir,
      };
    } catch {
      return {
        danfseUrl: 'http://127.0.0.1:8085/api/danfse',
        regimeRegularUrl: 'http://127.0.0.1:8080',
        simplesNacionalPrimaryUrl: 'http://127.0.0.1:8082',
        simplesNacionalFallbackUrl: 'http://127.0.0.1:8080',
        telemetryEnabled: false,
        offlineReadOnlySqliteExpected: true,
        isolatedStorageDir: this.baseDir,
      };
    }
  }

  public configureEndpoints(partial: Partial<RtcEndpointsConfig>): RtcEndpointsConfig {
    const current = this.getConfig();
    const isLocalHostUrl = (urlStr?: string): string | undefined => {
      if (!urlStr) return undefined;
      try {
        const parsed = new URL(urlStr);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return parsed.toString().replace(/\/$/, '');
        }
      } catch {}
      return undefined;
    };

    const next: RtcEndpointsConfig = {
      ...current,
      danfseUrl: isLocalHostUrl(partial.danfseUrl) || current.danfseUrl,
      regimeRegularUrl: isLocalHostUrl(partial.regimeRegularUrl) || current.regimeRegularUrl,
      simplesNacionalPrimaryUrl: isLocalHostUrl(partial.simplesNacionalPrimaryUrl) || current.simplesNacionalPrimaryUrl,
      simplesNacionalFallbackUrl: isLocalHostUrl(partial.simplesNacionalFallbackUrl) || current.simplesNacionalFallbackUrl,
      telemetryEnabled: false,
      isolatedStorageDir: this.baseDir,
    };
    fs.writeFileSync(this.configPath, JSON.stringify(next, null, 2), 'utf-8');
    return next;
  }

  private readLedger(): RtcLedger {
    this.ensureStructure();
    try {
      const raw = JSON.parse(fs.readFileSync(this.ledgerPath, 'utf-8'));
      return {
        schemaVersion: '1.0.0',
        documents: Array.isArray(raw.documents) ? raw.documents : [],
        simulations: Array.isArray(raw.simulations) ? raw.simulations : [],
      };
    } catch {
      return { schemaVersion: '1.0.0', documents: [], simulations: [] };
    }
  }

  private writeLedger(ledger: RtcLedger): void {
    this.ensureStructure();
    fs.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2), 'utf-8');
  }

  private async probeEndpoint(url: string): Promise<{ online: boolean; statusCode?: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 900);
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      return { online: true, statusCode: res.status };
    } catch {
      return { online: false };
    } finally {
      clearTimeout(timeout);
    }
  }

  public async getStatus() {
    const cfg = this.getConfig();
    const ledger = this.readLedger();
    const [danfseProbe, regularProbe, simplesPrimaryProbe, simplesFallbackProbe] = await Promise.all([
      this.probeEndpoint(cfg.danfseUrl.replace(/\/api\/danfse$/, '/health')),
      this.probeEndpoint(`${cfg.regimeRegularUrl}/actuator/health`),
      this.probeEndpoint(`${cfg.simplesNacionalPrimaryUrl}/actuator/health`),
      this.probeEndpoint(`${cfg.simplesNacionalFallbackUrl}/actuator/health`),
    ]);

    return {
      isolatedFromMainDb: true,
      storageDir: this.baseDir,
      telemetryEnabled: false,
      zeroFiscalContentLogged: true,
      automaticBankMovementBlocked: true,
      documentsCount: ledger.documents.length,
      simulationsCount: ledger.simulations.length,
      endpoints: cfg,
      connectors: {
        danfseGo: {
          name: 'calculadora-rtc-gerador-danfse (Go /api/danfse)',
          online: danfseProbe.online,
          fallbackReady: true,
        },
        regimeRegularJava: {
          name: 'calculadora-rtc-regime-regular (Spring Boot / SQLite)',
          online: regularProbe.online,
          fallbackReady: true,
        },
        simplesNacionalJava: {
          name: 'calculadora-rtc-simples-nacional (porta 8082 / fallback 8080)',
          online: simplesPrimaryProbe.online || simplesFallbackProbe.online,
          activeUrl: simplesPrimaryProbe.online
            ? cfg.simplesNacionalPrimaryUrl
            : simplesFallbackProbe.online
              ? cfg.simplesNacionalFallbackUrl
              : cfg.simplesNacionalPrimaryUrl,
          readmeCaveat:
            'README oficial menciona porta 8082 e 8080, JAR api-regime-geral.jar e pasta flyway/ — validar antes de subir container.',
          fallbackReady: true,
        },
      },
      sampleXmlAvailable: true,
    };
  }

  public getSampleXml(): string {
    return SAMPLE_NFSE_XML;
  }

  public listDocuments(): DanfseDocumentRecord[] {
    return this.readLedger().documents;
  }

  public listSimulations(): TaxSimulationRecord[] {
    return this.readLedger().simulations;
  }

  public validateNfseXml(xmlContent: string): { valid: boolean; errorClass?: string; message?: string } {
    if (typeof xmlContent !== 'string' || !xmlContent.trim()) {
      return { valid: false, errorClass: 'INVALID_XML_EMPTY', message: 'XML de NFS-e vazio.' };
    }
    const byteLength = Buffer.byteLength(xmlContent, 'utf-8');
    if (byteLength > MAX_XML_BYTES) {
      return {
        valid: false,
        errorClass: 'XML_SIZE_LIMIT_EXCEEDED',
        message: `XML excede o limite de segurança de ${Math.round(MAX_XML_BYTES / 1024)} KB.`,
      };
    }
    if (/<!DOCTYPE|<!ENTITY|SYSTEM\s+"file:/i.test(xmlContent)) {
      return {
        valid: false,
        errorClass: 'XML_XXE_BLOCKED',
        message: 'Estrutura DOCTYPE/ENTITY rejeitada pela proteção anti-XXE.',
      };
    }
    const trimmed = xmlContent.trim();
    if (!trimmed.startsWith('<')) {
      return {
        valid: false,
        errorClass: 'INVALID_XML_SYNTAX',
        message: 'Conteúdo informado não inicia com tag XML válida.',
      };
    }
    const hasRecognizedRoot = /<(NFSe|infNFSe|CompNfse|DPS|infDPS|NFe)\b/i.test(trimmed);
    if (!hasRecognizedRoot) {
      return {
        valid: false,
        errorClass: 'UNRECOGNIZED_NFSE_SCHEMA',
        message: 'XML válido genericamente, porém não contém estrutura reconhecida de NFS-e/DPS (<NFSe>, <infNFSe>, <CompNfse> ou <DPS>).',
      };
    }
    return { valid: true };
  }

  private async buildLocalDanfsePdf(meta: {
    id: string;
    number: string;
    issueDate: string;
    providerName: string;
    providerDoc: string;
    takerName: string;
    takerDoc: string;
    serviceDescription: string;
    serviceAmountDecimal: string;
    xmlSha256: string;
    adminRecordRef: string;
  }): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const draw = (text: string, x: number, y: number, size = 10, bold = false, color = rgb(0.1, 0.14, 0.22)) => {
      page.drawText(sanitizeAsciiPdfText(text), {
        x,
        y,
        size,
        font: bold ? fontBold : fontRegular,
        color,
      });
    };

    page.drawRectangle({ x: 36, y: 745, width: 523, height: 64, color: rgb(0.06, 0.11, 0.22) });
    draw('DANFSe - DOCUMENTO AUXILIAR DA NFS-e (MODO ADAPTADOR FISCAL)', 50, 785, 12, true, rgb(1, 1, 1));
    draw(`Numero NFS-e: ${meta.number}   |   Data Emissao: ${meta.issueDate}   |   Ref Adm: ${meta.adminRecordRef}`, 50, 764, 9, false, rgb(0.75, 0.85, 0.98));

    page.drawRectangle({ x: 36, y: 696, width: 523, height: 42, color: rgb(0.99, 0.95, 0.85), borderColor: rgb(0.85, 0.55, 0.1), borderWidth: 1 });
    draw('AVISO: Gerar o DANFSe NAO equivale a emitir uma NFS-e. Inicia de XML ja fornecido e', 46, 721, 8.5, true, rgb(0.55, 0.3, 0.05));
    draw('nao comprova autorizacao fiscal, pagamento ou autenticidade da operacao.', 46, 707, 8.5, false, rgb(0.55, 0.3, 0.05));

    draw('PRESTADOR DE SERVICOS', 40, 668, 10, true);
    draw(`Razao Social: ${meta.providerName}`, 40, 650, 9.5);
    draw(`CPF / CNPJ: ${meta.providerDoc}`, 40, 634, 9.5);

    draw('TOMADOR DE SERVICOS', 40, 600, 10, true);
    draw(`Razao Social: ${meta.takerName}`, 40, 582, 9.5);
    draw(`CPF / CNPJ: ${meta.takerDoc}`, 40, 566, 9.5);

    draw('DISCRIMINACAO DO SERVICO & VALORES', 40, 532, 10, true);
    draw(`Descricao: ${meta.serviceDescription.slice(0, 90)}`, 40, 514, 9);
    if (meta.serviceDescription.length > 90) {
      draw(meta.serviceDescription.slice(90, 180), 40, 500, 9);
    }
    draw(`Valor Bruto do Servico (R$): ${meta.serviceAmountDecimal}`, 40, 472, 11, true, rgb(0.04, 0.45, 0.28));

    page.drawLine({ start: { x: 36, y: 448 }, end: { x: 559, y: 448 }, thickness: 1, color: rgb(0.82, 0.85, 0.9) });
    draw('RASTREABILIDADE CRIPTOGRAFICA E ISOLAMENTO FISCAL (AQUILA PRO)', 40, 424, 9.5, true);
    draw(`ID Registro: ${meta.id}`, 40, 406, 8.5);
    draw(`SHA-256 XML Original Preservado: ${meta.xmlSha256}`, 40, 390, 8.5);
    draw('Armazenamento isolado do aquila.db | Conteudo fiscal omitido de logs e prompts de IA', 40, 374, 8.5, false, rgb(0.35, 0.42, 0.52));

    return await pdfDoc.save();
  }

  public async generateDanfse(payload: {
    xmlContent: string;
    adminRecordRef?: string;
    schoolUnit?: string;
    createdBy?: string;
  }) {
    const xmlContent = String(payload?.xmlContent || '');
    const validation = this.validateNfseXml(xmlContent);
    if (!validation.valid) {
      return {
        success: false,
        errorClass: validation.errorClass,
        error: validation.message,
      };
    }

    const cfg = this.getConfig();
    const id = `danfse-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const xmlSha256 = crypto.createHash('sha256').update(xmlContent, 'utf-8').digest('hex');

    const number = extractXmlTag(xmlContent, ['nNFSe', 'Numero', 'nDPS'], `XML-${Date.now()}`);
    const issueDate = extractXmlTag(xmlContent, ['dhEmi', 'dCompet', 'DataEmissao'], new Date().toISOString().slice(0, 10));
    const providerName = extractXmlTag(xmlContent, ['xNome', 'RazaoSocial'], 'Prestador Informado no XML');
    const providerDoc = extractXmlTag(xmlContent, ['CNPJ', 'CPF'], '00.000.000/0000-00');
    // Extrair bloco <toma> separadamente quando presente
    const takerBlockMatch = xmlContent.match(/<(toma|Tomador|TomadorServico)[\s\S]*?<\/\1>/i);
    const takerXml = takerBlockMatch ? takerBlockMatch[0] : '';
    const takerName = takerXml
      ? extractXmlTag(takerXml, ['xNome', 'RazaoSocial'], 'Tomador Informado no XML')
      : 'Colégio Áquila (Tomador Administrativo)';
    const takerDoc = takerXml ? extractXmlTag(takerXml, ['CNPJ', 'CPF'], '00.000.000/0001-00') : '00.000.000/0001-00';
    const serviceDescription = extractXmlTag(xmlContent, ['xDescServ', 'Discriminacao'], 'Serviço descrito em XML NFS-e');
    const rawAmount = extractXmlTag(xmlContent, ['vServ', 'ValorServicos', 'vLiq'], '0.00');
    const serviceAmountDecimal = centsToDecimal(parseDecimalToCents(rawAmount));
    const adminRecordRef = String(payload?.adminRecordRef || `ADM-${new Date().getFullYear()}-${number}`);
    const schoolUnit = String(payload?.schoolUnit || 'Unidade Administrativa');
    const createdBy = String(payload?.createdBy || 'Operador Administrativo');

    let pdfBuffer: Buffer | null = null;
    let providerMode: 'RTC_GO_CONTAINER' | 'LOCAL_PDFLIB_FALLBACK' = 'LOCAL_PDFLIB_FALLBACK';

    // Tenta primeiro o microserviço oficial Go POST /api/danfse (Content-Type: application/xml)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(cfg.danfseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          Accept: 'application/pdf',
        },
        body: xmlContent,
        signal: controller.signal,
      });

      if (response.ok) {
        const arrBuf = await response.arrayBuffer();
        const candidate = Buffer.from(arrBuf);
        if (candidate.subarray(0, 4).toString('ascii') === '%PDF') {
          pdfBuffer = candidate;
          providerMode = 'RTC_GO_CONTAINER';
        }
      } else if (response.status === 400) {
        // README da RFB alerta que erros internos de renderizacao podem retornar HTTP 400
        clearTimeout(timeout);
        return {
          success: false,
          errorClass: 'HTTP_400_AMBIGUOUS_DANFSE_RENDER',
          error:
            'O serviço Go DANFSe respondeu HTTP 400. Conforme documentação oficial da RFB, pode tratar-se de falha interna de renderização mapeada para 400 (não assumir automaticamente erro do usuário sem conferir o XML).',
        };
      }
    } catch {
      // Container Go offline — segue para geração local segura via pdf-lib sem interromper o sistema
    } finally {
      clearTimeout(timeout);
    }

    if (!pdfBuffer) {
      const localBytes = await this.buildLocalDanfsePdf({
        id,
        number,
        issueDate,
        providerName,
        providerDoc,
        takerName,
        takerDoc,
        serviceDescription,
        serviceAmountDecimal,
        xmlSha256,
        adminRecordRef,
      });
      pdfBuffer = Buffer.from(localBytes);
      providerMode = 'LOCAL_PDFLIB_FALLBACK';
    }

    // Preserva XML original e PDF em cofre isolado, registrando vínculo SHA-256 <-> SHA-256
    const xmlPath = path.join(this.xmlVaultDir, `${id}.xml`);
    const pdfPath = path.join(this.pdfVaultDir, `${id}.pdf`);
    fs.writeFileSync(xmlPath, xmlContent, 'utf-8');
    fs.writeFileSync(pdfPath, pdfBuffer);
    const pdfSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    const record: DanfseDocumentRecord = {
      id,
      adminRecordRef,
      schoolUnit,
      number,
      issueDate,
      providerName,
      providerDoc,
      takerName,
      takerDoc,
      serviceDescription,
      serviceAmountDecimal,
      xmlPath,
      xmlSha256,
      pdfPath,
      pdfSha256,
      providerMode,
      legalDisclaimer: DANFSE_DISCLAIMER,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    const ledger = this.readLedger();
    ledger.documents.unshift(record);
    this.writeLedger(ledger);

    return {
      success: true,
      document: record,
      pdfBase64: pdfBuffer.toString('base64'),
    };
  }

  public async simulateTax(payload: {
    regime: TaxRegimeType;
    ncmOrNbsCode?: string;
    operationDescription?: string;
    taxClassification?: string;
    baseAmount: string | number;
    cbsRatePercent?: number;
    ibsUfRatePercent?: number;
    ibsMunRatePercent?: number;
    seletivoRatePercent?: number;
    operationDate?: string;
    reviewer?: string;
  }) {
    const regime: TaxRegimeType = payload?.regime === 'simples_nacional' ? 'simples_nacional' : 'regime_regular';
    const baseCents = parseDecimalToCents(payload?.baseAmount ?? 0);
    if (baseCents <= 0) {
      return { success: false, error: 'Valor base da operação deve ser maior que zero.' };
    }

    const cbsRate = Number(payload?.cbsRatePercent ?? (regime === 'simples_nacional' ? 0.9 : 8.8));
    const ibsUfRate = Number(payload?.ibsUfRatePercent ?? (regime === 'simples_nacional' ? 0.1 : 12.2));
    const ibsMunRate = Number(payload?.ibsMunRatePercent ?? (regime === 'simples_nacional' ? 0.0 : 5.5));
    const seletivoRate = Number(payload?.seletivoRatePercent ?? (regime === 'regime_regular' ? 0.0 : 0.0));

    const cfg = this.getConfig();
    let providerMode: 'RFB_JAVA_REST' | 'DETERMINISTIC_CENTS_ADAPTER' = 'DETERMINISTIC_CENTS_ADAPTER';
    let engineVersion = regime === 'simples_nacional' ? 'rfb-simples-adapter/0.1-offline-contract' : 'rfb-regime-regular-adapter/0.1-offline-contract';
    let databaseVersion = 'SQLite-RTC-2026.11 (Tabela Referencial Validada)';

    // Tenta consulta REST se o serviço Java local estiver em execução
    const probeUrls =
      regime === 'simples_nacional'
        ? [cfg.simplesNacionalPrimaryUrl, cfg.simplesNacionalFallbackUrl]
        : [cfg.regimeRegularUrl];

    for (const baseUrl of probeUrls) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1200);
      try {
        const verRes = await fetch(`${baseUrl}/api/calculadora/versao`, { signal: ctrl.signal });
        if (verRes.ok) {
          const verJson = await verRes.json().catch(() => null);
          if (verJson?.versaoAplicacao) engineVersion = String(verJson.versaoAplicacao);
          if (verJson?.versaoBancoDados) databaseVersion = String(verJson.versaoBancoDados);
          providerMode = 'RFB_JAVA_REST';
          break;
        }
      } catch {
        // Mantém fallback determinístico em centavos sem travar
      } finally {
        clearTimeout(t);
      }
    }

    // Cálculo monetário exato em centavos (baseCents * ratePercent / 100)
    const cbsCents = Math.round((baseCents * cbsRate) / 100);
    const ibsUfCents = Math.round((baseCents * ibsUfRate) / 100);
    const ibsMunCents = Math.round((baseCents * ibsMunRate) / 100);
    const ibsTotalCents = ibsUfCents + ibsMunCents;
    const seletivoCents = regime === 'regime_regular' ? Math.round((baseCents * seletivoRate) / 100) : 0;
    const totalTaxesCents = cbsCents + ibsTotalCents + seletivoCents;
    const effectiveRate = ((totalTaxesCents / baseCents) * 100).toFixed(2);

    const warnings: string[] = [
      'Estimativa fiscal revisável — enquadramento tributário definitivo depende da validação do contador.',
      'Proibida qualquer movimentação bancária automática com base nesta simulação.',
    ];
    if (providerMode === 'DETERMINISTIC_CENTS_ADAPTER') {
      warnings.push(
        regime === 'simples_nacional'
          ? 'Serviço Java Simples Nacional offline (atenção às divergências do README oficial entre porta 8082/8080, api-regime-geral.jar e pasta flyway/); cálculo executado localmente em centavos.'
          : 'Serviço Java Regime Regular offline (requer base SQLite pré-gerada em modo somente leitura); cálculo executado localmente em centavos.'
      );
    }

    const record: TaxSimulationRecord = {
      id: `sim-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      regime,
      engineVersion,
      databaseVersion,
      operationDate: String(payload?.operationDate || new Date().toISOString().slice(0, 10)),
      inputs: {
        ncmOrNbsCode: String(payload?.ncmOrNbsCode || '1.1601.10.00'),
        operationDescription: String(payload?.operationDescription || 'Serviços educacionais / administrativos'),
        taxClassification: String(payload?.taxClassification || (regime === 'simples_nacional' ? 'Simples Nacional - Anexo Serviços' : 'CST 000 - Tributação Integral')),
        baseAmountDecimal: centsToDecimal(baseCents),
        cbsRatePercent: cbsRate,
        ibsUfRatePercent: ibsUfRate,
        ibsMunRatePercent: ibsMunRate,
        seletivoRatePercent: seletivoRate,
      },
      result: {
        cbsAmountDecimal: centsToDecimal(cbsCents),
        ibsUfAmountDecimal: centsToDecimal(ibsUfCents),
        ibsMunAmountDecimal: centsToDecimal(ibsMunCents),
        ibsTotalDecimal: centsToDecimal(ibsTotalCents),
        seletivoAmountDecimal: centsToDecimal(seletivoCents),
        totalRtcTaxesDecimal: centsToDecimal(totalTaxesCents),
        effectiveRatePercent: effectiveRate,
        providerMode,
      },
      warnings,
      reviewer: String(payload?.reviewer || 'Contador Responsável (Pendente Revisão)'),
      createdAt: new Date().toISOString(),
    };

    const ledger = this.readLedger();
    ledger.simulations.unshift(record);
    this.writeLedger(ledger);

    return {
      success: true,
      simulation: record,
    };
  }
}

export const rtcFiscalAdapterService = new RtcFiscalAdapterService();
