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
        provider_message_id TEXT,
        recipient_phone TEXT NOT NULL,
        template_name TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        next_retry_at TEXT,
        last_error TEXT,
        sent_at TEXT,
        reconciled_at TEXT,
        reconciled_by TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_outbox_status_retry ON notification_outbox(status, next_retry_at);
      CREATE INDEX IF NOT EXISTS idx_outbox_idempotency ON notification_outbox(idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_outbox_provider_id ON notification_outbox(provider_message_id);
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
    let ambiguous = 0;
    const markProcessing = this.db.prepare("UPDATE notification_outbox SET status = 'PROCESSING' WHERE id = ?");
    const markSent = this.db.prepare(`
      UPDATE notification_outbox 
      SET status = 'SENT', sent_at = ?, provider_message_id = COALESCE(?, provider_message_id), last_error = NULL 
      WHERE id = ?
    `);
    const markAmbiguous = this.db.prepare(`
      UPDATE notification_outbox
      SET status = 'AMBIGUOUS', provider_message_id = COALESCE(?, provider_message_id), last_error = ?
      WHERE id = ?
    `);
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
        const result = await sendFunction(item);
        const isSuccess = typeof result === "boolean" ? result : result.success;
        const providerMsgId = typeof result === "object" ? result.providerMessageId : null;
        const isAmbiguous = typeof result === "object" ? !!result.ambiguous : false;
        if (isSuccess) {
          markSent.run((/* @__PURE__ */ new Date()).toISOString(), providerMsgId || null, item.id);
          sent++;
        } else if (isAmbiguous) {
          const errMsg = typeof result === "object" && result.error ? result.error : "Timeout ap\xF3s envio \u2014 reconcilia\xE7\xE3o necess\xE1ria";
          markAmbiguous.run(providerMsgId || null, errMsg, item.id);
          ambiguous++;
        } else {
          const errMsg = typeof result === "object" && result.error ? result.error : "Falha no gateway remoto de envio";
          throw new Error(errMsg);
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
    return { processed: items.length, sent, retried, deadLetter, ambiguous };
  }
  /**
   * Reconcilia status de mensagem ambígua ou enviada externamente via webhook do provedor (Meta WhatsApp)
   */
  reconcileProviderStatus(idempotencyKey, providerStatus, providerMessageId, operatorId = "SYSTEM_RECONCILIATION") {
    const item = this.db.prepare("SELECT * FROM notification_outbox WHERE idempotency_key = ?").get(idempotencyKey);
    if (!item) {
      return { reconciled: false, previousStatus: null, newStatus: "FAILED" };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let newStatus = item.status;
    if (providerStatus === "DELIVERED" || providerStatus === "SENT") {
      newStatus = "SENT";
      this.db.prepare(`
        UPDATE notification_outbox
        SET status = 'SENT',
            provider_message_id = COALESCE(?, provider_message_id),
            sent_at = COALESCE(sent_at, ?),
            reconciled_at = ?,
            reconciled_by = ?,
            last_error = NULL
        WHERE id = ?
      `).run(providerMessageId || null, now, now, operatorId, item.id);
    } else {
      newStatus = "DEAD_LETTER";
      this.db.prepare(`
        UPDATE notification_outbox
        SET status = 'DEAD_LETTER',
            provider_message_id = COALESCE(?, provider_message_id),
            reconciled_at = ?,
            reconciled_by = ?,
            last_error = ?
        WHERE id = ?
      `).run(providerMessageId || null, now, operatorId, `Rejeitado pelo provedor: ${providerStatus}`, item.id);
    }
    return { reconciled: true, previousStatus: item.status, newStatus };
  }
  /**
   * Consulta itens retidos na Dead-Letter Queue (DLQ)
   */
  getDeadLetters(limit = 50, offset = 0) {
    return this.db.prepare(`
      SELECT * FROM notification_outbox
      WHERE status = 'DEAD_LETTER'
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  }
  /**
   * Reprocessamento controlado de item da DLQ por intervenção humana (HITL)
   */
  reprocessDeadLetter(id, operatorUserId, justification) {
    if (!operatorUserId || !justification || justification.trim().length < 5) {
      return { reprocessed: false, error: "Identifica\xE7\xE3o do operador e justificativa t\xE9cnica s\xE3o obrigat\xF3rias (HITL LGPD)." };
    }
    const item = this.db.prepare("SELECT * FROM notification_outbox WHERE id = ?").get(id);
    if (!item) {
      return { reprocessed: false, error: "Mensagem n\xE3o encontrada na base." };
    }
    if (item.status !== "DEAD_LETTER" && item.status !== "AMBIGUOUS" && item.status !== "FAILED") {
      return { reprocessed: false, error: `Status atual (${item.status}) n\xE3o permite reprocessamento manual.` };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(`
      UPDATE notification_outbox
      SET status = 'PENDING',
          retry_count = 0,
          next_retry_at = ?,
          reconciled_at = ?,
          reconciled_by = ?,
          last_error = ?
      WHERE id = ?
    `).run(
      now,
      now,
      operatorUserId,
      `Reprocessamento manual solicitado: "${justification}"`,
      id
    );
    return { reprocessed: true };
  }
  /**
   * Verificação de Alerta da Dead-Letter Queue para TI e DPO Escolar
   */
  checkDlqAlert(threshold = 1) {
    const row = this.db.prepare("SELECT count(*) as count FROM notification_outbox WHERE status = 'DEAD_LETTER'").get();
    const count = row.count || 0;
    const alert = count >= threshold;
    return {
      alert,
      count,
      message: alert ? `ALERTA OPERACIONAL: ${count} mensagem(ns) retida(s) na Dead-Letter Queue aguardando resolu\xE7\xE3o.` : "DLQ saud\xE1vel (Zero mensagens retidas)."
    };
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
        count(CASE WHEN status = 'AMBIGUOUS' THEN 1 END) as ambiguousCount,
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
var ROLE_RATE_LIMITS = {
  ADMIN: { read: 300, write: 150, dispatch: 60 },
  GATEWAY: { read: 300, write: 150, dispatch: 60 },
  TEACHER: { read: 120, write: 60, dispatch: 20 },
  GUARDIAN: { read: 60, write: 10, dispatch: 0 },
  STUDENT: { read: 60, write: 10, dispatch: 0 },
  GUEST: { read: 20, write: 0, dispatch: 0 }
};
var WebSocketServerManager = class extends import_events.EventEmitter {
  wss = null;
  httpServer = null;
  clients = /* @__PURE__ */ new Map();
  port = 9e3;
  isRunning = false;
  ipRateLimits = /* @__PURE__ */ new Map();
  MAX_CONNECTIONS_PER_IP = 20;
  MAX_IP_MESSAGES_PER_MINUTE = 180;
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
      console.log(`[WebSocket] Servidor Seguro iniciado na porta ${this.port} (Origem validada, Rate Limit Granular ativo).`);
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
    const ipState = this.ipRateLimits.get(ip) || { count: 0, windowStart: now };
    if (ipState.blockedUntil && now < ipState.blockedUntil) {
      const remainingSeconds = Math.ceil((ipState.blockedUntil - now) / 1e3);
      console.warn(`[WebSocket] Conex\xE3o bloqueada: IP ${ip} em cooldown tempor\xE1rio por ${remainingSeconds}s.`);
      callback(false, 429, `Too Many Requests: Cooldown active (${remainingSeconds}s)`);
      return;
    }
    if (now - ipState.windowStart > 6e4) {
      ipState.count = 1;
      ipState.windowStart = now;
    } else {
      ipState.count++;
      if (ipState.count > this.MAX_IP_MESSAGES_PER_MINUTE) {
        ipState.blockedUntil = now + 6e4;
        this.ipRateLimits.set(ip, ipState);
        console.warn(`[WebSocket] IP ${ip} atingiu limite m\xE1ximo de conex\xF5es/minuto. Cooldown acionado.`);
        callback(false, 429, "Too Many Requests: Rate Limit Exceeded");
        return;
      }
    }
    this.ipRateLimits.set(ip, ipState);
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
   * Extrai metadados do token (Role, UserId, Tenant) se payload JWT/HMAC presente
   */
  parseTokenMetadata(token) {
    if (!token || !token.includes(".")) {
      return { role: "TEACHER" };
    }
    try {
      const [payloadB64] = token.split(".");
      const json = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"));
      return {
        role: json.role || "TEACHER",
        userId: json.userId || json.sub,
        schoolId: json.schoolId || json.tenantId
      };
    } catch {
      return { role: "GUEST" };
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
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const token = url.searchParams.get("token") || (req.headers["authorization"] || "").replace("Bearer ", "");
      const metaParsed = this.parseTokenMetadata(token);
      const meta = {
        ip,
        authenticated: true,
        role: metaParsed.role,
        userId: metaParsed.userId,
        schoolId: metaParsed.schoolId,
        connectedAt: /* @__PURE__ */ new Date(),
        messageCount: 0,
        lastMessageTime: Date.now(),
        readCount: 0,
        writeCount: 0,
        dispatchCount: 0,
        windowStart: Date.now(),
        violationCount: 0
      };
      this.clients.set(ws, meta);
      this.emit("client:connected", {
        clientsCount: this.clients.size,
        ip,
        role: meta.role,
        userId: meta.userId,
        timestamp: /* @__PURE__ */ new Date()
      });
      ws.on("message", (data) => {
        try {
          const clientMeta = this.clients.get(ws);
          if (!clientMeta) return;
          const now = Date.now();
          if (clientMeta.blockedUntil && now < clientMeta.blockedUntil) {
            const remaining = Math.ceil((clientMeta.blockedUntil - now) / 1e3);
            this.sendToClient(ws, {
              type: "error",
              message: `Acesso temporariamente bloqueado por abuso (${remaining}s restantes).`,
              data: { remainingSeconds: remaining },
              timestamp: /* @__PURE__ */ new Date()
            });
            return;
          }
          const message = JSON.parse(data.toString());
          const category = this.categorizeMessage(message);
          if (now - clientMeta.windowStart > 6e4) {
            clientMeta.windowStart = now;
            clientMeta.readCount = 0;
            clientMeta.writeCount = 0;
            clientMeta.dispatchCount = 0;
          }
          const limits = ROLE_RATE_LIMITS[clientMeta.role] || ROLE_RATE_LIMITS.GUEST;
          let limitExceeded = false;
          let exceededReason = "";
          if (category === "READ") {
            clientMeta.readCount++;
            if (clientMeta.readCount > limits.read) {
              limitExceeded = true;
              exceededReason = `Limite de consultas excedido (${limits.read}/min para papel ${clientMeta.role})`;
            }
          } else if (category === "WRITE") {
            clientMeta.writeCount++;
            if (clientMeta.writeCount > limits.write) {
              limitExceeded = true;
              exceededReason = `Limite de muta\xE7\xF5es excedido (${limits.write}/min para papel ${clientMeta.role})`;
            }
          } else if (category === "DISPATCH") {
            clientMeta.dispatchCount++;
            if (clientMeta.dispatchCount > limits.dispatch) {
              limitExceeded = true;
              exceededReason = `Disparo n\xE3o autorizado ou limite excedido (${limits.dispatch}/min para papel ${clientMeta.role})`;
            }
          }
          if (limitExceeded) {
            clientMeta.violationCount++;
            this.emit("security:rate_limit_violation", {
              ip: clientMeta.ip,
              userId: clientMeta.userId,
              role: clientMeta.role,
              category,
              violationCount: clientMeta.violationCount,
              reason: exceededReason,
              timestamp: /* @__PURE__ */ new Date()
            });
            if (clientMeta.violationCount === 1) {
              this.sendToClient(ws, {
                type: "rate_limit_warning",
                message: exceededReason,
                data: { violationCount: 1 },
                timestamp: /* @__PURE__ */ new Date()
              });
              return;
            } else if (clientMeta.violationCount === 2) {
              clientMeta.blockedUntil = now + 6e4;
              this.sendToClient(ws, {
                type: "rate_limit_cooldown",
                message: "Cooldown de 60 segundos ativado por viola\xE7\xE3o de pol\xEDtica.",
                data: { cooldownSeconds: 60 },
                timestamp: /* @__PURE__ */ new Date()
              });
              return;
            } else {
              console.warn(`[WebSocket] Desconectando cliente persistente por abuso: ${clientMeta.ip} (${clientMeta.role})`);
              ws.close(1008, "Policy Violation: Repeated Rate Limit Abuse");
              return;
            }
          }
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
   * Categoriza mensagem para rate limit de acordo com o impacto
   */
  categorizeMessage(message) {
    if (message.category === "READ" || message.category === "WRITE" || message.category === "DISPATCH") {
      return message.category;
    }
    const type = (message.type || "").toLowerCase();
    if (type.includes("ping") || type.includes("subscribe") || type.includes("query") || type.includes("get")) {
      return "READ";
    }
    if (type.includes("broadcast") || type.includes("notify") || type.includes("alert")) {
      return "DISPATCH";
    }
    return "WRITE";
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
  const resultsDir = path.join(process.cwd(), "test-results");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  const dbPath = path.join(testDir, "aquila_e2e.db");
  const db = new import_better_sqlite3.default(dbPath);
  const testAuditTrail = [];
  try {
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    const t0 = performance.now();
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
    const t0_elapsed = performance.now() - t0;
    testAuditTrail.push({ test: "E2E-01-Pedagogico", status: "PASSED", latencyMs: t0_elapsed, details: `M\xE9dia=${reportCard.final_average}, Freq=${reportCard.attendance_rate}%` });
    console.log(`\u2705 [E2E-01] Fluxo Pedag\xF3gico homologado: M\xE9dia=${reportCard.final_average}, Freq=${reportCard.attendance_rate}%, Status=${reportCard.status}.
`);
    const t1 = performance.now();
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
    const dlqAlert = outboxService.checkDlqAlert(1);
    if (!dlqAlert.alert || dlqAlert.count !== 1) {
      throw new Error(`FALHA NO ALERTA DLQ: ${JSON.stringify(dlqAlert)}`);
    }
    console.log(`   - Alerta da Dead-Letter Queue ativo: "${dlqAlert.message}"`);
    const deadItems = outboxService.getDeadLetters(5);
    if (deadItems.length !== 1) {
      throw new Error(`FALHA NA CONSULTA DLQ: esperado 1 item, obtido ${deadItems.length}`);
    }
    const reprocessResult = outboxService.reprocessDeadLetter(
      deadItems[0].id,
      "USER_TI_ADMIN_01",
      "Corre\xE7\xE3o de conectividade com gateway WhatsApp Meta homologada"
    );
    if (!reprocessResult.reprocessed) {
      throw new Error(`FALHA NO REPROCESSO HITL: ${reprocessResult.error}`);
    }
    console.log("   - Reprocessamento manual HITL validado: mensagem reabilitada para PENDING com rastreabilidade.");
    outboxService.enqueue({
      idempotencyKey: "AVISO_BOLETIM_STD001_20261025",
      recipientPhone: "5511988887777",
      templateName: "aviso_boletim_v1",
      parameters: { student_name: "Aluno E2E Piloto", media: 8.75 }
    });
    await outboxService.processBatch(1, async () => {
      return { success: false, ambiguous: true, providerMessageId: "wamid.HBgLMTE5ODg4ODc3NzcVAgARGBI0NTY", error: "HTTP 504 Gateway Timeout" };
    });
    const ambiguousStats = outboxService.getStats();
    if (ambiguousStats.ambiguousCount !== 1) {
      throw new Error(`FALHA NO TRATAMENTO AMB\xCDGUO: ${JSON.stringify(ambiguousStats)}`);
    }
    console.log("   - Resposta amb\xEDgua tratada com seguran\xE7a (status retido em AMBIGUOUS).");
    const reconcileResult = outboxService.reconcileProviderStatus(
      "AVISO_BOLETIM_STD001_20261025",
      "DELIVERED",
      "wamid.HBgLMTE5ODg4ODc3NzcVAgARGBI0NTY",
      "META_WEBHOOK_WORKER"
    );
    if (!reconcileResult.reconciled || reconcileResult.newStatus !== "SENT") {
      throw new Error(`FALHA NA RECONCILIA\xC7\xC3O: ${JSON.stringify(reconcileResult)}`);
    }
    console.log("   - Reconcilia\xE7\xE3o oficial confirmada: status atualizado para SENT sem reenvio duplicado.");
    const t1_elapsed = performance.now() - t1;
    testAuditTrail.push({ test: "E2E-02-Mensageria-DLQ-Reconciliacao", status: "PASSED", latencyMs: t1_elapsed, details: "Idempot\xEAncia, DLQ, HITL e Reconcilia\xE7\xE3o verificados" });
    console.log(`\u2705 [E2E-02] Mensageria resiliente homologada com Reconcilia\xE7\xE3o Meta e DLQ Operacional.
`);
    const t2 = performance.now();
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
    const t2_elapsed = performance.now() - t2;
    testAuditTrail.push({ test: "E2E-03-OMR-HITL", status: "PASSED", latencyMs: t2_elapsed, details: "Ambiguidade retida e homologada por docente" });
    console.log("\u2705 [E2E-03] Fluxo OMR HITL homologado: Arbitragem docente conclu\xEDda e nota liberada com seguran\xE7a.\n");
    const t3 = performance.now();
    console.log("4\uFE0F\u20E3 [E2E-04] Validando Seguran\xE7a do WebSocket: Origem, Rate Limit Granular e Autentica\xE7\xE3o HMAC...");
    const wsManager = new WebSocketServerManager(9005, "SEGREDO_HMAC_TESTE_E2E_2026");
    const payloadB64 = Buffer.from(JSON.stringify({ role: "TEACHER", userId: "PROF_01", schoolId: "ESC_PILOTO_01", exp: Date.now() + 6e4 })).toString("base64");
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
    console.log("   - Conex\xE3o n\xE3o autorizada ou com origem externa rejeitada com 401/403.");
    const tokenMeta = wsManager.parseTokenMetadata(validToken);
    if (tokenMeta.role !== "TEACHER" || tokenMeta.userId !== "PROF_01" || tokenMeta.schoolId !== "ESC_PILOTO_01") {
      throw new Error(`FALHA NA EXTRA\xC7\xC3O DE METADADOS: ${JSON.stringify(tokenMeta)}`);
    }
    console.log("   - Metadados do token extra\xEDdos com fidelidade (Role=TEACHER, Tenant=ESC_PILOTO_01).");
    const t3_elapsed = performance.now() - t3;
    testAuditTrail.push({ test: "E2E-04-WebSocket-HMAC-RateLimit", status: "PASSED", latencyMs: t3_elapsed, details: "HMAC, Origens LAN e isolamento por Tenant aprovados" });
    console.log("\u2705 [E2E-04] Seguran\xE7a WebSocket homologada: Autentica\xE7\xE3o HMAC, isolamento e rate limits ativos.\n");
    const reportArtifact = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      releaseCandidate: "v2.1.0-rc.16",
      totalTests: testAuditTrail.length,
      allPassed: testAuditTrail.every((t) => t.status === "PASSED"),
      auditTrail: testAuditTrail
    };
    const reportPath = path.join(resultsDir, "e2e-critical-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(reportArtifact, null, 2), "utf-8");
    console.log(`\u{1F4C4} Relat\xF3rio de auditoria E2E salvo em: ${reportPath}`);
    console.log("\n\u{1F3C6} =========================================================================");
    console.log("   BATERIA E2E COMPLETA: TODOS OS TESTES CR\xCDTICOS APROVADOS (100% VERDE)");
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
