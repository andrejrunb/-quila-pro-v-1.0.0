import Database from '../Database';

describe('Database Write-Behind Cache', () => {
    let db: Database;

    beforeEach(async () => {
        db = new Database();
        await db.initialize();
        // Limpar histórico de chamadas do mock do better-sqlite3
        const mockDbInstance = db['db'];
        if (mockDbInstance) {
            mockDbInstance.prepare.mockClear();
            const stmt = mockDbInstance.prepare('SELECT 1');
            stmt.run.mockClear();
            mockDbInstance.prepare.mockClear();
        }
    });

    afterEach(async () => {
        await db.close();
    });

    it('deve acumular as escritas em memória sem persistir imediatamente', async () => {
        db.queueWrite(
            'INSERT INTO behavioral_logs (id, studentId, riskScore) VALUES (?, ?, ?)',
            ['test-wb-1', 'student-wb-1', 4.5]
        );

        const mockDbInstance = db['db'];
        // Como prepare é usado também para transações no flush, se não chamamos flush, prepare não deve ter sido chamado para o INSERT
        const calls = mockDbInstance.prepare.mock.calls;
        const insertCalls = calls.filter((c: any) => c[0] && c[0].includes('INSERT INTO behavioral_logs'));
        expect(insertCalls.length).toBe(0);
    });

    it('deve persistir no banco após o flushQueue', async () => {
        db.queueWrite(
            'INSERT INTO behavioral_logs (id, studentId, riskScore) VALUES (?, ?, ?)',
            ['test-wb-2', 'student-wb-2', 7.2]
        );

        await db.flushQueue();

        const mockDbInstance = db['db'];
        expect(mockDbInstance.prepare).toHaveBeenCalledWith(
            'INSERT INTO behavioral_logs (id, studentId, riskScore) VALUES (?, ?, ?)'
        );
        const stmt = mockDbInstance.prepare('dummy');
        expect(stmt.run).toHaveBeenCalledWith('test-wb-2', 'student-wb-2', 7.2);
    });

    it('deve descarregar e persistir a fila restante ao fechar o banco de dados', async () => {
        const mockDbInstance = db['db'];
        
        db.queueWrite(
            'INSERT INTO behavioral_logs (id, studentId, riskScore) VALUES (?, ?, ?)',
            ['test-wb-3', 'student-wb-3', 9.0]
        );

        // Fecha a conexão (deve fazer o flush interno)
        await db.close();

        expect(mockDbInstance.prepare).toHaveBeenCalledWith(
            'INSERT INTO behavioral_logs (id, studentId, riskScore) VALUES (?, ?, ?)'
        );
        const stmt = mockDbInstance.prepare('dummy');
        expect(stmt.run).toHaveBeenCalledWith('test-wb-3', 'student-wb-3', 9.0);
    });
});
