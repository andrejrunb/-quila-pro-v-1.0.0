import { Database } from '../../database/Database';
import { GenerativeAIService } from './GenerativeAIService';

export class ScheduleGeneratorService {
  private db: Database;
  private aiService: GenerativeAIService;

  constructor(db: Database, aiService: GenerativeAIService) {
    this.db = db;
    this.aiService = aiService;
  }

  async generateOptimalSchedule(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // 1. Gather all necessary constraints
      const teachers = await this.db.all("SELECT * FROM staff WHERE role IN ('Teacher', 'teacher', 'docente')");
      const classes = await this.db.all('SELECT * FROM classes');
      const rooms = await this.db.all('SELECT * FROM rooms');

      if (!teachers.length || !classes.length) {
        return { success: false, message: 'Faltam professores ou turmas cadastradas para gerar a grade.' };
      }

      // 2. Build Prompt for LLM
      const prompt = `
Você é um sistema autônomo de otimização logística.
Seu objetivo é gerar uma grade horária escolar (JSON) sem choque de horários.
Temos as seguintes turmas: ${JSON.stringify(classes.map(c => ({ id: c.id, name: c.name })))}
Temos os seguintes professores: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name })))}
Temos as seguintes salas: ${JSON.stringify(rooms.map(r => ({ id: r.id, name: r.name })))}

Regras:
1. Cada turma deve ter pelo menos 3 aulas por dia (ex: 07:00, 08:00, 09:00).
2. Um professor não pode dar aula em duas turmas diferentes no mesmo horário.
3. Retorne EXCLUSIVAMENTE um JSON válido no seguinte formato e nada mais:
[
  { "classId": "class-id", "teacherId": "teacher-id", "roomId": "room-id", "dayOfWeek": 1, "time": "07:00" },
  ...
]
`;

      // 3. Call AI Service (Ollama / Gemini)
      const aiResponse = await this.aiService.analyzeContent(prompt); 
      
      // Attempt to parse JSON from AI response
      let schedules;
      try {
        const jsonMatch = aiResponse.match(/\[.*\]/s);
        const rawJson = jsonMatch ? jsonMatch[0] : aiResponse;
        schedules = JSON.parse(rawJson);
        if (!Array.isArray(schedules)) throw new Error("Not an array");
      } catch (e) {
        throw new Error("A IA não retornou um formato JSON válido. Resposta: " + aiResponse.substring(0, 100));
      }

      // 4. Save into Database
      // Clear existing schedules for safety (simplified logic)
      await this.db.run('DELETE FROM schedules');
      
      for (const sched of schedules) {
        await this.db.run(
          `INSERT INTO schedules (id, classId, subject, teacherId, roomId, dayOfWeek, time) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`sched-${Date.now()}-${Math.random().toString(36).substring(7)}`, sched.classId, 'Aula Geral', sched.teacherId, sched.roomId || 'Sala Padrão', sched.dayOfWeek, sched.time]
        );
      }

      return { success: true, message: 'Grade gerada e sincronizada com sucesso!', data: schedules };
    } catch (err: any) {
      console.error('[ScheduleGenerator] Erro ao gerar grade com IA:', err);
      return { success: false, message: err.message };
    }
  }
}
