import { Database } from '../../apps/electron/src/database/Database';
import * as fs from 'fs';
import * as path from 'path';

async function testTaskLGPDShield() {
    console.log('--- TESTE DE BLINDAGEM LGPD: STUDENT_TASKS ---');
    
    // Setup Mock Database
    const testDbPath = path.join(__dirname, 'test_lgpd.db');
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    
    const db = new Database(testDbPath);
    await db.initialize();

    const testStudentId = 'ST-XP-123';
    
    console.log('0. Semeando infraestrutura de teste...');
    await db.run("INSERT OR IGNORE INTO schools (id, name) VALUES ('school-s-01', 'Test School')");
    await db.run("INSERT OR IGNORE INTO classes (id, schoolId, name) VALUES ('class-s-01', 'school-s-01', 'Test Class')");
    
    console.log('0.1 Semeando estudante de teste...');
    const student = {
        id: testStudentId,
        classId: 'class-s-01',
        name: 'Test Student LGPD',
        status: 'active'
    };
    await db.run("INSERT INTO students (id, classId, name, status) VALUES (?, ?, ?, ?)", [student.id, student.classId, student.name, student.status]);

    const testTask = {
        id: 'task-shield-test',
        studentId: testStudentId,
        title: 'Revisão de Álgebra',
        description: 'Conteúdo sensível sobre o aprendizado do aluno.',
        dueDate: new Date(),
        youtubeLinks: ['https://youtube.com/watch?v=123']
    };

    console.log('1. Criando tarefa com blindagem ativa...');
    await db.createStudentTask(testTask);

    console.log('2. Verificando persistência (Raw Access)...');
    const rawRows: any = await db.all('SELECT description, youtubeLinks FROM student_tasks WHERE id = ?', [testTask.id]);
    const rawRecord = rawRows[0];
    
    if (rawRecord.description.includes('sensível')) {
        console.error('FAIL: A descrição foi salva em TEXTO PLANO!');
    } else {
        console.log('OK: Descrição criptografada no banco:', rawRecord.description.substring(0, 20) + '...');
    }

    console.log('3. Recuperando tarefa via API segura...');
    const tasks = await db.getStudentTasks(testStudentId);
    const retrieved = tasks.find(t => t.id === testTask.id);

    if (retrieved && retrieved.description === testTask.description) {
        console.log('OK: Descriptografia bem-sucedida.');
    } else {
        console.error('FAIL: Falha ao recuperar dado original.');
    }

    console.log('4. Testando expurgo...');
    await db.purgeOldTasks(0); // Forçar remoção de tudo criado hoje (cutoff de 0 dias)
    const afterPurge = await db.getStudentTasks(testStudentId);
    if (afterPurge.length === 0) {
        console.log('OK: Expurgo funcional.');
    } else {
        console.error('FAIL: Expurgo não removeu os registros.');
    }

    console.log('\n--- FIM DO TESTE ---');
    db.close();
    fs.unlinkSync(testDbPath);
}

testTaskLGPDShield().catch(console.error);
