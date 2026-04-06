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
  private students: Map<string, StudentRecord> = new Map();

  constructor() {
    // Mock inicial
    this.addStudent({
      id: 'std-001',
      name: 'Andrej',
      enrollmentId: '2026-001',
      classId: '3A',
      parentContact: '+55 11 98888-8888',
      status: 'active'
    });
  }

  public addStudent(student: StudentRecord) {
    this.students.set(student.id, student);
  }

  public getStudent(id: string): StudentRecord | undefined {
    return this.students.get(id);
  }

  /**
   * Atualiza metadados de sincronização legada
   */
  public updateStudentLegacyData(id: string, metadata: { externalId: string; source: string; lastSync: string }) {
    const student = this.getStudent(id);
    if (student) {
        student.externalId = metadata.externalId;
        student.legacySource = metadata.source;
        student.lastSync = metadata.lastSync;
        console.log(`[AcademicRecords] Student ${id} synced with ${metadata.source} ID: ${metadata.externalId}`);
    }
  }

  public getAllStudents(): StudentRecord[] {
    return Array.from(this.students.values());
  }

  /**
   * Reconciles internal records with legacy data to detect 'Ghost Students' or gaps.
   */
  public reconcileHistoricalRecords(legacyRecords: any[]) {
    const internalEnrollments = new Set(this.getAllStudents().map(s => s.enrollmentId));
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
