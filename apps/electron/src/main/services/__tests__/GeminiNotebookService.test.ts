import { GeminiNotebookService } from '../GeminiNotebookService';

jest.mock('../ZeroBypassAuditService', () => ({
  ZeroBypassAuditService: { getInstance: () => ({ record: jest.fn().mockResolvedValue(undefined) }) },
}));

const ok = (body: unknown) => ({ ok: true, status: 200, text: async () => JSON.stringify(body) });

describe('GeminiNotebookService', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env = { ...env, AQUILA_GEMINI_NOTEBOOK_ENABLED: '1', AQUILA_GCP_PROJECT_NUMBER: '123', AQUILA_GEMINI_NOTEBOOK_ACCESS_TOKEN: 't0k' };
  });
  afterAll(() => { process.env = env; });

  it('fica desligado por padrão', async () => {
    delete process.env.AQUILA_GEMINI_NOTEBOOK_ENABLED;
    const svc = new GeminiNotebookService({}, jest.fn() as any);
    const r = await svc.createNotebook('u', 'Cinemática');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('DISABLED');
  });

  it('bloqueia PII no título (CPF e e-mail)', async () => {
    const f = jest.fn();
    const svc = new GeminiNotebookService({}, f as any);
    expect((await svc.createNotebook('u', 'Notas do 123.456.789-09')).code).toBe('VALIDATION');
    expect((await svc.createNotebook('u', 'fulano@escola.com')).code).toBe('VALIDATION');
    expect(f).not.toHaveBeenCalled();
  });

  it('cria notebook no endpoint documentado com bearer', async () => {
    const f = jest.fn().mockResolvedValue(ok({ title: 'Cinemática', notebookId: 'nb1' }));
    const svc = new GeminiNotebookService({}, f as any);
    const r = await svc.createNotebook('u', 'Cinemática');
    expect(r.ok).toBe(true);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://global-discoveryengine.googleapis.com/v1alpha/projects/123/locations/global/notebooks');
    expect(init.headers.Authorization).toBe('Bearer t0k');
    expect(JSON.parse(init.body)).toEqual({ title: 'Cinemática' });
  });

  it('lista com pageSize limitado e usa :listRecentlyViewed', async () => {
    const f = jest.fn().mockResolvedValue(ok({ notebooks: [{ title: 'a', notebookId: '1' }] }));
    const svc = new GeminiNotebookService({}, f as any);
    const r = await svc.listRecentNotebooks(9999);
    expect(r.data?.notebooks).toHaveLength(1);
    expect(f.mock.calls[0][0]).toContain('/notebooks:listRecentlyViewed?pageSize=100');
  });

  it('exclusão exige aprovação humana', async () => {
    const f = jest.fn().mockResolvedValue(ok({}));
    const svc = new GeminiNotebookService({}, f as any);
    expect((await svc.deleteNotebook('u', 'nb1', { approvedBy: '', confirm: false })).code).toBe('HITL_REQUIRED');
    expect(f).not.toHaveBeenCalled();
    const r = await svc.deleteNotebook('u', 'nb1', { approvedBy: 'dpo', confirm: true });
    expect(r.ok).toBe(true);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ names: ['projects/123/locations/global/notebooks/nb1'] });
  });

  it('compartilha só e-mails válidos com papel da documentação', async () => {
    const f = jest.fn().mockResolvedValue(ok({}));
    const svc = new GeminiNotebookService({}, f as any);
    const r = await svc.shareNotebook('u', 'nb1', [{ email: 'prof@escola.com', role: 'PROJECT_ROLE_READER' }, { email: 'invalido', role: 'PROJECT_ROLE_WRITER' }]);
    expect(r.ok).toBe(true);
    expect(f.mock.calls[0][0]).toContain('/notebooks/nb1:share');
    expect(JSON.parse(f.mock.calls[0][1].body).accountAndRoles).toEqual([{ email: 'prof@escola.com', role: 'PROJECT_ROLE_READER' }]);
  });
});
