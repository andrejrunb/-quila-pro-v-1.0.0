/**
 * Testes Unitários — H5P & Perseus Offline Container Engine (Áquila Pro)
 */

import { H5PPerseusEngine } from '../services/H5PPerseusEngine';

describe('H5PPerseusEngine — Renderizador Offline & Avaliação Formativa', () => {
  test('1. Deve listar o catálogo oficial de applets Perseus e H5P', () => {
    const catalog = H5PPerseusEngine.getCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(6);

    const types = catalog.map(c => c.type);
    expect(types).toContain('perseus_math_slider');
    expect(types).toContain('perseus_number_line');
    expect(types).toContain('perseus_radio_scaffolding');
    expect(types).toContain('h5p_branching_scenario');
    expect(types).toContain('h5p_image_hotspots');
    expect(types).toContain('h5p_drag_words');

    // Verificar BNCC e metas pedagógicas
    const itemAfim = catalog.find(c => c.id === 'perseus-math-afim-01');
    expect(itemAfim?.bnccCode).toBe('EM13MAT302');
    expect(itemAfim?.maxCoins).toBeGreaterThan(0);
  });

  test('2. Deve validar o Perseus Math Slider com precisão e tolerância', () => {
    const applet = H5PPerseusEngine.getAppletById('perseus-math-afim-01')!;
    expect(applet).toBeDefined();

    // Caso ideal: sem dicas, valores alvo exatos (m=2, b=-3)
    const resultIdeal = H5PPerseusEngine.evaluateSlider(applet, 2.0, -3.0, 0);
    expect(resultIdeal.isCorrect).toBe(true);
    expect(resultIdeal.score).toBe(100);
    expect(resultIdeal.coinsEarned).toBe(applet.maxCoins);
    expect(resultIdeal.hintPenaltyPercent).toBe(0);

    // Caso com 1 dica socrática (-10%)
    const result1Hint = H5PPerseusEngine.evaluateSlider(applet, 2.02, -3.0, 1);
    expect(result1Hint.isCorrect).toBe(true);
    expect(result1Hint.score).toBe(90);
    expect(result1Hint.hintPenaltyPercent).toBe(10);

    // Caso com 3 dicas socráticas (-50%)
    const result3Hints = H5PPerseusEngine.evaluateSlider(applet, 2.0, -3.0, 3);
    expect(result3Hints.isCorrect).toBe(true);
    expect(result3Hints.score).toBe(50);
    expect(result3Hints.hintPenaltyPercent).toBe(50);

    // Caso incorreto (fora de tolerância)
    const resultFail = H5PPerseusEngine.evaluateSlider(applet, 0.5, 1.0, 0);
    expect(resultFail.isCorrect).toBe(false);
    expect(resultFail.score).toBe(0);
    expect(resultFail.coinsEarned).toBe(0);
  });

  test('3. Deve validar a Reta Numérica Perseus (7/4 = 1.75)', () => {
    const applet = H5PPerseusEngine.getAppletById('perseus-numline-racionais-01')!;
    expect(applet).toBeDefined();

    // Posição correta dentro da tolerância
    const resCorrect = H5PPerseusEngine.evaluateNumberLine(applet, 1.74, 0);
    expect(resCorrect.isCorrect).toBe(true);
    expect(resCorrect.score).toBe(100);
    expect(resCorrect.coinsEarned).toBe(applet.maxCoins);

    // Posição incorreta
    const resIncorrect = H5PPerseusEngine.evaluateNumberLine(applet, 1.2, 0);
    expect(resIncorrect.isCorrect).toBe(false);
    expect(resIncorrect.score).toBe(0);
  });

  test('4. Deve validar Questão Perseus com Scaffolding Socrático', () => {
    const applet = H5PPerseusEngine.getAppletById('perseus-radio-mruv-01')!;
    expect(applet).toBeDefined();

    // Opção correta com 2 dicas usadas (-25%)
    const resCorrect = H5PPerseusEngine.evaluatePerseusRadio(applet, 'opt-a', 2);
    expect(resCorrect.isCorrect).toBe(true);
    expect(resCorrect.score).toBe(75);
    expect(resCorrect.coinsEarned).toBe(Math.round(applet.maxCoins * 0.75));

    // Opção errada
    const resWrong = H5PPerseusEngine.evaluatePerseusRadio(applet, 'opt-b', 0);
    expect(resWrong.isCorrect).toBe(false);
    expect(resWrong.score).toBe(0);
  });

  test('5. Deve validar Drag The Words H5P proporcionalmente', () => {
    const applet = H5PPerseusEngine.getAppletById('h5p-drag-lavoisier-01')!;
    expect(applet).toBeDefined();

    // Todas as 4 corretas
    const answersFull = {
      0: 'igual',
      1: 'O2 (oxigênio)',
      2: 'H2O (água)',
      3: 'rearranjam'
    };
    const resFull = H5PPerseusEngine.evaluateDragWords(applet, answersFull);
    expect(resFull.isCorrect).toBe(true);
    expect(resFull.score).toBe(100);
    expect(resFull.coinsEarned).toBe(applet.maxCoins);

    // Parcialmente correto (2 de 4)
    const answersPartial = {
      0: 'igual',
      1: 'O2 (oxigênio)',
      2: 'menor', // incorreto
      3: 'destroem' // incorreto
    };
    const resPartial = H5PPerseusEngine.evaluateDragWords(applet, answersPartial);
    expect(resPartial.isCorrect).toBe(false);
    expect(resPartial.score).toBe(50);
    expect(resPartial.coinsEarned).toBe(Math.round(applet.maxCoins * 0.5));
  });

  test('6. Deve calcular a curva de penalização por dicas de forma estrita', () => {
    expect(H5PPerseusEngine.calculateHintPenalty(0)).toBe(0);
    expect(H5PPerseusEngine.calculateHintPenalty(1)).toBe(0.10);
    expect(H5PPerseusEngine.calculateHintPenalty(2)).toBe(0.25);
    expect(H5PPerseusEngine.calculateHintPenalty(3)).toBe(0.50);
    expect(H5PPerseusEngine.calculateHintPenalty(10)).toBe(0.50);
  });
});
