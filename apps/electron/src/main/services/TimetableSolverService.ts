/**
 * TimetableSolverService — Serviço Soberano de Alocação de Grade Horária (SA+GLS)
 *
 * Conecta o backend Electron ao solver matemático em Python (`timetable_solver.py`)
 * utilizando Simulated Annealing + Guided Local Search (SA+GLS) e Kempe Chains
 * para resolver restrições Hard (H1–H4) e Soft (S1–S3) em <2s em CPU local.
 */

import { spawnSync } from 'child_process';
import * as path from 'path';

export interface TimetableRequirementInput {
  req_id: number;
  class_id: number;
  teacher_id: number;
  subject_id: number;
  room_id: number;
  building_id?: number;
  weekly_lessons: number;
}

export interface TimetableSolveRequest {
  num_classes: number;
  num_teachers: number;
  num_rooms: number;
  days?: number;
  periods_per_day?: number;
  seed?: number;
  time_limit_sec?: number;
  teacher_unavailable?: Record<string, number[]>;
  requirements: TimetableRequirementInput[];
}

export interface TimetableSolveResponse {
  hard_violations: number;
  soft_cost: number;
  iterations: number;
  elapsed_ms: number;
  schedule: number[][];
}

export class TimetableSolverService {
  private static instance: TimetableSolverService;

  private constructor() {}

  public static getInstance(): TimetableSolverService {
    if (!TimetableSolverService.instance) {
      TimetableSolverService.instance = new TimetableSolverService();
    }
    return TimetableSolverService.instance;
  }

  /**
   * Executa o solver híbrido SA+GLS local (`timetable_solver.py`).
   */
  public solveTimetable(request: TimetableSolveRequest): TimetableSolveResponse {
    if (!request.requirements || request.requirements.length === 0) {
      throw new Error('[TimetableSolverService] A matriz curricular (requirements) não pode estar vazia.');
    }

    const solverScriptPath = path.resolve(__dirname, '../python/timetable_solver.py');
    const proc = spawnSync('python', [solverScriptPath, '--stdin-json'], {
      input: JSON.stringify(request),
      encoding: 'utf-8',
      timeout: 10000,
    });

    if (proc.status !== 0 || !proc.stdout) {
      throw new Error(
        `[TimetableSolverService] Falha na execução do solver SA+GLS: ${proc.stderr || 'sem saída JSON'}`
      );
    }

    const parsed = JSON.parse(proc.stdout.trim()) as TimetableSolveResponse & { error?: string };
    if (parsed.error) {
      throw new Error(`[TimetableSolverService] Erro retornado pelo solver: ${parsed.error}`);
    }

    return {
      hard_violations: parsed.hard_violations,
      soft_cost: parsed.soft_cost,
      iterations: parsed.iterations,
      elapsed_ms: parsed.elapsed_ms,
      schedule: parsed.schedule,
    };
  }
}

export const timetableSolverService = TimetableSolverService.getInstance();
