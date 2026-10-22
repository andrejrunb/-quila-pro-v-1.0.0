import { logger } from '../logger';
import { Database } from '../../database/Database';

export interface MeshNode {
    id: string;
    url: string;
    type: 'local' | 'remote' | 'mesh';
    status: 'online' | 'offline';
    lastSeen: number;
    performanceScore: number; // ms to respond
    load: number; // 0-1
}

/**
 * MeshGatewayService
 * Gerencia o enxame de inferência GGUF-Mesh para o Áquila Pro.
 * Distribui prompts entre nós locais e remotos para garantir soberania e performance.
 */
export class MeshGatewayService {
    private static instance: MeshGatewayService;
    private nodes: MeshNode[] = [];
    private db: Database;

    private constructor() {
        this.db = Database.getInstance();
        this.initializeNodes();
    }

    public static getInstance(): MeshGatewayService {
        if (!MeshGatewayService.instance) {
            MeshGatewayService.instance = new MeshGatewayService();
        }
        return MeshGatewayService.instance;
    }

    private async initializeNodes() {
        // Nó Local (Padrão)
        this.nodes.push({
            id: 'local-ollama',
            url: 'http://localhost:11434',
            type: 'local',
            status: 'offline',
            lastSeen: 0,
            performanceScore: 0,
            load: 0
        });

        // Nó Mesh (GGUF-Mesh se disponível)
        this.nodes.push({
            id: 'school-mesh-primary',
            url: 'http://localhost:1234', // Porta padrão LM Studio / GGUF-Mesh local
            type: 'mesh',
            status: 'offline',
            lastSeen: 0,
            performanceScore: 0,
            load: 0
        });

        this.healthCheck();
        setInterval(() => this.healthCheck(), 30000); // Check a cada 30s
    }

    private async healthCheck() {
        for (const node of this.nodes) {
            try {
                const start = Date.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const response = await fetch(`${node.url}/api/tags`).catch(() => 
                    fetch(`${node.url}/v1/models`) // Fallback check para LM Studio
                );
                
                clearTimeout(timeoutId);
                
                if (response && response.ok) {
                    node.status = 'online';
                    node.lastSeen = Date.now();
                    node.performanceScore = Date.now() - start;
                } else {
                    node.status = 'offline';
                }
            } catch (e) {
                node.status = 'offline';
            }
        }
        logger.info(`[MeshGateway] HealthCheck concluído. Nós Online: ${this.nodes.filter(n => n.status === 'online').length}`);
    }

    /**
     * Retorna o melhor nó para a tarefa atual baseado em status e performance.
     */
    public async getOptimalNode(): Promise<MeshNode | null> {
        const onlineNodes = this.nodes.filter(n => n.status === 'online');
        if (onlineNodes.length === 0) return null;

        // Ordena por menor latência e tipo (NPU Local > Mesh > Cloud Fallback)
        return onlineNodes.sort((a, b) => {
            if (a.type === b.type) return a.performanceScore - b.performanceScore;
            const priority = { local: 1, mesh: 2, remote: 3 };
            return priority[a.type] - priority[b.type];
        })[0];
    }

    /**
     * Adiciona um novo nó ao mesh dinamicamente (ex: via descoberta ONVIF/mDNS)
     */
    public registerNode(node: Omit<MeshNode, 'status' | 'lastSeen' | 'performanceScore' | 'load'>) {
        if (!this.nodes.find(n => n.url === node.url)) {
            this.nodes.push({
                ...node,
                status: 'offline',
                lastSeen: 0,
                performanceScore: 0,
                load: 0
            });
            this.healthCheck();
            logger.info(`[MeshGateway] Novo nó registrado: ${node.id} (${node.url})`);
        }
    }

    public getStatus() {
        return this.nodes.map(n => ({
            id: n.id,
            status: n.status,
            type: n.type,
            latency: n.performanceScore
        }));
    }
}

export const meshGateway = MeshGatewayService.getInstance();
