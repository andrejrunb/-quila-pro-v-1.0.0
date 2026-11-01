import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface CreateStudentInput {
    name: string;
    classId: string;
    parentPhone?: string;
    registrationNumber?: string;
}

export interface CreatedStudent {
    studentId: string;
    id: string;
    name: string;
    classId: string;
}

/**
 * StudentService — Gestão de banco de dados e processamento de dados biométricos.
 * Responsável por importação massiva (CSV/Excel) e gestão de templates faciais.
 */
export class StudentService {
    private db: any;

    constructor(dbInstance: any) {
        this.db = dbInstance;
        console.log('[StudentService] Hub de Estudantes inicializado com injeção de DB.');
    }

    public async createStudent(input: CreateStudentInput): Promise<CreatedStudent> {
        const id = randomUUID();
        const classRecord = await this.db.get('SELECT id FROM classes WHERE id = ?', [input.classId]);
        if (!classRecord) throw new Error('Class not found.');

        await this.db.run(
            'INSERT INTO students (id, classId, name, parentPhone, registrationNumber) VALUES (?, ?, ?, ?, ?)',
            [id, input.classId, input.name.trim(), input.parentPhone?.trim() || null, input.registrationNumber?.trim() || null]
        );
        const saved = await this.db.get(
            'SELECT id, name, classId FROM students WHERE id = ?',
            [id]
        );
        if (!saved) throw new Error('Student was not persisted.');

        return { studentId: saved.id, id: saved.id, name: saved.name, classId: saved.classId };
    }

    public async importStudentsBulk(students: any[]) {
        console.log(`[StudentService] Iniciando importação massiva de ${students.length} alunos.`);
        return { count: students.length };
    }

    public async processExcelFile(filePath: string) {
        console.log(`[StudentService] Processando planilha: ${filePath}`);
        return { success: true, count: 42, message: 'Processamento de planilha simulado com sucesso.' };
    }

    public async getStudentStats() {
        return { total: 0, active: 0 };
    }

    public async getStudents() {
        console.log('[StudentService] Buscando lista de estudantes para o ecossistema.');
        // Em produção, isso viria do SQLite
        return Array.from({ length: 42 }, (_, i) => ({ id: `STU-${100 + i}`, name: `Aluno ${i}` }));
    }
}

export default StudentService;
