import { db, Database } from '../Database';

describe('Database 512-dim Embeddings & OMR Methods (Passos 106, 107, 141-146)', () => {
  beforeAll(async () => {
    await db.initialize();
  });

  test('Deve salvar e recuperar embedding 512-dim', async () => {
    const dbInstance = Database.getInstance();
    const runSpy = jest.spyOn(dbInstance, 'run').mockResolvedValue({ changes: 1, lastID: 1 });
    const allSpy = jest.spyOn(dbInstance, 'all').mockResolvedValue([
      {
        id: 'emb512_1',
        studentId: 'student_42',
        vector: JSON.stringify([0.1, 0.2, 0.3]),
        model: 'ArcFace-512',
        qualityScore: 0.99,
        createdAt: '2026-10-03T12:00:00Z',
      },
    ]);

    const embId = await db.saveFaceEmbedding512('student_42', [0.1, 0.2, 0.3]);
    expect(embId).toMatch(/^emb512_/);
    expect(runSpy).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO student_face_embeddings_512'),
      expect.anything()
    );

    const embeddings = await db.getFaceEmbeddings512('student_42');
    expect(embeddings).toHaveLength(1);
    expect(embeddings[0].studentId).toBe('student_42');
    expect(embeddings[0].vector).toEqual([0.1, 0.2, 0.3]);
  });

  test('searchClosestFace512 deve calcular similaridade de cosseno corretamente', async () => {
    const dbInstance = Database.getInstance();
    // Dois vetores unitários: um idêntico [1, 0] e outro ortogonal [0, 1]
    jest.spyOn(dbInstance, 'all').mockResolvedValue([
      {
        id: 'emb512_idêntico',
        studentId: 'aluno_gemeo',
        vector: JSON.stringify([1, 0]),
        model: 'ArcFace-512',
        qualityScore: 1.0,
      },
      {
        id: 'emb512_diferente',
        studentId: 'aluno_outro',
        vector: JSON.stringify([0, 1]),
        model: 'ArcFace-512',
        qualityScore: 1.0,
      },
    ]);

    // Busca com query [1, 0] com threshold 0.8
    const matches = await db.searchClosestFace512([1, 0], 0.8);
    expect(matches).toHaveLength(1);
    expect(matches[0].studentId).toBe('aluno_gemeo');
    expect(matches[0].similarity).toBe(1);
  });

  test('Deve criar template OMR e recuperar com JSON desserializado', async () => {
    const dbInstance = Database.getInstance();
    jest.spyOn(dbInstance, 'run').mockResolvedValue({ changes: 1, lastID: 1 });
    jest.spyOn(dbInstance, 'get').mockResolvedValue({
      id: 'omr_tpl_math',
      title: 'Matemática 101',
      totalQuestions: 2,
      optionsCount: 4,
      answerKey: JSON.stringify({ '1': 'A', '2': 'C' }),
      weights: JSON.stringify({ '1': 5, '2': 5 }),
    });

    const tplId = await db.createOmrTemplate({
      title: 'Matemática 101',
      totalQuestions: 2,
      optionsCount: 4,
      answerKey: { '1': 'A', '2': 'C' },
      weights: { '1': 5, '2': 5 },
    });
    expect(tplId).toMatch(/^omr_tpl_/);

    const template = await db.getOmrTemplate('omr_tpl_math');
    expect(template).toBeDefined();
    expect(template.answerKey).toEqual({ '1': 'A', '2': 'C' });
    expect(template.weights).toEqual({ '1': 5, '2': 5 });
  });
});
