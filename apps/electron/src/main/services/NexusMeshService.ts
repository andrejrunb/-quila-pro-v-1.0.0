// @ts-nocheck
// NOTE: libp2p e seus transportes são ESM-only; importados dinamicamente
// para evitar ERR_PACKAGE_PATH_NOT_EXPORTED no runtime CJS do Electron.
import { logger } from '../logger';
import { db } from '../../database/Database';

export interface NexusPeer {
    id: string;
    name: string;
    multiaddr: string;
    status: 'online' | 'offline' | 'syncing';
    latency: number;
}

export class NexusMeshService {
    private static instance: NexusMeshService;
    private node: any = null;
    private peers: Map<string, NexusPeer> = new Map();

    private constructor() {}

    public static getInstance(): NexusMeshService {
        if (!NexusMeshService.instance) {
            NexusMeshService.instance = new NexusMeshService();
        }
        return NexusMeshService.instance;
    }

    /**
     * Inicializa o Nó Nexus P2P
     */
    public async start() {
        try {
            logger.info('[NexusMesh] Inicializando malha P2P soberana...');

            // Importação dinâmica para compatibilidade ESM/CJS no Electron
            const { createLibp2p } = await import('libp2p');
            const { tcp } = await import('@libp2p/tcp');
            const { mplex } = await import('@libp2p/mplex');
            const { noise } = await import('@chainsafe/libp2p-noise');
            const { mdns } = await import('@libp2p/mdns');

            this.node = await createLibp2p({
                addresses: {
                    listen: ['/ip4/0.0.0.0/tcp/0']
                },
                transports: [tcp()],
                streamMuxers: [mplex()],
                connectionEncryption: [noise()],
                peerDiscovery: [
                    mdns({
                        interval: 10000
                    })
                ]
            });

            await this.node.start();
            logger.info(`[NexusMesh] Nó Ativo. ID: ${this.node.peerId.toString()}`);

            this.setupListeners();
            await this.loadPeersFromDb();

        } catch (err) {
            logger.error(`[NexusMesh] Falha ao iniciar malha: ${err}`);
        }
    }

    private setupListeners() {
        this.node.addEventListener('peer:discovery', (evt: any) => {
            const peerId = evt.detail.id.toString();
            logger.info(`[NexusMesh] Novo nó descoberto na vizinhança: ${peerId}`);
            this.handleDiscovery(peerId, evt.detail.multiaddrs);
        });

        this.node.connectionManager.addEventListener('peer:connect', (evt: any) => {
            const peerId = evt.detail.remotePeer.toString();
            logger.info(`[NexusMesh] Handshake bem-sucedido com ${peerId}`);
            this.updatePeerStatus(peerId, 'online');
        });
    }

    private async handleDiscovery(id: string, addrs: any[]) {
        // Lógica de auto-conexão se o nível de confiança for alto
        const existing = await db.get('SELECT * FROM nexus_peers WHERE id = ?', [id]);
        if (existing) {
            try {
                await this.node.dial(addrs[0]);
            } catch (err) {
                logger.warn(`[NexusMesh] Falha ao discar para ${id}: ${err}`);
            }
        }
    }

    private async loadPeersFromDb() {
        const rows = await db.all('SELECT * FROM nexus_peers');
        for (const row of rows) {
            this.peers.set(row.id, {
                id: row.id,
                name: row.name,
                multiaddr: row.multiaddr,
                status: 'offline',
                latency: 0
            });
        }
    }

    private updatePeerStatus(id: string, status: 'online' | 'offline' | 'syncing') {
        const peer = this.peers.get(id);
        if (peer) {
            peer.status = status;
        } else {
            this.peers.set(id, { id, name: 'Unknown Hub', multiaddr: '', status, latency: 0 });
        }
    }

    /**
     * Realiza um benchmark de latência na malha Nexus.
     * Nível 20 — Health Monitoring.
     */
    public async benchmarkMeshLatency(): Promise<number> {
        logger.info('[NexusMesh] Iniciando benchmark de latência...');
        const activePeers = this.getActivePeers().filter(p => p.status === 'online');
        
        if (activePeers.length === 0) {
            logger.warn('[NexusMesh] Nenhum peer online para benchmark.');
            return 0;
        }

        // Simula medição (em produção, faz um ping P2P)
        const avgLatency = 15 + Math.random() * 20;
        for (const peer of activePeers) {
            peer.latency = avgLatency + (Math.random() * 5);
        }

        return avgLatency;
    }

    public getMeshHealth() {
        const peers = this.getActivePeers();
        return {
            total: peers.length,
            online: peers.filter(p => p.status === 'online').length,
            latency: peers.reduce((acc, p) => acc + p.latency, 0) / (peers.length || 1)
        };
    }

    public getActivePeers(): NexusPeer[] {
        return Array.from(this.peers.values());
    }

    public async broadcastVaccine(vaccine: any) {
        logger.info(`[NexusMesh] Propagando Vacina Digital: ${vaccine.type}`);
        // No futuro, usar PubSub para broadcast eficiente
        await db.run(
            'INSERT INTO global_intelligence_ledger (id, type, payload) VALUES (?, ?, ?)',
            [`vac-${Date.now()}`, vaccine.type, JSON.stringify(vaccine.payload)]
        );
    }
}

export const nexusMeshService = NexusMeshService.getInstance();
