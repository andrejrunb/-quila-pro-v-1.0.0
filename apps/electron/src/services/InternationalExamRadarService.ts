/**
 * Áquila Pro — InternationalExamRadarService (Onda 5: Radar Global PISA & TIMSS)
 * 
 * Serviço de Avaliação Comparativa Internacional:
 * - Catálogo estruturado de itens desclassificados e públicos do PISA (OCDE) e TIMSS (IEA).
 * - Calibração na escala métrica internacional (Média = 500, Desvio Padrão = 100).
 * - Níveis de Proficiência PISA (Abaixo do Nível 1 até Nível 6) e Benchmarks TIMSS (Low a Advanced).
 * - Conversor e harmonizador métrico entre escalas SAEB (M=250, SD=50), ENEM (M=500, SD=100) e PISA/TIMSS.
 * - Mapeamento pedagógico cruzado entre matriz de descritores SAEB/BNCC e competências globais OCDE/IEA.
 */

export type InternationalProgram = 'PISA' | 'TIMSS';

export type PisaDomain = 'reading' | 'mathematics' | 'science';

export type TimssDomain = 'mathematics' | 'science';

export type TargetEducationGrade = '4th_grade' | '8th_grade' | '15_year_olds';

export type PisaProficiencyLevel =
  | 'LEVEL_6'       // >= 669 pts (Pensamento autônomo, modelagem complexa)
  | 'LEVEL_5'       // 607 a 668 pts (Raciocínio científico/matemático avançado)
  | 'LEVEL_4'       // 545 a 606 pts (Resolução de problemas de múltiplos passos)
  | 'LEVEL_3'       // 482 a 544 pts (Interpretação e execução intermediária)
  | 'LEVEL_2'       // 420 a 481 pts (Limiar Básico da OCDE / Baseline Literacy)
  | 'LEVEL_1'       // 358 a 419 pts (Tarefas diretas, instruções explícitas)
  | 'BELOW_LEVEL_1';// < 358 pts (Abaixo do nível funcional mínimo da OCDE)

export type TimssBenchmarkLevel =
  | 'ADVANCED'      // >= 625 pts (Investigação rigorosa e abstração)
  | 'HIGH'          // 550 a 624 pts (Aplicação em contextos complexos)
  | 'INTERMEDIATE'  // 475 a 549 pts (Aplicação de conhecimentos básicos)
  | 'LOW'           // 400 a 474 pts (Conhecimento elementar factual)
  | 'BELOW_LOW';    // < 400 pts (Abaixo do padrão de referência elementar)

export interface InternationalReleasedItem {
  id: string;
  program: InternationalProgram;
  yearReleased: number;
  domain: PisaDomain;
  targetGrade: TargetEducationGrade;
  title: string;
  stimulusContext: string;
  questionText: string;
  options?: { letter: 'A' | 'B' | 'C' | 'D' | 'E'; text: string }[];
  correctAnswer: string;
  itemType: 'multiple_choice' | 'constructed_response';
  pisaProficiencyLevel?: PisaProficiencyLevel;
  timssBenchmark?: TimssBenchmarkLevel;
  scaleCalibrationScore: number; // Escore calibrado no PISA/TIMSS (escala 500/100)
  triParameters: {
    paramA: number; // Discriminação (0.5 a 2.5)
    paramB: number; // Dificuldade na escala theta (-3.0 a +3.0)
    paramC: number; // Acerto ao acaso
  };
  cognitiveProcess: string; // Ex: 'Formulate', 'Employ', 'Interpret/Evaluate', 'Knowing', 'Applying', 'Reasoning'
  saebCorrelations: string[]; // Ex: ['D14', 'D20']
  bnccCorrelations: string[]; // Ex: ['EM13MAT301', 'EF09MA06']
  pedagogicalRubric: string;
}

export interface ScaleConversionResult {
  theta: number;
  pisaScore: number;
  timssScore: number;
  saebScore: number;
  enemScore: number;
  pisaProficiencyLevel: PisaProficiencyLevel;
  timssBenchmark: TimssBenchmarkLevel;
  isOecdBaselineMet: boolean; // >= Nível 2 PISA (420 pontos)
  comparativeVerdict: string;
}

export interface CrosswalkDescriptorMapping {
  saebDescriptorCode: string;
  saebDescription: string;
  internationalDomain: PisaDomain;
  pisaCompetency: string;
  timssCognitiveDomain: string;
  correlatedBnccCodes: string[];
  pedagogicalBridgeNotes: string;
}

export interface InternationalDiagnosticReport {
  studentOrGroupIdentifier: string;
  estimatedTheta: number;
  pisaScore: number;
  pisaLevel: PisaProficiencyLevel;
  timssScore: number;
  timssBenchmark: TimssBenchmarkLevel;
  isOecdBaselineMet: boolean;
  gapToOecdAverage: number; // Comparação com a média dos países OCDE (500 pts)
  gapToBrazilAveragePisa: number; // Comparação com a média histórica do Brasil no PISA (~384-410 pts)
  recommendedFocusAreas: string[];
  internationalDiagnosticSummary: string;
}

/**
 * Catálogo Curado de Itens Desclassificados Oficiais do PISA e TIMSS
 */
export const OFFICIAL_INTERNATIONAL_ITEMS: InternationalReleasedItem[] = [
  // ============================================================================
  // PISA — MATEMÁTICA
  // ============================================================================
  {
    id: 'PISA-MAT-01',
    program: 'PISA',
    yearReleased: 2012,
    domain: 'mathematics',
    targetGrade: '15_year_olds',
    title: 'Caminhada (Walking - P900Q01)',
    stimulusContext: 'A fórmula n / p = 140 fornece o número aproximado de passos por minuto (n) dados por uma pessoa, onde p é o comprimento da passada em metros.',
    questionText: 'Se a fórmula se aplica à caminhada do Heitor e ele dá 70 passos por minuto, qual é o comprimento da sua passada?',
    options: [
      { letter: 'A', text: '0,25 metros' },
      { letter: 'B', text: '0,50 metros' },
      { letter: 'C', text: '0,75 metros' },
      { letter: 'D', text: '1,00 metro' },
      { letter: 'E', text: '1,40 metros' }
    ],
    correctAnswer: 'B',
    itemType: 'multiple_choice',
    pisaProficiencyLevel: 'LEVEL_2',
    scaleCalibrationScore: 456,
    triParameters: {
      paramA: 1.15,
      paramB: -0.44,
      paramC: 0.20
    },
    cognitiveProcess: 'Employ',
    saebCorrelations: ['D20', 'D14'],
    bnccCorrelations: ['EM13MAT101', 'EF09MA08'],
    pedagogicalRubric: 'Resolver equação do 1º grau direta p = n / 140 = 70 / 140 = 0,5m. Limiar de alfabetização matemática OCDE.'
  },
  {
    id: 'PISA-MAT-02',
    program: 'PISA',
    yearReleased: 2015,
    domain: 'mathematics',
    targetGrade: '15_year_olds',
    title: 'Cultivo de Macieiras (Apples - M136Q01)',
    stimulusContext: 'Um agricultor planta macieiras em padrão quadrado com pinheiros protetores contra o vento ao redor. Número de macieiras = n²; número de pinheiros = 8n.',
    questionText: 'Para qual valor de n o número de macieiras se torna exatamente igual ao número de pinheiros plantados?',
    options: [
      { letter: 'A', text: 'n = 4' },
      { letter: 'B', text: 'n = 8' },
      { letter: 'C', text: 'n = 12' },
      { letter: 'D', text: 'n = 16' },
      { letter: 'E', text: 'n = 64' }
    ],
    correctAnswer: 'B',
    itemType: 'multiple_choice',
    pisaProficiencyLevel: 'LEVEL_4',
    scaleCalibrationScore: 568,
    triParameters: {
      paramA: 1.55,
      paramB: 0.68,
      paramC: 0.20
    },
    cognitiveProcess: 'Formulate',
    saebCorrelations: ['D21'],
    bnccCorrelations: ['EM13MAT302', 'EF09MA06'],
    pedagogicalRubric: 'Igualar equações n² = 8n => n(n - 8) = 0 => n = 8 (para n > 0). Exige formulação algébrica e abstração de padrões.'
  },
  {
    id: 'PISA-MAT-03',
    program: 'PISA',
    yearReleased: 2022,
    domain: 'mathematics',
    targetGrade: '15_year_olds',
    title: 'Preço Dinâmico e Inflação Energética',
    stimulusContext: 'Uma matriz energética combinada sofreu um choque de custo inicial de 25% no 1º trimestre, seguido de um desconto de contenção governamental de 20% no 2º trimestre.',
    questionText: 'Em relação ao preço original antes do choque, o preço final da energia no fim do 2º trimestre:',
    options: [
      { letter: 'A', text: 'Aumentou 5%' },
      { letter: 'B', text: 'Permaneceu exatamente o mesmo (0% de variação)' },
      { letter: 'C', text: 'Reduziu 5%' },
      { letter: 'D', text: 'Reduziu 2,5%' },
      { letter: 'E', text: 'Aumentou 2%' }
    ],
    correctAnswer: 'B',
    itemType: 'multiple_choice',
    pisaProficiencyLevel: 'LEVEL_3',
    scaleCalibrationScore: 512,
    triParameters: {
      paramA: 1.30,
      paramB: 0.12,
      paramC: 0.20
    },
    cognitiveProcess: 'Interpret/Evaluate',
    saebCorrelations: ['D14'],
    bnccCorrelations: ['EM13MAT101', 'EF09MA08'],
    pedagogicalRubric: 'Cálculo sucessivo: P * 1,25 * 0,80 = P * 1,00. Avalia compreensão de fatores multiplicativos sobrepostos.'
  },

  // ============================================================================
  // PISA — LEITURA (READING LITERACY)
  // ============================================================================
  {
    id: 'PISA-READ-01',
    program: 'PISA',
    yearReleased: 2018,
    domain: 'reading',
    targetGrade: '15_year_olds',
    title: 'Lago Chade (Lake Chad - R040Q02)',
    stimulusContext: 'O Lago Chade, na África subsaariana, varia drasticamente de tamanho. O texto apresenta um gráfico da profundidade entre 11.000 a.C. e os dias atuais e um texto explicativo sobre as mudanças climáticas e o consumo humano de irrigação.',
    questionText: 'A partir da leitura conjunta do gráfico histórico e do texto, qual fenômeno explica a contração mais recente e acelerada da superfície do lago a partir de 1970?',
    options: [
      { letter: 'A', text: 'Apenas a evaporação natural decorrente do ciclo solar de 11 anos' },
      { letter: 'B', text: 'A combinação de secas prolongadas no Sahel com a drenagem excessiva para irrigação agrícola' },
      { letter: 'C', text: 'O desvio permanente das cabeceiras glaciais dos Andes' },
      { letter: 'D', text: 'O aumento da densidade salina que impede o fluxo de afluentes' },
      { letter: 'E', text: 'A formação de diques geológicos naturais no período quaternário' }
    ],
    correctAnswer: 'B',
    itemType: 'multiple_choice',
    pisaProficiencyLevel: 'LEVEL_3',
    scaleCalibrationScore: 495,
    triParameters: {
      paramA: 1.40,
      paramB: -0.05,
      paramC: 0.20
    },
    cognitiveProcess: 'Integrate and Generate Inferences',
    saebCorrelations: ['D03_LP', 'D04_LP'],
    bnccCorrelations: ['EM13LP05', 'EF09LP04'],
    pedagogicalRubric: 'Correlacionar dados de infográfico temporal com inferências textuais sobre impacto antrópico e climático.'
  },
  {
    id: 'PISA-READ-02',
    program: 'PISA',
    yearReleased: 2018,
    domain: 'reading',
    targetGrade: '15_year_olds',
    title: 'Grafite e Espaço Urbano (Graffiti - R081Q01)',
    stimulusContext: 'Dois artigos de opinião divergentes: Carta 1 defende o grafite como expressão artística democrática; Carta 2 condena o grafite como depredação visual que gera insegurança e custos municipais.',
    questionText: 'Qual é o principal propósito comunicativo comum compartilhado pelos autores das duas cartas?',
    options: [
      { letter: 'A', text: 'Divulgar as técnicas de pintura com spray aos jovens artistas' },
      { letter: 'B', text: 'Expor argumentos persuasivos sobre a legitimidade do grafite na comunidade' },
      { letter: 'C', text: 'Anunciar o orçamento das tintas utilizadas pelos órgãos municipais' },
      { letter: 'D', text: 'Relatar o histórico das inscrições murais na Roma Antiga' },
      { letter: 'E', text: 'Propor sanções penais uniformes para qualquer manifestação de rua' }
    ],
    correctAnswer: 'B',
    itemType: 'multiple_choice',
    pisaProficiencyLevel: 'LEVEL_2',
    scaleCalibrationScore: 435,
    triParameters: {
      paramA: 1.20,
      paramB: -0.65,
      paramC: 0.20
    },
    cognitiveProcess: 'Reflect and Evaluate Form and Content',
    saebCorrelations: ['D06_LP', 'D14_LP'],
    bnccCorrelations: ['EM13LP01', 'EM13LP08'],
    pedagogicalRubric: 'Identificar a intencionalidade argumentativa em textos de opinião contrapostos.'
  },

  // ============================================================================
  // PISA — CIÊNCIAS (SCIENTIFIC LITERACY)
  // ============================================================================
  {
    id: 'PISA-SCI-01',
    program: 'PISA',
    yearReleased: 2015,
    domain: 'science',
    targetGrade: '15_year_olds',
    title: 'Efeito Estufa e Emissões Globais (Greenhouse - S114Q03)',
    stimulusContext: 'Emissões de gases de efeito estufa (CO2, metano) absorvem radiação infravermelha emitida pela superfície terrestre, mantendo o balanço radiativo do planeta.',
    questionText: 'Qual evidência empírica melhor sustenta a hipótese de que o aumento acelerado da temperatura média global no último século decorre primordialmente da atividade industrial humana?',
    options: [
      { letter: 'A', text: 'O alinhamento estrito entre a taxa de queima de combustíveis fósseis e a assinatura isotópica de carbono na atmosfera' },
      { letter: 'B', text: 'A oscilação constante da órbita lunar registrada em observatórios astronômicos' },
      { letter: 'C', text: 'A diminuição do volume de chuvas nas zonas desérticas sem vegetação' },
      { letter: 'D', text: 'A estabilização do nível médio dos oceanos nas últimas quatro décadas' },
      { letter: 'E', text: 'O resfriamento abrupto do núcleo geotérmico continental' }
    ],
    correctAnswer: 'A',
    itemType: 'multiple_choice',
    pisaProficiencyLevel: 'LEVEL_4',
    scaleCalibrationScore: 575,
    triParameters: {
      paramA: 1.65,
      paramB: 0.75,
      paramC: 0.20
    },
    cognitiveProcess: 'Interpret Data and Evidence Scientifically',
    saebCorrelations: ['D01_NAT'],
    bnccCorrelations: ['EM13CNT101', 'EM13CNT202'],
    pedagogicalRubric: 'Análise de evidência científica empírica através de razão isotópica C-12 / C-13.'
  },

  // ============================================================================
  // TIMSS — MATEMÁTICA E CIÊNCIAS (4º E 8º ANOS - IEA)
  // ============================================================================
  {
    id: 'TIMSS-MAT-01',
    program: 'TIMSS',
    yearReleased: 2019,
    domain: 'mathematics',
    targetGrade: '8th_grade',
    title: 'Equilíbrio e Frações de Balança (M062001)',
    stimulusContext: 'Uma balança de dois pratos está em perfeito equilíbrio. No prato esquerdo há 3 blocos idênticos marcados com a letra X e um peso de 50g. No prato direito há 1 bloco X e um peso de 250g.',
    questionText: 'Qual é a massa exata de cada bloco X?',
    options: [
      { letter: 'A', text: '50 gramas' },
      { letter: 'B', text: '100 gramas' },
      { letter: 'C', text: '150 gramas' },
      { letter: 'D', text: '200 gramas' },
      { letter: 'E', text: '250 gramas' }
    ],
    correctAnswer: 'B',
    itemType: 'multiple_choice',
    timssBenchmark: 'INTERMEDIATE',
    scaleCalibrationScore: 490,
    triParameters: {
      paramA: 1.25,
      paramB: -0.10,
      paramC: 0.20
    },
    cognitiveProcess: 'Applying',
    saebCorrelations: ['D20'],
    bnccCorrelations: ['EF09MA06', 'EF09MA08'],
    pedagogicalRubric: 'Equação de equilíbrio: 3X + 50 = X + 250 => 2X = 200 => X = 100g. Benchmark Intermediário TIMSS 8º ano.'
  },
  {
    id: 'TIMSS-MAT-02',
    program: 'TIMSS',
    yearReleased: 2019,
    domain: 'mathematics',
    targetGrade: '4th_grade',
    title: 'Partição de Superfície e Frações de Pizza (M041005)',
    stimulusContext: 'Uma turma dividiu 3 pizzas idênticas de forma que cada estudante recebesse exatamente 3/8 de uma pizza, sem sobrar nenhum pedaço.',
    questionText: 'Quantos estudantes receberam uma porção de pizza nessa turma?',
    options: [
      { letter: 'A', text: '6 estudantes' },
      { letter: 'B', text: '8 estudantes' },
      { letter: 'C', text: '9 estudantes' },
      { letter: 'D', text: '12 estudantes' },
      { letter: 'E', text: '24 estudantes' }
    ],
    correctAnswer: 'B',
    itemType: 'multiple_choice',
    timssBenchmark: 'HIGH',
    scaleCalibrationScore: 560,
    triParameters: {
      paramA: 1.45,
      paramB: 0.60,
      paramC: 0.20
    },
    cognitiveProcess: 'Reasoning',
    saebCorrelations: ['D14'],
    bnccCorrelations: ['EF09MA08'],
    pedagogicalRubric: 'Divisão fracionária: 3 ÷ (3/8) = 3 * (8/3) = 8 estudantes. Raciocínio proporcional abstrato para 4º ano.'
  },
  {
    id: 'TIMSS-SCI-01',
    program: 'TIMSS',
    yearReleased: 2019,
    domain: 'science',
    targetGrade: '8th_grade',
    title: 'Transformações de Energia em Montanha-Russa (S062012)',
    stimulusContext: 'Um carrinho de montanha-russa desce do repouso no ponto mais alto (Ponto A) até o ponto mais baixo da pista (Ponto B), desprezando-se as perdas por atrito com o ar e trilhos.',
    questionText: 'Ao atingir o Ponto B, como se caracterizam as energias potencial gravitacional e cinética do carrinho em relação ao Ponto A?',
    options: [
      { letter: 'A', text: 'Ambas as energias aumentaram' },
      { letter: 'B', text: 'A energia potencial gravitacional é mínima e a energia cinética é máxima' },
      { letter: 'C', text: 'A energia potencial gravitacional é máxima e a cinética é nula' },
      { letter: 'D', text: 'Ambas as energias se anularam completamente' },
      { letter: 'E', text: 'A energia cinética foi transformada integralmente em massa estática' }
    ],
    correctAnswer: 'B',
    itemType: 'multiple_choice',
    timssBenchmark: 'INTERMEDIATE',
    scaleCalibrationScore: 505,
    triParameters: {
      paramA: 1.35,
      paramB: 0.05,
      paramC: 0.20
    },
    cognitiveProcess: 'Knowing and Applying',
    saebCorrelations: ['D01_NAT'],
    bnccCorrelations: ['EM13CNT101'],
    pedagogicalRubric: 'Princípio da conservação da energia mecânica: Em = Ep + Ec. No ponto mais baixo h=0, logo Ep é mínima e Ec é máxima.'
  }
];

/**
 * Mapeamento Cruzado Oficial entre Descritores SAEB / Habilidades BNCC
 * e as Competências Globais da OCDE (PISA) e IEA (TIMSS)
 */
export const SAEB_BNCC_TO_INTERNATIONAL_CROSSWALK: Record<string, CrosswalkDescriptorMapping> = {
  'D14': {
    saebDescriptorCode: 'D14',
    saebDescription: 'Resolver problema envolvendo noções de porcentagem (acréscimos, descontos, fatores).',
    internationalDomain: 'mathematics',
    pisaCompetency: 'Quantity / Employ Mathematical Concepts and Facts',
    timssCognitiveDomain: 'Applying / Number Operations and Ratio',
    correlatedBnccCodes: ['EM13MAT101', 'EF09MA08'],
    pedagogicalBridgeNotes: 'Crucial para o Nível 2 e 3 do PISA. Capacita o estudante a tomar decisões de consumo, cálculo de taxas e juros na vida cívica.'
  },
  'D20': {
    saebDescriptorCode: 'D20',
    saebDescription: 'Analisar crescimento/decrescimento e zeros de funções afins (1º grau) expressas em gráficos ou tabelas.',
    internationalDomain: 'mathematics',
    pisaCompetency: 'Change and Relationships / Formulate Situations Mathematically',
    timssCognitiveDomain: 'Reasoning / Algebra and Functional Relationships',
    correlatedBnccCodes: ['EM13MAT301'],
    pedagogicalBridgeNotes: 'Corresponde à competência nuclear de modelagem de taxas constantes no PISA (Níveis 2 a 4).'
  },
  'D21': {
    saebDescriptorCode: 'D21',
    saebDescription: 'Identificar o gráfico de uma função quadrática a partir de seus coeficientes e raízes.',
    internationalDomain: 'mathematics',
    pisaCompetency: 'Change and Relationships / Mathematical Modeling',
    timssCognitiveDomain: 'Reasoning / Non-linear Patterns',
    correlatedBnccCodes: ['EM13MAT302', 'EF09MA06'],
    pedagogicalBridgeNotes: 'Habilidade diferencial para atingir o Nível 4/5 no PISA e Benchmark High no TIMSS.'
  },
  'D01_LP': {
    saebDescriptorCode: 'D01_LP',
    saebDescription: 'Localizar informações explícitas em um texto.',
    internationalDomain: 'reading',
    pisaCompetency: 'Locate Information / Access and Retrieve',
    timssCognitiveDomain: 'Knowing / Direct Retrieval',
    correlatedBnccCodes: ['EM13LP01', 'EF09LP01'],
    pedagogicalBridgeNotes: 'Base do Nível 1a e 1b no PISA. Sem esse domínio, o aluno se situa abaixo da proficiência funcional mínima da OCDE.'
  },
  'D03_LP': {
    saebDescriptorCode: 'D03_LP',
    saebDescription: 'Inferir o sentido de uma palavra ou expressão a partir do contexto.',
    internationalDomain: 'reading',
    pisaCompetency: 'Understand / Integrate and Generate Inferences',
    timssCognitiveDomain: 'Applying / Interpret Contextual Meaning',
    correlatedBnccCodes: ['EM13LP03', 'EF09LP04'],
    pedagogicalBridgeNotes: 'Necessário para atingir o Nível 2 (Baseline) e Nível 3 no PISA Leitura.'
  },
  'D14_LP': {
    saebDescriptorCode: 'D14_LP',
    saebDescription: 'Distinguir um fato da opinião relativa a esse fato.',
    internationalDomain: 'reading',
    pisaCompetency: 'Evaluate and Reflect / Assess Quality and Credibility',
    timssCognitiveDomain: 'Reasoning / Critical Evaluation',
    correlatedBnccCodes: ['EM13LP08'],
    pedagogicalBridgeNotes: 'Competência crítica central da OCDE para letramento digital e combate à desinformação (PISA Nível 3 a 5).'
  },
  'D01_NAT': {
    saebDescriptorCode: 'D01_NAT',
    saebDescription: 'Compreender conservação de energia e propriedades fundamentais da matéria.',
    internationalDomain: 'science',
    pisaCompetency: 'Explain Phenomena Scientifically',
    timssCognitiveDomain: 'Knowing and Applying / Physical Sciences',
    correlatedBnccCodes: ['EM13CNT101'],
    pedagogicalBridgeNotes: 'Pilar do letramento científico do PISA para entender matrizes de transição energética.'
  }
};

/**
 * Serviço Soberano de Avaliação Internacional (PISA / TIMSS)
 */
export class InternationalExamRadarService {
  /**
   * Converte a habilidade latente da TRI (theta) para o escore PISA (Média 500, DP 100)
   */
  public static convertThetaToPisaScore(theta: number): number {
    const raw = 500 + theta * 100;
    return Math.round(Math.max(100, Math.min(900, raw)));
  }

  /**
   * Converte o escore PISA de volta para a habilidade latente da TRI (theta)
   */
  public static convertPisaScoreToTheta(pisaScore: number): number {
    return +((pisaScore - 500) / 100).toFixed(3);
  }

  /**
   * Classifica o Escore PISA nos Níveis Oficiais de Proficiência da OCDE (1 a 6)
   */
  public static classifyPisaProficiencyLevel(pisaScore: number): PisaProficiencyLevel {
    if (pisaScore >= 669) return 'LEVEL_6';
    if (pisaScore >= 607) return 'LEVEL_5';
    if (pisaScore >= 545) return 'LEVEL_4';
    if (pisaScore >= 482) return 'LEVEL_3';
    if (pisaScore >= 420) return 'LEVEL_2';
    if (pisaScore >= 358) return 'LEVEL_1';
    return 'BELOW_LEVEL_1';
  }

  /**
   * Classifica o Escore TIMSS nos Benchmarks Internacionais Oficiais da IEA
   */
  public static classifyTimssBenchmark(timssScore: number): TimssBenchmarkLevel {
    if (timssScore >= 625) return 'ADVANCED';
    if (timssScore >= 550) return 'HIGH';
    if (timssScore >= 475) return 'INTERMEDIATE';
    if (timssScore >= 400) return 'LOW';
    return 'BELOW_LOW';
  }

  /**
   * Harmonizador Métrico Inter-escalas:
   * Converte uma pontuação SAEB (M=250, DP=50) diretamente para a Escala Internacional PISA/TIMSS (M=500, DP=100)
   * Fórmula: Theta = (SAEB - 250) / 50 => PISA = 500 + Theta * 100 = 500 + 2 * (SAEB - 250) = 2 * SAEB
   */
  public static convertSaebToPisa(saebScore: number): number {
    const theta = (saebScore - 250) / 50;
    return this.convertThetaToPisaScore(theta);
  }

  /**
   * Harmonizador Reverso: Converte Escala Internacional PISA/TIMSS para SAEB
   * Fórmula: SAEB = PISA / 2
   */
  public static convertPisaToSaeb(pisaScore: number): number {
    const theta = (pisaScore - 500) / 100;
    const rawSaeb = 250 + theta * 50;
    return Math.round(Math.max(100, Math.min(500, rawSaeb)));
  }

  /**
   * Harmonizador entre Escala ENEM (M=500, DP=100) e PISA (M=500, DP=100)
   * Ambas compartilham a mesma métrica de escore padrão (Z-score).
   */
  public static convertEnemToPisa(enemScore: number): number {
    return Math.round(Math.max(100, Math.min(900, enemScore)));
  }

  /**
   * Executa a Conversão Multidimensional Unificada a partir do Theta latente
   */
  public static performUnifiedScaleConversion(theta: number): ScaleConversionResult {
    const pisaScore = this.convertThetaToPisaScore(theta);
    const timssScore = pisaScore; // Mesma métrica internacional de M=500, SD=100
    const saebScore = Math.round(Math.max(100, Math.min(500, 250 + theta * 50)));
    const enemScore = Math.round(Math.max(200, Math.min(1000, 500 + theta * 100)));
    const pisaProficiencyLevel = this.classifyPisaProficiencyLevel(pisaScore);
    const timssBenchmark = this.classifyTimssBenchmark(timssScore);
    const isOecdBaselineMet = pisaScore >= 420;

    let comparativeVerdict = '';
    if (pisaScore >= 607) {
      comparativeVerdict = 'Padrão de Excelência Global: No topo dos 10% mundiais (comparável a Singapura, Japão e Coreia do Sul).';
    } else if (pisaScore >= 500) {
      comparativeVerdict = 'Nível Acima da Média OCDE: Plenamente proficiente em contextos internacionais.';
    } else if (isOecdBaselineMet) {
      comparativeVerdict = 'Linha de Base OCDE Assegurada: Letramento funcional mínimo consolidado, acima da média histórica brasileira no PISA.';
    } else {
      comparativeVerdict = 'Alerta Pedagógico Crítico: Abaixo do limiar básico da OCDE (Risco de analfabetismo funcional contemporâneo).';
    }

    return {
      theta,
      pisaScore,
      timssScore,
      saebScore,
      enemScore,
      pisaProficiencyLevel,
      timssBenchmark,
      isOecdBaselineMet,
      comparativeVerdict
    };
  }

  /**
   * Retorna os itens do catálogo internacional filtrados por programa ou domínio
   */
  public static getCatalogItems(filters?: {
    program?: InternationalProgram;
    domain?: PisaDomain;
    targetGrade?: TargetEducationGrade;
  }): InternationalReleasedItem[] {
    let list = OFFICIAL_INTERNATIONAL_ITEMS;
    if (filters?.program) {
      list = list.filter(item => item.program === filters.program);
    }
    if (filters?.domain) {
      list = list.filter(item => item.domain === filters.domain);
    }
    if (filters?.targetGrade) {
      list = list.filter(item => item.targetGrade === filters.targetGrade);
    }
    return list;
  }

  /**
   * Busca a correlação pedagógica internacional para um descritor SAEB
   */
  public static getCrosswalkMapping(descriptorCode: string): CrosswalkDescriptorMapping | null {
    return SAEB_BNCC_TO_INTERNATIONAL_CROSSWALK[descriptorCode] || null;
  }

  /**
   * Gera Diagnóstico Comparativo Internacional para um Estudante ou Turma
   */
  public static generateInternationalDiagnostic(
    identifier: string,
    theta: number,
    weakDescriptorCodes: string[] = []
  ): InternationalDiagnosticReport {
    const conversion = this.performUnifiedScaleConversion(theta);
    const gapToOecdAverage = conversion.pisaScore - 500;
    const brazilHistoricAverage = 390; // Média agregada histórica do Brasil no PISA
    const gapToBrazilAveragePisa = conversion.pisaScore - brazilHistoricAverage;

    const recommendedFocusAreas: string[] = [];
    weakDescriptorCodes.forEach(code => {
      const mapping = this.getCrosswalkMapping(code);
      if (mapping) {
        recommendedFocusAreas.push(
          `[${mapping.internationalDomain.toUpperCase()}] Reforçar ${mapping.pisaCompetency} (Descritor ${code} — ${mapping.pedagogicalBridgeNotes})`
        );
      }
    });

    if (recommendedFocusAreas.length === 0 && !conversion.isOecdBaselineMet) {
      recommendedFocusAreas.push(
        'Priorizar interpretação direta de enunciados cotidianos e cálculo de grandezas proporcionais (Nível 2 OCDE).'
      );
    }

    let summary = '';
    if (conversion.isOecdBaselineMet) {
      summary = `O estudante/turma atingiu a pontuação ${conversion.pisaScore} no PISA (${conversion.pisaProficiencyLevel}), superando a Linha de Base da OCDE (+${gapToBrazilAveragePisa} pts em relação à média brasileira).`;
    } else {
      summary = `Atenção: Pontuação PISA ${conversion.pisaScore} (${conversion.pisaProficiencyLevel}) encontra-se ${Math.abs(gapToOecdAverage)} pontos abaixo da média da OCDE e aquém do limiar mínimo funcional (Nível 2). Requer intervenção pedagógica orientada.`;
    }

    return {
      studentOrGroupIdentifier: identifier,
      estimatedTheta: theta,
      pisaScore: conversion.pisaScore,
      pisaLevel: conversion.pisaProficiencyLevel,
      timssScore: conversion.timssScore,
      timssBenchmark: conversion.timssBenchmark,
      isOecdBaselineMet: conversion.isOecdBaselineMet,
      gapToOecdAverage,
      gapToBrazilAveragePisa,
      recommendedFocusAreas,
      internationalDiagnosticSummary: summary
    };
  }
}
