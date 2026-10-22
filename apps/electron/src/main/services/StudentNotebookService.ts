import { Database } from '../../database/Database';
import { logger } from '../logger';

export interface StudySource {
  title: string;
  markdown: string;
  date: string;
}

/**
 * NotebookBridgeService (v3465)
 * O elo entre a soberania escolar e o estudo pessoal na nuvem.
 */
export class StudentNotebookService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Compila as anotações do aluno para um intervalo de datas.
   */
  public async compileStudyPackage(studentId: string, days: number = 7): Promise<StudySource> {
    logger.info(`[Bridge] Compilando pacote de estudo dos últimos ${days} dias para o aluno ${studentId}`);

    // Buscar resumos de lousa aprovados (vistos pelo professor)
    const materials = await this.db.all(`
      SELECT m.title, m.summary, m.createdAt 
      FROM lessons_learned m
      WHERE m.studentId = ? AND m.createdAt >= date('now', ?)
    `, [studentId, `-${days} days`]);

    // Buscar flashcards ativos
    const flashcards = await this.db.all(`
      SELECT question, answer, subject 
      FROM flashcards 
      WHERE studentId = ? AND createdAt >= date('now', ?)
    `, [studentId, `-${days} days`]);

    // Gerar o Markdown Estruturado (Otimizado para LLMs via RAG)
    let markdown = `# Diário de Estudos Soberano - Áquila Pro\n\n`;
    markdown += `Relatório gerado em: ${new Date().toLocaleDateString()}\n\n`;

    markdown += `## 📚 Resumos de Aula\n\n`;
    for (const m of materials) {
      markdown += `### ${m.title} (${new Date(m.createdAt).toLocaleDateString()})\n`;
      markdown += `${m.summary}\n\n`;
    }

    markdown += `## 🧠 Flashcards de Revisão (SRS)\n\n`;
    for (const f of flashcards) {
       markdown += `**Pergunta (${f.subject}):** ${f.question}\n`;
       markdown += `**Resposta:** ${f.answer}\n\n`;
    }

    logger.info(`[Bridge] Pacote de estudo compilado: ${markdown.length} bytes.`);
    
    return {
      title: `Aquila_Study_Package_${studentId}.md`,
      markdown,
      date: new Date().toISOString()
    };
  }

  /**
   * Converte para Base64 para download fácil via Frontend (Agente 2).
   */
  public getDownloadablePackage(source: StudySource): string {
    return Buffer.from(source.markdown).toString('base64');
  }
}

