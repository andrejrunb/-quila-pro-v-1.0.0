// @ts-nocheck
import { logger } from '../logger';
import { SyncPacket } from '../../services/AiTypes';
import { networkDiscoveryService } from './NetworkDiscoveryService';
import { sovereignFirewall } from './SovereignFirewallService';
import { EventEmitter } from 'events';

/**
 * Estrutura de registro CRDT LWW (Last-Write-Wins) com Vetor de Versão
 */
export interface CRDTRecord<T = any> {
  key: string;                       // Identificador unívoco do recurso
  value: T;                          // Dados armazenados
  timestamp: number;                 // Carimbo de tempo físico (ms)
  sequence: number;                  // Sequência monotônica local do nó gerador
  nodeId: string;                    // Nó que originou esta versão
  schoolId: string;                  // Isolamento institucional rígido (LGPD)
  isDeleted: boolean;                // Tombstone para exclusões lógicas
  versionVector: Record<string, number>; // Snapshot do vetor no momento da mutação
}

export type VersionVector = Record<string, number>;

export interface CRDTSyncInitPayload {
  schoolId: string;
  fromNodeId: string;
  versionVector: VersionVector;
  timestamp: number;
}

export interface CRDTSyncDeltaPayload {
  schoolId: string;
  fromNodeId: string;
  deltas: CRDTRecord[];
  versionVector: VersionVector;
  timestamp: number;
}

export interface MeshServiceOptions {
  port?: number;
  schoolId?: string;
  simulationMode?: boolean;
}

/**
 * SOVEREIGN MESH SERVICE (v700 — Onda 7: Offline-First & CRDT Mesh)
 * -----------------------------------------------------------------
 * Orquestra o enxame P2P soberano com:
 * 1. Descoberta mDNS local sem dependência de internet
 * 2. Criptografia ponta a ponta com Noise Protocol (@chainsafe/libp2p-noise)
 * 3. Sincronização offline-first determinística com CRDT LWW + Version Vector
 * 4. Isolamento estrito de dados por escola / tenant
 */
export class SovereignMeshService extends EventEmitter {
  private static instance: SovereignMeshService;
  private node: any = null;
  private isStarting: boolean = false;
  private PROTOCOL = '/aquila/sync/1.0.0';
  private SQS_PROTOCOL = '/aquila/sqs/1.0.0';
  private CRDT_PROTOCOL = '/aquila/crdt/1.0.0';
  private PORT = 4001;
  private schoolId: string = 'school-default';
  private simulationMode: boolean = false;

  // Estado CRDT Local
  private crdtStore: Map<string, CRDTRecord> = new Map();
  private versionVector: VersionVector = {};
  private localSequence: number = 0;
  private simulatedPeers: Map<string, SovereignMeshService> = new Map();

  // Segurança e Metadados
  private sessionKeys: Map<string, string> = new Map(); // PeerID -> ARK
  private peerReputations: Map<string, number> = new Map(); // PeerID -> Score (0-1)
  private handshakingPeers: Set<string> = new Set();
  private peerMetadata: Map<string, { roomId: string, roomName: string, cpu?: string, ram?: number, gpu?: string, tops?: number, ssd?: number }> = new Map();

  public constructor(options?: MeshServiceOptions) {
    super();
    if (options?.port) this.PORT = options.port;
    if (options?.schoolId) this.schoolId = options.schoolId;
    if (options?.simulationMode) this.simulationMode = options.simulationMode;
  }

  public static getInstance(options?: MeshServiceOptions): SovereignMeshService {
    if (!SovereignMeshService.instance) {
      SovereignMeshService.instance = new SovereignMeshService(options);
    }
    return SovereignMeshService.instance;
  }

  public setSchoolId(schoolId: string) {
    this.schoolId = schoolId;
  }

  public getSchoolId(): string {
    return this.schoolId;
  }

  public setSimulationMode(enabled: boolean) {
    this.simulationMode = enabled;
  }

  public isSimulation(): boolean {
    return this.simulationMode;
  }

  public getLocalHardwareSpecs() {
    const os = require('os');
    const cpus = os.cpus();
    const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'Desconhecido';
    const totalRamGb = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    const gpu = totalRamGb > 16 ? 'NVIDIA RTX 4060 (Simulada)' : 'Intel UHD Graphics';
    const tops = 26;
    return {
      cpu: cpuModel,
      ram: totalRamGb,
      gpu: gpu,
      tops: tops,
      ssd: 256
    };
  }

  /**
   * Inicia o nó Mesh P2P.
   */
  public async init() {
    if (this.node || this.isStarting) return;
    this.isStarting = true;

    // Carrega metadados de peers do SQLite
    try {
      const { Database } = await import('../../database/Database');
      const db = Database.getInstance();
      const savedPeers = await db.all('SELECT id, roomId, roomName, cpu, ram, gpu, tops, ssd FROM nexus_peers');
      for (const peer of (savedPeers || [])) {
        this.peerMetadata.set(peer.id, {
          roomId: peer.roomId || '',
          roomName: peer.roomName || '',
          cpu: peer.cpu || '',
          ram: peer.ram || 0,
          gpu: peer.gpu || '',
          tops: peer.tops || 0,
          ssd: peer.ssd || 0
        });
      }
      logger.info(`[Mesh] Metadados de ${savedPeers ? savedPeers.length : 0} peers carregados do banco.`);
    } catch (e) {
      logger.debug('[Mesh] SQLite nexus_peers não disponível na inicialização inicial.');
    }

    if (this.simulationMode) {
      this.isStarting = false;
      logger.info(`[Mesh] Nó iniciado em MODO SIMULAÇÃO (Escola: ${this.schoolId})`);
      return;
    }

    try {
      logger.info('[Mesh] Inicializando motor P2P Libp2p com Noise e mDNS local...');

      const { createLibp2p } = await import('libp2p');
      const { tcp } = await import('@libp2p/tcp');
      const { noise } = await import('@chainsafe/libp2p-noise');
      const { mplex } = await import('@libp2p/mplex');
      const { mdns } = await import('@libp2p/mdns');
      const { pipe } = await import('it-pipe');
      const lp = await import('it-length-prefixed');

      // Configuração soberana de libp2p
      this.node = await createLibp2p({
        addresses: {
          listen: [`/ip4/0.0.0.0/tcp/${this.PORT}`]
        },
        transports: [tcp()],
        connectionEncryption: [noise()], // Criptografia ponta a ponta com Noise Protocol
        streamMuxers: [mplex()],
        peerDiscovery: [
          mdns({
            interval: 10000,
            serviceTag: `aquila-mesh-${this.schoolId}.local` // mDNS isolado por escola sem dependência de internet
          })
        ]
      });

      // 1. Handler do Quantum Shield (SQS - Phase 700)
      this.node.handle(this.SQS_PROTOCOL, async ({ stream, connection }: any) => {
        try {
          const peerId = connection.remotePeer.toString();
          await pipe(
            stream,
            lp.decode(),
            async (source: any) => {
              for await (const msg of source) {
                const payload = JSON.parse(new TextDecoder().decode(msg.subarray()));
                
                // Validação de replay (Nonce de 30s)
                if (Math.abs(Date.now() - payload.timestamp) > 30000) {
                  logger.error(`[Mesh] Handshake SQS rejeitado para ${peerId}: Nonce expirado.`);
                  return;
                }

                // Verificação de isolamento da escola
                if (payload.schoolId && payload.schoolId !== this.schoolId) {
                  logger.warn(`[Mesh] Handshake rejeitado: Escola remota (${payload.schoolId}) != Local (${this.schoolId})`);
                  return;
                }

                const challenge = payload.challenge;
                const remoteRoomName = payload.roomName || '';
                this.peerMetadata.set(peerId, {
                  roomId: payload.roomId || '',
                  roomName: remoteRoomName,
                  cpu: payload.cpu || '',
                  ram: payload.ram || 0,
                  gpu: payload.gpu || '',
                  tops: payload.tops || 0,
                  ssd: payload.ssd || 0
                });

                // Deriva a chave ARK híbrida pós-Noise
                const { sovereignQuantumShield } = await import('./SovereignQuantumShield');
                const ark = await sovereignQuantumShield.deriveArk(Buffer.from(challenge), peerId);
                this.sessionKeys.set(peerId, ark);
                this.peerReputations.set(peerId, 0.8);
                logger.info(`[Mesh] Handshake SQS concluído para ${peerId}. Encriptação ponta a ponta ativa.`);

                // Dispara sincronização delta de dados CRDT após conexão segura
                this.reconcileWithPeer(peerId).catch(err => {
                  logger.error(`[Mesh] Falha ao reconciliar CRDT com ${peerId}:`, err);
                });
              }
            }
          );
        } catch (err) {
          logger.error('[Mesh] Falha no SQS handshake handler:', err);
        }
      });

      // 2. Handler do protocolo de sincronização Áquila (Pacotes gerais)
      this.node.handle(this.PROTOCOL, async ({ stream, connection }: any) => {
        try {
          const peerId = connection.remotePeer.toString();
          await pipe(
            stream,
            lp.decode(),
            async (source: any) => {
              for await (const msg of source) {
                let packetData = new TextDecoder().decode(msg.subarray());
                if (msg[0] === 0x1f && msg[1] === 0x8b) {
                  const { gunzipSync } = await import('zlib');
                  packetData = gunzipSync(msg).toString();
                }

                let packet: SyncPacket;
                try {
                  packet = JSON.parse(packetData) as SyncPacket;
                } catch (e) {
                  logger.error('[Mesh] Falha ao parsear pacote:', e);
                  continue;
                }

                if (!this.isQuantumSafe(peerId)) {
                  logger.warn(`[Mesh] Pacote bloqueado: Nó ${peerId} não autenticado via SQS.`);
                  continue;
                }

                await this.handleIncomingPacket(packet, peerId);
              }
            }
          );
        } catch (err) {
          logger.error('[Mesh] Erro no stream receiver:', err);
        }
      });

      // 3. Handler do protocolo de Sincronização CRDT Offline-First
      this.node.handle(this.CRDT_PROTOCOL, async ({ stream, connection }: any) => {
        try {
          const peerId = connection.remotePeer.toString();
          await pipe(
            stream,
            lp.decode(),
            async (source: any) => {
              for await (const msg of source) {
                const message = JSON.parse(new TextDecoder().decode(msg.subarray()));
                await this.handleCRDTMessage(message, peerId);
              }
            }
          );
        } catch (err) {
          logger.error('[Mesh] Erro no CRDT stream receiver:', err);
        }
      });

      await this.node.start();
      logger.info(`[Mesh] Nó P2P online. PeerID: ${this.node.peerId.toString()}`);

      // Listener de descoberta automática via mDNS
      this.node.addEventListener('peer:discovery', async (evt: any) => {
        const peerId = evt.detail.id;
        const peerIdStr = peerId.toString();
        if (this.handshakingPeers.has(peerIdStr)) return;
        this.handshakingPeers.add(peerIdStr);

        logger.info(`[Mesh] mDNS: Nó detectado na rede local: ${peerIdStr}`);
        try {
          const multiaddrs = evt.detail.multiaddrs;
          if (multiaddrs && multiaddrs.length > 0) {
            await this.node.dial(multiaddrs[0]);
            await this.performQuantumHandshake(peerId);
            this.emit('peer:connected', { peerId: peerIdStr, timestamp: Date.now() });
          }
        } catch (err: any) {
          logger.warn(`[Mesh] Falha ao conectar ao par mDNS ${peerIdStr}: ${err.message}`);
        } finally {
          setTimeout(() => this.handshakingPeers.delete(peerIdStr), 30000);
        }
      });

      this.startDiscoveryLoop();

    } catch (err) {
      logger.error('[Mesh] Falha fatal ao iniciar enxame:', err);
      this.isStarting = false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NÚCLEO CRDT (LAST-WRITE-WINS & VETOR DE VERSÃO)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Armazena ou atualiza um registro no CRDT local com Last-Write-Wins.
   */
  public async putCRDT<T = any>(key: string, value: T): Promise<CRDTRecord<T>> {
    const nodeId = this.getNodeId();
    this.localSequence++;
    this.versionVector[nodeId] = this.localSequence;

    const record: CRDTRecord<T> = {
      key,
      value,
      timestamp: Date.now(),
      sequence: this.localSequence,
      nodeId,
      schoolId: this.schoolId,
      isDeleted: false,
      versionVector: { ...this.versionVector }
    };

    this.crdtStore.set(key, record);
    this.emit('crdt:put', record);

    // Propaga mutação para os pares conectados
    await this.broadcastCRDTMutation(record);
    return record;
  }

  /**
   * Remove logicamente (Tombstone) um registro via CRDT LWW.
   */
  public async deleteCRDT(key: string): Promise<boolean> {
    const existing = this.crdtStore.get(key);
    if (!existing && !this.crdtStore.has(key)) return false;

    const nodeId = this.getNodeId();
    this.localSequence++;
    this.versionVector[nodeId] = this.localSequence;

    const tombstone: CRDTRecord = {
      key,
      value: null,
      timestamp: Date.now(),
      sequence: this.localSequence,
      nodeId,
      schoolId: this.schoolId,
      isDeleted: true,
      versionVector: { ...this.versionVector }
    };

    this.crdtStore.set(key, tombstone);
    this.emit('crdt:delete', tombstone);
    await this.broadcastCRDTMutation(tombstone);
    return true;
  }

  /**
   * Obtém um registro CRDT válido (ignora tombstones a menos que solicitado).
   */
  public getCRDT<T = any>(key: string, includeDeleted = false): CRDTRecord<T> | undefined {
    const record = this.crdtStore.get(key);
    if (!record) return undefined;
    if (record.isDeleted && !includeDeleted) return undefined;
    return record as CRDTRecord<T>;
  }

  /**
   * Retorna todos os registros ativos da escola local.
   */
  public getAllCRDT(includeDeleted = false): CRDTRecord[] {
    const all = Array.from(this.crdtStore.values()).filter(r => r.schoolId === this.schoolId);
    if (!includeDeleted) {
      return all.filter(r => !r.isDeleted);
    }
    return all;
  }

  /**
   * Resolução Determinística de Conflitos Last-Write-Wins (LWW).
   * 1. Maior timestamp físico vence.
   * 2. Desempate por maior sequence monotônico.
   * 3. Desempate determinístico lexicográfico por nodeId.
   */
  public resolveConflict(incoming: CRDTRecord, existing?: CRDTRecord): { winner: 'incoming' | 'existing'; record: CRDTRecord } {
    if (!existing) {
      return { winner: 'incoming', record: incoming };
    }

    if (incoming.timestamp > existing.timestamp) {
      return { winner: 'incoming', record: incoming };
    }
    if (incoming.timestamp < existing.timestamp) {
      return { winner: 'existing', record: existing };
    }

    if (incoming.sequence > existing.sequence) {
      return { winner: 'incoming', record: incoming };
    }
    if (incoming.sequence < existing.sequence) {
      return { winner: 'existing', record: existing };
    }

    if (incoming.nodeId.localeCompare(existing.nodeId) > 0) {
      return { winner: 'incoming', record: incoming };
    }

    return { winner: 'existing', record: existing };
  }

  /**
   * Aplica um registro CRDT remoto respeitando LWW e isolamento institucional.
   */
  public applyRemoteCRDTRecord(incoming: CRDTRecord): boolean {
    if (incoming.schoolId !== this.schoolId) {
      logger.warn(`[Mesh CRDT] Registro rejeitado: violação de isolamento (${incoming.schoolId} != ${this.schoolId})`);
      return false;
    }

    const existing = this.crdtStore.get(incoming.key);
    const { winner, record } = this.resolveConflict(incoming, existing);

    // Atualiza o relógio do nó remoto no nosso vetor de versão
    const currentRemoteSeq = this.versionVector[incoming.nodeId] || 0;
    if (incoming.sequence > currentRemoteSeq) {
      this.versionVector[incoming.nodeId] = incoming.sequence;
    }

    if (winner === 'incoming') {
      this.crdtStore.set(incoming.key, incoming);
      this.emit('crdt:conflict-resolved', { key: incoming.key, winner: 'incoming', record: incoming });
      return true;
    }

    return false;
  }

  /**
   * Reconcilia estado delta com um peer específico após reconexão.
   */
  public async reconcileWithPeer(peerId: string) {
    const initPayload: CRDTSyncInitPayload = {
      schoolId: this.schoolId,
      fromNodeId: this.getNodeId(),
      versionVector: { ...this.versionVector },
      timestamp: Date.now()
    };

    if (this.simulationMode) {
      const targetPeer = this.simulatedPeers.get(peerId);
      if (targetPeer) {
        await targetPeer.handleCRDTMessage({ type: 'CRDT_SYNC_INIT', payload: initPayload }, this.getNodeId());
      }
      return;
    }

    if (!this.node) return;
    try {
      const stream = await this.node.dialProtocol(peerId, this.CRDT_PROTOCOL);
      const { pipe } = await import('it-pipe');
      const lp = await import('it-length-prefixed');
      const data = new TextEncoder().encode(JSON.stringify({ type: 'CRDT_SYNC_INIT', payload: initPayload }));
      await pipe([data], lp.encode(), stream.sink);
    } catch (err: any) {
      logger.debug(`[Mesh CRDT] Falha ao iniciar reconciliação com ${peerId}: ${err.message}`);
    }
  }

  /**
   * Computa registros delta a enviar com base no vetor de versão do par.
   */
  public computeDeltasForPeer(remoteVector: VersionVector): CRDTRecord[] {
    const deltas: CRDTRecord[] = [];
    for (const record of this.crdtStore.values()) {
      if (record.schoolId !== this.schoolId) continue;
      const remoteSeq = remoteVector[record.nodeId] || 0;
      if (record.sequence > remoteSeq) {
        deltas.push(record);
      }
    }
    return deltas;
  }

  private async broadcastCRDTMutation(record: CRDTRecord) {
    if (this.simulationMode) {
      for (const [peerId, peerService] of this.simulatedPeers.entries()) {
        await peerService.handleCRDTMessage(
          { type: 'CRDT_MUTATION_BROADCAST', payload: { record } },
          this.getNodeId()
        );
      }
      return;
    }

    if (!this.node) return;
    const peers = this.node.getPeers();
    for (const peer of peers) {
      try {
        const stream = await this.node.dialProtocol(peer, this.CRDT_PROTOCOL);
        const { pipe } = await import('it-pipe');
        const lp = await import('it-length-prefixed');
        const data = new TextEncoder().encode(JSON.stringify({
          type: 'CRDT_MUTATION_BROADCAST',
          payload: { record }
        }));
        await pipe([data], lp.encode(), stream.sink);
      } catch (err) {
        // Falha tolerada de nós offline temporariamente
      }
    }
  }

  private async handleCRDTMessage(message: any, fromPeerId: string) {
    switch (message.type) {
      case 'CRDT_SYNC_INIT': {
        const init = message.payload as CRDTSyncInitPayload;
        if (init.schoolId !== this.schoolId) return;

        // Calcula os deltas que o emissor necessita
        const deltas = this.computeDeltasForPeer(init.versionVector);
        const deltaPayload: CRDTSyncDeltaPayload = {
          schoolId: this.schoolId,
          fromNodeId: this.getNodeId(),
          deltas,
          versionVector: { ...this.versionVector },
          timestamp: Date.now()
        };

        if (this.simulationMode) {
          const senderPeer = this.simulatedPeers.get(fromPeerId);
          if (senderPeer) {
            await senderPeer.handleCRDTMessage({ type: 'CRDT_SYNC_DELTA', payload: deltaPayload }, this.getNodeId());
          }
        } else if (this.node) {
          const stream = await this.node.dialProtocol(fromPeerId, this.CRDT_PROTOCOL);
          const { pipe } = await import('it-pipe');
          const lp = await import('it-length-prefixed');
          const data = new TextEncoder().encode(JSON.stringify({ type: 'CRDT_SYNC_DELTA', payload: deltaPayload }));
          await pipe([data], lp.encode(), stream.sink);
        }
        break;
      }

      case 'CRDT_SYNC_DELTA': {
        const deltaMsg = message.payload as CRDTSyncDeltaPayload;
        if (deltaMsg.schoolId !== this.schoolId) return;

        let appliedCount = 0;
        for (const record of deltaMsg.deltas) {
          if (this.applyRemoteCRDTRecord(record)) {
            appliedCount++;
          }
        }

        // Se tínhamos registros que o emissor não possuía, enviamos a resposta recíproca
        const myDeltas = this.computeDeltasForPeer(deltaMsg.versionVector);
        if (myDeltas.length > 0) {
          const reciprocalPayload: CRDTSyncDeltaPayload = {
            schoolId: this.schoolId,
            fromNodeId: this.getNodeId(),
            deltas: myDeltas,
            versionVector: { ...this.versionVector },
            timestamp: Date.now()
          };
          if (this.simulationMode) {
            const senderPeer = this.simulatedPeers.get(fromPeerId);
            if (senderPeer) {
              await senderPeer.handleCRDTMessage({ type: 'CRDT_SYNC_DELTA', payload: reciprocalPayload }, this.getNodeId());
            }
          }
        }

        this.emit('crdt:reconciled', { peerId: fromPeerId, appliedCount });
        break;
      }

      case 'CRDT_MUTATION_BROADCAST': {
        const record = message.payload.record as CRDTRecord;
        this.applyRemoteCRDTRecord(record);
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUPORTE A SIMULAÇÃO E TOPOLOGIA EM TESTES
  // ─────────────────────────────────────────────────────────────────────────────

  public connectSimulatedPeer(peer: SovereignMeshService) {
    const peerId = peer.getNodeId();
    this.simulatedPeers.set(peerId, peer);
    this.sessionKeys.set(peerId, `ark-simulated-${peerId}`);
    this.peerReputations.set(peerId, 0.95);
    this.emit('peer:connected', { peerId, timestamp: Date.now() });

    // Dispara reconciliação recíproca
    this.reconcileWithPeer(peerId);
  }

  public disconnectSimulatedPeer(peerId: string) {
    this.simulatedPeers.delete(peerId);
    this.sessionKeys.delete(peerId);
    this.emit('peer:disconnected', { peerId, timestamp: Date.now() });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MÉTODOS ORIGINAIS PRESERVADOS COM RETROCOMPATIBILIDADE
  // ─────────────────────────────────────────────────────────────────────────────

  private async startDiscoveryLoop() {
    setInterval(async () => {
      if (!this.node || this.simulationMode) return;
      const localDevices = await networkDiscoveryService.scan();
      for (const device of localDevices) {
        if (device.ipAddress) {
          this.attemptDial(device.ipAddress);
        }
      }
    }, 60000);
  }

  private async attemptDial(ip: string) {
    if (!this.node) return;
    try {
      const multiaddr = `/ip4/${ip}/tcp/${this.PORT}`;
      const connection = await this.node.dial(multiaddr);
      await this.performQuantumHandshake(connection.remotePeer);
    } catch (err) {}
  }

  private async performQuantumHandshake(peer: any) {
    try {
      const stream = await this.node.dialProtocol(peer, this.SQS_PROTOCOL);
      const { pipe } = await import('it-pipe');
      const lp = await import('it-length-prefixed');
      const { sovereignQuantumShield } = await import('./SovereignQuantumShield');

      const challenge = sovereignQuantumShield.generateLatticeChallenge();
      const payload = JSON.stringify({
        challenge,
        timestamp: Date.now(),
        nodeId: this.getNodeId(),
        schoolId: this.schoolId,
        ...this.getLocalHardwareSpecs()
      });
      const data = new TextEncoder().encode(payload);

      await pipe([data], lp.encode(), stream.sink);
      const ark = await sovereignQuantumShield.deriveArk(Buffer.from(challenge), peer.toString());
      this.sessionKeys.set(peer.toString(), ark);
    } catch (err) {
      logger.error(`[Mesh] Falha no handshake SQS com ${peer.toString()}:`, err);
    }
  }

  public isQuantumSafe(peerId: string): boolean {
    return this.sessionKeys.has(peerId);
  }

  public getSessionKey(peerId: string): string | undefined {
    return this.sessionKeys.get(peerId);
  }

  public async sendToNode(peerId: string, packet: SyncPacket) {
    if (this.simulationMode) {
      const peer = this.simulatedPeers.get(peerId);
      if (peer) {
        await peer.handleIncomingPacket(packet, this.getNodeId());
      }
      return;
    }

    if (!this.node) return;
    packet.tenantId = this.schoolId;
    packet.targetNode = peerId;
    packet.signature = sovereignFirewall.signPacket(packet);

    try {
      const { gzipSync } = await import('zlib');
      let data: Buffer | Uint8Array = new TextEncoder().encode(JSON.stringify(packet));
      if (data.length > 2048) {
        data = gzipSync(data);
      }
      const stream = await this.node.dialProtocol(peerId, this.PROTOCOL, {
        signal: AbortSignal.timeout(5000)
      });
      const { pipe } = await import('it-pipe');
      const lp = await import('it-length-prefixed');
      await pipe([data], lp.encode(), stream.sink);
    } catch (err: any) {
      logger.error(`[Mesh] Falha ao enviar para nó ${peerId}: ${err.message}`);
    }
  }

  public async broadcast(packet: SyncPacket) {
    if (this.simulationMode) {
      for (const [peerId, peer] of this.simulatedPeers.entries()) {
        await peer.handleIncomingPacket(packet, this.getNodeId());
      }
      return;
    }

    if (!this.node) return;
    packet.tenantId = this.schoolId;
    packet.signature = sovereignFirewall.signPacket(packet);

    try {
      const { gzipSync } = await import('zlib');
      let data: Buffer | Uint8Array = new TextEncoder().encode(JSON.stringify(packet));
      if (data.length > 2048) {
        data = gzipSync(data);
      }
      const peers = this.node.getPeers();
      for (const peer of peers) {
        try {
          const stream = await this.node.dialProtocol(peer, this.PROTOCOL, {
            signal: AbortSignal.timeout(5000)
          });
          const { pipe } = await import('it-pipe');
          const lp = await import('it-length-prefixed');
          await pipe([data], lp.encode(), stream.sink);
        } catch (err) {}
      }
    } catch (err) {
      logger.error('[Mesh] Erro no broadcast:', err);
    }
  }

  private async handleIncomingPacket(packet: SyncPacket, peerId: string) {
    if (!this.isQuantumSafe(peerId) && !this.simulationMode) {
      logger.warn(`[Mesh] Pacote bloqueado: Nó ${peerId} não autenticado via SQS.`);
      return;
    }

    if (packet.tenantId && packet.tenantId !== this.schoolId) {
      logger.warn(`[Mesh] Pacote rejeitado: Origem Tenant ${packet.tenantId} != Local ${this.schoolId}`);
      return;
    }

    this.emit('packet', packet);
    this.emit(`mesh:payload:${packet.payloadType}`, packet);
  }

  public getNodeId(): string {
    if (this.simulationMode) {
      return (this as any)._simulatedNodeId || `sim-node-${this.PORT}`;
    }
    return this.node ? this.node.peerId.toString() : 'offline';
  }

  public setSimulatedNodeId(id: string) {
    (this as any)._simulatedNodeId = id;
  }

  public getPeers() {
    if (this.simulationMode) {
      return Array.from(this.simulatedPeers.keys());
    }
    return this.node ? this.node.getPeers() : [];
  }

  public getConnectedPeers() {
    return this.getPeers().map((p: any) => {
      const peerId = typeof p === 'string' ? p : p.toString();
      const meta = this.peerMetadata.get(peerId) || { roomId: '', roomName: '' };
      return {
        id: peerId,
        roomId: meta.roomId,
        roomName: meta.roomName,
        cpu: meta.cpu || 'Intel Core i5',
        ram: meta.ram || 8,
        gpu: meta.gpu || 'Intel Graphics',
        tops: meta.tops || 26,
        ssd: meta.ssd || 240
      };
    });
  }

  public getStatus() {
    return {
      active: this.simulationMode ? true : !!this.node,
      peerId: this.getNodeId(),
      schoolId: this.schoolId,
      peersConnected: this.getPeers().length,
      crdtRecordsCount: this.crdtStore.size,
      versionVector: { ...this.versionVector },
      addresses: this.node ? this.node.getMultiaddrs().map((a: any) => a.toString()) : [],
      reputations: Object.fromEntries(this.peerReputations)
    };
  }

  public getMeshInfo() {
    return {
      nodeId: this.getNodeId(),
      schoolId: this.schoolId,
      addresses: this.node ? this.node.getMultiaddrs().map((a: any) => a.toString()) : []
    };
  }

  public setPeerRoom(peerId: string, roomId: string, roomName: string, specs?: any) {
    const s = specs || {};
    this.peerMetadata.set(peerId, { 
      roomId, 
      roomName,
      cpu: s.cpu || '',
      ram: s.ram || 0,
      gpu: s.gpu || '',
      tops: s.tops || 0,
      ssd: s.ssd || 0
    });
    
    // Atualizar tabela nexus_peers
    try {
      import('../../database/Database').then(({ Database }) => {
        const db = Database.getInstance();
        db.get('SELECT * FROM nexus_peers WHERE id = ?', [peerId]).then(existing => {
          if (existing) {
            db.run(
              'UPDATE nexus_peers SET name = ?, roomId = ?, roomName = ?, cpu = ?, ram = ?, gpu = ?, tops = ?, ssd = ?, lastHandshake = ?, status = ? WHERE id = ?',
              [roomName || existing.name, roomId, roomName, s.cpu || existing.cpu, s.ram || existing.ram, s.gpu || existing.gpu, s.tops || existing.tops, s.ssd || existing.ssd, Date.now(), 'online', peerId]
            );
          } else {
            db.run(
              'INSERT INTO nexus_peers (id, name, multiaddr, status, lastHandshake, roomId, roomName, cpu, ram, gpu, tops, ssd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [peerId, roomName || `Hub ${peerId.substring(0, 8)}`, `p2p://${peerId}`, 'online', Date.now(), roomId, roomName, s.cpu || '', s.ram || 0, s.gpu || '', s.tops || 0, s.ssd || 0]
            );
          }
        }).catch(e => logger.error(`[Mesh] Falha ao atualizar database em setPeerRoom: ${e}`));
      }).catch(dbErr => {
        logger.error(`[Mesh] Falha ao obter Database em setPeerRoom: ${dbErr}`);
      });
    } catch (err) {
      logger.error(`[Mesh] Erro inesperado em setPeerRoom: ${err}`);
    }
  }

  public getPeerReputation(peerId: string): number {
    return this.peerReputations.get(peerId) || 0;
  }

  public clearCRDT() {
    this.crdtStore.clear();
    this.versionVector = {};
    this.localSequence = 0;
  }
}

export const sovereignMeshService = SovereignMeshService.getInstance();
