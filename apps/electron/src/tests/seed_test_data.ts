import { Database } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';

const FIRST_NAMES = ['Gabriel', 'Lucas', 'Mateus', 'Enzo', 'Guilherme', 'Rafael', 'João', 'Felipe', 'Gustavo', 'Vitor', 'Thiago', 'Bruno', 'Nicolas', 'Daniel', 'Rodrigo', 'André', 'Eduardo', 'Samuel', 'Pietro', 'Davi', 'Julia', 'Sophia', 'Isabella', 'Maria', 'Alice', 'Manuela', 'Beatriz', 'Valentina', 'Heloisa', 'Luiza', 'Mariana', 'Larissa', 'Camila', 'Leticia', 'Bruna', 'Giovanna', 'Yasmin', 'Isadora', 'Rafaela', 'Lorena'];
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Teixeira'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName() {
  return `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)} ${getRandomItem(LAST_NAMES)}`;
}

async function seedTestData() {
  console.log('--- [SEED] Iniciando Carga Massiva de Dados (Escola Teste) ---');
  
  const db = Database.getInstance();
  await db.initialize();

  try {
    // 2. Limpeza opcional
    console.log('[Seed] Desativando FKs para carga massiva...');
    await db.run('PRAGMA foreign_keys = OFF');
    
    console.log('[Seed] Limpando tabelas para carga limpa...');
    const tablesToClear = [
      'schools', 'classes', 'students', 'staff', 'staff_details', 
      'rooms', 'schedules', 'attendance', 'billing', 'users',
      'rooms', 'schedules', 'attendance', 'billing', 'users',
      'student_tasks', 'behavioral_logs', 'events', 'notifications',
      'active_sessions', 'student_economy', 'presence_logs', 
      'augmentations', 'verification_queue', 'evasion_profiles',
      'student_risk_history', 'coordination_insights', 'user_consent',
      'lesson_reports', 'smart_secretariat_tasks', 'biometric_mesh_sync',
      'pedagogical_resources', 'pedagogical_collections'
    ];
    for (const table of tablesToClear) {
      try {
        await db.run(`DELETE FROM ${table}`, []);
      } catch (e) {
        console.warn(`[Seed] Tabela ${table} não encontrada ou erro ao limpar, ignorando...`);
      }
    }

    // 2. Escola
    const schoolId = 'school-teste-001';
    console.log('[Seed] Criando Escola Matriz...');
    await db.run(
      'INSERT INTO schools (id, name, address, type, region) VALUES (?, ?, ?, ?, ?)',
      [schoolId, 'Colégio Áquila Pro - Unidade Teste Matriz', 'Rua da Inovação, 500, São Paulo', 'private', 'capital']
    );

    // 3. Salas (20 salas)
    console.log('[Seed] Gerando 20 salas...');
    const roomIds: string[] = [];
    for (let i = 101; i <= 120; i++) {
      const roomId = `room-${i}`;
      roomIds.push(roomId);
      await db.run(
        'INSERT INTO rooms (id, schoolId, name, location, capacity) VALUES (?, ?, ?, ?, ?)',
        [roomId, schoolId, `Sala ${i}`, i < 200 ? 'Bloco A' : 'Bloco B', 35]
      );
    }

    // 4. Funcionários (300 funcionários)
    console.log('[Seed] Gerando 300 funcionários (65 Professores + Admin/Outros)...');
    const staffIds: string[] = [];
    const teacherIds: string[] = [];
    for (let i = 0; i < 300; i++) {
      const id = uuidv4();
      staffIds.push(id);
      const isTeacher = i < 65;
      if (isTeacher) teacherIds.push(id);
      
      const name = generateName();
      const role = isTeacher ? 'Professor' : getRandomItem(['Coordenação', 'Secretaria', 'Segurança', 'Limpeza', 'TI', 'Financeiro']);
      
      await db.run(
        'INSERT INTO staff (id, name, role, status) VALUES (?, ?, ?, ?)',
        [id, name, role, 'active']
      );
      
      await db.run(
        'INSERT INTO staff_details (staffId, baseSalary, contractType) VALUES (?, ?, ?)',
        [id, role === 'Professor' ? 4500 : 2500, 'CLT']
      );

      // Criar usuário para funcionários (ex: professores e admin)
      if (isTeacher || role === 'Coordenação' || role === 'Secretaria') {
        const username = name.toLowerCase().replace(/\s/g, '.');
        await db.run(
          'INSERT OR IGNORE INTO users (id, username, name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), username, name, 'hashed_password_placeholder', role.toLowerCase()]
        );
      }
    }

    // 5. Turmas e Alunos (46 turmas, 1300 alunos)
    console.log('[Seed] Gerando 46 turmas e 1300 alunos...');
    const grades = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º Médio', '2º Médio', '3º Médio'];
    const subjects = ['Português', 'Matemática', 'História', 'Geografia', 'Ciências', 'Inglês', 'Artes', 'Ed. Física'];
    
    let studentCount = 0;
    const totalTarget = 1300;
    const classes: string[] = [];

    for (let t = 0; t < 46; t++) {
      const classId = `class-teste-${t}`;
      classes.push(classId);
      const grade = getRandomItem(grades);
      const letter = String.fromCharCode(65 + (t % 3)); // A, B, C
      
      await db.run(
        'INSERT INTO classes (id, schoolId, name, grade) VALUES (?, ?, ?, ?)',
        [classId, schoolId, `${grade} ${letter}`, grade]
      );

      // Vincular Horários (Schedules) - 5 por turma
      for (let d = 1; d <= 5; d++) {
        const teacherId = getRandomItem(teacherIds);
        const roomId = getRandomItem(roomIds);
        await db.run(
          'INSERT INTO schedules (id, classId, roomId, teacherId, subject, dayOfWeek, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), classId, roomId, teacherId, getRandomItem(subjects), d, '08:00', '09:40']
        );
      }

      // Recursos Pedagógicos por Turma
      for (let r = 0; r < 3; r++) {
        await db.run(
          `INSERT INTO pedagogical_resources (id, classId, type, title, content, aiSummary, youtubeLinks, privacyTag) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(), 
            classId, 
            'study_guide', 
            `Guia de Estudo: ${getRandomItem(subjects)} - Módulo ${r+1}`,
            'Conteúdo didático estruturado para revisão.',
            'Este guia foca nos conceitos fundamentais abordados em sala.',
            JSON.stringify([{ title: 'Video Aula Complementar', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }]),
            'LOCAL_ONLY'
          ]
        );
      }

      // Alunos por turma (~28)
      const studentsInClass = t === 45 ? totalTarget - studentCount : Math.floor(Math.random() * 5) + 26;
      for (let s = 0; s < studentsInClass; s++) {
        studentCount++;
        const studentId = uuidv4();
        const studentName = generateName();
        const reg = `REG-2026-${String(studentCount).padStart(4, '0')}`;
        
        await db.run(
          'INSERT INTO students (id, classId, name, registrationNumber, status, row, col) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [studentId, classId, studentName, reg, 'active', Math.floor(s / 5), s % 5]
        );

        // Tarefas Pedagógicas (1 por aluno)
        await db.run(
          `INSERT INTO student_tasks (id, studentId, title, description, dueDate, status, priority) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            studentId,
            `Atividade de ${getRandomItem(subjects)}`,
            'Resolver os exercícios da página 42 do livro didático.',
            '2026-05-15 10:00:00',
            'pending',
            'high'
          ]
        );

        // Dados Históricos: Frequência (Janeiro a Abril)
        // 80 dias úteis simulados
        if (s % 10 === 0) { 
            // Buscar um scheduleId real para esta turma
            const classSchedules = await db.all('SELECT id FROM schedules WHERE classId = ? LIMIT 1', [classId]);
            const realScheduleId = classSchedules.length > 0 ? classSchedules[0].id : uuidv4();
            
            await db.run(
                'INSERT INTO attendance (id, studentId, classId, scheduleId, date, status, percentage) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), studentId, classId, realScheduleId, '2026-04-20', 'present', 100.0]
            );
        }

        // Financeiro (4 meses)
        for (let m = 1; m <= 4; m++) {
          await db.run(
            'INSERT INTO billing (id, studentHash, amount, dueDate, status) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), studentId, 1200.0, `2026-0${m}-10`, Math.random() > 0.05 ? 'paid' : 'pending']
          );
        }
      }
    }

    console.log(`--- [SEED] Carga concluída: ${studentCount} alunos, 300 staff, 46 turmas. ---`);
    await db.run('PRAGMA foreign_keys = ON');
  } catch (err: any) {
    console.error('❌ [SEED] Erro:', err.message);
  }
}

seedTestData();
