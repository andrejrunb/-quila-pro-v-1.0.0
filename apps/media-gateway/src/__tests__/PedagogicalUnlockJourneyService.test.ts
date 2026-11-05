/**
 * PedagogicalUnlockJourneyService.test.ts
 * Suíte de Testes da Jornada de Desbloqueio Pedagógico & Governança (Lote Piloto — Física)
 */

import { PedagogicalUnlockJourneyService } from '../services/PedagogicalUnlockJourneyService';
import { GamificationCatalogService } from '../services/GamificationCatalogService';

describe('PedagogicalUnlockJourneyService — Jornada de Desbloqueio e Governança', () => {
  const studentPseudonym = 'anon_student_8f3a9e';

  beforeEach(() => {
    PedagogicalUnlockJourneyService.resetProgress();
    // Garante que Newton começa em DRAFT
    GamificationCatalogService.updateCharacterStatus('char_isaac_newton', 'DRAFT');
  });

  afterEach(() => {
    PedagogicalUnlockJourneyService.resetProgress();
    GamificationCatalogService.updateCharacterStatus('char_isaac_newton', 'DRAFT');
  });

  test('1. Acúmulo de progresso sem punição: erros não decrementam acertos anteriores', () => {
    // 2 acertos
    PedagogicalUnlockJourneyService.recordDiagnosticEvent({
      student_pseudonym_id: studentPseudonym,
      activity_id: 'act_newton_01',
      bncc_skill_code: 'EM13CNT301',
      is_correct: true,
      timestamp: Date.now()
    });
    PedagogicalUnlockJourneyService.recordDiagnosticEvent({
      student_pseudonym_id: studentPseudonym,
      activity_id: 'act_newton_02',
      bncc_skill_code: 'EM13CNT301',
      is_correct: true,
      timestamp: Date.now()
    });

    // 1 erro subsequente — NÃO PODE DECREMENTAR O CONTADOR
    const progress = PedagogicalUnlockJourneyService.recordDiagnosticEvent({
      student_pseudonym_id: studentPseudonym,
      activity_id: 'act_newton_03',
      bncc_skill_code: 'EM13CNT301',
      is_correct: false,
      timestamp: Date.now()
    });

    expect(progress.correct_count).toBe(2);
    expect(progress.total_attempts).toBe(3);
  });

  test('2. Avaliação de desbloqueio incompleto: informa feedback formativo sem expor theta', () => {
    // Apenas 2 acertos (requisito mínimo é 5)
    PedagogicalUnlockJourneyService.recordDiagnosticEvent({
      student_pseudonym_id: studentPseudonym,
      activity_id: 'act_newton_01',
      bncc_skill_code: 'EM13CNT301',
      is_correct: true,
      timestamp: Date.now()
    });
    PedagogicalUnlockJourneyService.recordDiagnosticEvent({
      student_pseudonym_id: studentPseudonym,
      activity_id: 'act_newton_02',
      bncc_skill_code: 'EM13CNT301',
      is_correct: true,
      timestamp: Date.now()
    });

    const result = PedagogicalUnlockJourneyService.evaluateUnlock(studentPseudonym, 'char_isaac_newton');

    expect(result.can_equip).toBe(false);
    expect(result.block_reason).toBe('INSUFFICIENT_PROGRESS');
    expect(result.current_correct).toBe(2);
    expect(result.required_correct).toBe(5);
    expect(result.pedagogical_feedback).toContain('Faltam 3 atividades formativas');
  });

  test('3. Bloqueio por Governança: Personagem em DRAFT impede equipagem mesmo com meta atingida', () => {
    // Realiza 5 acertos necessários
    for (let i = 1; i <= 5; i++) {
      PedagogicalUnlockJourneyService.recordDiagnosticEvent({
        student_pseudonym_id: studentPseudonym,
        activity_id: `act_newton_0${i}`,
        bncc_skill_code: 'EM13CNT301',
        is_correct: true,
        timestamp: Date.now()
      });
    }

    const result = PedagogicalUnlockJourneyService.evaluateUnlock(studentPseudonym, 'char_isaac_newton');

    // Meta atingida, tier Aprendiz reconhecido, mas equipagem BLOQUEADA porque status é DRAFT
    expect(result.tier_unlocked).toBe('APRENDIZ');
    expect(result.can_equip).toBe(false);
    expect(result.block_reason).toBe('CHARACTER_DRAFT_NOT_APPROVED');
    expect(result.pedagogical_feedback).toContain('aguarda validação final da coordenação pedagógica');
  });

  test('4. Ciclo Completo de Homologação HITL: Aprovação docente libera equipagem e progressão para Especialista', () => {
    // 8 acertos (atinge Especialista: Math.ceil(5 * 1.5) = 8)
    for (let i = 1; i <= 8; i++) {
      PedagogicalUnlockJourneyService.recordDiagnosticEvent({
        student_pseudonym_id: studentPseudonym,
        activity_id: `act_newton_0${i}`,
        bncc_skill_code: 'EM13CNT301',
        is_correct: true,
        timestamp: Date.now()
      });
    }

    // Professor e Revisor Jurídico aprovam o personagem
    GamificationCatalogService.updateCharacterStatus('char_isaac_newton', 'APPROVED');

    const result = PedagogicalUnlockJourneyService.evaluateUnlock(studentPseudonym, 'char_isaac_newton');

    expect(result.tier_unlocked).toBe('ESPECIALISTA');
    expect(result.can_equip).toBe(true);
    expect(result.block_reason).toBeNull();
    expect(result.pedagogical_feedback).toContain('Parabéns pela dedicação!');
    expect(result.pedagogical_feedback).toContain('ESPECIALISTA');
  });

  test('5. Progressão para Mestre (2x requisito): reconhece excelência na habilidade BNCC', () => {
    // 10 acertos (atinge Mestre: 5 * 2 = 10)
    for (let i = 1; i <= 10; i++) {
      PedagogicalUnlockJourneyService.recordDiagnosticEvent({
        student_pseudonym_id: studentPseudonym,
        activity_id: `act_newton_0${i}`,
        bncc_skill_code: 'EM13CNT301',
        is_correct: true,
        timestamp: Date.now()
      });
    }

    GamificationCatalogService.updateCharacterStatus('char_isaac_newton', 'APPROVED');

    const result = PedagogicalUnlockJourneyService.evaluateUnlock(studentPseudonym, 'char_isaac_newton');

    expect(result.tier_unlocked).toBe('MESTRE');
    expect(result.can_equip).toBe(true);
  });

  test('6. Salvaguarda de Catálogo do Aluno: Personagens em DRAFT são 100% omitidos do catálogo estudantil', () => {
    // Todos os personagens começam em DRAFT
    const studentCatalog = GamificationCatalogService.getStudentFacingCharacters();
    expect(studentCatalog.length).toBe(0);

    // Quando 1 personagem é aprovado pela banca HITL
    GamificationCatalogService.updateCharacterStatus('char_isaac_newton', 'APPROVED');
    const updatedCatalog = GamificationCatalogService.getStudentFacingCharacters();
    expect(updatedCatalog.length).toBe(1);
    expect(updatedCatalog[0].id).toBe('char_isaac_newton');
  });

  test('7. Salvaguarda de Ativos Visuais: URL / CDN / Cache bloqueados para personagens em DRAFT', () => {
    // Tentativa direta de obter URL de ativo de personagem em DRAFT deve lançar exceção de bloqueio
    expect(() => {
      GamificationCatalogService.getStudentFacingAssetUrl('char_isaac_newton');
    }).toThrow('ASSET_DELIVERY_BLOCKED_FOR_DRAFT');

    // Após aprovação formal, o ativo é liberado para carregamento
    GamificationCatalogService.updateCharacterStatus('char_isaac_newton', 'APPROVED');
    const assetUrl = GamificationCatalogService.getStudentFacingAssetUrl('char_isaac_newton');
    expect(assetUrl).toBe('science_royale_lote_2.jpg');
  });

  test('8. Salvaguarda de Citações: Omissão de citações não comprovadas e ressalva em atribuições incertas', () => {
    // Newton: Fonte primária verificada (carta a Hooke 1676)
    const newtonQuote = GamificationCatalogService.getStudentFacingQuote('char_isaac_newton');
    expect(newtonQuote).not.toBeNull();
    expect(newtonQuote?.text).toContain('ombros de gigantes');
    expect(newtonQuote?.source_attribution).toContain('The Newton Project');

    // Galileu: Atribuição histórica incerta (Baretti 1757) -> Deve conter disclaimer obrigatório
    const galileoQuote = GamificationCatalogService.getStudentFacingQuote('char_galileo_galilei');
    expect(galileoQuote).not.toBeNull();
    expect(galileoQuote?.historiographical_disclaimer).toContain('não de fonte primária contemporânea');

    // Lattes: Citação sem fonte primária -> Deve ser OMITIDA (retorna null) do portal do aluno
    const lattesQuote = GamificationCatalogService.getStudentFacingQuote('char_cesar_lattes');
    expect(lattesQuote).toBeNull();

    // Tesla: Pendente de localização de documento -> Deve ser OMITIDA (retorna null)
    const teslaQuote = GamificationCatalogService.getStudentFacingQuote('char_nikola_tesla');
    expect(teslaQuote).toBeNull();
  });
});
