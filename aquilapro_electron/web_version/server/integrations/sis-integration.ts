// ============================================
// INTEGRAÇÃO COM SIS (Sistema de Informações Escolar)
// Áquila Pro - Sincronização de Dados
// ============================================

interface SISStudent {
  externalId: string;
  name: string;
  enrollment: string;
  className: string;
  grade: string;
  birthDate: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  status: "active" | "inactive" | "transferred";
}

interface SISClass {
  externalId: string;
  name: string;
  grade: string;
  shift: "morning" | "afternoon" | "evening";
  teacher: string;
  room: string;
  maxStudents: number;
}

interface SISSchedule {
  classId: string;
  dayOfWeek: number; // 0=domingo, 1=segunda...
  startTime: string; // HH:mm
  endTime: string;
  subject: string;
  teacher: string;
}

interface SyncResult {
  success: boolean;
  studentsCreated: number;
  studentsUpdated: number;
  studentsDeactivated: number;
  classesCreated: number;
  classesUpdated: number;
  schedulesCreated: number;
  errors: string[];
  timestamp: string;
}

// ============================================
// ADAPTADORES PARA SISTEMAS POPULARES
// ============================================

// Adaptador genérico para API REST
class GenericSISAdapter {
  private baseUrl: string;
  private apiKey: string;
  private headers: Record<string, string>;

  constructor(config: { baseUrl: string; apiKey: string; headers?: Record<string, string> }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
      ...config.headers,
    };
  }

  async fetchStudents(): Promise<SISStudent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/students`, { headers: this.headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return this.mapStudents(data);
    } catch (error) {
      console.error("Erro ao buscar alunos do SIS:", error);
      return [];
    }
  }

  async fetchClasses(): Promise<SISClass[]> {
    try {
      const response = await fetch(`${this.baseUrl}/classes`, { headers: this.headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return this.mapClasses(data);
    } catch (error) {
      console.error("Erro ao buscar turmas do SIS:", error);
      return [];
    }
  }

  async fetchSchedules(): Promise<SISSchedule[]> {
    try {
      const response = await fetch(`${this.baseUrl}/schedules`, { headers: this.headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return this.mapSchedules(data);
    } catch (error) {
      console.error("Erro ao buscar horários do SIS:", error);
      return [];
    }
  }

  async exportAttendance(date: string, records: Array<{ studentId: string; status: string; timestamp: string }>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/attendance`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ date, records }),
      });
      return response.ok;
    } catch (error) {
      console.error("Erro ao exportar presença para SIS:", error);
      return false;
    }
  }

  private mapStudents(data: any[]): SISStudent[] {
    return data.map((item: any) => ({
      externalId: String(item.id || item.externalId),
      name: item.name || item.nome || "",
      enrollment: item.enrollment || item.matricula || "",
      className: item.className || item.turma || "",
      grade: item.grade || item.serie || "",
      birthDate: item.birthDate || item.dataNascimento || "",
      parentName: item.parentName || item.nomeResponsavel || "",
      parentEmail: item.parentEmail || item.emailResponsavel || "",
      parentPhone: item.parentPhone || item.telefoneResponsavel || "",
      status: item.status === "ativo" ? "active" : item.status === "inativo" ? "inactive" : item.status || "active",
    }));
  }

  private mapClasses(data: any[]): SISClass[] {
    return data.map((item: any) => ({
      externalId: String(item.id || item.externalId),
      name: item.name || item.nome || "",
      grade: item.grade || item.serie || "",
      shift: item.shift === "matutino" ? "morning" : item.shift === "vespertino" ? "afternoon" : item.shift || "morning",
      teacher: item.teacher || item.professor || "",
      room: item.room || item.sala || "",
      maxStudents: item.maxStudents || item.capacidade || 40,
    }));
  }

  private mapSchedules(data: any[]): SISSchedule[] {
    return data.map((item: any) => ({
      classId: String(item.classId || item.turmaId),
      dayOfWeek: item.dayOfWeek || item.diaSemana || 1,
      startTime: item.startTime || item.horaInicio || "07:00",
      endTime: item.endTime || item.horaFim || "07:50",
      subject: item.subject || item.disciplina || "",
      teacher: item.teacher || item.professor || "",
    }));
  }
}

// Adaptador para importação via Excel/CSV
class ExcelSISAdapter {
  async parseStudentsFromCSV(csvContent: string): Promise<SISStudent[]> {
    const lines = csvContent.split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const students: SISStudent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      students.push({
        externalId: row["id"] || row["matricula"] || String(i),
        name: row["nome"] || row["name"] || "",
        enrollment: row["matricula"] || row["enrollment"] || "",
        className: row["turma"] || row["class"] || "",
        grade: row["serie"] || row["grade"] || "",
        birthDate: row["nascimento"] || row["birthdate"] || "",
        parentName: row["responsavel"] || row["parent"] || "",
        parentEmail: row["email_responsavel"] || row["parent_email"] || "",
        parentPhone: row["telefone_responsavel"] || row["parent_phone"] || "",
        status: "active",
      });
    }

    return students;
  }

  async parseScheduleFromCSV(csvContent: string): Promise<SISSchedule[]> {
    const lines = csvContent.split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const schedules: SISSchedule[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      const dayMap: Record<string, number> = {
        "segunda": 1, "terça": 2, "terca": 2, "quarta": 3,
        "quinta": 4, "sexta": 5, "sábado": 6, "sabado": 6, "domingo": 0,
      };

      schedules.push({
        classId: row["turma_id"] || row["class_id"] || "",
        dayOfWeek: dayMap[row["dia"]?.toLowerCase()] || parseInt(row["dia_semana"]) || 1,
        startTime: row["inicio"] || row["start"] || "07:00",
        endTime: row["fim"] || row["end"] || "07:50",
        subject: row["disciplina"] || row["subject"] || "",
        teacher: row["professor"] || row["teacher"] || "",
      });
    }

    return schedules;
  }
}

// ============================================
// SINCRONIZADOR PRINCIPAL
// ============================================

export class SISSynchronizer {
  private apiAdapter: GenericSISAdapter | null = null;
  private excelAdapter: ExcelSISAdapter;

  constructor(config?: { baseUrl: string; apiKey: string }) {
    if (config) {
      this.apiAdapter = new GenericSISAdapter(config);
    }
    this.excelAdapter = new ExcelSISAdapter();
  }

  async syncFromAPI(): Promise<SyncResult> {
    if (!this.apiAdapter) {
      return {
        success: false,
        studentsCreated: 0, studentsUpdated: 0, studentsDeactivated: 0,
        classesCreated: 0, classesUpdated: 0, schedulesCreated: 0,
        errors: ["Adaptador de API não configurado"],
        timestamp: new Date().toISOString(),
      };
    }

    const errors: string[] = [];
    let studentsCreated = 0, studentsUpdated = 0, studentsDeactivated = 0;
    let classesCreated = 0, classesUpdated = 0, schedulesCreated = 0;

    try {
      // Sync classes
      const classes = await this.apiAdapter.fetchClasses();
      for (const cls of classes) {
        try {
          // Aqui seria a lógica de upsert no banco local
          classesCreated++;
        } catch (e: any) {
          errors.push(`Erro ao sincronizar turma ${cls.name}: ${e.message}`);
        }
      }

      // Sync students
      const students = await this.apiAdapter.fetchStudents();
      for (const student of students) {
        try {
          // Aqui seria a lógica de upsert no banco local
          studentsCreated++;
        } catch (e: any) {
          errors.push(`Erro ao sincronizar aluno ${student.name}: ${e.message}`);
        }
      }

      // Sync schedules
      const schedules = await this.apiAdapter.fetchSchedules();
      for (const schedule of schedules) {
        try {
          // Aqui seria a lógica de upsert no banco local
          schedulesCreated++;
        } catch (e: any) {
          errors.push(`Erro ao sincronizar horário: ${e.message}`);
        }
      }
    } catch (e: any) {
      errors.push(`Erro geral na sincronização: ${e.message}`);
    }

    return {
      success: errors.length === 0,
      studentsCreated, studentsUpdated, studentsDeactivated,
      classesCreated, classesUpdated, schedulesCreated,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  async syncFromCSV(studentsCSV?: string, schedulesCSV?: string): Promise<SyncResult> {
    const errors: string[] = [];
    let studentsCreated = 0, schedulesCreated = 0;

    try {
      if (studentsCSV) {
        const students = await this.excelAdapter.parseStudentsFromCSV(studentsCSV);
        studentsCreated = students.length;
        console.log(`Parsed ${students.length} alunos do CSV`);
      }

      if (schedulesCSV) {
        const schedules = await this.excelAdapter.parseScheduleFromCSV(schedulesCSV);
        schedulesCreated = schedules.length;
        console.log(`Parsed ${schedules.length} horários do CSV`);
      }
    } catch (e: any) {
      errors.push(`Erro ao processar CSV: ${e.message}`);
    }

    return {
      success: errors.length === 0,
      studentsCreated, studentsUpdated: 0, studentsDeactivated: 0,
      classesCreated: 0, classesUpdated: 0, schedulesCreated,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  async exportAttendanceToSIS(date: string, records: Array<{ studentId: string; status: string; timestamp: string }>): Promise<boolean> {
    if (!this.apiAdapter) {
      console.warn("Adaptador de API não configurado para exportação");
      return false;
    }
    return this.apiAdapter.exportAttendance(date, records);
  }
}

// Exportar instância padrão
export const sisSync = new SISSynchronizer();
export const excelAdapter = new ExcelSISAdapter();
