import { Logger } from './Logger';
import { Database } from '../../database/Database';

export interface AttendanceAuditResult {
    studentId: string;
    studentName: string;
    status: 'PRESENT' | 'ABSENT' | 'MISPLACED';
    confidence: number;
    lastSeen?: string;
    targetRoom?: string;
    currentRoom?: string;
}

/**
 * ScientificAttendanceService
 * Realiza a auditoria cruzada entre a grade horária e a biometria facial em tempo real.
 * Garante que o aluno está onde deveria estar.
 */
export class ScientificAttendanceService {
    constructor(
        private readonly db: Database,
        private readonly logger: Logger
    ) {}

    /**
     * Realiza a auditoria científica para uma aula específica
     */
    async auditClass(classId: string, roomId: string, timeWindowMinutes: number = 15, confidenceThreshold: number = 0.85): Promise<AttendanceAuditResult[]> {
        this.logger.info(`[ScientificAttendance] Iniciando auditoria para Turma: ${classId}, Sala: ${roomId} (Threshold: ${confidenceThreshold})`);

        try {
            // 1. Busca lista de alunos esperada para esta turma
            const roster = await this.db.all(`SELECT id, name FROM students WHERE classId = ? AND status = 'active'`, [classId]);
            
            // 2. Define a janela de tempo (padrão: agora +/- window)
            const now = new Date();
            const startTime = new Date(now.getTime() - timeWindowMinutes * 60000).toISOString();
            
            // 3. Busca logs biométricos recentes na sala alvo
            const detectionsInRoom = await this.db.all(`
                SELECT studentId, confidence, logged_at 
                FROM attendance_logs 
                WHERE logged_at >= ? AND confidence >= ? AND deviceId IN (SELECT id FROM cameras WHERE location = ?)
            `, [startTime, confidenceThreshold, roomId]);

            // 4. Busca logs biométricos em outras salas (detecção de evasão/erro)
            const detectionsElsewhere = await this.db.all(`
                SELECT al.studentId, al.confidence, al.logged_at, c.location 
                FROM attendance_logs al
                JOIN cameras c ON al.deviceId = c.id
                WHERE al.logged_at >= ? AND al.confidence >= ? AND c.location != ?
            `, [startTime, confidenceThreshold, roomId]);

            // 5. Motor de Comparação (Cross-Audit Engine)
            const results: AttendanceAuditResult[] = roster.map(student => {
                const inRoom = detectionsInRoom.find(d => d.studentId === student.id);
                const elsewhere = detectionsElsewhere.find(d => d.studentId === student.id);

                if (inRoom) {
                    return {
                        studentId: student.id,
                        studentName: student.name,
                        status: 'PRESENT',
                        confidence: inRoom.confidence,
                        lastSeen: inRoom.logged_at
                    };
                }

                if (elsewhere) {
                    return {
                        studentId: student.id,
                        studentName: student.name,
                        status: 'MISPLACED',
                        confidence: elsewhere.confidence,
                        lastSeen: elsewhere.logged_at,
                        targetRoom: roomId,
                        currentRoom: elsewhere.location
                    };
                }

                return {
                    studentId: student.id,
                    studentName: student.name,
                    status: 'ABSENT',
                    confidence: 0
                };
            });

            // 6. Log de Auditoria
            const presentCount = results.filter(r => r.status === 'PRESENT').length;
            this.logger.info(`[ScientificAttendance] Auditoria concluída. Presentes: ${presentCount}/${roster.length}`);
            
            return results;

        } catch (error) {
            this.logger.error(`[ScientificAttendance] Erro na auditoria: ${error}`);
            throw error;
        }
    }

    /**
     * Confirma a presença no banco de dados após validação científica
     */
    async confirmAttendance(results: AttendanceAuditResult[], classId: string, scheduleId: string) {
        const date = new Date().toISOString().split('T')[0];
        
        for (const res of results) {
            const attendanceId = `att_${Date.now()}_${res.studentId}`;
            await this.db.run(`
                INSERT OR REPLACE INTO attendance (id, studentId, classId, scheduleId, date, status, confidence, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                attendanceId,
                res.studentId,
                classId,
                scheduleId,
                date,
                res.status,
                res.confidence
            ]);

            // Se o aluno estiver MISPLACED ou ABSENT, gera notificação para coordenação
            if (res.status !== 'PRESENT') {
                await this.triggerSecurityProtocol(res, classId);
            }
        }
    }

    private async triggerSecurityProtocol(result: AttendanceAuditResult, classId: string) {
        const title = result.status === 'MISPLACED' ? '🚨 Aluno em Local Incorreto' : '⚠️ Alerta de Ausência';
        const message = result.status === 'MISPLACED' 
            ? `O aluno ${result.studentName} deveria estar na sala ${result.targetRoom}, mas foi detectado em ${result.currentRoom}.`
            : `O aluno ${result.studentName} não foi detectado na sala de aula.`;

        await this.db.run(`
            INSERT INTO notifications (id, type, title, message, priority, studentId, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [`not_sec_${Date.now()}`, 'SECURITY', title, message, 'HIGH', result.studentId]);
    }
}
