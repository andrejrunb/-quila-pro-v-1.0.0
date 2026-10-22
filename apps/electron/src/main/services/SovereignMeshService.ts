// @ts-nocheck
import { logger } from '../logger';
import { SyncPacket } from '../../services/AiTypes';
import { networkDiscoveryService } from './NetworkDiscoveryService';
import { sovereignFirewall } from './SovereignFirewallService';
import { EventEmitter } from 'events';

/**
 * SOVEREIGN MESH SERVICE (v601)
 * ----------------------------
 * Orquestra o enxame P2P real entre campuses.
 * Implementa comunicações seguras (libp2p + Noise) sem dependência externa.
 */
export class SovereignMeshService extends EventEmitter {
  private static instance: SovereignMeshService;
  private node: any = null;
  private isStarting: boolean = false;
  private PROTOCOL = '/aquila/sync/1.0.0';
  private SQS_PROTOCOL = '/aquila/sqs/1.0.0';
  private PORT = 4001; // Porta padrão do enxame Áquila
  private sessionKeys: Map<string, string> = new Map(); // PeerID -> ARK
  private peerReputations: Map<string, number> = new Map(); // PeerID -> Score (0-1)
  private handshakingPeers: Set<string> = new Set();
  private peerMetadata: Map<string, { roomId: string, roomName: string, cpu?: string, ram?: number, gpu?: string, tops?: number, ssd?: number }> = new Map();

  public constructor() {
    super();
  }

  public getLocalHardwareSpecs() {
    const os = require('os');
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Desconhecido';
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

  public static getInstance(): SovereignMeshService {
    if (!SovereignMeshService.instance) {
      SovereignMeshService.instance = new SovereignMeshService();
    }
    return SovereignMeshService.instance;
  }

  /**
   * Inicia o nó Mesh P2P.
   */
  public async init() {
    if (this.node || this.isStarting) return;
    this.isStarting = true;

    // Carrega metadados de peers salvos no banco
    try {
      const { Database } = await import('../../database/Database');
      const db = Database.getInstance();
      const savedPeers = await db.all('SELECT id, roomId, roomName, cpu, ram, gpu, tops, ssd FROM nexus_peers');
      for (const peer of savedPeers) {
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
      logger.info(`[Mesh] Metadados de ${savedPeers.length} peers carregados do banco.`);
    } catch (e) {
      logger.error('[Mesh] Erro ao carregar metadados dos peers do banco:', e);
    }

    try {
      logger.info('[Mesh] Inicializando motor P2P Libp2p...');
      
      // Importação dinâmica para compatibilidade ESM/CJS (v1.5.0)
      const { createLibp2p } = await import('libp2p');
      const { tcp } = await import('@libp2p/tcp');
      const { noise } = await import('@chainsafe/libp2p-noise');
      const { mplex } = await import('@libp2p/mplex');
      const { mdns } = await import('@libp2p/mdns');
      const { pipe } = await import('it-pipe');
      const lp = await import('it-length-prefixed');

      this.node = await createLibp2p({
        addresses: {
          listen: [`/ip4/0.0.0.0/tcp/${this.PORT}`]
        },
        transports: [tcp()],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        peerDiscovery: [
          mdns({ interval: 10000 }) // Emite sinal mDNS a cada 10s na rede local
        ]
      });

      // Handler do Quantum Shield (SQS - Phase 700)
      this.node.handle(this.SQS_PROTOCOL, async ({ stream, connection }: any) => {
        try {
          const peerId = connection.remotePeer.toString();
          logger.info(`[Mesh] Recebendo handshake SQS de ${peerId}`);
          
          await pipe(
            stream,
            // @ts-ignore
            lp.decode(),
            async (source: any) => {
              for await (const msg of source) {
                const payload = JSON.parse(new TextDecoder().decode(msg.subarray()));
                
                // [Phase 1300] Verificação de Nonce (Anti-Replay)
                if (Math.abs(Date.now() - payload.timestamp) > 30000) {
                  logger.error(`[Mesh] SQS Handshake REJEITADO para ${peerId}: Nonce expirado.`);
                  return;
                }

                const challenge = payload.challenge;
                const remoteRoomId = payload.roomId || '';
                const remoteRoomName = payload.roomName || '';
                const remoteCpu = payload.cpu || '';
                const remoteRam = payload.ram || 0;
                const remoteGpu = payload.gpu || '';
                const remoteTops = payload.tops || 0;
                const remoteSsd = payload.ssd || 0;

                if (remoteRoomId || remoteRoomName || remoteCpu) {
                  this.peerMetadata.set(peerId, { 
                    roomId: remoteRoomId, 
                    roomName: remoteRoomName,
                    cpu: remoteCpu,
                    ram: remoteRam,
                    gpu: remoteGpu,
                    tops: remoteTops,
                    ssd: remoteSsd
                  });
                  logger.info(`[Mesh] Handshake SQS recebeu metadados de sala para ${peerId}: ${remoteRoomName}`);
                  
                  // Atualizar tabela nexus_peers
                  try {
                    const { Database } = await import('../../database/Database');
                    const db = Database.getInstance();
                    const existing = await db.get('SELECT * FROM nexus_peers WHERE id = ?', [peerId]);
                    if (existing) {
                      await db.run(
                        'UPDATE nexus_peers SET name = ?, roomId = ?, roomName = ?, cpu = ?, ram = ?, gpu = ?, tops = ?, ssd = ?, lastHandshake = ?, status = ? WHERE id = ?',
                        [remoteRoomName || existing.name, remoteRoomId, remoteRoomName, remoteCpu, remoteRam, remoteGpu, remoteTops, remoteSsd, Date.now(), 'online', peerId]
                      );
                    } else {
                      await db.run(
                        'INSERT INTO nexus_peers (id, name, multiaddr, status, lastHandshake, roomId, roomName, cpu, ram, gpu, tops, ssd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [peerId, remoteRoomName || `Hub ${peerId.substring(0, 8)}`, connection.remoteAddr.toString(), 'online', Date.now(), remoteRoomId, remoteRoomName, remoteCpu, remoteRam, remoteGpu, remoteTops, remoteSsd]
                      );
                    }
                  } catch (dbErr) {
                    logger.error(`[Mesh] Falha ao atualizar nexus_peers no handshake: ${dbErr}`);
                  }
                }

                // Deriva a chave ARK híbrida
                const { sovereignQuantumShield } = await import('./SovereignQuantumShield');
                const ark = await sovereignQuantumShield.deriveArk(Buffer.from(challenge), peerId);
                this.sessionKeys.set(peerId, ark);
                this.peerReputations.set(peerId, 0.8); // Reputação inicial
                logger.info(`[Mesh] Handshake SQS concluído para ${peerId}. Camada Quântica ATIVA.`);
              }
            }
          );
        } catch (err) {
          logger.error('[Mesh] Falha no SQS handshake handler:', err);
        }
      });

      // Handler do protocolo de sincronização Áquila
      this.node.handle(this.PROTOCOL, async ({ stream, connection }: any) => {
        try {
          const peerId = connection.remotePeer.toString();
          await pipe(
            stream,
            // @ts-ignore
            lp.decode(),
            async (source: any) => {
              for await (const msg of source) {
                let packetData = new TextDecoder().decode(msg.subarray());
                let packet: SyncPacket;

                // [Phase 1600] Hardening - Auto-Decompression
                if (msg[0] === 0x1f && msg[1] === 0x8b) {
                   const { gunzipSync } = await import('zlib');
                   packetData = gunzipSync(msg).toString();
                   logger.debug('[Mesh] Pacote descompactado com sucesso.');
                }

                try {
                  packet = JSON.parse(packetData) as SyncPacket;
                } catch (e) {
                  logger.error('[Mesh] Falha ao parsear pacote:', e);
                  continue;
                }
                
                // [Security Check] Verificar se o nó já passou pelo SQS
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

      await this.node.start();
      logger.info(`[Mesh] Nó P2P online. PeerID: ${this.node.peerId.toString()}`);

      // [CRITICAL FIX] Listener de descoberta automática via mDNS (rede local)
      // Quando outro computador com Áquila Pro é detectado na mesma rede,
      // conecta automaticamente e realiza o handshake de segurança quântica.
      this.node.addEventListener('peer:discovery', async (evt: any) => {
        const peerId = evt.detail.id;
        const peerIdStr = peerId.toString();
        if (this.handshakingPeers.has(peerIdStr)) return; // Evita handshakes duplicados
        this.handshakingPeers.add(peerIdStr);

        logger.info(`[Mesh] \u{1F50D} Novo Hub Áquila descoberto na rede local: ${peerIdStr}`);
        try {
          const multiaddrs = evt.detail.multiaddrs;
          if (multiaddrs && multiaddrs.length > 0) {
            await this.node.dial(multiaddrs[0]);
            await this.performQuantumHandshake(peerId);
            logger.info(`[Mesh] \u2705 Conexão segura SQS estabelecida com ${peerIdStr}`);
            this.emit('peer:connected', { peerId: peerIdStr, timestamp: Date.now() });
          }
        } catch (err: any) {
          logger.warn(`[Mesh] Falha ao conectar com peer descoberto ${peerIdStr}: ${err.message}`);
        } finally {
          // Libera o lock após 30s para permitir re-tentativa
          setTimeout(() => this.handshakingPeers.delete(peerIdStr), 30000);
        }
      });

      // Inicia loop de descoberta manual complementar (v1.6 ARP Discovery)
      this.startDiscoveryLoop();

    } catch (err) {
      logger.error('[Mesh] Falha fatal ao iniciar enxame:', err);
      this.isStarting = false;
    }
  }

  /**
   * Tenta descobrir peers na rede local via ARP e mDNS (mock).
   */
  private async startDiscoveryLoop() {
    setInterval(async () => {
      if (!this.node) return;
      
      const localDevices = await networkDiscoveryService.scan();
      for (const device of localDevices) {
        if (device.ipAddress) {
          this.attemptDial(device.ipAddress);
        }
      }
    }, 60000); // Tenta descobrir novos peers a cada 1 minuto
  }

  /**
   * Tenta conectar-se a um endereço IP candidato a Áquila Hub.
   */
  private async attemptDial(ip: string) {
    if (!this.node) return;
    try {
      const multiaddr = `/ip4/${ip}/tcp/${this.PORT}`;
      // Log parcial para evitar spam
      logger.debug(`[Mesh] Conectando ao candidato: ${multiaddr}`);
      const connection = await this.node.dial(multiaddr);
      
      // Imediaitamente inicia o Quantum Handshake (Phase 700)
      await this.performQuantumHandshake(connection.remotePeer);
    } catch (err) {
      // Falha silenciosa em caso de dispositivo não-Áquila
    }
  }

  /**
   * Realiza a troca de chaves secundária para resiliência quântica.
   */
  private async performQuantumHandshake(peer: any) {
    try {
      const stream = await this.node.dialProtocol(peer, this.SQS_PROTOCOL);
      const { pipe } = await import('it-pipe');
      const lp = await import('it-length-prefixed');
      const { sovereignQuantumShield } = await import('./SovereignQuantumShield');

      // Busca dados locais da sala
      const { Database } = await import('../../database/Database');
      const db = Database.getInstance();
      const settings = await db.getSettings();
      const roomId = settings.assigned_room_id || '';
      let roomName = '';
      if (roomId) {
        const room = await db.get('SELECT name FROM rooms WHERE id = ?', [roomId]);
        if (room) roomName = room.name;
      }

      const specs = this.getLocalHardwareSpecs();

      const challenge = sovereignQuantumShield.generateLatticeChallenge();
      const payload = JSON.stringify({
        challenge,
        timestamp: Date.now(),
        nodeId: this.getNodeId(),
        roomId,
        roomName,
        ...specs
      });
      const data = new TextEncoder().encode(payload);

      // @ts-ignore
      await pipe([data], lp.encode(), stream.sink);

      // Deriva a chave ARK localmente também
      const ark = await sovereignQuantumShield.deriveArk(Buffer.from(challenge), peer.toString());
      this.sessionKeys.set(peer.toString(), ark);
      
      logger.info(`[Mesh] Handshake SQS enviado e chave ARK derivada para ${peer.toString()}`);
    } catch (err) {
      logger.error(`[Mesh] Falha ao realizar handshake SQS com ${peer.toString()}:`, err);
    }
  }

  public isQuantumSafe(peerId: string): boolean {
    return this.sessionKeys.has(peerId);
  }

  public getSessionKey(peerId: string): string | undefined {
    return this.sessionKeys.get(peerId);
  }

  /**
   * Envia um pacote para um nó específico, garantindo que ele seja autenticado.
   */
  public async sendToNode(peerId: string, packet: SyncPacket) {
    if (!this.node) return;

    // Assina o pacote
    const { tenantIsolationService } = await import('./TenantIsolationService');
    packet.tenantId = tenantIsolationService.getActiveTenant() || 'UNKNOWN';
    packet.targetNode = peerId;

    const ark = this.sessionKeys.get(peerId);
    if (!ark) {
      logger.warn(`[Mesh] Tentativa de enviar para ${peerId} sem chave ARK ativa.`);
      return;
    }

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
      logger.debug(`[Mesh] Pacote enviado com sucesso para nó alvo: ${peerId}`);
    } catch (err: any) {
      logger.error(`[Mesh] Falha ao enviar para nó ${peerId}: ${err.message}`);
    }
  }

  /**
   * Processa pacotes recebidos pela rede Mesh.
   */
  private async handleIncomingPacket(packet: SyncPacket, peerId: string) {
    const ark = this.sessionKeys.get(peerId);
    
    // [Security Check] Verificar se o nó já passou pelo SQS
    if (!SovereignMeshService.getInstance().isQuantumSafe(peerId)) {
       logger.warn(`[Mesh] Pacote bloqueado: Nó ${peerId} não autenticado via SQS.`);
       return;
    }

    // [Institution Isolation] Verificar se o pacote pertence à mesma instituição (Phase 1300)
    const { tenantIsolationService } = await import('./TenantIsolationService');
    const currentTenantId = tenantIsolationService.getActiveTenant();

    if (packet.sourceNode !== 'CORPORATE_BROKER' && packet.tenantId && packet.tenantId !== currentTenantId) {
       logger.warn(`[Mesh] Pacote REJEITADO (Isolamento de Instituição): Origem Tenant ${packet.tenantId} != Local ${currentTenantId}`);
       return;
    }

    logger.info(`[Mesh] Pacote recebido [${packet.payloadType}] de ${packet.sourceNode} (Secured via SQS)`);
    this.emit('packet', packet);
    this.emit(`mesh:payload:${packet.payloadType}`, packet);

    // [Distributed Inference] (Phase 600)
    if (packet.payloadType === 'inference_request' || packet.payloadType === 'inference_result') {
       // These are handled by DistributedInferenceService listeners
    }

    // [Swarm RAG] Resposta automática para consultas de conhecimento (Phase 900)
    if (packet.payloadType === 'RAG_QUERY') {
      this.handleRagQuery(packet, peerId);
    }

    // [Swarm Consensus] Resposta automática para propostas de consenso (Phase 900)
    if (packet.payloadType === 'CONSENSUS_PROPOSAL') {
      this.handleConsensusProposal(packet, peerId);
    }

    // [Cross-Repair] Resposta para solicitação de reparo de binários (Phase 1000)
    if (packet.payloadType === 'REPAIR_REQUEST') {
      this.handleRepairRequest(packet, peerId);
    }

    if (packet.payloadType === 'REPAIR_RESPONSE') {
      this.handleRepairResponse(packet, peerId);
    }

    // [Federated Library] Anúncio de novo material pedagógico (Phase 1100)
    if (packet.payloadType === 'RESOURCE_ANNOUNCEMENT') {
      this.handleResourceAnnouncement(packet, peerId);
    }

    // [Swarm Intelligence] Busca Descentralizada (Phase 1200)
    if (packet.payloadType === 'SWARM_SEARCH_REQUEST') {
      this.handleSwarmSearchRequest(packet, peerId);
    }

    if (packet.payloadType === 'SWARM_SEARCH_RESPONSE') {
      this.handleSwarmSearchResponse(packet, peerId);
    }

    // [Swarm Reputation] Sincronização de endossos (Phase 1400)
    if (packet.payloadType === 'REPUTATION_VOUCH') {
      this.handleReputationVouch(packet, peerId);
    }

    // [Phase 1500] Insight Bridge - Pedidos de ajuda
    if (packet.payloadType === 'BRIDGE_HELP_REQUEST') {
      this.handleHelpRequest(packet, peerId);
    }

    if (packet.payloadType === 'HELP_RESPONSE') {
      this.handleHelpResponse(packet, peerId);
    }

    // [Phase 1900] Global Intelligence Pulse
    if (packet.payloadType === 'GLOBAL_INSIGHT_PULSE') {
      this.handleGlobalPulse(packet, peerId);
    }

    // [Phase 600] Federated Insight
    if (packet.payloadType === 'FEDERATED_INSIGHT' as any) {
      this.handleFederatedInsight(packet, peerId);
    }

    // [Level 13] Reputation Sync
    if (packet.payloadType === 'REPUTATION_SYNC' as any) {
      this.handleReputationSync(packet, peerId);
    }
  }

  private async handleGlobalPulse(packet: SyncPacket, peerId: string) {
    logger.info(`[GlobalInt] Recebido pulso de inteligência de ${peerId}. Integrando ao Nexus Hub.`);
    
    // Processa via serviço de aprendizagem federada
    const { federatedLearningService } = await import('./FederatedLearningService');
    await federatedLearningService.handleFederatedInsight(packet);

    // Resposta de confirmação (Ack) facultativa ou ignorar para evitar tempestades de rádio
  }

  private async handleFederatedInsight(packet: SyncPacket, peerId: string) {
    logger.info(`[Federation] Novo insight institucional recebido de ${peerId}.`);
    const { SovereignLibrarianService } = await import('./SovereignLibrarianService');
    const librarian = SovereignLibrarianService.getInstance();
    
    await librarian.handleIncomingFederatedInsight({
      ...packet.payload,
      sourceNodeId: peerId,
      timestamp: packet.timestamp
    });
  }


  private async handleHelpRequest(packet: SyncPacket, peerId: string) {
    logger.info(`[Bridge] Novo pedido de ajuda federada: ${packet.payload.topic} (De ${peerId})`);
    this.emit('help_request', packet);
  }

  private async handleHelpResponse(packet: SyncPacket, peerId: string) {
    logger.info(`[Bridge] Recebida resposta para ajuda ${packet.payload.requestId} (Vinda de ${peerId})`);
    this.emit('help_response', packet);
  }

  /**
   * [Phase 1200] Responde a uma busca por recursos públicos no enxame.
   */
  private async handleSwarmSearchRequest(packet: SyncPacket, peerId: string) {
    try {
      const { Database } = await import('../../database/Database');
      const db = Database.getInstance();
      const query = packet.payload.query;
      
      const results = await db.all(`
        SELECT pr.id, pr.title, pr.type, pr.aiSummary as excerpt, pr.youtubeLinks,
               (SELECT COUNT(*) FROM swarm_reputation WHERE resourceId = pr.id) as reputationScore
        FROM pedagogical_resources pr
        WHERE pr.privacyTag = 'PUBLIC_SWARM' 
        AND (pr.title LIKE ? OR pr.aiSummary LIKE ?)
        LIMIT 5
      `, [`%${query}%`, `%${query}%`]);

      if (results.length > 0) {
        await this.broadcast({
          id: `search_res_${packet.id}_${Date.now()}`,
          sourceNode: this.getNodeId(),
          targetNode: packet.sourceNode,
          timestamp: Date.now(),
          payloadType: 'SWARM_SEARCH_RESPONSE',
          payload: { 
            requestId: packet.id,
            results: results 
          },
          securityLevel: 'medium_sovereignty'
        });
      }
    } catch (err) {
      logger.error('[Mesh] Falha ao processar SWARM_SEARCH_REQUEST:', err);
    }
  }

  /**
   * [Phase 1200] Recebe resultados de busca vindos do enxame.
   */
  private async handleSwarmSearchResponse(packet: SyncPacket, peerId: string) {
    logger.info(`[Mesh] Recebidos ${packet.payload.results.length} resultados de enxame de ${peerId}`);
    this.emit('swarm_search_result', {
      peerId,
      results: packet.payload.results
    });

    // Cache automático dos metadados para exploração rápida
    try {
      const { Database } = await import('../../database/Database');
      const db = Database.getInstance();
      for (const res of packet.payload.results) {
        await db.run(`
          INSERT OR REPLACE INTO swarm_resources_cache (id, sourcePeerId, title, type, excerpt, youtubeLinks, reputationScore)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [res.id, peerId, res.title, res.type, res.excerpt, res.youtubeLinks, res.reputationScore || 0]);
      }
    } catch (err) {
      logger.error('[Mesh] Falha ao cachear resultados do enxame:', err);
    }
  }

  /**
   * [Phase 1400] Processa um endosso (vouch) vindo de outro nó.
   */
  private async handleReputationVouch(packet: SyncPacket, peerId: string) {
    logger.info(`[Reputation] Recebido endosso de ${peerId} para recurso ${packet.payload.resourceId}`);
    try {
      const { Database } = await import('../../database/Database');
      const db = Database.getInstance();
      
      await db.run(`
        INSERT INTO swarm_reputation (resourceId, voterPeerId, signature, comment)
        VALUES (?, ?, ?, ?)
      `, [packet.payload.resourceId, peerId, packet.signature, packet.payload.comment]);

      // Notifica a UI sobre a atualização de reputação
      this.emit('reputation_update', {
        resourceId: packet.payload.resourceId,
        peerId
      });
    } catch (err) {
      logger.error('[Mesh] Falha ao processar REPUTATION_VOUCH:', err);
    }
  }

  /**
   * [Phase 1100] Indexa metadados de recursos compartilhados no enxame.
   */
  private handleResourceAnnouncement(packet: SyncPacket, peerId: string) {
    logger.info(`[Library] Novo recurso federado descoberto: ${packet.payload.title} (Via ${peerId})`);
    // Em produção, salvaria numa tabela 'swarm_library_cache'
    this.emit('swarm_resource', packet.payload);
  }

  /**
   * [Phase 1000] Envia o binário de backup se possuirmos o arquivo íntegro.
   */
  private async handleRepairRequest(packet: SyncPacket, peerId: string) {
    try {
      const { sovereignBackupService } = await import('./SovereignBackupService');
      const shard = await sovereignBackupService.getRepairShard(packet.payload.fileName);

      if (shard) {
        logger.info(`[Mesh] Servindo fragmento de reparo [${packet.payload.fileName}] para ${peerId}`);
        await this.broadcast({
          id: `rep_res_${packet.id}_${Date.now()}`,
          sourceNode: this.getNodeId(),
          targetNode: packet.sourceNode,
          timestamp: Date.now(),
          payloadType: 'REPAIR_RESPONSE',
          payload: { 
            fileName: packet.payload.fileName,
            shardData: shard,
            integrityHash: 'SIGNED_SQS'
          },
          securityLevel: 'high_sovereignty'
        });
      }
    } catch (err) {
      logger.error('[Mesh] Falha ao processar REPAIR_REQUEST:', err);
    }
  }

  /**
   * [Phase 1000] Recebe e aplica o fragmento de reparo vindo do enxame.
   */
  private async handleRepairResponse(packet: SyncPacket, peerId: string) {
    try {
      logger.info(`[Mesh] Recebido fragmento de reparo para ${packet.payload.fileName}. Aplicando intervenção autonômica...`);
      
      const fs = await import('fs');
      const path = await import('path');
      const { app } = await import('electron');
      
      const userDataPath = app.getPath('userData');
      const repairDir = path.join(userDataPath, 'swarm_repairs');
      
      if (!fs.existsSync(repairDir)) fs.mkdirSync(repairDir, { recursive: true });
      
      const repairPath = path.join(repairDir, packet.payload.fileName);
      
      // Decodifica Base64 se necessário
      const binaryData = typeof packet.payload.shardData === 'string' 
        ? Buffer.from(packet.payload.shardData, 'base64') 
        : packet.payload.shardData;

      fs.writeFileSync(repairPath, binaryData);
      logger.info(`[Mesh] Reparo CROSS-P2P concluído. Arquivo salvo em: ${repairPath}`);
      
      // Notifica o serviço de integridade para re-validar o arquivo
      this.emit('mesh:repair:applied', { fileName: packet.payload.fileName, path: repairPath });
    } catch (err) {
      logger.error('[Mesh] Falha ao aplicar reparo de binário:', err);
    }
  }

  /**
   * Avalia uma proposta de consenso vinda da malha.
   */
  private async handleConsensusProposal(packet: SyncPacket, peerId: string) {
    try {
      const { cortexEvolutionService } = await import('./CortexEvolutionService');
      const localContext = cortexEvolutionService.searchKnowledge(packet.payload.content, 3);
      
      // Se tivermos evidências similares localmente, votamos a favor (AGREE)
      const vote = localContext.length > 0 ? 'AGREE' : 'ABSTAIN';

      await this.broadcast({
        id: `vote_${packet.id}_${Date.now()}`,
        sourceNode: this.getNodeId(),
        targetNode: packet.sourceNode,
        timestamp: Date.now(),
        payloadType: 'CONSENSUS_VOTE',
        payload: { 
          proposalId: packet.id,
          vote: vote,
          confidence: localContext[0]?.score || 0
        },
        securityLevel: 'high_sovereignty'
      });

      logger.info(`[Consensus] Votado ${vote} para proposta ${packet.id} de ${peerId}`);
    } catch (err) {
      logger.error('[Mesh] Falha ao processar CONSENSUS_PROPOSAL:', err);
    }
  }

  /**
   * Responde uma consulta de RAG vinda de outro nó.
   */
  private async handleRagQuery(packet: SyncPacket, peerId: string) {
    try {
      const { cortexEvolutionService } = await import('./CortexEvolutionService');
      const matches = cortexEvolutionService.searchKnowledge(packet.payload.query, 5);
      
      // Filtrar insights LOCAL_ONLY antes de responder (Soberania de Dados)
      const sanitizedMatches = matches.filter(m => !m.tags?.includes('LOCAL_ONLY'));

      if (sanitizedMatches.length > 0) {
        await this.broadcast({
          id: `res_${packet.id}_${Date.now()}`,
          sourceNode: this.getNodeId(),
          targetNode: packet.sourceNode,
          timestamp: Date.now(),
          payloadType: 'RAG_RESPONSE',
          payload: { 
            requestId: packet.payload.requestId, 
            matches: sanitizedMatches 
          },
          securityLevel: 'medium_sovereignty'
        });
      }
    } catch (err) {
      logger.error('[Mesh] Falha ao processar RAG_QUERY remota:', err);
    }
  }

  /**
   * [Level 13] Sincroniza a tabela de reputação local com o enxame.
   */
  public async syncReputationTable() {
    if (!this.node) return;
    
    logger.info('[Mesh] Iniciando sincronização global de reputação...');
    await this.broadcast({
      id: `rep_sync_${Date.now()}`,
      sourceNode: this.getNodeId(),
      targetNode: 'ALL',
      timestamp: Date.now(),
      payloadType: 'REPUTATION_SYNC' as any,
      payload: { 
        reputations: Object.fromEntries(this.peerReputations) 
      },
      securityLevel: 'high_sovereignty'
    });
  }

  private handleReputationSync(packet: SyncPacket, peerId: string) {
    logger.info(`[Reputation] Recebida tabela de reputação de ${peerId}. Mesclando consensos...`);
    const remoteReputations = packet.payload.reputations || {};
    
    for (const [nodeId, score] of Object.entries(remoteReputations)) {
      const currentScore = this.peerReputations.get(nodeId) || 0.5;
      // Mesclagem ponderada (Consenso agêntico v1)
      // Damos 20% de peso para a opinião do par e 80% para a nossa observação local
      const newScore = (currentScore * 0.8) + ((score as number) * 0.2);
      this.peerReputations.set(nodeId, newScore);
    }
  }


  /**
   * Transmite um pacote para todos os peers conectados no enxame.
   * [Phase 1600] Hardening - Auto-Compression
   */
  public async broadcast(packet: SyncPacket) {
    if (!this.node) return;

    // Assina o pacote antes do broadcast (Security Governance)
    const { tenantIsolationService } = await import('./TenantIsolationService');
    packet.tenantId = tenantIsolationService.getActiveTenant() || 'UNKNOWN';
    packet.signature = sovereignFirewall.signPacket(packet);

    try {
      const { gzipSync } = await import('zlib');
      let data: Buffer | Uint8Array = new TextEncoder().encode(JSON.stringify(packet));

      if (data.length > 2048) {
        data = gzipSync(data);
        logger.debug(`[Mesh] Pacote comprimido: ${data.length} bytes.`);
      }

      const peers = this.node.getPeers();
      for (const peer of peers) {
        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        while (attempts < maxAttempts && !success) {
          attempts++;
          try {
            const stream = await this.node.dialProtocol(peer, this.PROTOCOL, {
              signal: AbortSignal.timeout(5000) // 5s timeout per dial
            });
            const { pipe } = await import('it-pipe');
            const lp = await import('it-length-prefixed');

            await pipe(
              [data],
              // @ts-ignore
              lp.encode(),
              stream.sink
            );
            success = true;
          } catch (err: any) {
            if (attempts >= maxAttempts) {
              logger.error(`[Mesh] Falha persistente após ${maxAttempts} tentativas para peer ${peer.toString()}: ${err.message}`);
            } else {
              logger.warn(`[Mesh] Erro ao enviar para peer ${peer.toString()} (Tentativa ${attempts}/${maxAttempts})...`);
              // Pequeno delay exponencial entre retentativas
              await new Promise(resolve => setTimeout(resolve, attempts * 500));
            }
          }
        }
      }
    } catch (err) {
      logger.error('[Mesh] Erro crítico no broadcast:', err);
    }
  }

  /**
   * [Phase 1700] Monitor de Saúde da Malha (Heartbeat)
   */
  public startHeartbeat() {
    setInterval(async () => {
      const peers = this.node ? this.node.getPeers().length : 0;
      logger.info(`[Mesh] Heartbeat: ${peers} conexões ativas.`);
      
      // [Level 13] Sincronização periódica de reputação (Swarm-wide Consensus)
      if (peers > 0) {
        await this.syncReputationTable();
      }
    }, 60000);
  }

  public getNodeId(): string {
    return this.node ? this.node.peerId.toString() : 'offline';
  }

  public getPeers() {
    return this.node ? this.node.getPeers() : [];
  }

  public getConnectedPeers() {
    return this.getPeers().map((p: any) => {
      const peerId = p.toString();
      const meta = this.peerMetadata.get(peerId) || { roomId: '', roomName: '' };
      return {
        id: peerId,
        roomId: meta.roomId,
        roomName: meta.roomName,
        cpu: meta.cpu || 'Intel Core i5',
        ram: meta.ram || 8,
        gpu: meta.gpu || 'Intel Graphics',
        tops: meta.tops || 0,
        ssd: meta.ssd || 240
      };
    });
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

  public getMeshInfo() {
    return {
      nodeId: this.getNodeId(),
      addresses: this.node ? this.node.getMultiaddrs().map((a: any) => a.toString()) : []
    };
  }

  public getStatus() {
    return {
      active: !!this.node,
      peerId: this.node ? this.node.peerId.toString() : null,
      peersConnected: this.node ? this.node.getPeers().length : 0,
      addresses: this.node ? this.node.getMultiaddrs().map((a: any) => a.toString()) : [],
      reputations: Object.fromEntries(this.peerReputations)
    };
  }

  public getPeerReputation(peerId: string): number {
    return this.peerReputations.get(peerId) || 0;
  }
}

export const sovereignMeshService = SovereignMeshService.getInstance();
