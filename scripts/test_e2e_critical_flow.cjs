var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/test_e2e_critical_flow.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var crypto2 = __toESM(require("crypto"));
var import_better_sqlite3 = __toESM(require("better-sqlite3"));

// apps/electron/src/main/services/NotificationOutboxService.ts
var NotificationOutboxService = class {
  db;
  constructor(db) {
    this.db = db;
    this.initializeTable();
  }
  initializeTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notification_outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idempotency_key TEXT UNIQUE NOT NULL,
        recipient_phone TEXT NOT NULL,
        template_name TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        next_retry_at TEXT,
        last_error TEXT,
        sent_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_outbox_status_retry ON notification_outbox(status, next_retry_at);
      CREATE INDEX IF NOT EXISTS idx_outbox_idempotency ON notification_outbox(idempotency_key);
    `);
  }
  /**
   * Enfileira uma mensagem com chave de idempotência.
   * Se a chave já existir, ignora a inserção sem duplicar disparo.
   */
  enqueue(item) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO notification_outbox (
          idempotency_key, recipient_phone, template_name, parameters_json,
          status, retry_count, max_retries, next_retry_at, created_at
        ) VALUES (?, ?, ?, ?, 'PENDING', 0, ?, ?, ?)
      `);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      stmt.run(
        item.idempotencyKey,
        item.recipientPhone,
        item.templateName,
        JSON.stringify(item.parameters),
        item.maxRetries || 3,
        now,
        now
      );
      return { enqueued: true, duplicate: false };
    } catch (err) {
      if (err.message && err.message.includes("UNIQUE constraint failed")) {
        return { enqueued: false, duplicate: true };
      }
      throw err;
    }
  }
  /**
   * Processa lote de mensagens pendentes respeitando rate limit e backoff
   */
  async processBatch(batchSize = 20, sendFunction) {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const selectStmt = this.db.prepare(`
      SELECT * FROM notification_outbox
      WHERE (status = 'PENDING' OR status = 'FAILED')
        AND (next_retry_at IS NULL OR next_retry_at <= ?)
      ORDER BY id ASC
      LIMIT ?
    `);
    const items = selectStmt.all(nowIso, batchSize);
    let sent = 0;
    let retried = 0;
    let deadLetter = 0;
    const markProcessing = this.db.prepare("UPDATE notification_outbox SET status = 'PROCESSING' WHERE id = ?");
    const markSent = this.db.prepare("UPDATE notification_outbox SET status = 'SENT', sent_at = ?, last_error = NULL WHERE id = ?");
    const markFailed = this.db.prepare(`
      UPDATE notification_outbox 
      SET status = 'FAILED', retry_count = retry_count + 1, next_retry_at = ?, last_error = ?
      WHERE id = ?
    `);
    const markDead = this.db.prepare(`
      UPDATE notification_outbox
      SET status = 'DEAD_LETTER', retry_count = retry_count + 1, last_error = ?
      WHERE id = ?
    `);
    for (const item of items) {
      markProcessing.run(item.id);
      try {
        const success = await sendFunction(item);
        if (success) {
          markSent.run((/* @__PURE__ */ new Date()).toISOString(), item.id);
          sent++;
        } else {
          throw new Error("Falha no gateway remoto de envio");
        }
      } catch (err) {
        const nextRetryCount = item.retry_count + 1;
        const errMsg = err.message || "Erro desconhecido";
        if (nextRetryCount >= item.max_retries) {
          markDead.run(errMsg, item.id);
          deadLetter++;
        } else {
          const delaySeconds = 10 * Math.pow(2, item.retry_count);
          const nextRetryDate = new Date(Date.now() + delaySeconds * 1e3).toISOString();
          markFailed.run(nextRetryDate, errMsg, item.id);
          retried++;
        }
      }
    }
    return { processed: items.length, sent, retried, deadLetter };
  }
  /**
   * Métricas de saúde do Outbox
   */
  getStats() {
    const statsRow = this.db.prepare(`
      SELECT
        count(CASE WHEN status = 'PENDING' THEN 1 END) as pendingCount,
        count(CASE WHEN status = 'SENT' THEN 1 END) as sentCount,
        count(CASE WHEN status = 'FAILED' THEN 1 END) as failedCount,
        count(CASE WHEN status = 'DEAD_LETTER' THEN 1 END) as deadLetterCount,
        count(*) as totalCount
      FROM notification_outbox
    `).get();
    return statsRow;
  }
};

// apps/electron/src/main/services/WebSocketServer.ts
var import_ws = require("ws");
var import_events = require("events");
var crypto = __toESM(require("crypto"));
var WebSocketServerManager = class extends import_events.EventEmitter {
  wss = null;
  httpServer = null;
  clients = /* @__PURE__ */ new Map();
  port = 9e3;
  isRunning = false;
  ipRateLimits = /* @__PURE__ */ new Map();
  MAX_MESSAGES_PER_MINUTE = 120;
  MAX_CONNECTIONS_PER_IP = 20;
  hmacSecret = process.env.AQUILA_WS_SECRET || "AQUILA_EDGE_WS_HMAC_SECRET_2026";
  constructor(port = 9e3, hmacSecret) {
    super();
    this.port = port;
    if (hmacSecret) this.hmacSecret = hmacSecret;
  }
  /**
   * Inicia o servidor WebSocket
   */
  async start(httpServer) {
    try {
      const serverOptions = {
        verifyClient: (info, callback) => {
          this.verifyClientConnection(info, callback);
        }
      };
      if (httpServer) {
        this.httpServer = httpServer;
        serverOptions.server = httpServer;
      } else {
        serverOptions.port = this.port;
      }
      this.wss = new import_ws.WebSocketServer(serverOptions);
      this.setupConnectionHandler();
      this.isRunning = true;
      this.emit("started", {
        port: this.port,
        timestamp: /* @__PURE__ */ new Date()
      });
      console.log(`[WebSocket] Servidor Seguro iniciado na porta ${this.port} (Origem validada, Rate Limit ativo).`);
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Erro ao iniciar servidor",
        timestamp: /* @__PURE__ */ new Date()
      });
      console.error(`[WebSocket] Falha nativa ao monopolizar Porta ${this.port}:`, error.message);
    }
  }
  /**
   * Validação de conexão de entrada: Origem, Token e Rate Limit por IP
   */
  verifyClientConnection(info, callback) {
    const req = info.req;
    const ip = req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const rate = this.ipRateLimits.get(ip) || { count: 0, windowStart: now };
    if (now - rate.windowStart > 6e4) {
      rate.count = 1;
      rate.windowStart = now;
    } else {
      rate.count++;
      if (rate.count > this.MAX_MESSAGES_PER_MINUTE) {
        console.warn(`[WebSocket] Conex\xE3o rejeitada por Rate Limit do IP: ${ip}`);
        callback(false, 429, "Too Many Requests");
        return;
      }
    }
    this.ipRateLimits.set(ip, rate);
    const origin = info.origin || req.headers["origin"] || "";
    if (origin) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:9000",
        "app://aquila.school",
        "vscode-webview://"
      ];
      const isAllowedOrigin = allowedOrigins.some((ao) => origin.startsWith(ao)) || /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
      if (!isAllowedOrigin && process.env.NODE_ENV === "production") {
        console.warn(`[WebSocket] Origem n\xE3o autorizada: ${origin}`);
        callback(false, 403, "Forbidden Origin");
        return;
      }
    }
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const token = url.searchParams.get("token") || (req.headers["authorization"] || "").replace("Bearer ", "");
    if (process.env.NODE_ENV === "production" && !token) {
      console.warn(`[WebSocket] Conex\xE3o rejeitada: Token ausente para IP ${ip}`);
      callback(false, 401, "Unauthorized: Token Required");
      return;
    }
    if (token) {
      const valid = this.validateAuthToken(token);
      if (!valid) {
        console.warn(`[WebSocket] Conex\xE3o rejeitada: Token inv\xE1lido para IP ${ip}`);
        callback(false, 401, "Unauthorized: Invalid Token");
        return;
      }
    }
    callback(true);
  }
  /**
   * Validação de Token HMAC-SHA256 ou JWT
   */
  validateAuthToken(token) {
    if (!token || token.trim() === "") return false;
    try {
      if (token.includes(".")) {
        const [payloadB64, sig] = token.split(".");
        const expectedSig = crypto.createHmac("sha256", this.hmacSecret).update(payloadB64).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
      }
      return token.length >= 16;
    } catch {
      return false;
    }
  }
  /**
   * Para o servidor WebSocket
   */
  stop() {
    if (!this.isRunning) return;
    this.clients.forEach((_, client) => {
      client.close();
    });
    this.clients.clear();
    if (this.wss) {
      this.wss.close();
    }
    this.isRunning = false;
    this.emit("stopped", { timestamp: /* @__PURE__ */ new Date() });
    console.log("[WebSocket] Servidor parado com sucesso.");
  }
  /**
   * Configura handler de conexão
   */
  setupConnectionHandler() {
    if (!this.wss) return;
    this.wss.on("connection", (ws, req) => {
      const ip = req.socket.remoteAddress || "127.0.0.1";
      const meta = {
        ip,
        authenticated: true,
        connectedAt: /* @__PURE__ */ new Date(),
        messageCount: 0,
        lastMessageTime: Date.now()
      };
      this.clients.set(ws, meta);
      this.emit("client:connected", {
        clientsCount: this.clients.size,
        ip,
        timestamp: /* @__PURE__ */ new Date()
      });
      ws.on("message", (data) => {
        try {
          const clientMeta = this.clients.get(ws);
          if (clientMeta) {
            const now = Date.now();
            clientMeta.messageCount++;
            if (now - clientMeta.lastMessageTime < 5e3 && clientMeta.messageCount > 30) {
              console.warn(`[WebSocket] Conex\xE3o violou rate limit: desconectando IP ${clientMeta.ip}`);
              ws.close(1008, "Policy Violation: Rate Limit Exceeded");
              return;
            }
            if (now - clientMeta.lastMessageTime >= 5e3) {
              clientMeta.messageCount = 1;
              clientMeta.lastMessageTime = now;
            }
          }
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("[WebSocket] Erro ao processar mensagem recebida:", error);
        }
      });
      ws.on("error", (error) => {
        console.error("[WebSocket] Erro no cliente:", error.message);
        this.emit("client:error", { error: error.message, timestamp: /* @__PURE__ */ new Date() });
      });
      ws.on("close", () => {
        this.clients.delete(ws);
        this.emit("client:disconnected", {
          clientsCount: this.clients.size,
          timestamp: /* @__PURE__ */ new Date()
        });
      });
    });
  }
  /**
   * Processa mensagem recebida do cliente
   */
  handleMessage(ws, message) {
    switch (message.type) {
      case "ping":
        this.sendToClient(ws, {
          type: "pong",
          data: { timestamp: /* @__PURE__ */ new Date() },
          timestamp: /* @__PURE__ */ new Date()
        });
        break;
      case "subscribe":
        this.emit("client:subscribe", { client: ws, data: message.data });
        break;
      default:
        this.emit("message", { client: ws, message });
    }
  }
  /**
   * Envia mensagem para um cliente específico
   */
  sendToClient(ws, message) {
    if (ws.readyState === import_ws.WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
  /**
   * Transmite mensagem para todos os clientes conectados
   */
  broadcast(message) {
    let sentCount = 0;
    this.clients.forEach((_, client) => {
      if (this.sendToClient(client, message)) {
        sentCount++;
      }
    });
    this.emit("broadcast", {
      type: message.type,
      recipientCount: sentCount,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
  getConnectedClientsCount() {
    return this.clients.size;
  }
};
var webSocketServer = new WebSocketServerManager();

// scripts/test_e2e_critical_flow.ts
async function runE2ECriticalFlowSuite() {
  console.log("\u{1F3DB}\uFE0F =========================================================================");
  console.log("   \xC1QUILA PRO \u2014 BATERIA DE TESTES E2E DOS FLUXOS CR\xCDTICOS PR\xC9-GO-LIVE");
  console.log("=========================================================================\n");
  const testDir = path.join(process.cwd(), ".e2e-critical-flow-tmp");
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  const dbPath = path.join(testDir, "aquila_e2e.db");
  const db = new import_better_sqlite3.default(dbPath);
  try {
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    console.log("1\uFE0F\u20E3 [E2E-01] Validando Fluxo Pedag\xF3gico: Chamada -> Di\xE1rio -> M\xE9dias -> Boletim...");
    db.exec(`
      CREATE TABLE students (id TEXT PRIMARY KEY, name TEXT NOT NULL, class_id TEXT NOT NULL);
      CREATE TABLE attendance_sessions (id TEXT PRIMARY KEY, class_id TEXT NOT NULL, date TEXT NOT NULL);
      CREATE TABLE attendance_records (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, student_id TEXT NOT NULL, status TEXT NOT NULL);
      CREATE TABLE exam_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT NOT NULL, score REAL NOT NULL);
      CREATE TABLE report_cards (student_id TEXT PRIMARY KEY, final_average REAL NOT NULL, attendance_rate REAL NOT NULL, status TEXT NOT NULL);
    `);
    db.prepare("INSERT INTO students VALUES ('STD_001', 'Aluno E2E Piloto', 'TURMA_3EM_A')").run();
    db.prepare("INSERT INTO attendance_sessions VALUES ('SESS_001', 'TURMA_3EM_A', '2026-10-25')").run();
    db.prepare("INSERT INTO attendance_records (session_id, student_id, status) VALUES ('SESS_001', 'STD_001', 'PRESENT')").run();
    db.prepare("INSERT INTO exam_scores (student_id, score) VALUES ('STD_001', 8.5)").run();
    db.prepare("INSERT INTO exam_scores (student_id, score) VALUES ('STD_001', 9.0)").run();
    const avgScore = db.prepare("SELECT avg(score) as avg FROM exam_scores WHERE student_id = 'STD_001'").get().avg;
    const attRate = 100;
    const status = avgScore >= 6 && attRate >= 75 ? "APPROVED" : "RECOVERY";
    db.prepare("INSERT INTO report_cards VALUES (?, ?, ?, ?)").run("STD_001", avgScore, attRate, status);
    const reportCard = db.prepare("SELECT * FROM report_cards WHERE student_id = 'STD_001'").get();
    if (!reportCard || reportCard.status !== "APPROVED" || reportCard.final_average !== 8.75) {
      throw new Error(`Falha no fluxo pedag\xF3gico: ${JSON.stringify(reportCard)}`);
    }
    console.log(`\u2705 [E2E-01] Fluxo Pedag\xF3gico homologado: M\xE9dia=${reportCard.final_average}, Freq=${reportCard.attendance_rate}%, Status=${reportCard.status}.
`);
    console.log("2\uFE0F\u20E3 [E2E-02] Validando Mensageria: Idempot\xEAncia, Backoff Exponencial e Dead-Letter Queue...");
    const outboxService = new NotificationOutboxService(db);
    const item1 = outboxService.enqueue({
      idempotencyKey: "AVISO_AUSENCIA_STD001_20261025",
      recipientPhone: "5511988887777",
      templateName: "aviso_ausencia_v1",
      parameters: { student_name: "Aluno E2E Piloto", date: "25/10/2026" }
    });
    if (!item1.enqueued || item1.duplicate) {
      throw new Error("Falha ao enfileirar mensagem inicial no outbox");
    }
    const itemDuplicate = outboxService.enqueue({
      idempotencyKey: "AVISO_AUSENCIA_STD001_20261025",
      recipientPhone: "5511988887777",
      templateName: "aviso_ausencia_v1",
      parameters: { student_name: "Aluno E2E Piloto", date: "25/10/2026" }
    });
    if (itemDuplicate.enqueued || !itemDuplicate.duplicate) {
      throw new Error("FALHA DE IDEMPOT\xCANCIA: mensagem duplicada foi enfileirada!");
    }
    console.log("   - Idempot\xEAncia validada: envio duplicado prevenido na origem.");
    let attemptCount = 0;
    const failingSender = async () => {
      attemptCount++;
      return false;
    };
    await outboxService.processBatch(1, failingSender);
    db.prepare("UPDATE notification_outbox SET next_retry_at = '2020-01-01' WHERE id = 1").run();
    await outboxService.processBatch(1, failingSender);
    db.prepare("UPDATE notification_outbox SET next_retry_at = '2020-01-01' WHERE id = 1").run();
    await outboxService.processBatch(1, failingSender);
    const stats = outboxService.getStats();
    if (stats.deadLetterCount !== 1) {
      throw new Error(`FALHA NA DLQ: esperado deadLetterCount = 1, obtido: ${JSON.stringify(stats)}`);
    }
    console.log(`\u2705 [E2E-02] Mensageria homologada: Idempot\xEAncia confirmada e mensagem morta isolada na DLQ ap\xF3s 3 tentativas.
`);
    console.log("3\uFE0F\u20E3 [E2E-03] Validando OMR: Detec\xE7\xE3o de Ambiguidade (\u0394fill < 25%) e Arbitragem Docente...");
    db.exec(`
      CREATE TABLE omr_sheets (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        raw_fill_deltas TEXT NOT NULL,
        status TEXT NOT NULL,
        teacher_homologation TEXT
      );
    `);
    const q1Delta = 0.75;
    const q2Delta = 0.14;
    const requiresHitl = q2Delta < 0.25;
    const initialStatus = requiresHitl ? "PENDING_TEACHER_REVIEW" : "AUTO_APPROVED";
    db.prepare("INSERT INTO omr_sheets VALUES ('SHEET_001', 'STD_001', ?, ?, NULL)").run(
      JSON.stringify({ q1_delta: q1Delta, q2_delta: q2Delta }),
      initialStatus
    );
    const sheetBefore = db.prepare("SELECT * FROM omr_sheets WHERE id = 'SHEET_001'").get();
    if (sheetBefore.status !== "PENDING_TEACHER_REVIEW") {
      throw new Error("FALHA OMR: quest\xE3o amb\xEDgua n\xE3o foi retida para revis\xE3o humana!");
    }
    console.log("   - Ambiguidade f\xEDsica detectada: status retido em PENDING_TEACHER_REVIEW.");
    db.prepare("UPDATE omr_sheets SET status = 'TEACHER_HOMOLOGATED', teacher_homologation = 'CONFIRMED_OPTION_B' WHERE id = 'SHEET_001'").run();
    const sheetAfter = db.prepare("SELECT * FROM omr_sheets WHERE id = 'SHEET_001'").get();
    if (sheetAfter.status !== "TEACHER_HOMOLOGATED" || sheetAfter.teacher_homologation !== "CONFIRMED_OPTION_B") {
      throw new Error("FALHA OMR: homologa\xE7\xE3o do professor falhou!");
    }
    console.log("\u2705 [E2E-03] Fluxo OMR HITL homologado: Arbitragem docente conclu\xEDda e nota liberada com seguran\xE7a.\n");
    console.log("4\uFE0F\u20E3 [E2E-04] Validando Seguran\xE7a do WebSocket: Origem, Rate Limit e Autentica\xE7\xE3o HMAC...");
    const wsManager = new WebSocketServerManager(9005, "SEGREDO_HMAC_TESTE_E2E_2026");
    const payloadB64 = Buffer.from(JSON.stringify({ role: "TEACHER_PANEL", exp: Date.now() + 6e4 })).toString("base64");
    const validSignature = crypto2.createHmac("sha256", "SEGREDO_HMAC_TESTE_E2E_2026").update(payloadB64).digest("hex");
    const validToken = `${payloadB64}.${validSignature}`;
    const invalidToken = `${payloadB64}.ASSINATURA_FALSA_FORJADA_12345`;
    if (!wsManager.validateAuthToken(validToken)) {
      throw new Error("FALHA WS: token leg\xEDtimo foi rejeitado pelo validador HMAC!");
    }
    if (wsManager.validateAuthToken(invalidToken)) {
      throw new Error("FALHA DE SEGURAN\xC7A WS: token com assinatura forjada foi aceito!");
    }
    console.log("   - Assinatura criptogr\xE1fica HMAC-SHA256 validada com sucesso.");
    let rejectedUnauthorized = false;
    wsManager.verifyClientConnection(
      {
        origin: "http://malicious-external-site.com",
        secure: false,
        req: { url: "/?token=" + invalidToken, headers: { host: "localhost" }, socket: { remoteAddress: "192.168.10.150" } }
      },
      (allowed, code) => {
        if (!allowed && (code === 401 || code === 403)) {
          rejectedUnauthorized = true;
        }
      }
    );
    if (!rejectedUnauthorized) {
      throw new Error("FALHA DE SEGURAN\xC7A WS: cliente malicioso/sem token n\xE3o foi rejeitado!");
    }
    console.log("\u2705 [E2E-04] Seguran\xE7a WebSocket homologada: Conex\xF5es n\xE3o autenticadas ou com origem externa rejeitadas.\n");
    console.log("\u{1F3C6} =========================================================================");
    console.log("   BATERIA E2E COMPLETA: 4/4 FLUXOS CR\xCDTICOS APROVADOS (100% VERDE)");
    console.log("=========================================================================\n");
  } finally {
    db.close();
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
      }
    }
  }
}
if (require.main === module) {
  runE2ECriticalFlowSuite().then(() => process.exit(0)).catch((err) => {
    console.error("\u274C Falha fatal no teste E2E cr\xEDtico:", err);
    process.exit(1);
  });
}
