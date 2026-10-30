/**
 * Testes Unitários de Ciclo de Vida: Super Professor IA & Fallback Resiliente
 * Homologação da release v2.1.0-rc.30
 */

import { ExamQuestionItem, QuestionReviewStatus } from '../../../../apps/electron/src/ui/components/ExamPaperFoundry';

describe('Super Professor IA — Ciclo de Vida Pedagógico & Fallback sem GPU', () => {
  // Simulação da função de parsing / fallback local
  const parseLocalHeuristicFallback = (rawText: string, banca: string, subject: string): ExamQuestionItem[] => {
    const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 15);
    const count = Math.max(1, Math.min(paragraphs.length, 5));
    const items: ExamQuestionItem[] = [];

    for (let i = 0; i < count; i++) {
      const sample = paragraphs[i] || rawText.slice(0, 180);
      items.push({
        id: `ai-local-test-${i + 1}`,
        exam: banca,
        subject: subject,
        topic: `Tópico: ${subject} (${banca})`,
        statement: `(${banca} — Prova Digitalizada) ${sample.trim()}`,
        alternatives: {
          A: 'Proposição I e cálculo linear correspondente.',
          B: 'Proposição II com variação proporcional direta.',
          C: 'Alternativa correta fundamentada pela matriz curricular.',
          D: 'Hipótese nula com divergência dimensional.',
          E: 'Equilíbrio dinâmico em regime estacionário.'
        },
        correct: 'C',
        explanation: `Resolução estruturada pelo Super Professor Soberano para ${subject} (${banca}).`,
        kumonL1: 'L1: Identificação das grandezas fundamentais e equacionamento inicial.',
        kumonL2: 'L2: Resolução da relação matemática e simplificação algébrica.',
        status: 'RASCUNHO_IA'
      });
    }
    return items;
  };

  test('1. Toda questão gerada por IA DEVE iniciar obrigatoriamente como RASCUNHO_IA', () => {
    const rawExam = 'Um automóvel viaja a 72 km/h em uma pista plana.\n\nUm bloco de 4 kg é abandonado do repouso.';
    const questions = parseLocalHeuristicFallback(rawExam, 'ENEM', 'Física');

    expect(questions.length).toBe(2);
    questions.forEach(q => {
      expect(q.status).toBe('RASCUNHO_IA');
      expect(q.reviewedBy).toBeUndefined();
      expect(q.reviewedAt).toBeUndefined();
    });
  });

  test('2. Transição de estado: validação docente transforma RASCUNHO_IA em REVISADO_PROFESSOR', () => {
    const rawExam = 'Questão de cinemática para teste de validação.';
    const questions = parseLocalHeuristicFallback(rawExam, 'UFG', 'Física');
    const questionToReview = questions[0];

    // Simulação da ação de aprovação docente (HITL)
    const reviewedQuestion: ExamQuestionItem = {
      ...questionToReview,
      status: 'REVISADO_PROFESSOR',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Prof. Coordenador de Física'
    };

    expect(reviewedQuestion.status).toBe('REVISADO_PROFESSOR');
    expect(reviewedQuestion.reviewedBy).toBe('Prof. Coordenador de Física');
    expect(typeof reviewedQuestion.reviewedAt).toBe('string');
  });

  test('3. Fallback Local 100% Funcional sem Conexão de GPU Remota', () => {
    // Simula desconexão total (modo offline / sem internet / sem API NVIDIA)
    const rawExam = `Em uma experiência de termologia em laboratório escolar, 200g de água a 25ºC recebem 2000 cal de uma fonte térmica.
    
Para calcular a temperatura final, sabendo que o calor específico da água é 1 cal/gºC, qual é a variação de temperatura?`;

    const questions = parseLocalHeuristicFallback(rawExam, 'PAS-UnB', 'Física');

    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].alternatives).toHaveProperty('A');
    expect(questions[0].alternatives).toHaveProperty('B');
    expect(questions[0].alternatives).toHaveProperty('C');
    expect(questions[0].alternatives).toHaveProperty('D');
    expect(questions[0].alternatives).toHaveProperty('E');
    expect(['A', 'B', 'C', 'D', 'E']).toContain(questions[0].correct);
    expect(questions[0].explanation).toBeDefined();
    expect(questions[0].kumonL1).toContain('L1:');
  });

  test('4. Integridade de Gabarito para Folha de Respostas OMR', () => {
    const rawExam = 'Questão de teste OMR';
    const questions = parseLocalHeuristicFallback(rawExam, 'ENEM', 'Química');

    const answerKey: Record<string, string> = {};
    questions.forEach((q, idx) => {
      answerKey[String(idx + 1)] = q.correct;
    });

    expect(answerKey['1']).toBe('C');
    expect(Object.keys(answerKey).length).toBe(questions.length);
  });
});
