import { Database } from '../../database/Database';
import { v4 as uuidv4 } from 'uuid';
import { isDedicatedDemoDatabase } from '../../database/demoSeedGuard';

const FIRST_NAMES = [
  'Gabriel', 'Lucas', 'Matheus', 'Pedro', 'Guilherme', 'Enzo', 'Gustavo', 'Rafael', 'João', 'Felipe',
  'Sophia', 'Alice', 'Julia', 'Isabella', 'Manuela', 'Laura', 'Luiza', 'Valentina', 'Giovanna', 'Beatriz',
  'Thiago', 'Bruno', 'Caio', 'Daniel', 'Eduardo', 'Fabio', 'Hugo', 'Igor', 'Jorge', 'Kleber',
  'Livia', 'Mariana', 'Nicole', 'Olivia', 'Paola', 'Raquel', 'Sabrina', 'Tatiana', 'Ursula', 'Vanessa'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Nascimento', 'Magalhães', 'Melo', 'Cardoso', 'Teixeira', 'Cavalcanti', 'Dantas', 'Menezes', 'Pinto'
];

export async function seedProductionData() {
  if (
    process.env.AQUILA_ENABLE_DEMO_SEED !== 'true' ||
    !isDedicatedDemoDatabase(Database.getInstance().getDatabasePath())
  ) {
    throw new Error('Synthetic seeding requires an explicitly isolated development database.');
  }

  const db = Database.getInstance();
  console.log('--- Iniciando seed sintético para desenvolvimento isolado ---');

  try {
    // Desativar FKs temporariamente para permitir limpeza e seeding de dados
    await db.run('PRAGMA foreign_keys = OFF');

    // 0. Limpeza preventiva para evitar conflito de FK e chaves únicas
    console.log('Limpando dados antigos...');
    await db.run('DELETE FROM attendance_logs');
    await db.run('DELETE FROM students');
    await db.run('DELETE FROM classes');
    await db.run('DELETE FROM staff_details');
    await db.run('DELETE FROM staff');
    await db.run('DELETE FROM schools');
    await db.run("DELETE FROM cameras WHERE name IN ('Câmera Pátio Central', 'Câmera Corredor 1')");

    // 1. Criar Escola e Período
    const schoolId = uuidv4();
    await db.run('INSERT OR IGNORE INTO schools (id, name, type) VALUES (?, ?, ?)', [
      schoolId, 'Instituto Educacional Áquila Pro', 'PRIVATE'
    ]);

    // 2. Criar Funcionários (300)
    console.log('Gerando 300 funcionários...');
    for (let i = 0; i < 300; i++) {
      const id = uuidv4();
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const role = i < 50 ? 'ADMIN' : i < 70 ? 'RH' : i < 90 ? 'COORDINATOR' : 'TEACHER';
      
      await db.run('INSERT OR IGNORE INTO staff (id, name, role, email) VALUES (?, ?, ?, ?)', [
        id, `${firstName} ${lastName}`, role, `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@aquila.edu`
      ]);
    }

    // 3. Criar Turmas (50)
    console.log('Gerando 50 turmas...');
    const classIds: string[] = [];
    for (let i = 0; i < 50; i++) {
      const id = uuidv4();
      const grade = Math.floor(i / 5) + 1;
      const letter = String.fromCharCode(65 + (i % 5));
      await db.run('INSERT OR IGNORE INTO classes (id, name, grade, schoolId) VALUES (?, ?, ?, ?)', [
        id, `${grade}º Ano ${letter}`, grade, schoolId
      ]);
      classIds.push(id);
    }

    // 4. Criar Alunos (1300)
    console.log('Gerando 1300 alunos e logs históricos...');
    const now = new Date();
    for (let i = 0; i < 1300; i++) {
      const id = uuidv4();
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const classId = classIds[Math.floor(Math.random() * classIds.length)];
      
      await db.run('INSERT OR IGNORE INTO students (id, name, registrationNumber, classId) VALUES (?, ?, ?, ?)', [
        id, `${firstName} ${lastName}`, `REG-${2026000 + i}`, classId
      ]);

      // Logs de Presença e Comportamento desde Janeiro (Amostragem)
      const months = ['01', '02', '03', '04'];
      for (const month of months) {
        const days = ['05', '12', '19', '26']; // Uma vez por semana para evitar lentidão excessiva no seed
        for (const day of days) {
            const type = Math.random() > 0.1 ? 'PRESENT' : 'ABSENT';
            await db.run('INSERT INTO attendance_logs (id, studentId, type, logged_at) VALUES (?, ?, ?, ?)', [
              uuidv4(), id, type, `2026-${month}-${day} 08:00:00`
            ]);
        }
      }
    }

    // 4.5 Criar Câmeras fictícias
    console.log('Gerando câmeras fictícias...');
    await db.run('INSERT OR IGNORE INTO cameras (id, name, rtspUrl, location, status, last_seen, config) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      uuidv4(), 'Câmera Pátio Central', 'rtsp://192.168.1.10/stream', 'Pátio', 'online', new Date().toISOString(), JSON.stringify({ fps: 30, resolution: '1080p' })
    ]);
    await db.run('INSERT OR IGNORE INTO cameras (id, name, rtspUrl, location, status, last_seen, config) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      uuidv4(), 'Câmera Corredor 1', 'rtsp://192.168.1.11/stream', 'Corredor', 'online', new Date().toISOString(), JSON.stringify({ fps: 30, resolution: '720p' })
    ]);

    // Reativar FKs após concluir o seed
    await db.run('PRAGMA foreign_keys = ON');
    console.log('--- Seeding concluído com sucesso ---');
  } catch (err) {
    // Restore FK enforcement and propagate the seed failure to the runner.
    try {
      await db.run('PRAGMA foreign_keys = ON');
    } catch (cleanupError) {
      console.error('Falha ao reativar foreign keys após erro no seeding:', cleanupError);
    }
    console.error('Falha no seeding:', err);
    throw err;
  }
}
