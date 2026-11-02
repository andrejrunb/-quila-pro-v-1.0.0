import { SecretariatService } from '../SecretariatService';

describe('SecretariatService teacher provisioning', () => {
  const db = { createTeacher: jest.fn(async (_teacher: Record<string, unknown>) => undefined) };
  const service = new SecretariatService(db as any);

  beforeEach(() => {
    db.createTeacher.mockClear();
  });

  it('refuses to create an account when no individual password is provided', async () => {
    const response = await service.createTeacher({ name: 'Teacher One' });

    expect(response.success).toBe(false);
    expect(db.createTeacher).not.toHaveBeenCalled();
  });

  it('requires a long password distinct from the username and never returns it', async () => {
    const usernamePassword = await service.createTeacher({
      name: 'teacher.one',
      username: 'teacher.one',
      password: 'teacher.one',
    });
    expect(usernamePassword.success).toBe(false);
    expect(db.createTeacher).not.toHaveBeenCalled();

    const response = await service.createTeacher({
      name: 'Teacher One',
      username: 'teacher.one',
      password: 'unique-password-123',
    });
    expect(response).toEqual({ success: true, id: expect.any(String), login: 'teacher.one' });
    expect(response).not.toHaveProperty('password');
    expect(response).not.toHaveProperty('password');
    const savedTeacher = db.createTeacher.mock.calls[0]?.[0];
    if (!savedTeacher) throw new Error('Expected the teacher to be persisted.');
    expect(savedTeacher).toMatchObject({ username: 'teacher.one' });
    expect(savedTeacher.password_hash).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(savedTeacher.password_hash).not.toContain('unique-password-123');
  });
});
