import { Database } from '../../database/Database';
import { Logger } from './Logger';

export class MockSeeder {
    private db: Database;
    private logger: Logger;

    constructor(db: Database) {
        this.db = db;
        this.logger = new Logger('mock_seeder.log');
    }

    public async runSeedIfNeeded() {
        try {
            // Verifica se já existem alunos
            const rows = await this.db.all('SELECT COUNT(*) as count FROM students');
            if (rows && rows[0] && rows[0].count > 0) {
                this.logger.info('Banco de dados já possui dados. Seed não é necessário.');
                return;
            }

            this.logger.info('Iniciando preenchimento com dados fictícios...');

            // Seed Users (Staff/Direção)
            const users = [
                { id: 'usr-dir-01', name: 'Ana Silva (Diretora)', role: 'director', username: 'ana.silva', passwordHash: 'hash', status: 'active', permissions: 'ALL' },
                { id: 'usr-prof-01', name: 'Carlos Professor', role: 'teacher', username: 'carlos.prof', passwordHash: 'hash', status: 'active', permissions: 'BASIC' },
            ];
            for (const u of users) {
                await this.db.run(
                    'INSERT OR IGNORE INTO users (id, name, role, username, passwordHash, status, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [u.id, u.name, u.role, u.username, u.passwordHash, u.status, u.permissions]
                );
            }

            // Seed Classes
            const classes = [
                { id: 'class-01', name: 'Maternal I', grade: 'Infantil', period: 'Manhã', teacherId: 'usr-prof-01' },
                { id: 'class-02', name: 'Jardim II', grade: 'Infantil', period: 'Tarde', teacherId: 'usr-prof-01' },
                { id: 'class-03', name: 'Fundamental I', grade: 'Fundamental', period: 'Manhã', teacherId: 'usr-prof-01' }
            ];
            for (const c of classes) {
                await this.db.run(
                    'INSERT OR IGNORE INTO classes (id, name, grade, period, teacherId) VALUES (?, ?, ?, ?, ?)',
                    [c.id, c.name, c.grade, c.period, c.teacherId]
                );
            }

            // Seed Students
            const studentNames = ['Lucas Mendes', 'Beatriz Souza', 'Carlos Andrade', 'Mariana Silva', 'Joãozinho Pires', 'Fernanda Oliveira'];
            for (let i = 0; i < studentNames.length; i++) {
                const s = studentNames[i];
                await this.db.run(
                    'INSERT OR IGNORE INTO students (id, name, enrollmentId, dateOfBirth, classId, parentName, parentEmail, parentPhone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [`stu-${i}`, s, `RM-${10000+i}`, '2015-05-10', i < 2 ? 'class-01' : 'class-03', `Pai do ${s}`, `pai${i}@teste.com`, '11999999999', 'active']
                );
            }

            // Seed Cameras
            await this.db.run(
                'INSERT OR IGNORE INTO cameras (id, name, rtspUrl, room, status, fps, resolution, lastSeen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                ['cam-01', 'Câmera Pátio Central', 'rtsp://192.168.1.10', 'Pátio', 'online', 30, '1080p', new Date().toISOString()]
            );

            // Seed Events
            await this.db.run(
                'INSERT OR IGNORE INTO events (id, title, date, time, description, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['evt-01', 'Reunião de Pais e Mestres', '2026-06-10', '19:00', 'Reunião semestral para avaliação', 'meeting', 'scheduled']
            );

            this.logger.info('Seed finalizado com sucesso!');
        } catch (error) {
            this.logger.error('Erro ao executar Seed Fictício: ' + error);
        }
    }
}
