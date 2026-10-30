/**
 * Homologação Técnica — WordwallGameEngine (Onda 9 / Gamificação Soberana)
 */

import { WordwallGameEngine } from '../services/WordwallGameEngine';

describe('WordwallGameEngine — Mecânicas de Jogos Educativos & Currículo', () => {
  test('1. Deve listar as modalidades canônicas do catálogo Wordwall', () => {
    const modalities = WordwallGameEngine.getCatalogModalities();
    expect(modalities.length).toBeGreaterThanOrEqual(10);
    const ids = modalities.map(m => m.id);
    expect(ids).toContain('group_sort');
    expect(ids).toContain('maze_chase');
    expect(ids).toContain('gameshow_quiz');
    expect(ids).toContain('airplane');
    expect(ids).toContain('diagram_labeling');
  });

  test('2. Deve gerar jogo de Classificação em Grupos para Alavancas (Ciências 7º Ano EF07CI01)', () => {
    const game = WordwallGameEngine.createAlavancasGroupSortGame();
    expect(game.id).toBe('WW-CIEN7-ALAVANCAS-01');
    expect(game.templateType).toBe('group_sort');
    expect(game.grade).toBe('7º Ano');
    expect(game.bnccSkillCode).toBe('EF07CI01');

    const payload = game.payload as any;
    expect(payload.groups.length).toBe(3);
    expect(payload.items.length).toBeGreaterThanOrEqual(6);

    // Validar se tesoura é interfixa e carrinho de mão é inter-resistente
    const tesoura = payload.items.find((it: any) => it.text.includes('Tesoura'));
    expect(tesoura.correctGroupId).toBe('interfixa');

    const carrinho = payload.items.find((it: any) => it.text.includes('Carrinho de mão'));
    expect(carrinho.correctGroupId).toBe('inter_resistente');
  });

  test('3. Deve gerar jogo de Perseguição em Labirinto para Rios Voadores (Ciências 7º Ano EF07CI13)', () => {
    const game = WordwallGameEngine.createRiosVoadoresMazeGame();
    expect(game.id).toBe('WW-CIEN7-RIOSVOADORES-02');
    expect(game.templateType).toBe('maze_chase');
    
    const payload = game.payload as any;
    expect(payload.lives).toBe(3);
    expect(payload.stages.length).toBeGreaterThanOrEqual(3);

    // Validação da primeira fase
    const stage1 = payload.stages[0];
    expect(stage1.correctZone).toContain('Evapotranspiração');
    expect(stage1.distractorZones.length).toBeGreaterThanOrEqual(2);
  });

  test('4. Deve gerar jogo de Aviãozinho para Eletricidade e Consumo kWh (Ciências 8º Ano EF08CI04)', () => {
    const game = WordwallGameEngine.createEletricidadeAirplaneGame();
    expect(game.id).toBe('WW-CIEN8-ELETRICIDADE-03');
    expect(game.templateType).toBe('airplane');
    
    const payload = game.payload as any;
    expect(payload.fuelLevel).toBe(100);
    expect(payload.targets.length).toBeGreaterThanOrEqual(3);

    // Verificar cálculo de 2000W em 30 min = 1 kWh
    const target1 = payload.targets[0];
    expect(target1.correctCloudText).toBe('1,0 kWh');
  });

  test('5. Deve gerar Game Show de Física EM com lifelines e pontuação (Plurall / EM13CNT205)', () => {
    const game = WordwallGameEngine.createFisicaGameshow();
    expect(game.id).toBe('WW-EM-FIS-GAMESHOW-04');
    expect(game.templateType).toBe('gameshow_quiz');
    
    const payload = game.payload as any;
    expect(payload.lifelines.some((l: any) => l.name === '50:50')).toBe(true);
    expect(payload.questions.length).toBe(4);

    // Validar questão de Carnot
    const carnot = payload.questions.find((q: any) => q.text.includes('Carnot'));
    expect(carnot.correctAnswer).toBe('B'); // 50%
  });
});
