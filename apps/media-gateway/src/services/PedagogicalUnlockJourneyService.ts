/**
 * PedagogicalUnlockJourneyService.ts
 * ============================================================================
 * Serviço de Jornadas de Desbloqueio Pedagógico & Cosméticos (Áquila Pro)
 * ============================================================================
 * Princípios de Design & Governança (ECA Digital & LGPD Art. 14):
 * 1. EQUIDADE & NÃO-PUNIÇÃO: Erros não decrementam progresso nem retiram cosméticos.
 * 2. ZERO EXPOSIÇÃO DO THETA (TRI): O valor numérico de proficiência jamais é exposto.
 * 3. PROGRESSO PEDAGÓGICO COMPROVADO: Reconhece constância e evolução na habilidade BNCC.
 * 4. GATE DE PUBLICAÇÃO: Se o personagem ou cosmético estiver em 'DRAFT' ou 'PENDING_REVIEW',
 *    a equipagem é bloqueada até aprovação formal de professor e revisor jurídico (HITL).
 * ============================================================================
 */

import { IntellectualWarriorCharacter } from '../types/mediaContracts';
import { GamificationCatalogService } from './GamificationCatalogService';

export interface DiagnosticActivityEvent {
  student_pseudonym_id: string; // Pseudônimo anônimo do aluno (sem CPF ou nome cru)
  activity_id: string;
  bncc_skill_code: string;
  is_correct: boolean;
  timestamp: number;
}

export interface StudentSkillProgress {
  student_pseudonym_id: string;
  bncc_skill_code: string;
  correct_count: number;
  total_attempts: number;
  completed_activity_ids: string[];
  unlocked_tiers: Map<string, 'APRENDIZ' | 'ESPECIALISTA' | 'MESTRE'>;
}

export interface JourneyEvaluationResult {
  student_pseudonym_id: string;
  character_id: string;
  bncc_skill_code: string;
  current_correct: number;
  required_correct: number;
  tier_unlocked: 'APRENDIZ' | 'ESPECIALISTA' | 'MESTRE' | null;
  can_equip: boolean;
  block_reason?: 'INSUFFICIENT_PROGRESS' | 'CHARACTER_DRAFT_NOT_APPROVED' | null;
  pedagogical_feedback: string;
}

export class PedagogicalUnlockJourneyService {
  // Armazenamento em memória para o ciclo do serviço (em produção, espelhado no SQLite local)
  private static progressStore: Map<string, StudentSkillProgress> = new Map();

  /**
   * Chave composta para busca de progresso por estudante e habilidade BNCC
   */
  private static buildKey(studentId: string, bnccCode: string): string {
    return `${studentId}::${bnccCode}`;
  }

  /**
   * Processa a resolução de um item diagnóstico sem expor theta nem punir erros
   */
  public static recordDiagnosticEvent(event: DiagnosticActivityEvent): StudentSkillProgress {
    const key = this.buildKey(event.student_pseudonym_id, event.bncc_skill_code);
    let progress = this.progressStore.get(key);

    if (!progress) {
      progress = {
        student_pseudonym_id: event.student_pseudonym_id,
        bncc_skill_code: event.bncc_skill_code,
        correct_count: 0,
        total_attempts: 0,
        completed_activity_ids: [],
        unlocked_tiers: new Map()
      };
      this.progressStore.set(key, progress);
    }

    progress.total_attempts += 1;
    if (event.is_correct && !progress.completed_activity_ids.includes(event.activity_id)) {
      progress.correct_count += 1;
      progress.completed_activity_ids.push(event.activity_id);
    }

    return progress;
  }

  /**
   * Avalia a elegibilidade de desbloqueio de um personagem da Arena
   */
  public static evaluateUnlock(
    studentPseudonymId: string,
    characterId: string
  ): JourneyEvaluationResult {
    const character = GamificationCatalogService.getCharacterById(characterId);
    if (!character) {
      throw new Error(`CHARACTER_NOT_FOUND: Personagem ${characterId} não consta no catálogo.`);
    }

    const key = this.buildKey(studentPseudonymId, character.bncc_skill_code);
    const progress = this.progressStore.get(key) || {
      student_pseudonym_id: studentPseudonymId,
      bncc_skill_code: character.bncc_skill_code,
      correct_count: 0,
      total_attempts: 0,
      completed_activity_ids: [],
      unlocked_tiers: new Map()
    };

    const minRequired = character.unlock_criteria?.min_correct ?? 5;
    const isProgressSufficient = progress.correct_count >= minRequired;

    let tierUnlocked: 'APRENDIZ' | 'ESPECIALISTA' | 'MESTRE' | null = null;
    if (progress.correct_count >= minRequired * 2) {
      tierUnlocked = 'MESTRE';
    } else if (progress.correct_count >= Math.ceil(minRequired * 1.5)) {
      tierUnlocked = 'ESPECIALISTA';
    } else if (isProgressSufficient) {
      tierUnlocked = 'APRENDIZ';
    }

    // Regra de Governança: Se o personagem ainda estiver em DRAFT / PENDING_REVIEW, não pode ser equipado
    const isApprovedForPublication =
      character.publication_status === 'APPROVED' || character.publication_status === 'PUBLISHED';

    if (!isProgressSufficient) {
      return {
        student_pseudonym_id: studentPseudonymId,
        character_id: characterId,
        bncc_skill_code: character.bncc_skill_code,
        current_correct: progress.correct_count,
        required_correct: minRequired,
        tier_unlocked: null,
        can_equip: false,
        block_reason: 'INSUFFICIENT_PROGRESS',
        pedagogical_feedback: `Continue explorando a trilha de ${character.knowledge_area}. Faltam ${minRequired - progress.correct_count} atividades formativas concluídas com sucesso.`
      };
    }

    if (!isApprovedForPublication) {
      return {
        student_pseudonym_id: studentPseudonymId,
        character_id: characterId,
        bncc_skill_code: character.bncc_skill_code,
        current_correct: progress.correct_count,
        required_correct: minRequired,
        tier_unlocked: tierUnlocked,
        can_equip: false,
        block_reason: 'CHARACTER_DRAFT_NOT_APPROVED',
        pedagogical_feedback: `Progresso reconhecido com mérito! O avatar de ${character.name} aguarda validação final da coordenação pedagógica para liberação visual.`
      };
    }

    return {
      student_pseudonym_id: studentPseudonymId,
      character_id: characterId,
      bncc_skill_code: character.bncc_skill_code,
      current_correct: progress.correct_count,
      required_correct: minRequired,
      tier_unlocked: tierUnlocked,
      can_equip: true,
      block_reason: null,
      pedagogical_feedback: `Parabéns pela dedicação! Você desbloqueou ${character.name} (${tierUnlocked}) demonstrando constância na habilidade ${character.bncc_skill_code}.`
    };
  }

  /**
   * Limpa a base em memória (usado em testes unitários)
   */
  public static resetProgress(): void {
    this.progressStore.clear();
  }
}
