import Database from '../../database/Database';
import { logger } from '../logger';
import { v4 as uuidv4 } from 'uuid';

export interface LegalArticle {
  id: string;
  source: string;
  article_number: string;
  title: string;
  content: string;
  tags: string[];
  legal_level: string;
}

/**
 * LegalGuardService (Phase 900)
 * Responsável por gerenciar o "Vault Legal" - uma biblioteca de artigos regulatórios
 * que fundamentam as ações pedagógicas e de segurança do Áquila Pro.
 */
export class LegalGuardService {
  constructor(private db: Database) {}

  /**
   * Busca artigos relacionados a uma query ou tags.
   */
  async findRelatedArticles(query: string): Promise<LegalArticle[]> {
    try {
      // Simples busca por LIKE no conteúdo e título por enquanto (RAG Lite)
      const results = await this.db.all(`
        SELECT * FROM legal_vault 
        WHERE content LIKE ? OR title LIKE ? OR source LIKE ?
        LIMIT 3
      `, [`%${query}%`, `%${query}%`, `%${query}%`]);

      return results.map(r => ({
        ...r,
        tags: JSON.parse(r.tags || '[]')
      }));
    } catch (err) {
      logger.error(`[LegalGuard] Erro ao buscar artigos: ${err}`);
      return [];
    }
  }

  /**
   * Seed inicial com artigos fundamentais (ECA, BNCC).
   */
  async seedVault() {
    const coreArticles = [
      {
        source: 'ECA',
        article: 'Art. 18-A',
        title: 'Direito ao Cuidado sem Castigo Físico',
        content: 'A criança e o adolescente têm o direito de ser educados e cuidados sem o uso de castigo físico ou de tratamento cruel ou degradante.',
        tags: ['comportamento', 'proteção', 'direitos'],
        level: 'federal'
      },
      {
        source: 'BNCC',
        article: 'Competência 9',
        title: 'Empatia e Cooperação',
        content: 'Exercitar a empatia, o diálogo, a resolução de conflitos e a cooperação, fazendo-se respeitar e promovendo o respeito ao outro.',
        tags: ['pedagógico', 'socioemocional'],
        level: 'federal'
      },
      {
        source: 'Regimento Interno',
        article: 'Art. 45',
        title: 'Segurança no Pátio',
        content: 'É dever da monitoria garantir o bem-estar dos alunos em áreas de convivência comum, prevenindo situações de risco físico ou emocional.',
        tags: ['segurança', 'monitoramento'],
        level: 'interno'
      }
    ];

    for (const art of coreArticles) {
      const id = `LEGAL-${uuidv4().substring(0, 8)}`;
      await this.db.run(`
        INSERT OR IGNORE INTO legal_vault (id, source, article_number, title, content, tags, legal_level)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        art.source,
        art.article,
        art.title,
        art.content,
        JSON.stringify(art.tags),
        art.level
      ]);
    }
    
    logger.info('[LegalGuard] Vault Legal semeado com artigos base.');
  }
}
