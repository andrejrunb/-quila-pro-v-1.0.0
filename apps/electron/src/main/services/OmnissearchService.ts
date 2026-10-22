import { Database } from "../../database/Database";
import { nexusSyncService } from "./NexusSyncService";

export interface SearchResult {
  type: 'student' | 'finance' | 'security' | 'nexus' | 'pedagogic' | 'governance';
  title: string;
  subtitle: string;
  relevance: number;
  metadata: any;
}

/**
 * OmnissearchService (v4002 - Nexus Intelligence)
 * Motor de Busca Multimodal para o Áquila Pro.
 * Integra comandos de voz e texto com o grafo de dados da escola e status do enxame.
 */
export class OmnissearchService {
  constructor(private db: Database) {}

  /**
   * Executa uma busca global baseada em linguagem natural
   */
  async search(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const q = `%${query}%`;

    // 1. Busca por Alunos (Foco em RA e Nome)
    const students = await this.db.all(
      'SELECT id, name, registrationNumber FROM students WHERE name LIKE ? OR registrationNumber LIKE ? LIMIT 5',
      [q, q]
    );
    for (const s of students) {
      results.push({
        type: 'student',
        title: s.name,
        subtitle: `RA: ${s.registrationNumber}`,
        relevance: 1.0,
        metadata: { id: s.id }
      });
    }

    // 2. Busca Financeira (Fatura por Nome de Aluno)
    const bills = await this.db.all(
       'SELECT b.id, s.name as studentName, b.amount, b.status FROM billing b JOIN students s ON b.studentHash = s.id WHERE s.name LIKE ? LIMIT 3',
       [q]
    );
    for (const b of bills) {
      results.push({
        type: 'finance',
        title: `Financeiro: ${b.studentName}`,
        subtitle: `R$ ${b.amount} - ${b.status === 'paid' ? 'PAGO' : 'PENDENTE'}`,
        relevance: 0.8,
        metadata: { billingId: b.id }
      });
    }

    // 3. Segurança em Tempo Real (Eventos de CSI/Visão)
    const security = await this.db.all(
        'SELECT type, message, timestamp FROM security_events WHERE message LIKE ? OR type LIKE ? ORDER BY timestamp DESC LIMIT 3',
        [q, q]
    );
    for (const ev of security) {
        results.push({
            type: 'security',
            title: `Alerta: ${ev.type}`,
            subtitle: `${ev.message} (${new Date(ev.timestamp).toLocaleTimeString()})`,
            relevance: 1.5, // Alta relevância para segurança
            metadata: { event: ev }
        });
    }

    // 4. Busca por Nexus Nodes (Hardware/Edge)
    const nodes = nexusSyncService.getNodes().filter(n => n.name.toUpperCase().includes(query.toUpperCase()));
    for (const n of nodes) {
      results.push({
        type: 'nexus',
        title: `Unidade Edge: ${n.name}`,
        subtitle: `Estado: ${n.syncStatus} | NPU: ${Math.round(n.load * 100)}%`,
        relevance: 1.2,
        metadata: { nodeId: n.id }
      });
    }

    // 5. Busca Pedagógica (Transcrição de Lousas e Flashcards)
    const materials = await this.db.all(
        `SELECT id, question as title, subject as subtitle, 'flashcard' as type FROM flashcards WHERE question LIKE ? OR subject LIKE ? 
         UNION
         SELECT id, draft as title, 'Review pendente' as subtitle, 'approval' as type FROM communication_approvals WHERE draft LIKE ?
         LIMIT 5`,
        [q, q, q]
    );
    for (const m of materials) {
        results.push({
            type: 'pedagogic',
            title: m.title,
            subtitle: m.subtitle,
            relevance: 0.9,
            metadata: { id: m.id, materialType: m.type }
        });
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Processa entrada de voz via Mobile/Assistant (Omnissearch Voice)
   */
  async processVoiceCommand(transcript: string): Promise<{ action: string, data: any }> {
    const text = transcript.toUpperCase();
    
    // Intenções de Busca
    if (text.includes('BUSCAR') || text.includes('QUEM É') || text.includes('PROCURAR')) {
      const name = text.replace(/BUSCAR|QUEM É|PROCURAR/g, '').trim();
      const results = await this.search(name);
      return { action: 'SEARCH_RESULTS', data: results };
    }

    // Intenções de Navegação e Alerta
    if (text.includes('SEGURANÇA') || text.includes('CÂMERAS')) {
        return { action: 'NAVIGATE', data: { page: 'SecuritySOC' } };
    }

    if (text.includes('RISCO') || text.includes('EVASÃO') || text.includes('FALTA')) {
       return { action: 'NAVIGATE', data: { page: 'EvasionRadar' } };
    }

    if (text.includes('SALDO') || text.includes('CAIXA') || text.includes('DINHEIRO')) {
        return { action: 'NAVIGATE', data: { page: 'FinancialGlass' } };
    }

    return { action: 'GENERAL_ASYNC_QUERY', data: { raw: transcript, suggestion: 'Experimente buscar por um aluno ou status de segurança.' } };
  }
}
