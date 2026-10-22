import Database from '../../database/Database';

/**
 * ClassroomEntryService.ts — AG-023
 * Monitora a transição entre Entrada na Escola e Entrada em Sala.
 * Requisito de áudio do usuário (Fluxo 07:30).
 */
export class ClassroomEntryService {
  private readonly DEFAULT_START_TIME = '07:30';

  constructor(private readonly db: Database) {}

  /**
   * Obtém o status consolidado usando os vínculos de Grade Horária (AG-024).
   */
  async getFullStatus(): Promise<any> {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dayOfWeek = now.getDay(); // 0-6 (Dom-Sab)
    const todayStr = now.toISOString().split('T')[0];

    // 1. Quem deve estar em sala agora?
    const scheduledStudents = await this.db.getStudentsScheduledNow(time, dayOfWeek);
    
    // 2. Buscar presenças reais hoje
    const todayNotifications = await this.db.all(`
      SELECT studentId, type, message, cameraId, timestamp 
      FROM notifications 
      WHERE date(timestamp) = ?
    `, [todayStr]);

    // 3. Processar Status
    const totalStudents = (await this.db.get('SELECT COUNT(*) as count FROM students')).count;
    
    const arrivedIds = new Set(todayNotifications.filter(n => n.type === 'ENTRY_CONFIRMATION' || n.type === 'BEHAVIORAL').map(n => n.studentId));
    
    const studentsInClass = new Set();
    const outsideClass: any[] = [];

    for (const s of scheduledStudents) {
        // Verificar se o aluno foi visto na câmera específica daquela sala
        const seenInRoom = todayNotifications.some(n => 
            n.studentId === s.studentId && 
            n.type === 'CLASSROOM_ENTRY' && 
            n.cameraId === s.cameraId
        );

        if (seenInRoom) {
            studentsInClass.add(s.studentId);
        } else if (arrivedIds.has(s.studentId)) {
            // Está na escola mas não na sala vinculada
            outsideClass.push({
                id: s.studentId,
                name: s.studentName,
                lastSeen: `Deveria estar em: ${s.roomName} (${s.subject})`
            });
        }
    }

    return {
      total: totalStudents,
      arrived: arrivedIds.size,
      inClass: studentsInClass.size,
      outsideClass: outsideClass,
      notArrived: Math.max(0, totalStudents - arrivedIds.size),
      metrics: {
        percArrived: totalStudents > 0 ? Math.round((arrivedIds.size / totalStudents) * 100) : 0,
        percInClass: arrivedIds.size > 0 ? Math.round((studentsInClass.size / arrivedIds.size) * 100) : 0,
        percTotalInClass: totalStudents > 0 ? Math.round((studentsInClass.size / totalStudents) * 100) : 0
      },
      updatedAt: now.toISOString()
    };
  }
}

