import { Logger } from './Logger';
import Database from '../../database/Database';
import { LocalAudioIntelligenceService } from './LocalAudioIntelligenceService';
import { WhatsAppMessagingService } from './WhatsAppMessagingService';

/**
 * PedagogicalOrchestrator
 * Orquestra o ecossistema pedagógico do Áquila Pro.
 * Conecta o processamento de áudio local com o histórico, coordenação e comunicação com pais.
 */
export class PedagogicalOrchestrator {
    constructor(
        private readonly db: Database,
        private readonly audioAI: LocalAudioIntelligenceService,
        private readonly whatsapp: WhatsAppMessagingService,
        private readonly logger: Logger
    ) {}

    /**
     * Processa um relatório de aula enviado via áudio
     */
    async processAudioReport(teacherId: string, classId: string, roomId: string, audioPath: string) {
        this.logger.info(`[Orchestrator] Iniciando processamento de relatório para Prof: ${teacherId}, Turma: ${classId}`);

        try {
            // 1. Transcrição Local
            const transcription = await this.audioAI.transcribeLocal(audioPath);

            // 2. Resumo Pedagógico via IA Local (Ollama)
            const summary = await this.audioAI.summarizePedagogically(transcription);

            // 3. Extração de Insights (sentimento, engajamento)
            // Para simplificar, usamos um objeto fixo aqui que seria gerado pela audioAI
            const insights = {
                engagement: 0.85,
                sentiment: 'positive',
                topics: ['geometria', 'álgebra'],
                alerts: []
            };

            // 4. Persistência no Banco de Dados
            const reportId = `rep_${Date.now()}`;
            await this.db.saveClassReport({
                id: reportId,
                teacherId,
                classId,
                roomId,
                transcription,
                summary,
                insights,
                routingStatus: 'COMPLETED'
            });

            // 5. Roteamento Pedagógico Inteligente
            const classInfo = await this.db.get(`SELECT name FROM classes WHERE id = ?`, [classId]);
            const className = classInfo?.name || 'Turma';

            // A. Notificação para Coordenação
            const coordUsers = await this.db.getCoordinationUsersByClass(classId);
            for (const coord of coordUsers) {
                await this.routeNotification(coord, `Resumo Pedagógico: ${className}`, summary);
            }
            
            // B. Notificação para Pais e Alunos
            const students = await this.db.all('SELECT * FROM students WHERE classId = ?', [classId]);
            for (const student of students) {
                // Notifica Pais
                const parent = await this.db.getParentUserByStudent(student.id);
                if (parent) {
                    await this.routeNotification(parent, `Novidades de ${student.name}`, summary, student.name);
                }

                // Notifica Aluno (se tiver usuário vinculado)
                const studentUser = await this.db.get('SELECT * FROM users WHERE id = ?', [student.id]);
                if (studentUser) {
                    await this.routeNotification(studentUser, `Resumo da sua aula`, `Você participou de uma aula de ${insights.topics.join(', ')}. Veja o que foi discutido!`);
                }
            }

            // C. Auditoria Central
            await this.db.logAudit(teacherId, 'PEDAGOGICAL_REPORT', `Relatório gerado para turma ${classId}`, { reportId });

            return { success: true, transcription, summary };

        } catch (error) {
            this.logger.error(`[Orchestrator] Erro ao processar relatório: ${error}`);
            throw error;
        }
    }

    /**
     * Retorna os relatórios mais recentes processados pelo Córtex.
     */
    public async getRecentReports(limit: number = 5): Promise<any[]> {
      // Em um cenário real, buscaríamos na tabela pedagogical_reports
      // Por enquanto, simulamos para o Dashboard Executivo
      return [
        { id: 1, teacherName: 'Prof. André', classId: '3º Ano A', summary: 'Aula de frações concluída. Engajamento alto.', timestamp: new Date().toISOString() },
        { id: 2, teacherName: 'Prof. Camila', classId: '2º Ano B', summary: 'Laboratório de Química. Sem intercorrências.', timestamp: new Date().toISOString() }
      ];
    }

    /**
     * Roteia a notificação baseado no engajamento do usuário (App vs WhatsApp)
     */
    public async sendNotification(userId: string, title: string, content: string, type: 'PEDAGOGICAL' | 'FINANCIAL' | 'SECURITY' = 'PEDAGOGICAL', studentName?: string) {
        const user = await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) return;

        const lastInteraction = user.last_app_interaction ? new Date(user.last_app_interaction) : null;
        const now = new Date();
        const isAppActive = lastInteraction && (now.getTime() - lastInteraction.getTime() < 24 * 60 * 60 * 1000); // Ativo nas últimas 24h

        if (isAppActive && user.notification_pref !== 'WHATSAPP') {
            // Push Interno (Persistência para o App consumir)
            await this.db.run(
                'INSERT INTO notifications (id, title, message, type, targetUserId) VALUES (?, ?, ?, ?, ?)',
                [`not_${Date.now()}_${user.id}`, title, content, type, user.id]
            );
            this.logger.info(`[Orchestrator] Notificação App (${type}) enviada para ${user.name}`);
        } else {
            // WhatsApp Rescue / Incentive Logic
            let message = '';
            if (type === 'FINANCIAL') {
                message = `Olá ${user.name}! 🦅 Identificamos uma pendência financeira no Áquila Pro. Confira os detalhes no App e evite multas. O Áquila agradece sua parceria!`;
            } else {
                message = studentName 
                    ? `Olá ${user.name}! 🦅 O professor de *${studentName}* enviou um resumo da aula de hoje:\n\n"${content}"\n\nAcompanhe o progresso diário no App Áquila!`
                    : `Olá ${user.name}! 🦅 Novo resumo pedagógico disponível:\n\n"${content}"\n\nAcesse o App Áquila para mais detalhes.`;
            }
            
            await this.whatsapp.sendMessage(user.phone || '5500000000000', message);
            this.logger.info(`[Orchestrator] WhatsApp Rescue (${type}) enviado para ${user.name} (${user.phone})`);
        }
    }

    /**
     * Roteia a notificação baseado no engajamento do usuário (Internal legacy wrapper)
     */
    private async routeNotification(user: any, title: string, content: string, studentName?: string) {
        return this.sendNotification(user.id, title, content, 'PEDAGOGICAL', studentName);
    }

    /**
     * Identifica a aula atual do professor baseado no horário
     */
    async getCurrentClass(teacherId: string) {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0-6 (Domingo-Sábado)
        const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        const schedules = await this.db.getTeacherSchedule(teacherId, dayOfWeek);
        
        // Encontra o horário que engloba o momento atual
        const currentSchedule = schedules.find(s => s.startTime <= time && s.endTime >= time);

        if (currentSchedule) {
            // Busca detalhes da turma
            const classInfo = await this.db.get(`SELECT * FROM classes WHERE id = ?`, [currentSchedule.classId]);
            return {
                ...currentSchedule,
                className: classInfo?.name || 'Turma Desconhecida'
            };
        }

        return null;
    }
}
