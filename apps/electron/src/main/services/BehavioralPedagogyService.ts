import { db } from '../../database/Database';
import { PromptRegistry } from './logic/PromptRegistry';
import { GenerativeAIService } from './GenerativeAIService';
import { logger } from '../logger';

/**
 * BehavioralPedagogyService.ts (v1.5.1)
 * ------------------------------------
 * Orquestra o fluxo de Guarda Pedagógica:
 * 1. Reformulação de incidentes brutos via IA.
 * 2. Persistência de alertas pedagógicos.
 * 3. Notificação automática para o próximo professor na grade horária.
 */
export class BehavioralPedagogyService {
  private aiService: GenerativeAIService;

  constructor(aiService: GenerativeAIService) {
    this.aiService = aiService;
  }

  /**
   * Transforma um relato bruto em uma análise pedagógica construtiva.
   */
  public async reformulateIncident(studentId: string, rawText: string): Promise<string> {
    const student = await db.getStudent(studentId);
    if (!student) throw new Error('Aluno não encontrado.');

    const prompt = PromptRegistry.PEDAGOGICAL_REFORMULATION({
      rawText,
      studentName: student.name
    });

    // Usamos o provedor de LLM configurado no sistema
    return await this.aiService._callLLMProvider(prompt, student.name);
  }

  /**
   * Salva o incidente e encaminha para a coordenação e o próximo professor.
   */
  public async forwardIncident(params: {
    studentId: string;
    classId: string;
    originalText: string;
    reformulatedText: string;
    severity: string;
  }): Promise<void> {
    const incidentId = `ped_${Date.now()}`;

    // 1. Salvar na tabela de notificações (como incidente pedagógico)
    await db.saveAlert({
      id: incidentId,
      type: 'BEHAVIORAL_INCIDENT',
      title: 'Guarda Pedagógica: Alerta de Comportamento',
      message: params.reformulatedText,
      severity: params.severity,
      studentId: params.studentId,
      timestamp: new Date()
    });

    // 2. Tentar encontrar o próximo professor do dia para este aluno
    try {
      const nextTeacher = await this.findNextTeacher(params.classId);
      if (nextTeacher) {
        logger.info(`[PedagogyGuard] Notificando próximo professor: ${nextTeacher.teacherName} (${nextTeacher.subject})`);
        
        await db.saveAlert({
          id: `${incidentId}_relay`,
          type: 'FOLLOWUP_REQUIRED',
          title: `Relay Pedagógico: ${params.severity}`,
          message: `Atenção: Houve um incidente na aula anterior com um aluno da turma. Detalhes: ${params.reformulatedText}`,
          severity: 'HIGH',
          userId: nextTeacher.teacherId, // Notificação direcionada
          studentId: params.studentId,
          timestamp: new Date()
        });
      }
    } catch (err) {
      logger.error(`[PedagogyGuard] Falha ao localizar próximo professor: ${err}`);
    }

    logger.info(`[PedagogyGuard] Incidente ${incidentId} encaminhado com sucesso.`);
  }

  /**
   * Localiza o próximo compromisso na grade horária da turma.
   */
  private async findNextTeacher(classId: string): Promise<{ teacherId: string, teacherName: string, subject: string } | null> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    // Busca o próximo horário que começa após o atual
    const nextSchedule = await db.get(`
      SELECT teacherId, teacher as teacherName, subject 
      FROM schedules 
      WHERE classId = ? AND dayOfWeek = ? AND startTime > ?
      ORDER BY startTime ASC 
      LIMIT 1
    `, [classId, dayOfWeek, timeStr]);

    return nextSchedule || null;
  }
}

// Exportamos uma instância singleton ligada ao GenerativeAIService padrão se necessário,
// mas tipicamente será instanciada no registerIPCHandlers.
