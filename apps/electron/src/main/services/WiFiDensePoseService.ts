import { EventEmitter } from 'events';
import * as dgram from 'dgram';
import * as crypto from 'crypto';
import { GhostPresence } from '../../services/AiTypes';
import { logger } from '../logger';

/**
 * WiFiDensePoseService — Submódulo de Percepção Passiva por Sinais RF (RuView CSI Pipeline)
 * 
 * Controles de Segurança e Governança LGPD (Conforme Auditoria P0):
 * 1. Zonas Íntimas Proibidas: Banheiros e vestiários são bloqueados por padrão.
 * 2. Autenticação UDP: Verificação de HMAC-SHA256, checagem de frescor de timestamp (10s),
 *    prevenção contra ataques de replay via cache de nonces e allowlist de IPs.
 * 3. Simulação Segura: Simulação desativada por padrão em produção. Eventos simulados são
 *    obrigatoriamente etiquetados como 'source: simulation' e JAMAIS disparam alertas de emergência.
 */

// Zonas íntimas bloqueadas por padrão em conformidade estrita com LGPD Art. 14 e 16
const PROHIBITED_INTIMATE_ZONES = new Set([
  'WC_MASC_L3', 'WC_FEM_L3', 'WC_UNISSEX', 'VESTIARIO_SUL', 'VESTIARIO_NORTE'
]);

export class WiFiDensePoseService extends EventEmitter {
  private static instance: WiFiDensePoseService;
  private ghosts: Map<string, GhostPresence> = new Map();
  private udpServer: dgram.Socket | null = null;
  private udpPort = parseInt(process.env.RUVIEW_UDP_PORT || '5005', 10);
  private simulationInterval: NodeJS.Timeout | null = null;
  private isLiveHardwareActive = false;
  private lastHardwarePacketTs = 0;

  // Segurança de Ingestão UDP
  private hmacSecret = process.env.RUVIEW_HMAC_SECRET || '';
  private recentNonces: Set<string> = new Set();
  private maxNonceCacheSize = 1000;
  private allowedSubnets = (process.env.RUVIEW_ALLOWED_IPS || '127.0.0.1,192.168.,10.').split(',');

  private constructor() {
    super();
  }

  public static getInstance(): WiFiDensePoseService {
    if (!WiFiDensePoseService.instance) {
      WiFiDensePoseService.instance = new WiFiDensePoseService();
    }
    return WiFiDensePoseService.instance;
  }

  /**
   * Inicia o subsistema de escuta e monitoramento.
   */
  public start() {
    logger.info('[DensePose] Inicializando serviço de percepção passiva RuView...');
    this.startUdpListener();

    // Simulação ativa apenas em desenvolvimento ou se explicitamente configurada
    const isProduction = process.env.NODE_ENV === 'production';
    const enableSimulation = process.env.ENABLE_DENSE_POSE_SIMULATION === 'true' || !isProduction;

    if (enableSimulation) {
      logger.info('[DensePose] Modo de simulação física determinística ativo para calibração de laboratório.');
      this.startSimulation();
    } else {
      logger.info('[DensePose] Ambiente de produção: simulação sintética DESATIVADA.');
    }
  }

  /**
   * Inicializa o socket UDP com validação de pacotes.
   */
  private startUdpListener() {
    try {
      this.udpServer = dgram.createSocket('udp4');

      this.udpServer.on('error', (err) => {
        logger.warn(`[DensePose] Erro no socket UDP: ${err.message}.`);
      });

      this.udpServer.on('message', (msg, rinfo) => {
        this.handleSecureCsiPacket(msg, rinfo.address);
      });

      this.udpServer.bind(this.udpPort, () => {
        logger.info(`[DensePose] Socket UDP escutando com segurança na porta ${this.udpPort}.`);
      });
    } catch (err: any) {
      logger.warn(`[DensePose] Falha ao vincular porta UDP ${this.udpPort}: ${err.message}`);
    }
  }

  /**
   * Valida e decodifica pacote CSI com autenticação, timestamp e verificação anti-replay.
   */
  public handleSecureCsiPacket(packet: Buffer, sourceIp: string) {
    // 1. Limite de tamanho de pacote (anti-DoS buffer overflow)
    if (packet.length > 4096 || packet.length < 16) {
      logger.debug(`[DensePose] Pacote UDP rejeitado: tamanho anômalo (${packet.length} bytes) de ${sourceIp}`);
      return;
    }

    // 2. Validação de IP / Subrede permitida
    const isIpAllowed = this.allowedSubnets.some(prefix => sourceIp.startsWith(prefix.trim()));
    if (!isIpAllowed) {
      logger.warn(`[DensePose] Pacote UDP rejeitado de IP não autorizado: ${sourceIp}`);
      return;
    }

    try {
      let data: any;
      if (packet[0] === 0x7b) { // JSON format '{'
        data = JSON.parse(packet.toString('utf-8'));
      } else {
        logger.debug(`[DensePose] Pacote binário não estruturado descartado.`);
        return;
      }

      // 3. Validação de Autenticidade (HMAC-SHA256) se chave configurada
      if (this.hmacSecret) {
        if (!data.signature || !data.nonce || !data.timestamp) {
          logger.warn(`[DensePose] Pacote rejeitado: metadados de autenticação ausentes de ${sourceIp}`);
          return;
        }

        const expectedPayload = `${data.nodeId}:${data.zoneId}:${data.timestamp}:${data.nonce}`;
        const calculatedHmac = crypto.createHmac('sha256', this.hmacSecret).update(expectedPayload).digest('hex');

        if (calculatedHmac !== data.signature) {
          logger.error(`[DensePose] VIOLAÇÃO DE SEGURANÇA: Assinatura HMAC inválida do nó ${data.nodeId} (${sourceIp})`);
          return;
        }

        // 4. Prevenção de Ataques de Replay (Janela de 10 segundos + Nonce único)
        const nowMs = Date.now();
        if (Math.abs(nowMs - Number(data.timestamp)) > 10000) {
          logger.warn(`[DensePose] Pacote rejeitado: timestamp fora da janela de frescor (possível replay)`);
          return;
        }

        if (this.recentNonces.has(data.nonce)) {
          logger.warn(`[DensePose] Pacote rejeitado: nonce duplicado detectado (replay attack evitado)`);
          return;
        }

        this.recentNonces.add(data.nonce);
        if (this.recentNonces.size > this.maxNonceCacheSize) {
          // Limpa metade dos nonces mais antigos
          const arr = Array.from(this.recentNonces);
          this.recentNonces = new Set(arr.slice(500));
        }
      }

      // 5. Governança LGPD: Bloqueio estrito de monitoramento em áreas íntimas
      const requestedZone = data.zoneId || 'ZONE_PERIMETER';
      if (PROHIBITED_INTIMATE_ZONES.has(requestedZone)) {
        logger.warn(`[DensePose LGPD Guard] Telemetria em zona íntima proibida descartada: ${requestedZone}`);
        return;
      }

      this.isLiveHardwareActive = true;
      this.lastHardwarePacketTs = Date.now();

      const ghost: GhostPresence = {
        id: data.nodeId || `csi_node_${sourceIp.replace(/\./g, '_')}`,
        x: Number(data.x) || 5.0,
        y: Number(data.y) || 5.0,
        z: data.posture === 'FALLEN' ? 0.2 : 1.4,
        posture: data.posture === 'FALLEN' ? 'FALLEN' : (data.posture || 'STANDING'),
        confidence: Math.min(1.0, Math.max(0.0, Number(data.confidence) || 0.85)),
        timestamp: new Date().toISOString(),
        zoneId: requestedZone,
        lastSeen: Date.now()
      };

      this.registerGhost(ghost, false); // Evento real de hardware
    } catch (err: any) {
      logger.debug(`[DensePose] Falha ao processar telemetria UDP: ${err.message}`);
    }
  }

  private registerGhost(ghost: GhostPresence, isSimulated: boolean) {
    this.ghosts.set(ghost.id, ghost);
    this.emit('ghost-detected', { ...ghost, simulated: isSimulated });

    // ALERTA DE EMERGÊNCIA: Emitido APENAS para hardware físico real validado
    if (ghost.posture === 'FALLEN') {
      if (isSimulated) {
        logger.info(`[DensePose Lab] Queda sintética simulada em ${ghost.zoneId} (Alerta de emergência suprimido).`);
      } else {
        logger.error(`[CRITICAL] ALERTA DE QUEDA PASSIVA CONFIRMADA (RuView Hardware) em ${ghost.zoneId}`);
        this.emit('passive-fall-alert', ghost);
      }
    }

    // Auto-limpeza após 25 segundos sem renovação
    setTimeout(() => {
      const current = this.ghosts.get(ghost.id);
      if (current && current.timestamp === ghost.timestamp) {
        this.ghosts.delete(ghost.id);
        this.emit('ghost-lost', ghost.id);
      }
    }, 25000);
  }

  /**
   * Simulação inofensiva de calibração em áreas comuns (pátio / corredores).
   */
  private startSimulation() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);

    this.simulationInterval = setInterval(() => {
      // Se tiver pacotes reais recentes (<15s), suprime a simulação
      if (this.isLiveHardwareActive && (Date.now() - this.lastHardwarePacketTs < 15000)) {
        return;
      }

      if (Math.random() > 0.80) {
        this.generateLabSimulationEvent();
      }
    }, 15000);
  }

  private generateLabSimulationEvent() {
    // Apenas áreas públicas permitidas no laboratório
    const allowedLabZones = ['PATIO_CENTRAL', 'CORREDOR_BLOCO_B', 'BIBLIOTECA_ALMA'];
    const zoneId = allowedLabZones[Math.floor(Math.random() * allowedLabZones.length)];

    const ghost: GhostPresence = {
      id: `csi_sim_${Math.random().toString(36).substring(7)}`,
      x: 2 + Math.random() * 15,
      y: 1 + Math.random() * 8,
      z: 1.4,
      posture: Math.random() > 0.5 ? 'STANDING' : 'MOVING',
      confidence: 0.88,
      timestamp: new Date().toISOString(),
      zoneId: zoneId,
      lastSeen: Date.now()
    };

    this.registerGhost(ghost, true); // Marcado explicitamente como simulado
  }

  public getActiveGhosts(): GhostPresence[] {
    return Array.from(this.ghosts.values());
  }

  public hasPresenceInZone(zoneId: string): boolean {
    return Array.from(this.ghosts.values()).some(g => g.zoneId === zoneId);
  }

  public stop() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.udpServer) {
      try {
        this.udpServer.close();
      } catch (e) {}
    }
  }
}

export const wiFiDensePoseService = WiFiDensePoseService.getInstance();
