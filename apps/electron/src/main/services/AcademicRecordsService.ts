export interface StudentRecord {
  id: string;
  name: string;
  enrollmentId: string;
  classId: string;
  parentContact: string;
  status: 'active' | 'graduated' | 'inactive';
  externalId?: string;
  legacySource?: string;
  lastSync?: string;
}

/**
 * AcademicRecordsService (v1631-v1635)
 * Centraliza os dados da secretaria e registros acadêmicos.
 */
class AcademicRecordsService {
  private db: any;

  public setDatabase(db: any) {
    this.db = db;
  }

  public async getStudent(id: string): Promise<StudentRecord | undefined> {
    if (!this.db) return undefined;
    const row = await this.db.get('SELECT * FROM students WHERE id = ?', [id]);
    if (!row) return undefined;
    
    return {
      id: row.id,
      name: row.name,
      enrollmentId: row.registrationNumber,
      classId: row.classId,
      parentContact: '', // TODO: Fetch from staff/parent connection table
      status: row.status as any,
      externalId: row.externalId,
      legacySource: row.legacySource,
      lastSync: row.lastSync
    };
  }

  public async getAllStudents(): Promise<StudentRecord[]> {
    if (!this.db) return [];
    const rows = await this.db.all('SELECT * FROM students');
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      enrollmentId: row.registrationNumber,
      classId: row.classId,
      status: row.status as any,
      parentContact: '',
      externalId: row.externalId,
      legacySource: row.legacySource,
      lastSync: row.lastSync
    }));
  }

  /**
   * Adiciona aluno (Persistência Real)
   */
  public async addStudent(student: StudentRecord) {
    if (!this.db) return;
    await this.db.run(`
      INSERT INTO students (id, name, registrationNumber, classId, status)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        registrationNumber=excluded.registrationNumber, 
        classId=excluded.classId, 
        status=excluded.status
    `, [student.id, student.name, student.enrollmentId, student.classId, student.status]);
  }

  /**
   * Atualiza metadados de sincronização legada
   */
  public async updateStudentLegacyData(id: string, metadata: { externalId: string; source: string; lastSync: string }) {
    if (!this.db) return;
    
    await this.db.run(`
        UPDATE students 
        SET externalId = ?, legacySource = ?, lastSync = ?
        WHERE id = ?
    `, [metadata.externalId, metadata.source, metadata.lastSync, id]);
    
    console.log(`[AcademicRecords] Student ${id} synced with ${metadata.source} ID: ${metadata.externalId}`);
  }

  /**
   * Reconciles internal records with legacy data to detect 'Ghost Students' or gaps.
   */
  public async reconcileHistoricalRecords(legacyRecords: any[]) {
    const students = await this.getAllStudents();
    const internalEnrollments = new Set(students.map(s => s.enrollmentId));
    const discrepancies: string[] = [];

    legacyRecords.forEach(lr => {
      if (!internalEnrollments.has(lr.externalId)) {
        discrepancies.push(`MISSING_INTERNAL: Student ${lr.name} exists in legacy but not in OS.`);
      }
    });

    if (discrepancies.length > 0) {
      console.warn(`[AcademicRecords] FOUND ${discrepancies.length} HISTORICAL DISCREPANCIES.`);
    }

    return discrepancies;
  }
}

export const academicRecordsService = new AcademicRecordsService();
