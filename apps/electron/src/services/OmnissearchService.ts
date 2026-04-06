import { Database } from "../database/Database";

export interface SearchResult {
  type: 'student' | 'finance' | 'event' | 'nexus' | 'pedagogic' | 'governance';
  title: string;
  subtitle: string;
  relevance: number;
  metadata: any;
}

import { nexusSyncService } from "./NexusSyncService";

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

    // 1. Busca por Alunos
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

    // 2. Busca por Faturas (Finanças)
    const bills = await this.db.all(
       'SELECT b.id, s.name as studentName, b.amount, b.status FROM billing b JOIN students s ON b.studentHash = s.id WHERE s.name LIKE ? LIMIT 3',
       [q]
    );
    for (const b of bills) {
      results.push({
        type: 'finance',
        title: `Fatura: ${b.studentName}`,
        subtitle: `R$ ${b.amount} - Status: ${b.status}`,
        relevance: 0.8,
        metadata: { billingId: b.id }
      });
    }

    // 3. Busca por Nexus Nodes (v4002)
    const nodes = nexusSyncService.getNodes().filter(n => n.name.toUpperCase().includes(query.toUpperCase()));
    for (const n of nodes) {
      results.push({
        type: 'nexus',
        title: `Nó Nexus: ${n.name}`,
        subtitle: `Estado: ${n.syncStatus} | NPU: ${Math.round(n.load * 100)}%`,
        relevance: 1.1, // Prioridade alta para hardware
        metadata: { nodeId: n.id }
      });
    }

    // 4. Busca por Learning Pods (Pedagógico v4002)
    const pods = await this.db.all(
       'SELECT id, subject, summary, created_at FROM learning_pods WHERE subject LIKE ? OR summary LIKE ? LIMIT 3',
       [q, q]
    );
    for (const pod of pods) {
      results.push({
        type: 'pedagogic',
        title: `Aula: ${pod.subject}`,
        subtitle: `Resumo: ${pod.summary.substring(0, 60)}...`,
        relevance: 0.9,
        metadata: { podId: pod.id }
      });
    }

    // 5. Busca por Governança (Votações v4002)
    const proposals = await this.db.all(
       'SELECT id, title, status FROM proposals_votecasting WHERE title LIKE ? AND status = "ACTIVE" LIMIT 3',
       [q]
    );
    for (const prop of proposals) {
      results.push({
        type: 'governance',
        title: `Votação: ${prop.title}`,
        subtitle: `Status: ATIVA | Participe agora`,
        relevance: 1.2,
        metadata: { proposalId: prop.id }
      });
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Processa entrada de voz via Mobile/Assistant
   */
  async processVoiceCommand(transcript: string): Promise<{ action: string, data: any }> {
    const text = transcript.toUpperCase();
    
    if (text.includes('BUSCAR') || text.includes('QUEM É')) {
      const name = text.replace(/BUSCAR|QUEM É/g, '').trim();
      const results = await this.search(name);
      return { action: 'SEARCH_RESULTS', data: results };
    }

    if (text.includes('RISCO') || text.includes('EVASÃO')) {
       return { action: 'NAVIGATE', data: { page: 'EvasionRadar' } };
    }

    if (text.includes('ENXAME') || text.includes('STATUS')) {
       return { action: 'NAVIGATE', data: { page: 'SwarmExecutiveCockpit' } };
    }

    if (text.includes('VOTAÇÃO') || text.includes('CONSELHO')) {
       return { action: 'NAVIGATE', data: { page: 'CouncilRoom' } };
    }

    return { action: 'UNKNOWN', data: { raw: transcript } };
  }
}
