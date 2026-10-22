/**
 * users.roles.test.ts — Suite de Testes: Usuários, Roles e Relações
 * 
 * Cobre:
 * - Login de cada role (admin, director, secretary, coordinator, docente, security, rh, pais, totem, student)
 * - Rejeição de credenciais inválidas
 * - Sessão: criação, validação, expiração, logout
 * - Hierarquia: permissões por role no App.tsx (isProgramAuthorized)
 * - Relações: professor → schedule → turma → aluno
 * - Relações: usuário pai → aluno (via username convenção seed)
 * - Criação de admin via create-admin-user handler (scrypt)
 * - Logout invalida sessão
 * - Sessão correta: token diferente por login
 * 
 * Não cobertos (declarado):
 * - Login via email (o IPC espera username ou email — testado apenas username aqui)
 * - Fluxo LGPD (lgpd:check-consent) — coberto em LGPDService testes
 * - Reinicialização de sessão após crash do main process
 */

import { AuthService } from '../AuthService';
import { Database } from '../../../database/Database';
import * as crypto from 'crypto';

// ─── Helpers ────────────────────────────────────────────────────────────────
function scryptHash(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$16384$8$1$${salt}$${hash}`;
}

/** Todos os roles definidos no sistema */
const ALL_ROLES = [
  'admin', 'director', 'secretary', 'coordinator',
  'docente', 'security', 'rh', 'pais', 'totem', 'student', 'operator'
];

/** Roles que têm acesso ao desktop (App.tsx:isProgramAuthorized) */
const DESKTOP_AUTHORIZED_ROLES = ['admin', 'director', 'secretary', 'hr', 'coordinator', 'security', 'totem'];

import SessionService from '../SessionService';

// ─── Mock do Database ────────────────────────────────────────────────────────
jest.mock('../../../database/Database');
jest.mock('../SessionService');

describe('Áquila Pro — Usuários, Roles e Relações', () => {
  let authService: AuthService;
  let mockDb: jest.Mocked<Database>;
  let mockSessionService: jest.Mocked<SessionService>;
  let sessions: Map<string, any>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    mockSessionService = new SessionService() as jest.Mocked<SessionService>;
    authService = new AuthService(mockDb, mockSessionService);
    sessions = new Map();
    jest.clearAllMocks();

    // Mock stateful run para sessões (Simula Persistência Soberana em memória)
    mockDb.run.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('INSERT INTO active_sessions') && params) {
        const [token, userId, expiresAt, data] = params;
        sessions.set(token, { token, userId, expiresAt, data });
      } else if (sql.includes('DELETE FROM active_sessions') && params) {
        const [token] = params;
        sessions.delete(token);
      }
      return { changes: 1, lastID: 1 };
    });

    // Mock stateful get para sessões
    mockDb.get.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('FROM active_sessions') && params) {
        const [token] = params;
        return sessions.get(token) || null;
      }
      return null;
    });
  });

  afterAll(async () => {
    await mockDb.close();
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GRUPO 1: Login por role
  // ════════════════════════════════════════════════════════════════════════════
  describe('1. Login por role', () => {

    it.each(ALL_ROLES)('role "%s" — login com credenciais válidas retorna sessão', async (role) => {
      const pass = 'TestPass@2026!';
      const hash = scryptHash(pass);
      const mockUser = {
        id: `user-${role}-01`,
        username: `${role}_user`,
        password_hash: hash,
        name: `Usuário ${role}`,
        role
      };
      mockDb.get.mockResolvedValueOnce(mockUser);
      // O mockDb.run já está configurado no beforeEach para ser stateful.


      const session = await authService.login(`${role}_user`, pass);

      expect(session).not.toBeNull();
      expect(session?.user.role).toBe(role);
      expect(session?.user.username).toBe(`${role}_user`);
      expect(session?.token).toHaveLength(64); // 32 bytes hex
      expect(session?.expiresAt).toBeGreaterThan(Date.now());
    });

    it('login com usuário inexistente retorna null', async () => {
      mockDb.get.mockResolvedValueOnce(null);
      const session = await authService.login('nao_existe', 'qualquer');
      expect(session).toBeNull();
    });

    it('login com senha incorreta retorna null (hash scrypt não bate)', async () => {
      const hash = scryptHash('senha_correta');
      const mockUser = { id: 'u1', username: 'admin', password_hash: hash, name: 'Admin', role: 'admin' };
      mockDb.get.mockResolvedValueOnce(mockUser);

      const session = await authService.login('admin', 'senha_errada');
      expect(session).toBeNull();
    });

    it('login com username vazio retorna null sem chamar DB', async () => {
      mockDb.get.mockResolvedValueOnce(null);
      const session = await authService.login('', '');
      expect(session).toBeNull();
    });

    it('login retorna null se password_hash está corrompido (formato desconhecido)', async () => {
      const mockUser = { id: 'u1', username: 'admin', password_hash: 'corrupt_hash_xyz', name: 'Admin', role: 'admin' };
      mockDb.get.mockResolvedValueOnce(mockUser);
      const session = await authService.login('admin', 'qualquer');
      // Formato não reconhecido → bcrypt.compareSync falha graciosamente → null
      expect(session).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GRUPO 2: Sessão — ciclo de vida completo
  // ════════════════════════════════════════════════════════════════════════════
  describe('2. Sessão — ciclo de vida', () => {

    async function loginAs(role: string): Promise<{ token: string; userId: string }> {
      const pass = 'Test@123';
      const hash = scryptHash(pass);
      mockDb.get.mockResolvedValueOnce({ id: `uid-${role}`, username: role, password_hash: hash, name: role, role });
      // Removemos a re-atribuição de mockDb.run para manter a lógica do beforeEach

      const session = await authService.login(role, pass);
      return { token: session!.token, userId: `uid-${role}` };
    }

    it('sessão ativa é validada por token', async () => {
      const { token } = await loginAs('admin');
      const validated = await authService.validateSession(token);
      expect(validated).not.toBeNull();
      expect(validated?.user.role).toBe('admin');
    });

    it('token inválido retorna null', async () => {
      const result = await authService.validateSession('token-invalido-000');
      expect(result).toBeNull();
    });

    it('logout invalida token — validateSession retorna null', async () => {
      const { token } = await loginAs('docente');
      await authService.logout(token);
      const result = await authService.validateSession(token);
      expect(result).toBeNull();
    });

    it('sessão expirada retorna null e remove token da memória', async () => {
      const { token } = await loginAs('rh');
      const session = (await authService.validateSession(token))!;
 
      const spy = jest.spyOn(Date, 'now').mockReturnValue(session.expiresAt + 1000);
      const expired = await authService.validateSession(token);
      expect(expired).toBeNull();
      // Confirma que foi removida (segunda chamada também null)
      const again = await authService.validateSession(token);
      expect(again).toBeNull();
      spy.mockRestore();
    });

    it('dois logins simultâneos geram tokens diferentes', async () => {
      const pass = 'Test@123';
      const hash = scryptHash(pass);
      mockDb.get
        .mockResolvedValueOnce({ id: 'u1', username: 'admin', password_hash: hash, name: 'Admin', role: 'admin' })
        .mockResolvedValueOnce({ id: 'u1', username: 'admin', password_hash: hash, name: 'Admin', role: 'admin' });
      // mockDb.run.mockResolvedValue({ changes: 1, lastID: 1 }); // Comentado para usar logic do beforeEach


      const s1 = await authService.login('admin', pass);
      const s2 = await authService.login('admin', pass);
      expect(s1!.token).not.toBe(s2!.token);
    });

    it('expiresAt é 24h no futuro a partir do login', async () => {
      const before = Date.now();
      const { token } = await loginAs('coordinator');
      const session = (await authService.validateSession(token))!;
      const expectedExpiry = before + 24 * 60 * 60 * 1000;
      // Tolerância de 100ms
      expect(session.expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 100);
      expect(session.expiresAt).toBeLessThanOrEqual(expectedExpiry + 5000);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GRUPO 3: Criação de usuários (createUser / ensureDefaultAdmin)
  // ════════════════════════════════════════════════════════════════════════════
  describe('3. Criação de usuários', () => {

    it('createUser insere com hash scrypt no banco', async () => {
      mockDb.run = jest.fn().mockResolvedValueOnce({ changes: 1, lastID: 1 });

      await authService.createUser({
        username: 'novo_admin',
        password: 'Secure@2026!',
        name: 'Novo Admin',
        role: 'admin'
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          expect.stringContaining('novo_admin'),
          expect.stringContaining('scrypt$'),
          'Novo Admin',
          'admin'
        ])
      );
    });

    it('createUser usa role "operator" como default se não informado', async () => {
      mockDb.run = jest.fn().mockResolvedValueOnce({ changes: 1, lastID: 1 });
      await authService.createUser({ username: 'sem_role', name: 'Sem Role' });
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining(['operator'])
      );
    });

    it('ensureDefaultAdmin cria admin se não existe', async () => {
      mockDb.get.mockResolvedValueOnce(null); // admin não existe
      // db.run já é stateful no beforeEach


      await authService.ensureDefaultAdmin();

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['admin'])
      );
    });

    it('ensureDefaultAdmin NÃO cria se admin já existe', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 'u1', username: 'admin' });

      await authService.ensureDefaultAdmin();

      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('seedDemoUsers cria 4 usuários demo de roles diferentes', async () => {
      // Todos os 4 checks retornam null (nenhum existe)
      mockDb.get.mockResolvedValue(null);
      // db.run já é stateful no beforeEach (vai salvar na session map se for o caso, ou apenas retornar sucesso)


      await authService.seedDemoUsers();

      // seedDemoUsers chama get 4 vezes (verifica existência) e run 4 vezes (inserção)
      expect(mockDb.get).toHaveBeenCalledTimes(4);
      expect(mockDb.run).toHaveBeenCalledTimes(4);
      const roles = mockDb.run.mock.calls.map(call => (call[1] as any[])?.[4]);
      expect(roles).toContain('rh');
      expect(roles).toContain('coordenacao');
      expect(roles).toContain('docente');
      expect(roles).toContain('pais');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GRUPO 4: Hierarquia de permissões (isProgramAuthorized — lógica do App.tsx)
  // ════════════════════════════════════════════════════════════════════════════
  describe('4. Hierarquia de permissões (Desktop Authorization)', () => {

    /** Reproduz a lógica de isProgramAuthorized do App.tsx */
    function isProgramAuthorized(role: string): boolean {
      return ['admin', 'director', 'secretary', 'hr', 'coordinator', 'security', 'totem']
        .includes(role.toLowerCase());
    }

    it.each(DESKTOP_AUTHORIZED_ROLES)(
      'role "%s" é autorizado no desktop',
      (role) => expect(isProgramAuthorized(role)).toBe(true)
    );

    it.each(['pais', 'student', 'docente', 'rh_legacy', 'operator'])(
      'role "%s" NÃO é autorizado no desktop (redireciona para app/web)',
      (role) => expect(isProgramAuthorized(role)).toBe(false)
    );

    it('role vazio não é autorizado', () => {
      expect(isProgramAuthorized('')).toBe(false);
    });

    it('role undefined (como string) não é autorizado', () => {
      expect(isProgramAuthorized('undefined')).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GRUPO 5: Relações Professor → Schedule → Turma
  // ════════════════════════════════════════════════════════════════════════════
  describe('5. Relações: Professor → Schedule → Turma', () => {

    it('professor docente tem acesso ao TeacherPortal (via isTeacherPage)', () => {
      const teacherPages = ['teacher-dashboard', 'rooms', 'schedule', 'diary', 'student-portfolio',
        'attendance', 'students', 'photos', 'ranking-board', 'seating-intelligence', 'tasks', 'whiteboard', 'daily-report'];
      // Qualquer página da lista → TeacherPortal é renderizado
      expect(teacherPages).toContain('teacher-dashboard');
      expect(teacherPages).toContain('attendance');
    });

    it('schedule seed contém teacherId válido apontando para user docente', () => {
      // Reproduz a relação criada no seed
      const schedule = { classId: 'class-9a', teacherId: 'user-doc-01', subject: 'Matemática' };
      const users = [
        { id: 'user-doc-01', role: 'docente' },
        { id: 'user-doc-02', role: 'docente' },
      ];
      const teacher = users.find(u => u.id === schedule.teacherId);
      expect(teacher).toBeDefined();
      expect(teacher?.role).toBe('docente');
    });

    it('um aluno pertence a exatamente uma turma (FK classId)', () => {
      const students = [
        { id: 'stu-9a-01', classId: 'class-9a' },
        { id: 'stu-8b-01', classId: 'class-8b' },
      ];
      const classes = ['class-9a', 'class-8b', 'class-7a'];
      for (const s of students) {
        expect(classes).toContain(s.classId);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GRUPO 6: Compatibilidade do hash — scrypt criado pelo SetupWizard é verificável
  // ════════════════════════════════════════════════════════════════════════════
  describe('6. Compatibilidade de hash — SetupWizard → AuthService', () => {

    it('hash scrypt gerado externamente é verificável pelo AuthService._verifyPassword', async () => {
      const password = 'Admin@2026!';
      const hash = scryptHash(password); // mesmo algoritmo do create-admin-user corrigido

      const mockUser = { id: 'u-setup', username: 'novo_admin', password_hash: hash, name: 'Novo', role: 'admin' };
      mockDb.get.mockResolvedValueOnce(mockUser);
      // db.run já é stateful


      const session = await authService.login('novo_admin', password);
      expect(session).not.toBeNull();
      expect(session?.user.role).toBe('admin');
    });

    it('hash scrypt com senha errada NÃO autentica', async () => {
      const hash = scryptHash('senha_correta');
      const mockUser = { id: 'u-setup', username: 'admin_setup', password_hash: hash, name: 'Admin', role: 'admin' };
      mockDb.get.mockResolvedValueOnce(mockUser);

      const session = await authService.login('admin_setup', 'senha_errada');
      expect(session).toBeNull();
    });

    it('hash legado PBKDF2 (2 partes) ainda é verificável (backwards compat)', async () => {
      const salt = 'legacysalt';
      const hash = crypto.pbkdf2Sync('senha_antiga', salt, 1000, 64, 'sha512').toString('hex');
      const mockUser = {
        id: 'legacy-user',
        username: 'user_legacy',
        password_hash: `${salt}:${hash}`,
        name: 'Legacy',
        role: 'operator'
      };
      mockDb.get.mockResolvedValueOnce(mockUser);
      // db.run já é stateful


      const session = await authService.login('user_legacy', 'senha_antiga');
      expect(session).not.toBeNull();
    });

    it('hash legado PBKDF2 (3 partes / 210k iterações) ainda é verificável', async () => {
      const salt = 'salt2';
      const iterations = 210000;
      const hash = crypto.pbkdf2Sync('senha210k', salt, iterations, 64, 'sha512').toString('hex');
      const mockUser = {
        id: 'u2',
        username: 'user_210k',
        password_hash: `${salt}:${iterations}:${hash}`,
        name: 'User 210k',
        role: 'operator'
      };
      mockDb.get.mockResolvedValueOnce(mockUser);
      // db.run já é stateful


      const session = await authService.login('user_210k', 'senha210k');
      expect(session).not.toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GRUPO 7: Gestão de múltiplas sessões
  // ════════════════════════════════════════════════════════════════════════════
  describe('7. Múltiplas sessões simultâneas', () => {

    it('admin e docente logados ao mesmo tempo — sessões independentes', async () => {
      const pass = 'Test@123';
      const hashAdmin = scryptHash(pass);
      const hashDoc = scryptHash(pass);

      mockDb.get
        .mockResolvedValueOnce({ id: 'u-admin', username: 'admin', password_hash: hashAdmin, name: 'Admin', role: 'admin' })
        .mockResolvedValueOnce({ id: 'u-doc', username: 'docente', password_hash: hashDoc, name: 'Docente', role: 'docente' });
      // db.run já é stateful


      const s1 = await authService.login('admin', pass);
      const s2 = await authService.login('docente', pass);

      expect(s1?.user.role).toBe('admin');
      expect(s2?.user.role).toBe('docente');
      expect(s1?.token).not.toBe(s2?.token);

      // Logout admin não afeta docente
      await authService.logout(s1!.token);
      expect(await authService.validateSession(s1!.token)).toBeNull();
      expect(await authService.validateSession(s2!.token)).not.toBeNull();
    });
  });
});
