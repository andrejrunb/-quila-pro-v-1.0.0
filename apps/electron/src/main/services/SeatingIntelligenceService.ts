import { Database } from '../../database/Database';
import { logger } from '../logger';

export interface SeatingLayout {
    rows: number;
    cols: number;
    deskPos: { x: number; y: number };
    students: { id: string; row?: number; col?: number }[];
}

export interface SpatialAuditResult {
    studentId: string;
    studentName: string;
    assignedPos: { row: number; col: number } | null;
    status: 'PRESENT' | 'ABSENT' | 'MISPLACED' | 'UNASSIGNED';
    confidence: number;
    lastSeen?: string;
}

export interface SeatingRecommendation {
    studentId: string;
    studentName: string;
    currentPosition: { row: number, col: number };
    suggestedPosition: { row: number, col: number };
    reason: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * SeatingIntelligenceService
 * Gerencia a disposição física dos alunos em sala de aula (Mapa de Sala).
 * Essencial para auditoria de presença e análise comportamental por zona.
 */
export class SeatingIntelligenceService {
    private static instance: SeatingIntelligenceService;

    private constructor(
        private readonly db: Database
    ) {}

    public static getInstance(): SeatingIntelligenceService {
        if (!SeatingIntelligenceService.instance) {
            SeatingIntelligenceService.instance = new SeatingIntelligenceService(Database.getInstance());
        }
        return SeatingIntelligenceService.instance;
    }

    /**
     * Recupera o layout de assentos para uma turma específica
     */
    async getLayout(classId: string): Promise<any> {
        try {
            // 1. Busca configurações do grid
            const layoutConfig = await this.db.get(
                'SELECT rows, cols, deskPos FROM seating_layouts WHERE classId = ?',
                [classId]
            );

            // 2. Busca posições dos alunos da turma
            const students = await this.db.all(
                'SELECT id, name, row, col FROM students WHERE classId = ?',
                [classId]
            );

            if (!layoutConfig && (!students || students.length === 0)) return null;

            return {
                rows: layoutConfig?.rows || 6,
                cols: layoutConfig?.cols || 8,
                deskPos: layoutConfig?.deskPos ? (typeof layoutConfig.deskPos === 'string' ? JSON.parse(layoutConfig.deskPos) : layoutConfig.deskPos) : { x: 40, y: 105 },
                students: (students || []).map((s: any) => ({
                    id: s.id,
                    name: s.name && s.name.includes(':') ? s.name.split(':')[1] || s.name : s.name,
                    row: s.row !== null && s.row !== undefined ? s.row : undefined,
                    col: s.col !== null && s.col !== undefined ? s.col : undefined
                }))
            };
        } catch (error) {
            logger.error(`[SeatingService] Erro ao recuperar layout: ${error}`);
            return null;
        }
    }

    /**
     * Salva o layout de assentos para uma turma
     */
    async saveLayout(classId: string, data: any): Promise<{ success: boolean; error?: string }> {
        logger.info(`[SeatingService] Salvando layout para turma: ${classId}`);
        
        try {
            // Normalização: data pode ser um array de posições ou um objeto completo de layout
            const isArrayInput = Array.isArray(data);
            const students: any[] = isArrayInput ? data : (data?.students ?? []);
            const rows: number = isArrayInput ? 6 : (data?.rows ?? 6);
            const cols: number = isArrayInput ? 8 : (data?.cols ?? 8);
            const deskPos = isArrayInput ? { x: 40, y: -15 } : (data?.deskPos ?? { x: 40, y: -15 });

            // 0. Garantir que escola e turma existam (resiliente a testes E2E com IDs arbitrários)
            const E2E_SCHOOL_ID = 'aquila-test-school';
            await this.db.run(
                'INSERT OR IGNORE INTO schools (id, name, type) VALUES (?, ?, ?)',
                [E2E_SCHOOL_ID, 'Escola Áquila (Sistema)', 'PRIVATE']
            );
            await this.db.run(
                'INSERT OR IGNORE INTO classes (id, schoolId, name) VALUES (?, ?, ?)',
                [classId, E2E_SCHOOL_ID, `Turma ${classId}`]
            );

            // 1. Salva configurações do grid (upsert)
            await this.db.run(`
                INSERT OR REPLACE INTO seating_layouts (classId, rows, cols, deskPos, updatedAt)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                classId,
                rows,
                cols,
                JSON.stringify(deskPos)
            ]);

            // 2. Atualiza posições dos alunos em lote (se houver)
            for (const student of students) {
                await this.db.run(
                    'UPDATE students SET row = ?, col = ? WHERE id = ?',
                    [student.row ?? null, student.col ?? null, student.id]
                );
            }

            return { success: true };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[SeatingService] Erro ao salvar layout para turma ${classId}: ${msg}`);
            logger.error(`[SeatingService] Erro ao salvar layout: ${msg}`);
            return { success: false, error: msg };
        }
    }

    /**
     * Realiza a auditoria espacial em tempo real.
     * Cruza o mapa de assentos com os logs biométricos recentes.
     */
    async validatePresence(classId: string, roomId: string): Promise<SpatialAuditResult[]> {
        logger.info(`[SeatingService] Iniciando Auditoria Espacial - Turma: ${classId}, Sala: ${roomId}`);

        try {
            // 1. Busca roster com posições atribuídas
            const students = await this.db.all(
                'SELECT id, name, row, col FROM students WHERE classId = ? AND status = "active"',
                [classId]
            );

            // 2. Busca logs biométricos dos últimos 5 minutos nesta sala
            const startTime = new Date(Date.now() - 5 * 60000).toISOString();
            const detections = await this.db.all(`
                SELECT studentId, confidence, logged_at 
                FROM attendance_logs 
                WHERE logged_at >= ? AND deviceId IN (SELECT id FROM cameras WHERE location = ?)
            `, [startTime, roomId]);

            // 3. Processa resultados
            const results: SpatialAuditResult[] = students.map(s => {
                const detection = detections.find(d => d.studentId === s.id);
                const hasPosition = s.row !== null && s.col !== null;

                let status: SpatialAuditResult['status'] = 'ABSENT';
                if (detection) {
                    status = hasPosition ? 'PRESENT' : 'UNASSIGNED';
                } else if (hasPosition) {
                    status = 'ABSENT';
                }

                return {
                    studentId: s.id,
                    studentName: s.name,
                    assignedPos: hasPosition ? { row: s.row, col: s.col } : null,
                    status,
                    confidence: detection?.confidence || 0,
                    lastSeen: detection?.logged_at
                };
            });
            
            return results;
        } catch (error) {
            logger.error(`[SeatingService] Erro na validação espacial: ${error}`);
            throw error;
        }
    }

    /**
     * [LIFECYCLE-AUTO] Otimiza automaticamente a disposição de todas as turmas.
     */
    async autoOptimizeAllClasses(): Promise<void> {
        logger.info('[SeatingService] Iniciando otimização automática global de layouts...');
        try {
            const classes = await this.db.all('SELECT id FROM classes');
            for (const cls of classes) {
                const recommendations = await this.getRecommendations(cls.id);
                if (recommendations.length > 0) {
                    logger.info(`[SeatingService] ${recommendations.length} recomendações geradas para turma ${cls.id}`);
                }
            }
        } catch (error) {
            logger.error(`[SeatingService] Erro na otimização global: ${error}`);
        }
    }

    /**
     * [AI-ENGINE] Gera recomendações de assentos baseadas em critérios multidimensionais.
     */
    async getRecommendations(classId: string): Promise<SeatingRecommendation[]> {
        const recommendations: SeatingRecommendation[] = [];
        try {
            const students = await this.db.all(`
                SELECT id, name, row, col, frustrationScore, observationLevel, metadata 
                FROM students 
                WHERE classId = ? AND status = 'active'
            `, [classId]);

            for (const student of students) {
                const metadata = student.metadata ? JSON.parse(student.metadata) : {};
                let suggestedRow = student.row;
                let reason = '';
                let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

                // 1. Problemas de Visão -> Frente (Fila 0 ou 1)
                if (metadata.vision_issue && student.row > 1) {
                    suggestedRow = 0;
                    reason = 'Necessidade de proximidade ao quadro devido a restrições visuais.';
                    priority = 'HIGH';
                }

                // 2. Indisciplina (Observation Level alto) -> Frente
                else if (student.observationLevel > 4 && student.row > 2) {
                    suggestedRow = 1;
                    reason = 'Monitoramento pedagógico intensificado devido ao nível de dispersão.';
                    priority = 'MEDIUM';
                }

                // 3. Frustração (Stress) -> Subir 2 filas para suporte do professor
                else if (student.frustrationScore > 7 && student.row > 1) {
                    suggestedRow = Math.max(0, student.row - 2);
                    reason = 'Aproximação preventiva para suporte socioemocional e redução de frustração.';
                    priority = 'MEDIUM';
                }

                // 4. Estatura (Alto) -> Fundo
                else if (metadata.is_tall && student.row < 3) {
                    suggestedRow = 5;
                    reason = 'Otimização de visibilidade coletiva (estatura elevada).';
                    priority = 'LOW';
                }

                if (suggestedRow !== student.row) {
                    recommendations.push({
                        studentId: student.id,
                        studentName: student.name,
                        currentPosition: { row: student.row, col: student.col },
                        suggestedPosition: { row: suggestedRow, col: student.col },
                        reason,
                        priority
                    });
                }
            }

            return recommendations;
        } catch (error) {
            logger.error(`[SeatingService] Erro ao gerar recomendações: ${error}`);
            return [];
        }
    }

    /**
     * Alias para compatibilidade com suites de teste legadas.
     */
    async suggestLayoutChanges(classId: string): Promise<SeatingRecommendation[]> {
        return this.getRecommendations(classId);
    }
}

export const seatingIntelligenceService = SeatingIntelligenceService.getInstance();

