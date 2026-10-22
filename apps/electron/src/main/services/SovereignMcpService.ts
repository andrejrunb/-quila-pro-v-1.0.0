import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../logger';
import { sovereignGraphService } from './SovereignGraphService';

/**
 * SovereignMcpService (v1.5.0-PRO)
 * Atua como o barramento de ferramentas (Tool Bus) do Áquila Pro.
 * Permite que agentes Hub solicitem ferramentas via protocolos padronizados MCP.
 */
export class SovereignMcpService {
  private static instance: SovereignMcpService;
  private server: Server;
  private tools: Map<string, (args: any) => Promise<any>> = new Map();

  private constructor() {
    this.server = new Server(
      { name: 'aquila-sovereign-hub', version: '1.5.0' },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
    this.registerInternalTools();
  }

  public static getInstance(): SovereignMcpService {
    if (!SovereignMcpService.instance) {
      SovereignMcpService.instance = new SovereignMcpService();
    }
    return SovereignMcpService.instance;
  }

  /**
   * Registra uma nova ferramenta no barramento MCP
   */
  public registerTool(name: string, description: string, schema: any, handler: (args: any) => Promise<any>) {
    this.tools.set(name, handler);
    // Nota: O SDK exige que as ferramentas sejam listadas no handler de ListTools
    logger.info(`[MCP] Ferramenta registrada: ${name}`);
  }

  /**
   * Inicia o servidor MCP via Stdio (Padrão local Áquila)
   */
  public async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('[MCP] Servidor Soberano iniciado via Stdio.');
    } catch (err) {
      logger.error(`[MCP] Falha ao iniciar servidor: ${err}`);
    }
  }

  /**
   * Executa uma ferramenta internamente (bypass opcional para agentes locais)
   */
  public async executeTool(name: string, args: any): Promise<any> {
    const handler = this.tools.get(name);
    if (!handler) throw new Error(`Ferramenta ${name} não encontrada.`);
    return await handler(args);
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.keys()).map(name => ({
        name,
        description: `Tool for Áquila Sovereign OS: ${name}`,
        inputSchema: { type: 'object', properties: {} } // Simplificação para v1.5
      }))
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const handler = this.tools.get(request.params.name);
      if (!handler) throw new Error(`Ferramenta ${request.params.name} não encontrada.`);
      
      const result = await handler(request.params.arguments);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    });
  }

  private registerInternalTools() {
    // 1. Ferramentas do Grafo de Conhecimento
    this.registerTool(
      'query_knowledge_graph',
      'Consulta o relacionamento entre entidades na escola.',
      {},
      async (args) => sovereignGraphService.getKnowledgeContext(args.nodeId)
    );

    // 2. Ferramentas de Auditoria
    this.registerTool(
      'audit_system_health',
      'Retorna o estado térmico e de recursos do Edge Hub.',
      {},
      async () => {
        const { resourceMonitor } = require('./ResourceMonitorService');
        return resourceMonitor.getStatus();
      }
    );

    // 3. Ferramenta de Alerta
    this.registerTool(
      'trigger_safety_alert',
      'Dispara um alerta de segurança imediato no SOC.',
      { type: 'object', properties: { level: { type: 'string' } } },
      async (args) => ({ status: 'ALERT_SENT', level: args.level || 'info' })
    );
  }
}

export const sovereignMcpService = SovereignMcpService.getInstance();
