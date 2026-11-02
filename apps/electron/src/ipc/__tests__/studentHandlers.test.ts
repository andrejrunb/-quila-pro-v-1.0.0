import { StudentService } from '../../main/services/StudentService';
import { CREATE_STUDENT_CHANNEL, registerStudentHandlers } from '../studentHandlers';

describe('student IPC registration', () => {
  const registered = new Map<string, (_event: unknown, payload: unknown) => Promise<unknown>>();
  const dbRows = new Map<string, { id: string; name: string; classId: string }>();
  const db = {
    get: jest.fn(async (sql: string, params: string[]) => {
      if (sql.includes('FROM classes')) return { id: params[0] };
      return dbRows.get(params[0]) || null;
    }),
    run: jest.fn(async (_sql: string, params: Array<string | null>) => {
      dbRows.set(params[0] as string, {
        id: params[0] as string,
        classId: params[1] as string,
        name: params[2] as string,
      });
      return { changes: 1 };
    }),
  };
  const studentService = new StudentService(db);

  beforeEach(() => {
    registered.clear();
    dbRows.clear();
    db.get.mockClear();
    db.run.mockClear();
  });

  function registerAs(role?: string) {
    registerStudentHandlers(
      {
        authService: { getCurrentUser: async () => role ? { role } : null },
        studentService,
      },
      (channel, handler) => registered.set(channel, handler)
    );
    return registered.get(CREATE_STUDENT_CHANNEL)!;
  }

  it('registers only the purpose-specific channel and persists an authorized student', async () => {
    const handler = registerAs('admin');
    const response = await handler({}, { name: 'Student One', classId: 'class-1' }) as {
      success: boolean;
      studentId?: string;
    };

    expect(registered.has(CREATE_STUDENT_CHANNEL)).toBe(true);
    expect(registered.has('unknown:channel')).toBe(false);
    expect(response.success).toBe(true);
    expect(response.studentId).toBeTruthy();
    expect(await db.get('SELECT id, name, classId FROM students WHERE id = ?', [response.studentId!]))
      .toMatchObject({ name: 'Student One', classId: 'class-1' });
  });

  it('denies an unauthorized user before writing', async () => {
    const response = await registerAs('student')({}, { name: 'Student One', classId: 'class-1' }) as {
      code: string;
    };
    expect(response.code).toBe('UNAUTHORIZED');
    expect(db.run).not.toHaveBeenCalled();
  });

  it('rejects invalid payloads before authorization or service calls', async () => {
    const response = await registerAs('admin')({}, { name: '', classId: 'class-1', ignored: true }) as {
      code: string;
    };
    expect(response.code).toBe('INVALID_PAYLOAD');
    expect(db.run).not.toHaveBeenCalled();
  });
});
