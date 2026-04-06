import { Database } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';

export interface LegalArticle {
  id: string;
  category: 'ECA' | 'BNCC' | 'CHILD_LAW' | 'HEALTH';
  article_number: string;
  content: string;
  pedagogical_context?: string;
  keywords?: string;
}

export interface EvidenceDossier {
  id: string;
  studentId: string;
  incidentCount: number;
  severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  compiledData: any;
  legalGrounding: string;
  status: 'draft' | 'reviewed' | 'archived';
  createdAt: Date;
}

class LegalEvidenceService {
  private db = Database.getInstance();

  /**
   * Busca artigos legais baseados em palavras-chave ou categorias
   */
  async findRelevantLaws(query: string, category?: string): Promise<LegalArticle[]> {
    let sql = `SELECT * FROM legal_articles_vault WHERE (content LIKE ? OR keywords LIKE ?)`;
    const params: any[] = [`%${query}%`, `%${query}%`];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    return await this.db.all<LegalArticle>(sql, params);
  }

  /**
   * Gera um dossiê de evidências para um aluno baseado no seu histórico
   */
  async compileStudentDossier(studentId: string): Promise<string> {
    // 1. Coletar histórico do banco (Presença, Ocorrências, Notas)
    const presenceData = await this.db.all(`SELECT * FROM presence WHERE studentId = ? ORDER BY date DESC LIMIT 50`, [studentId]);
    const economyData = await this.db.get(`SELECT * FROM student_economy WHERE student_id = ?`, [studentId]);
    
    // 2. Analisar severidade (Lógica simplificada para MVP)
    const incidentCount = presenceData.filter((p: any) => p.status === 'absent').length;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (incidentCount > 10) severity = 'CRITICAL';
    else if (incidentCount > 5) severity = 'HIGH';
    else if (incidentCount > 2) severity = 'MEDIUM';

    // 3. Buscar embasamento legal automático
    const relevantLaws = await this.findRelevantLaws(severity === 'CRITICAL' ? 'evasão' : 'frequência', 'ECA');
    const legalGrounding = relevantLaws.map(l => `${l.category} Art. ${l.article_number}: ${l.content}`).join('\n\n');

    const dossierId = uuidv4();
    const compiledData = JSON.stringify({
      presenceSummary: { total: presenceData.length, absences: incidentCount },
      economy: economyData
    });

    await this.db.run(
      `INSERT INTO student_evidence_dossier (id, student_id, incident_count, severity_level, compiled_data, legal_grounding, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [dossierId, studentId, incidentCount, severity, compiledData, legalGrounding, 'draft']
    );

    return dossierId;
  }

  /**
   * Seed inicial de artigos legais (ECA/BNCC) para garantir que o sistema tenha base
   */
  async seedLegalVault() {
    const initialArticles: LegalArticle[] = [
      {
        id: uuidv4(),
        category: 'ECA',
        article_number: '129',
        content: 'São medidas aplicáveis aos pais ou responsável: encaminhamento a programa oficial ou comunitário de proteção à família; inclusão em programa oficial ou comunitário de auxílio, orientação e tratamento a alcoólatras e toxicômanos; encaminhamento a tratamento psicológico ou psiquiátrico; encaminhamento a cursos ou programas de orientação; obrigação de matricular o filho ou enteado e acompanhar sua frequência e aproveitamento escolar; obrigação de encaminhar a criança ou adolescente a tratamento especializado; advertência.',
        keywords: 'responsabilidade, pais, frequência, advertência',
        pedagogical_context: 'Justifica a convocação formal de pais em casos de negligência com a frequência.'
      },
      {
        id: uuidv4(),
        category: 'ECA',
        article_number: '56',
        content: 'Os dirigentes de estabelecimentos de ensino fundamental comunicarão ao Conselho Tutelar os casos de: maus-tratos envolvendo seus alunos; reiteração de faltas injustificadas e de evasão escolar, esgotados os recursos escolares; elevados níveis de repetência.',
        keywords: 'conselho tutelar, faltas, evasão, repetência',
        pedagogical_context: 'Base legal para a escola escalar o problema quando não há resposta da família.'
      },
      {
        id: uuidv4(),
        category: 'BNCC',
        article_number: 'Competência 10',
        content: 'Agir pessoal e coletivamente com autonomia, responsabilidade, flexibilidade, resiliência e determinação, tomando decisões com base em princípios éticos, democráticos, inclusivos, sustentáveis e solidários.',
        keywords: 'autonomia, responsabilidade, ética',
        pedagogical_context: 'Embasamento para intervenções focadas no desenvolvimento socioemocional e engajamento.'
      }
    ];

    for (const art of initialArticles) {
      await this.db.run(
        `INSERT OR IGNORE INTO legal_articles_vault (id, category, article_number, content, pedagogical_context, keywords)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [art.id, art.category, art.article_number, art.content, art.pedagogical_context, art.keywords]
      );
    }
  }
}

export const legalEvidenceService = new LegalEvidenceService();
