import Database, { db } from '../../database/Database';
import { logger } from '../logger';
import { EducationalAIIntegration } from './EducationalAIIntegration';
import { approvalWorkflowService } from './ApprovalWorkflowService';
import { photoLifecycleService } from './PhotoLifecycleService';
import { v4 as uuidv4 } from 'uuid';

/**
 * BoardAnalysisService (v3465)
 * Transforma giz em inteligência digital.
 */
export class BoardAnalysisService {
  private db: Database;
  private eduAI: EducationalAIIntegration;

  constructor(db: Database, eduAI: EducationalAIIntegration) {
    this.db = db;
    this.eduAI = eduAI;
  }

  /**
   * Processa uma foto de lousa e enfileira para aprovação.
   */
  public async analyzeAndQueue(subject: string, classId: string, base64Image: string) {
    logger.info(`[Vision] Iniciando análise de lousa para a disciplina: ${subject}`);

    // 1. Chamar o motor de processamento inteligente
    const result = await this.eduAI.processMaterial(`Lousa - ${subject}`, 'image', base64Image);

    // 2. Enfileirar para aprovação do professor no ApprovalWorkflow
    const approvalId = await approvalWorkflowService.enqueueContent({
      senderId: 'SYSTEM_VISION',
      type: 'MESSAGE',
      draft: result.summary,
      metadata: {
        subject,
        classId,
        flashcards: result.flashcards,
        transcript: result.transcript,
        youtubeQueries: result.youtubeQueries,
        studyCycle: result.studyCycleTasks,
        imageHint: `board_${Date.now()}.jpg`
      }
    });

    logger.info(`[Vision] Lousa processada e aguardando aprovação (ID: ${approvalId})`);
    return approvalId;
  }

  /**
   * Finaliza o processamento após o professor aprovar o rascunho.
   * Cria os flashcards reais para os alunos da turma.
   */
  public async finalizeApprovedBoard(approvalId: string) {
    const approval = await this.db.get(`SELECT metadata FROM communication_approvals WHERE id = ?`, [approvalId]);
    if (!approval) return;

    const metadata = JSON.parse(approval.metadata);
    const { subject, classId, flashcards, studyCycle, youtubeQueries } = metadata;

    // Buscar todos os alunos da turma
    const students = await this.db.all(`SELECT id FROM students WHERE classId = ?`, [classId]);

    for (const flashcard of flashcards) {
      const flashcardId = uuidv4();
      
      for (const student of students) {
        // 1. Criar o Flashcard
        await this.db.run(`
          INSERT INTO flashcards (id, studentId, subject, question, answer)
          VALUES (?, ?, ?, ?, ?)
        `, [flashcardId, student.id, subject, flashcard.question, flashcard.answer]);

        // 2. Iniciar o Cronograma SRS
        await this.db.run(`
          INSERT INTO srs_schedules (studentId, flashcardId, nextReview)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [student.id, flashcardId]);
      }
    }

    // 3. Criar Ciclo de Estudo (Tarefas Proativas) — Phase 707
    if (studyCycle && Array.isArray(studyCycle)) {
      for (const taskTemplate of studyCycle) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + taskTemplate.offsetDays);

        for (const student of students) {
          await (this.db as any).createStudentTask({
            studentId: student.id,
            title: taskTemplate.title,
            description: `${taskTemplate.description} (Referente à aula de ${subject})`,
            dueDate: dueDate,
            status: 'pending',
            sourceMaterialId: approvalId,
            youtubeLinks: youtubeQueries // Salva os termos de busca para o aluno
          });
        }
      }
    }

    logger.info(`[Vision] ${flashcards.length} flashcards e ${studyCycle?.length || 0} tarefas distribuídas para ${students.length} alunos.`);
    
    // 3. Limpeza de Mídia (Expurgo Soberano)
    if (metadata.imageHint) {
       await photoLifecycleService.purgeProcessedImage(metadata.imageHint);
    }
  }
}

