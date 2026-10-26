/**
 * PEDAGOGICAL SCAFFOLDING ENGINE (v1.0 — Kumon Adaptativo Áquila Pro)
 * ====================================================================
 * Motor soberano de decomposição pedagógica adaptativa, agendamento de
 * repetição espaçada de Ebbinghaus (24h, 48h, 96h, 144h) e diagnóstico
 * socrático de equívocos conceituais frequentes (misconceptions).
 */

export type AquilaScaffoldingLevel =
  | 'NIVEL_1_FUNDAMENTOS'
  | 'NIVEL_2_APLICACAO_CURRICULAR'
  | 'NIVEL_3_APROFUNDAMENTO_OLIMPICO';

export type PedagogicalModality =
  | 'visual_intuitive'
  | 'worked_example'
  | 'guided_practice'
  | 'olympic_challenge'
  | 'counter_example';

export interface MicroStep {
  id: string;
  stepNumber: number;
  level: AquilaScaffoldingLevel;
  title: string;
  description: string;
  pedagogicalModality: PedagogicalModality;
  workedExample?: {
    problemStatement: string;
    stepByStepSolution: string[];
    fadedPrompt?: string; // Etapa omitida para fading scaffolding
  };
  checkQuestion: {
    prompt: string;
    expectedAnswer: string | number;
    options?: string[];
    acceptableTolerance?: number;
  };
  estimatedDurationMinutes: number;
  targetStandardCompletionSeconds: number; // SCT (Standard Completion Time Kumon)
}

export interface LevelDefinition {
  name: string;
  description: string;
  microSteps: MicroStep[];
  masteryThresholdPercent: number;
}

export interface ScaffoldingPlan {
  skillId: string;
  discipline: string;
  bnccCode?: string;
  skillName: string;
  totalMicroSteps: number;
  levels: {
    nivel1: LevelDefinition;
    nivel2: LevelDefinition;
    nivel3: LevelDefinition;
  };
  createdAt: string;
}

export const EBBINGHAUS_INTERVAL_HOURS = [24, 48, 96, 144] as const;
export type EbbinghausIntervalHour = (typeof EBBINGHAUS_INTERVAL_HOURS)[number];

export type ReviewStatus = 'PENDING' | 'DUE' | 'COMPLETED' | 'OVERDUE' | 'RELAPSED';

export interface ScheduledReviewItem {
  id: string;
  studentId: string;
  skillId: string;
  intervalIndex: number; // 0, 1, 2, 3
  intervalHours: EbbinghausIntervalHour;
  scheduledFor: string; // ISO 8601
  status: ReviewStatus;
  completedAt?: string;
  success?: boolean;
  retentionScore?: number;
  timeSpentSeconds?: number;
}

export interface SpacedRepetitionSchedule {
  studentId: string;
  skillId: string;
  firstMasteredAt: string;
  stabilityIndexHours: number;
  reviews: ScheduledReviewItem[];
  isFullyConsolidated: boolean;
}

export interface StudentSubmission {
  studentId: string;
  skillId: string;
  microStepId?: string;
  problemPrompt: string;
  studentAnswer: string;
  expectedAnswer: string;
  studentWorkingNotes?: string;
}

export interface SocraticIntervention {
  studentId: string;
  skillId: string;
  misconceptionId: string;
  inquiryQuestion: string;
  counterExample: string;
  guidingHint: string;
  correctiveStepAnchor: string;
  remedialScaffoldingLevel: AquilaScaffoldingLevel;
}

export interface MisconceptionPattern {
  id: string;
  discipline: string;
  topic: string;
  title: string;
  description: string;
  detector: (submission: StudentSubmission) => boolean;
  socraticInquiryPrompt: string;
  concreteCounterExample: string;
  correctiveMicroStepAnchor: string;
  remedialLevel: AquilaScaffoldingLevel;
}

export interface MisconceptionDiagnosis {
  hasMisconception: boolean;
  detectedMisconception?: {
    id: string;
    title: string;
    description: string;
    counterExample: string;
  };
  socraticIntervention?: SocraticIntervention;
  confidence: number;
  recommendedAction: 'PROCEED' | 'OFFER_SOCRATIC_HINT' | 'TRIGGER_LEVEL_1_REMEDIATION' | 'REPEAT_WORKED_EXAMPLE';
}

export interface KumonMicroDrill {
  drillId: string;
  skillId: string;
  level: AquilaScaffoldingLevel;
  difficultyIndex: number; // 1 a 10
  problemStatement: string;
  expectedAnswer: string | number;
  standardCompletionTimeSeconds: number; // SCT
  hintsAvailable: string[];
}

export interface SkillDecompositionRequest {
  skillId: string;
  skillName: string;
  discipline: string;
  bnccCode?: string;
  customPrerequisites?: string[];
}

/**
 * Catálogo canônico de equívocos conceituais frequentes (Misconception Bank)
 */
export const CANONICAL_MISCONCEPTION_PATTERNS: MisconceptionPattern[] = [
  {
    id: 'MIS_ADD_FRACTIONS_DIRECT',
    discipline: 'Matemática',
    topic: 'Frações • Adição com denominadores diferentes',
    title: 'Soma Direta de Numeradores e Denominadores',
    description: 'O aluno soma numeradores e denominadores sem encontrar o denominador comum: a/b + c/d = (a+c)/(b+d).',
    detector: (sub) => {
      const prompt = sub.problemPrompt.replace(/\s+/g, '');
      const ans = sub.studentAnswer.replace(/\s+/g, '');
      if (prompt.includes('1/2+1/3') || prompt.includes('1/2 + 1/3')) {
        return ans === '2/5' || ans === '0.4';
      }
      if (prompt.includes('1/4+1/2') || prompt.includes('1/4 + 1/2')) {
        return ans === '2/6' || ans === '1/3';
      }
      const match = ans.match(/^(\d+)\/(\d+)$/);
      if (match && sub.expectedAnswer.includes('/')) {
        const parts = sub.expectedAnswer.split('/');
        return match[2] !== parts[1] && sub.studentAnswer !== sub.expectedAnswer;
      }
      return false;
    },
    socraticInquiryPrompt:
      'Imagine que você tem meia pizza (1/2) e ganha mais um terço de pizza (1/3). Você comeu 2 fatias de 5 (2/5)? Sabia que 2/5 é menor do que apenas a metade que você já tinha?',
    concreteCounterExample: '1/2 = 50% da pizza. 2/5 = 40% da pizza. Como somar fatias pode diminuir o total?',
    correctiveMicroStepAnchor: 'NIVEL_1_PASSO_FRACAO_VISUAL',
    remedialLevel: 'NIVEL_1_FUNDAMENTOS',
  },
  {
    id: 'MIS_ALGEBRA_DISTRIBUTIVE_POWER',
    discipline: 'Matemática',
    topic: 'Álgebra • Produtos Notáveis',
    title: 'Distribuição Direta de Expoentes na Soma',
    description: 'O aluno assume linearidade na potência: (a + b)^2 = a^2 + b^2, omitindo o termo misto 2ab.',
    detector: (sub) => {
      const ans = sub.studentAnswer.replace(/\s+/g, '').toLowerCase();
      const prompt = sub.problemPrompt.replace(/\s+/g, '').toLowerCase();
      return (
        ans.includes('a^2+b^2') ||
        ans.includes('x^2+y^2') ||
        (ans.includes('x^2+4') && prompt.includes('(x+2)^2')) ||
        (ans.includes('x^2+9') && prompt.includes('(x+3)^2'))
      );
    },
    socraticInquiryPrompt:
      'Se substituirmos a = 3 e b = 4: (3 + 4)^2 = 7^2 = 49. Se calcularmos 3^2 + 4^2, obtemos 9 + 16 = 25. Onde foram parar as 24 unidades que faltam?',
    concreteCounterExample: 'Área de um quadrado de lado (a+b): é composta por um quadrado a^2, um quadrado b^2 e DOIS retângulos a*b!',
    correctiveMicroStepAnchor: 'NIVEL_1_PASSO_PRODUTO_NOTAVEL_GEOMETRICO',
    remedialLevel: 'NIVEL_1_FUNDAMENTOS',
  },
  {
    id: 'MIS_NEGATIVE_NUMBER_EXPONENT',
    discipline: 'Matemática',
    topic: 'Aritmética • Potenciação de Números Negativos',
    title: 'Confusão do Escopo do Sinal Negativo em Potências',
    description: 'Confundir o resultado de -x^2 com (-x)^2 (ex: -3^2 = -9 vs (-3)^2 = 9).',
    detector: (sub) => {
      const prompt = sub.problemPrompt.replace(/\s+/g, '');
      const ans = sub.studentAnswer.replace(/\s+/g, '');
      if (prompt.includes('-3^2') && !prompt.includes('(-3)')) {
        return ans === '9' || ans === '+9';
      }
      if (prompt.includes('(-3)^2')) {
        return ans === '-9';
      }
      return false;
    },
    socraticInquiryPrompt:
      'Em -3^2, quem está sendo elevado ao expoente 2: apenas o número 3 ou o conjunto com o sinal (-3)? Pense na ordem das operações: potência antes do sinal negativo!',
    concreteCounterExample: '-3^2 significa -(3 × 3) = -9. Já (-3)^2 significa (-3) × (-3) = +9.',
    correctiveMicroStepAnchor: 'NIVEL_1_PASSO_SINAIS_E_PRIORIDADES',
    remedialLevel: 'NIVEL_1_FUNDAMENTOS',
  },
  {
    id: 'MIS_NEWTON_THIRD_LAW_CANCEL',
    discipline: 'Física',
    topic: 'Dinâmica • Terceira Lei de Newton (Ação e Reação)',
    title: 'Ação e Reação se Anulando no Mesmo Corpo',
    description: 'Achar que forças de ação e reação se anulam e impedem o movimento.',
    detector: (sub) => {
      const text = (sub.studentAnswer + ' ' + (sub.studentWorkingNotes || '')).toLowerCase();
      return (
        text.includes('se anulam') ||
        text.includes('força resultante zero') ||
        text.includes('cancela a ação')
      );
    },
    socraticInquiryPrompt:
      'Quando você chuta uma bola, seu pé aplica força na bola e a bola aplica força no seu pé. As duas forças estão agindo no mesmo objeto?',
    concreteCounterExample:
      'Ação e reação atuam em corpos DIFERENTES! A Terra puxa a maçã (força na maçã) e a maçã puxa a Terra (força na Terra). Elas nunca podem se anular no mesmo corpo.',
    correctiveMicroStepAnchor: 'NIVEL_1_PASSO_TERCEIRA_LEI_INTERACAO',
    remedialLevel: 'NIVEL_1_FUNDAMENTOS',
  },
  {
    id: 'MIS_ELECTRIC_CURRENT_CONSUMED',
    discipline: 'Física',
    topic: 'Eletrodinâmica • Corrente Elétrica em Circuitos',
    title: 'Consumo de Corrente pelos Resistores',
    description: 'Achar que a corrente elétrica (elétrons) é gasta ao passar por lâmpadas ou resistores.',
    detector: (sub) => {
      const text = (sub.studentAnswer + ' ' + (sub.studentWorkingNotes || '')).toLowerCase();
      return (
        text.includes('corrente diminui depois') ||
        text.includes('gasta elétrons') ||
        text.includes('corrente é consumida')
      );
    },
    socraticInquiryPrompt:
      'A corrente elétrica é a contagem de elétrons passando por segundo. Se entrassem 100 elétrons na lâmpada e saíssem apenas 80, onde estariam os outros 20 acumulados?',
    concreteCounterExample:
      'Conservação da Carga: a corrente que entra é exatamente igual à que sai. O que se transfere para a lâmpada é a ENERGIA elétrica, não a matéria dos elétrons!',
    correctiveMicroStepAnchor: 'NIVEL_1_PASSO_CIRCUITO_FLUXO_CONTINUO',
    remedialLevel: 'NIVEL_1_FUNDAMENTOS',
  },
];

export class PedagogicalScaffoldingEngine {
  private static instance: PedagogicalScaffoldingEngine;
  private schedules: Map<string, SpacedRepetitionSchedule> = new Map();
  private customMisconceptions: MisconceptionPattern[] = [];

  public static getInstance(): PedagogicalScaffoldingEngine {
    if (!PedagogicalScaffoldingEngine.instance) {
      PedagogicalScaffoldingEngine.instance = new PedagogicalScaffoldingEngine();
    }
    return PedagogicalScaffoldingEngine.instance;
  }

  /**
   * 1. DECOMPOSIÇÃO EM 3 NÍVEIS ÁQUILA (MÉTODO KUMON PROGRESSIVO)
   */
  public decomposeSkill(request: SkillDecompositionRequest): ScaffoldingPlan {
    const isMath = request.discipline.toLowerCase().includes('matemática') || request.discipline.toLowerCase().includes('math');

    // NÍVEL 1: FUNDAMENTOS / BASE INTUITIVA
    const nivel1Steps: MicroStep[] = [
      {
        id: `${request.skillId}_N1_S1`,
        stepNumber: 1,
        level: 'NIVEL_1_FUNDAMENTOS',
        title: `Intuição e Representação Visual de ${request.skillName}`,
        description: 'Construção da representação mental concreta, eliminando abstrações puras e isolando a variável fundamental.',
        pedagogicalModality: 'visual_intuitive',
        checkQuestion: {
          prompt: isMath
            ? `Identifique na malha visual a representação de 1 parte de 4 de um todo:`
            : `Identifique a grandeza fundamental correspondente ao fenômeno observado:`,
          expectedAnswer: isMath ? '1/4' : 'corrente',
          options: isMath ? ['1/4', '1/2', '3/4', '4/1'] : ['tensão', 'corrente', 'resistência', 'potência'],
        },
        estimatedDurationMinutes: 5,
        targetStandardCompletionSeconds: 45,
      },
      {
        id: `${request.skillId}_N1_S2`,
        stepNumber: 2,
        level: 'NIVEL_1_FUNDAMENTOS',
        title: `Micro-Drill Básico Sem Fricção`,
        description: 'Prática atômica de cálculo direto ou identificação sem armadilhas conceituais.',
        pedagogicalModality: 'guided_practice',
        checkQuestion: {
          prompt: isMath ? 'Calcule o valor reduzido direto: 2/4 = ?' : 'Uma carga de 10C passa em 2s. Corrente = ? A',
          expectedAnswer: isMath ? '1/2' : '5',
        },
        estimatedDurationMinutes: 7,
        targetStandardCompletionSeconds: 60,
      },
    ];

    // NÍVEL 2: APLICAÇÃO CURRICULAR / WORKED EXAMPLES (BNCC / SAEB)
    const nivel2Steps: MicroStep[] = [
      {
        id: `${request.skillId}_N2_S1`,
        stepNumber: 3,
        level: 'NIVEL_2_APLICACAO_CURRICULAR',
        title: `Worked Example Guiado (Eu Faço / Nós Fazemos)`,
        description: 'Exemplo resolvido detalhadamente com etapa final omitida para prática com fading scaffolding.',
        pedagogicalModality: 'worked_example',
        workedExample: {
          problemStatement: isMath
            ? 'Efetue a operação: 1/2 + 1/3 encontrando o denominador comum.'
            : 'Em um circuito com resistor de 10Ω e ddp de 20V, determine a corrente aplicando a Primeira Lei de Ohm.',
          stepByStepSolution: isMath
            ? [
                'Passo 1: MMC entre 2 e 3 é 6.',
                'Passo 2: 1/2 = 3/6 e 1/3 = 2/6.',
                'Passo 3: 3/6 + 2/6 = 5/6.',
              ]
            : [
                'Passo 1: Aplicar a Primeira Lei de Ohm: U = R * I.',
                'Passo 2: Isolar I = U / R.',
                'Passo 3: I = 20 / 10 = 2 A.',
              ],
          fadedPrompt: isMath ? 'Complete: 3/6 + 2/6 = ?' : 'Complete: 20 / 10 = ?',
        },
        checkQuestion: {
          prompt: isMath ? 'Qual o valor final da soma 1/2 + 1/3?' : 'Qual o valor da corrente em ampères?',
          expectedAnswer: isMath ? '5/6' : '2',
        },
        estimatedDurationMinutes: 10,
        targetStandardCompletionSeconds: 90,
      },
      {
        id: `${request.skillId}_N2_S2`,
        stepNumber: 4,
        level: 'NIVEL_2_APLICACAO_CURRICULAR',
        title: `Problema Contextualizado Padrão SAEB / ENEM`,
        description: 'Aplicação da competência curricular em situação-problema cotidiana.',
        pedagogicalModality: 'guided_practice',
        checkQuestion: {
          prompt: isMath
            ? 'Um aluno estudou 1/4 do dia pela manhã e 1/2 do dia à tarde. Que fração total do dia ele estudou?'
            : 'Um chuveiro elétrico opera sob 220V e dissipa 4400W. Qual é a corrente consumida?',
          expectedAnswer: isMath ? '3/4' : '20',
        },
        estimatedDurationMinutes: 12,
        targetStandardCompletionSeconds: 120,
      },
    ];

    // NÍVEL 3: APROFUNDAMENTO / DESAFIO OLÍMPICO & VESTIBULARES (OBMEP / FUVEST / ITA)
    const nivel3Steps: MicroStep[] = [
      {
        id: `${request.skillId}_N3_S1`,
        stepNumber: 5,
        level: 'NIVEL_3_APROFUNDAMENTO_OLIMPICO',
        title: `Desafio Olímpico e Problema Inverso (Estilo OBMEP / ITA)`,
        description: 'Problema complexo não-trivial exigindo interconexão de conceitos, busca de contraexemplos e heurística.',
        pedagogicalModality: 'olympic_challenge',
        checkQuestion: {
          prompt: isMath
            ? 'Sejam a e b inteiros positivos tais que 1/a + 1/b = 1/6 com a < b. Quantos pares ordenados (a, b) existem?'
            : 'Em uma ponte de Wheatstone desequilibrada com gerador real, determine a corrente no galvanômetro.',
          expectedAnswer: isMath ? '4' : '0.5',
        },
        estimatedDurationMinutes: 20,
        targetStandardCompletionSeconds: 300,
      },
    ];

    return {
      skillId: request.skillId,
      discipline: request.discipline,
      bnccCode: request.bnccCode || 'BNCC_GENERICA',
      skillName: request.skillName,
      totalMicroSteps: nivel1Steps.length + nivel2Steps.length + nivel3Steps.length,
      levels: {
        nivel1: {
          name: 'Nível 1 (Fundamentos / Base Intuitiva)',
          description: 'Construção da base conceitual intuitiva com zero sobrecarga cognitiva e isolamento de variáveis.',
          microSteps: nivel1Steps,
          masteryThresholdPercent: 80,
        },
        nivel2: {
          name: 'Nível 2 (Aplicação Curricular / Worked Examples)',
          description: 'Modelagem formal da BNCC com exemplos guiados em fading scaffolding e problemas do cotidiano.',
          microSteps: nivel2Steps,
          masteryThresholdPercent: 85,
        },
        nivel3: {
          name: 'Nível 3 (Aprofundamento / Desafio Olímpico e Vestibulares)',
          description: 'Aprofundamento de alto rendimento para olimpíadas científicas e vestibulares concorridos.',
          microSteps: nivel3Steps,
          masteryThresholdPercent: 90,
        },
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 2. AGENDAMENTO DE REVISÃO ESPAÇADA DE EBBINGHAUS (24h, 48h, 96h, 144h)
   */
  public scheduleEbbinghausReviews(
    studentId: string,
    skillId: string,
    masteryAchievedAt: Date = new Date()
  ): SpacedRepetitionSchedule {
    const key = `${studentId}_${skillId}`;
    const baseTimeMs = masteryAchievedAt.getTime();

    let cumulativeHours = 0;
    const reviews: ScheduledReviewItem[] = EBBINGHAUS_INTERVAL_HOURS.map((hours, index) => {
      cumulativeHours += hours;
      const scheduledDate = new Date(baseTimeMs + cumulativeHours * 3600 * 1000);
      return {
        id: `rev_${studentId}_${skillId}_idx${index}`,
        studentId,
        skillId,
        intervalIndex: index,
        intervalHours: hours,
        scheduledFor: scheduledDate.toISOString(),
        status: 'PENDING',
      };
    });

    const schedule: SpacedRepetitionSchedule = {
      studentId,
      skillId,
      firstMasteredAt: masteryAchievedAt.toISOString(),
      stabilityIndexHours: 24, // Estabilidade inicial
      reviews,
      isFullyConsolidated: false,
    };

    this.schedules.set(key, schedule);
    return schedule;
  }

  /**
   * Consulta de revisões vencidas ou devidas para um aluno
   */
  public getDueReviews(studentId: string, referenceDate: Date = new Date()): ScheduledReviewItem[] {
    const dueItems: ScheduledReviewItem[] = [];
    const refTime = referenceDate.getTime();

    for (const schedule of this.schedules.values()) {
      if (schedule.studentId !== studentId) continue;

      for (const review of schedule.reviews) {
        if (review.status === 'COMPLETED') continue;

        const scheduledTime = new Date(review.scheduledFor).getTime();
        if (scheduledTime <= refTime) {
          review.status = 'DUE';
          dueItems.push(review);
        }
      }
    }

    return dueItems;
  }

  /**
   * Registro do resultado de uma revisão espaçada com atualização da força da memória
   */
  public recordReviewOutcome(
    studentId: string,
    skillId: string,
    intervalIndex: number,
    success: boolean,
    score: number = success ? 100 : 40,
    timeSpentSeconds: number = 60,
    timestamp: Date = new Date()
  ): {
    schedule: SpacedRepetitionSchedule;
    updatedReview: ScheduledReviewItem;
    retentionProbability: number;
    recommendedNextAction: 'ADVANCE' | 'RETRY_SAME_INTERVAL' | 'REGRESS_TO_FOUNDATIONS';
  } {
    const key = `${studentId}_${skillId}`;
    let schedule = this.schedules.get(key);
    if (!schedule) {
      schedule = this.scheduleEbbinghausReviews(studentId, skillId, timestamp);
    }

    const review = schedule.reviews[intervalIndex];
    if (!review) {
      throw new Error(`Índice de revisão inválido: ${intervalIndex}`);
    }

    review.completedAt = timestamp.toISOString();
    review.success = success;
    review.timeSpentSeconds = timeSpentSeconds;

    let action: 'ADVANCE' | 'RETRY_SAME_INTERVAL' | 'REGRESS_TO_FOUNDATIONS' = 'ADVANCE';

    if (success) {
      review.status = 'COMPLETED';
      // Multiplica a estabilidade mnemônica (Spaced Repetition Stability Factor)
      schedule.stabilityIndexHours = Math.round(schedule.stabilityIndexHours * 1.8 + review.intervalHours);

      // Se completou a última etapa (144h), marca como totalmente consolidada
      if (intervalIndex === EBBINGHAUS_INTERVAL_HOURS.length - 1) {
        schedule.isFullyConsolidated = true;
      }
    } else {
      review.status = 'RELAPSED';
      // Regressão Kumon adaptativa: diminui estabilidade e reescalona
      schedule.stabilityIndexHours = Math.max(12, Math.round(schedule.stabilityIndexHours * 0.5));
      action = intervalIndex > 0 ? 'RETRY_SAME_INTERVAL' : 'REGRESS_TO_FOUNDATIONS';

      // Reescalona próxima tentativa em +24h
      if (intervalIndex < schedule.reviews.length - 1) {
        const nextReview = schedule.reviews[intervalIndex + 1];
        nextReview.scheduledFor = new Date(timestamp.getTime() + 24 * 3600 * 1000).toISOString();
        nextReview.status = 'PENDING';
      }
    }

    const retention = this.calculateRetentionProbability(
      new Date(schedule.firstMasteredAt),
      schedule.stabilityIndexHours,
      timestamp
    );
    review.retentionScore = Math.round(retention * 100);

    return {
      schedule,
      updatedReview: review,
      retentionProbability: retention,
      recommendedNextAction: action,
    };
  }

  /**
   * Cálculo da probabilidade de retenção na curva de esquecimento: R(t) = exp(-t / S)
   */
  public calculateRetentionProbability(
    lastLearnedDate: Date,
    stabilityHours: number,
    targetDate: Date = new Date()
  ): number {
    const elapsedHours = Math.max(0, (targetDate.getTime() - lastLearnedDate.getTime()) / (3600 * 1000));
    const safeStability = Math.max(1, stabilityHours);
    const retention = Math.exp(-elapsedHours / safeStability);
    return Math.min(1.0, Math.max(0.01, Number(retention.toFixed(4))));
  }

  /**
   * 3. DETECÇÃO SOCRÁTICA DE EQUÍVOCOS CONCEITUAIS (MISCONCEPTIONS)
   */
  public registerCustomMisconception(pattern: MisconceptionPattern): void {
    this.customMisconceptions.push(pattern);
  }

  public diagnoseMisconception(submission: StudentSubmission): MisconceptionDiagnosis {
    // Se a resposta estiver correta, não há equívoco
    if (submission.studentAnswer.trim() === submission.expectedAnswer.trim()) {
      return {
        hasMisconception: false,
        confidence: 1.0,
        recommendedAction: 'PROCEED',
      };
    }

    const allPatterns = [...CANONICAL_MISCONCEPTION_PATTERNS, ...this.customMisconceptions];

    for (const pattern of allPatterns) {
      if (pattern.detector(submission)) {
        const intervention: SocraticIntervention = {
          studentId: submission.studentId,
          skillId: submission.skillId,
          misconceptionId: pattern.id,
          inquiryQuestion: pattern.socraticInquiryPrompt,
          counterExample: pattern.concreteCounterExample,
          guidingHint: `Observe com atenção o contraexemplo. Aplique o mesmo raciocínio ao problema original sem pular etapas.`,
          correctiveStepAnchor: pattern.correctiveMicroStepAnchor,
          remedialScaffoldingLevel: pattern.remedialLevel,
        };

        return {
          hasMisconception: true,
          detectedMisconception: {
            id: pattern.id,
            title: pattern.title,
            description: pattern.description,
            counterExample: pattern.concreteCounterExample,
          },
          socraticIntervention: intervention,
          confidence: 0.95,
          recommendedAction:
            pattern.remedialLevel === 'NIVEL_1_FUNDAMENTOS'
              ? 'TRIGGER_LEVEL_1_REMEDIATION'
              : 'OFFER_SOCRATIC_HINT',
        };
      }
    }

    // Erro comum não-catalogado
    return {
      hasMisconception: false,
      confidence: 0.5,
      recommendedAction: 'REPEAT_WORKED_EXAMPLE',
    };
  }

  /**
   * Geração de Micro-Exercício Kumon Paramétrico com SCT
   */
  public generateKumonMicroDrill(
    skillId: string,
    level: AquilaScaffoldingLevel,
    difficultyIndex: number = 5
  ): KumonMicroDrill {
    const isLevel1 = level === 'NIVEL_1_FUNDAMENTOS';
    const sctSeconds = isLevel1 ? 40 : level === 'NIVEL_2_APLICACAO_CURRICULAR' ? 80 : 180;

    return {
      drillId: `drill_${skillId}_${level}_d${difficultyIndex}_${Date.now()}`,
      skillId,
      level,
      difficultyIndex,
      problemStatement: isLevel1
        ? `Resolva a operação elementar de ancoragem com um único passo visual.`
        : `Resolva o problema aplicando o procedimento de worked example sem pular linhas.`,
      expectedAnswer: isLevel1 ? '1' : '10',
      standardCompletionTimeSeconds: sctSeconds,
      hintsAvailable: [
        'Isole o primeiro termo antes de combinar.',
        'Desenhe o modelo de barras para enxergar as proporções.',
      ],
    };
  }

  public getSchedule(studentId: string, skillId: string): SpacedRepetitionSchedule | undefined {
    return this.schedules.get(`${studentId}_${skillId}`);
  }

  public clearSchedules(): void {
    this.schedules.clear();
  }
}

export const pedagogicalScaffoldingEngine = PedagogicalScaffoldingEngine.getInstance();
export default pedagogicalScaffoldingEngine;
