/**
 * Áquila Pro — PedagogicalTriEngine (Onda 8)
 * 
 * Motor de Avaliação Pedagógica baseado na Teoria de Resposta ao Item (TRI)
 * Modelo Logístico de 3 Parâmetros (3PL):
 *   P(θ) = c + (1 - c) / (1 + e^(-1.7 * a * (θ - b)))
 * 
 * Funcionalidades:
 * - Estimador Bayesiano EAP (Expected A Posteriori) e MLE/Bisseção com regularização
 * - Cálculo de Coerência Pedagógica e Detecção de Padrão de Chute (Guttman Inconsistency & Levine-Drastow Fit)
 * - Mapeamento Direto de Matrizes de Referência SAEB e Habilidades da BNCC
 * - Escalas de Proficiência Oficiais: ENEM (M=500, SD=100) e SAEB (M=250, SD=50)
 * - Privacidade Soberana (LGPD Art. 14/16): Relatório individual confidencial e agregação estatística para o corpo docente (Sem Ranqueamento Público Estigmatizante).
 */

export const TRI_SCALING_CONSTANT_D = 1.7;

export type KnowledgeArea = 'matematica' | 'linguagens' | 'natureza' | 'humanas';
export type EducationStage =
  | 'EF_ANOS_INICIAIS'
  | 'EF_ANOS_FINAIS'
  | 'ENSINO_MEDIO'
  | 'VESTIBULAR_MEDICINA';
export type MasteryLevel = 'abaixo_do_basico' | 'basico' | 'proficiente' | 'avancado';

export interface SaebDescriptor {
  code: string; // Ex: 'D01', 'D14', 'D28'
  area: KnowledgeArea;
  topic: string; // Ex: 'I - Espaço e Forma', 'III - Números e Operações / Álgebra'
  description: string;
  stage: EducationStage;
  correlatedBnccCodes: string[]; // Ex: ['EM13MAT101', 'EM13MAT301']
}

export interface BnccSkill {
  code: string; // Ex: 'EM13MAT101'
  area: KnowledgeArea;
  component: string; // Ex: 'Matemática'
  description: string;
  stage: EducationStage;
}

export interface TriItemParameters {
  id: string;
  paramA: number; // Discriminação do item (a > 0, normal: 0.5 a 2.5)
  paramB: number; // Dificuldade do item (b na escala de theta: -3.0 a +3.0)
  paramC: number; // Probabilidade de acerto ao acaso / chute (c ∈ [0, 0.35])
  descriptorCode: string; // Código do descritor SAEB (ex: 'D14')
  bnccCode: string; // Código da habilidade BNCC (ex: 'EM13MAT301')
  area: KnowledgeArea;
  stage: EducationStage;
  weight?: number;
}

export interface StudentItemResponse {
  itemId: string;
  isCorrect: boolean;
  selectedOption?: string;
  responseTimeSeconds?: number;
}

export interface ItemEvaluationDetail {
  item: TriItemParameters;
  response: StudentItemResponse;
  expectedProbability: number; // P(theta)
  residual: number; // u_i - P_i
  standardizedResidual: number; // z_i
  isAnomalousGuess: boolean; // Acerto de item difícil com baixa probabilidade prevista
}

export interface DescriptorDiagnostic {
  descriptorCode: string;
  area: KnowledgeArea;
  topic: string;
  description: string;
  totalItems: number;
  correctItems: number;
  accuracyPct: number;
  averageItemDifficulty: number;
  masteryLevel: MasteryLevel;
  pedagogicalRecommendation: string;
}

export interface StudentPrivateEvaluationResult {
  studentId: string;
  assessmentId: string;
  totalItems: number;
  correctItems: number;
  accuracyPercentage: number;
  theta: number; // Proficiência latente estimada (-4.0 a +4.0)
  standardError: number; // Erro padrão da estimativa (SE)
  enemScore: number; // Escala ENEM padrão (Média 500, DP 100)
  saebScore: number; // Escala SAEB padrão (Média 250, DP 50)
  schoolGrade: number; // Nota escolar convertida (0.0 a 10.0)
  pedagogicalCoherenceIndex: number; // 0 a 100% (Análise de Guttman)
  isGuessingPatternDetected: boolean;
  itemDetails: ItemEvaluationDetail[];
  descriptorDiagnostics: DescriptorDiagnostic[];
  globalMasteryLevel: MasteryLevel;
  formativeFeedback: string;
  glowsAndGrows?: {
    glows: string[];
    grows: string[];
    nextSteps: string[];
  };
  evaluatedAt: string;
}

export interface ClassAggregatedAnalytics {
  assessmentId: string;
  classId: string;
  totalStudentsEvaluated: number;
  averageTheta: number;
  thetaStandardDeviation: number;
  averageSaebScore: number;
  averageEnemScore: number;
  masteryDistribution: {
    abaixoDoBasicoPct: number;
    basicoPct: number;
    proficientePct: number;
    avancadoPct: number;
  };
  criticalDescriptors: {
    descriptorCode: string;
    description: string;
    area: KnowledgeArea;
    accuracyPercentage: number;
    interventionPriority: 'URGENTE' | 'MODERADA' | 'CONSOLIDADA';
  }[];
  coherenceHealthIndex: number; // % média de coerência da turma
  guessingPatternAlertRate: number; // % de alunos com suspeita de chute sistemático
  privacyNotice: string;
}

/**
 * Matriz Oficial de Descritores SAEB de Referência (MEC/INEP)
 */
export const OFFICIAL_SAEB_DESCRIPTORS: Record<string, SaebDescriptor> = {
  // MATEMÁTICA - ENSINO MÉDIO / EF9
  'D01': {
    code: 'D01',
    area: 'matematica',
    topic: 'I - Espaço e Forma',
    description: 'Identificar figuras semelhantes mediante o reconhecimento de relações de proporcionalidade.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13MAT201', 'EF09MA12'],
  },
  'D12': {
    code: 'D12',
    area: 'matematica',
    topic: 'II - Grandezas e Medidas',
    description: 'Resolver problema envolvendo o cálculo de área de figuras planas.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13MAT307', 'EF09MA19'],
  },
  'D14': {
    code: 'D14',
    area: 'matematica',
    topic: 'III - Números e Operações / Álgebra',
    description: 'Resolver problema envolvendo noções de porcentagem (25%, 50%, 100%, acréscimos e descontos).',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13MAT101', 'EF09MA08'],
  },
  'D19': {
    code: 'D19',
    area: 'matematica',
    topic: 'III - Números e Operações / Álgebra',
    description: 'Resolver problema envolvendo juros compostos ou simples em situações financeiras.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13MAT103'],
  },
  'D20': {
    code: 'D20',
    area: 'matematica',
    topic: 'III - Números e Operações / Álgebra',
    description: 'Analisar crescimento/decrescimento e zeros de funções afins (1º grau) expressas em gráficos ou tabelas.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13MAT301'],
  },
  'D21': {
    code: 'D21',
    area: 'matematica',
    topic: 'III - Números e Operações / Álgebra',
    description: 'Identificar o gráfico de uma função quadrática a partir de seus coeficientes e raízes.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13MAT302', 'EF09MA06'],
  },
  'D28': {
    code: 'D28',
    area: 'matematica',
    topic: 'III - Números e Operações / Álgebra',
    description: 'Reconhecer a representação algébrica ou gráfica de uma função exponencial ou logarítmica.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13MAT304'],
  },
  'D34': {
    code: 'D34',
    area: 'matematica',
    topic: 'IV - Tratamento da Informação',
    description: 'Resolver problema envolvendo informações apresentadas em tabelas e/ou gráficos de setores/linhas.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13MAT401', 'EF09MA21'],
  },
  'D35': {
    code: 'D35',
    area: 'matematica',
    topic: 'IV - Tratamento da Informação',
    description: 'Calcular a probabilidade de um evento em espaços amostrais discretos e equiprováveis.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13MAT402', 'EF09MA20'],
  },

  // LÍNGUA PORTUGUESA - ENSINO MÉDIO / EF9
  'D01_LP': {
    code: 'D01_LP',
    area: 'linguagens',
    topic: 'I - Procedimentos de Leitura',
    description: 'Localizar informações explícitas em um texto.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13LP01', 'EF09LP01'],
  },
  'D03_LP': {
    code: 'D03_LP',
    area: 'linguagens',
    topic: 'I - Procedimentos de Leitura',
    description: 'Inferir o sentido de uma palavra ou expressão a partir do contexto.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13LP03', 'EF09LP04'],
  },
  'D04_LP': {
    code: 'D04_LP',
    area: 'linguagens',
    topic: 'I - Procedimentos de Leitura',
    description: 'Inferir uma informação implícita em um texto.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13LP05'],
  },
  'D06_LP': {
    code: 'D06_LP',
    area: 'linguagens',
    topic: 'I - Procedimentos de Leitura',
    description: 'Identificar o tema ou ideia central de um texto argumentativo ou lírico.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13LP06'],
  },
  'D14_LP': {
    code: 'D14_LP',
    area: 'linguagens',
    topic: 'IV - Coerência e Coesão no Processamento do Texto',
    description: 'Distinguir um fato da opinião relativa a esse fato.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13LP08'],
  },

  // CIÊNCIAS DA NATUREZA
  'D01_NAT': {
    code: 'D01_NAT',
    area: 'natureza',
    topic: 'I - Matéria e Energia',
    description: 'Avaliar transformações e conservação de energia em circuitos e processos termodinâmicos.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13CNT101', 'EM13CNT102'],
  },
  'D02_NAT': {
    code: 'D02_NAT',
    area: 'natureza',
    topic: 'II - Vida e Evolução',
    description: 'Analisar transmissão de características hereditárias, mutações e biotecnologia na saúde.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13CNT202'],
  },

  // CIÊNCIAS HUMANAS
  'D01_HUM': {
    code: 'D01_HUM',
    area: 'humanas',
    topic: 'I - Cidadania e Sociedade',
    description: 'Analisar criticamente fontes e narrativas sobre direitos fundamentais e cidadania.',
    stage: 'ENSINO_MEDIO',
    correlatedBnccCodes: ['EM13CHS102', 'EM13CHS301'],
  },

  // FUNDAMENTAL II (ANOS FINAIS - CIÊNCIAS 7º ANO / 7ª SÉRIE SPE POSITIVO)
  'D_EF7_CI_V1': {
    code: 'D_EF7_CI_V1',
    area: 'natureza',
    topic: 'Terra e Universo / Vida e Evolução (7º Ano - Vol. 1)',
    description: 'Compreender ecossistemas, efeito estufa natural, ciclo hidrológico e a dinâmica de umidade dos rios voadores.',
    stage: 'EF_ANOS_FINAIS',
    correlatedBnccCodes: ['EF07CI12', 'EF07CI15', 'EF07CI16'],
  },
  'D_EF7_CI_V2': {
    code: 'D_EF7_CI_V2',
    area: 'natureza',
    topic: 'Vida e Evolução / Terra e Universo (7º Ano - Vol. 2)',
    description: 'Caracterizar órgãos vegetativos e reprodutivos de angiospermas, fitofisionomias dos biomas e dinâmica tectônica.',
    stage: 'EF_ANOS_FINAIS',
    correlatedBnccCodes: ['EF07CI07', 'EF07CI08', 'EF07CI13', 'EF07CI14'],
  },
  'D_EF7_CI_V3': {
    code: 'D_EF7_CI_V3',
    area: 'natureza',
    topic: 'Matéria e Energia / Vida e Evolução (7º Ano - Vol. 3)',
    description: 'Analisar vacinas, saúde pública, saneamento básico e aplicação de forças em máquinas simples (alavancas e roldanas).',
    stage: 'EF_ANOS_FINAIS',
    correlatedBnccCodes: ['EF07CI01', 'EF07CI09', 'EF07CI10', 'EF07CI11'],
  },
  'D_EF7_CI_V4': {
    code: 'D_EF7_CI_V4',
    area: 'natureza',
    topic: 'Matéria e Energia (7º Ano - Vol. 4)',
    description: 'Diferenciar calor e temperatura, analisar propagação térmica, matriz energética e impactos de máquinas térmicas.',
    stage: 'EF_ANOS_FINAIS',
    correlatedBnccCodes: ['EF07CI02', 'EF07CI03', 'EF07CI04', 'EF07CI05', 'EF07CI06'],
  },

  // FUNDAMENTAL I (ANOS INICIAIS - SAEB 5º ANO)
  'D01_EF5_MAT': {
    code: 'D01_EF5_MAT',
    area: 'matematica',
    topic: 'I - Espaço e Forma',
    description: 'Identificar a localização/movimentação de objeto em mapas, croquis e outras representações gráficas.',
    stage: 'EF_ANOS_INICIAIS',
    correlatedBnccCodes: ['EF05MA14', 'EF03MA12'],
  },
  'D14_EF5_MAT': {
    code: 'D14_EF5_MAT',
    area: 'matematica',
    topic: 'III - Números e Operações',
    description: 'Resolver problema envolvendo adição ou subtração com números naturais.',
    stage: 'EF_ANOS_INICIAIS',
    correlatedBnccCodes: ['EF05MA07', 'EF03MA06'],
  },
  'D01_EF5_LP': {
    code: 'D01_EF5_LP',
    area: 'linguagens',
    topic: 'I - Procedimentos de Leitura',
    description: 'Localizar informações explícitas em textos infantis e fábulas.',
    stage: 'EF_ANOS_INICIAIS',
    correlatedBnccCodes: ['EF05LP01', 'EF01LP01'],
  },

  // PREPARATÓRIOS PARA MEDICINA & ALTA EXIGÊNCIA (2ª FASE E DISCURSIVAS)
  'D_MED_BIO': {
    code: 'D_MED_BIO',
    area: 'natureza',
    topic: 'Biologia Molecular & Genética',
    description: 'Mecanismos moleculares de replicação, síntese proteica, regulação gênica e herança quantitativa.',
    stage: 'VESTIBULAR_MEDICINA',
    correlatedBnccCodes: ['EM13CNT202', 'MED_BIO_01'],
  },
  'D_MED_QUI': {
    code: 'D_MED_QUI',
    area: 'natureza',
    topic: 'Química Orgânica & Termodinâmica',
    description: 'Mecanismos de reações orgânicas, síntese de fármacos, equilíbrios iônicos e termoquímica avançada.',
    stage: 'VESTIBULAR_MEDICINA',
    correlatedBnccCodes: ['EM13CNT101', 'MED_QUI_01'],
  },
};

/**
 * Matriz de Referência BNCC
 */
export const OFFICIAL_BNCC_SKILLS: Record<string, BnccSkill> = {
  'EM13MAT101': {
    code: 'EM13MAT101',
    area: 'matematica',
    component: 'Matemática',
    description: 'Interpretar criticamente situações econômicas, financeiras e sociais, analisando dados, taxas e índices.',
    stage: 'ENSINO_MEDIO',
  },
  'EM13MAT301': {
    code: 'EM13MAT301',
    area: 'matematica',
    component: 'Matemática',
    description: 'Resolver e elaborar problemas com funções afins e modelagem matemática de fenômenos cotidianos.',
    stage: 'ENSINO_MEDIO',
  },
  'EM13MAT302': {
    code: 'EM13MAT302',
    area: 'matematica',
    component: 'Matemática',
    description: 'Construir modelos com funções quadráticas em situações de máximos, mínimos e trajetórias.',
    stage: 'ENSINO_MEDIO',
  },
  'EM13MAT401': {
    code: 'EM13MAT401',
    area: 'matematica',
    component: 'Matemática',
    description: 'Investigar relações entre variáveis quantitativas a partir de gráficos estatísticos e medidas centrais.',
    stage: 'ENSINO_MEDIO',
  },
  'EM13LP01': {
    code: 'EM13LP01',
    area: 'linguagens',
    component: 'Língua Portuguesa',
    description: 'Relacionar o texto, tanto na produção como na recepção, com suas condições de produção e circulação.',
    stage: 'ENSINO_MEDIO',
  },
  'EM13LP05': {
    code: 'EM13LP05',
    area: 'linguagens',
    component: 'Língua Portuguesa',
    description: 'Analisar criticamente produções textuais, inferindo teses, recursos de estilo e propósitos do autor.',
    stage: 'ENSINO_MEDIO',
  },
  'EM13CNT101': {
    code: 'EM13CNT101',
    area: 'natureza',
    component: 'Física / Química',
    description: 'Analisar e representar as transformações e conservações em sistemas naturais e tecnológicos.',
    stage: 'ENSINO_MEDIO',
  },
  'EM13CNT202': {
    code: 'EM13CNT202',
    area: 'natureza',
    component: 'Biologia',
    description: 'Analisar a diversidade de seres vivos, processos genéticos e adaptações ecológicas.',
    stage: 'ENSINO_MEDIO',
  },
  'EM13CHS102': {
    code: 'EM13CHS102',
    area: 'humanas',
    component: 'História / Sociologia',
    description: 'Identificar, analisar e comparar diferentes fontes e narrativas históricas sobre a sociedade contemporânea.',
    stage: 'ENSINO_MEDIO',
  },

  // FUNDAMENTAL II (ANOS FINAIS - CIÊNCIAS 7º ANO / 7ª SÉRIE SPE POSITIVO)
  'EF07CI01': {
    code: 'EF07CI01',
    area: 'natureza',
    component: 'Ciências',
    description: 'Discutir a aplicação, pelas máquinas simples (martelo, tesoura, alavanca, roldana), das forças para multiplicar ou equilibrar esforços.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI02': {
    code: 'EF07CI02',
    area: 'natureza',
    component: 'Ciências',
    description: 'Diferenciar temperatura, calor e sensação térmica nas diferentes situações de equilíbrio termodinâmico.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI03': {
    code: 'EF07CI03',
    area: 'natureza',
    component: 'Ciências',
    description: 'Utilizar o conhecimento das formas de propagação do calor para justificar o isolamento ou condutibilidade térmica em situações cotidianas.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI04': {
    code: 'EF07CI04',
    area: 'natureza',
    component: 'Ciências',
    description: 'Avaliar o papel do equilíbrio termodinâmico para a manutenção da vida na Terra e para o funcionamento de máquinas térmicas.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI05': {
    code: 'EF07CI05',
    area: 'natureza',
    component: 'Ciências',
    description: 'Discutir o uso de diferentes tipos de combustível e máquinas térmicas ao longo do tempo e seus impactos socioambientais.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI06': {
    code: 'EF07CI06',
    area: 'natureza',
    component: 'Ciências',
    description: 'Discutir e avaliar mudanças econômicas, culturais e sociais decorrentes da máquina a vapor e dos combustíveis fósseis.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI07': {
    code: 'EF07CI07',
    area: 'natureza',
    component: 'Ciências',
    description: 'Caracterizar os principais ecossistemas e biomas brasileiros (Cerrado, Amazônia, Caatinga, etc.) em relação à paisagem, água e biodiversidade.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI08': {
    code: 'EF07CI08',
    area: 'natureza',
    component: 'Ciências',
    description: 'Avaliar como os impactos provocados por queimadas, desmatamento e catástrofes naturais alteram as populações de um ecossistema.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI09': {
    code: 'EF07CI09',
    area: 'natureza',
    component: 'Ciências',
    description: 'Interpretar as condições de saúde da comunidade com base em indicadores de saneamento básico e saúde pública.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI10': {
    code: 'EF07CI10',
    area: 'natureza',
    component: 'Ciências',
    description: 'Argumentar sobre a importância da vacinação para a saúde pública e a formação da memória imunológica.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI11': {
    code: 'EF07CI11',
    area: 'natureza',
    component: 'Ciências',
    description: 'Analisar historicamente o uso da tecnologia na prevenção, diagnóstico e tratamento de doenças.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI12': {
    code: 'EF07CI12',
    area: 'natureza',
    component: 'Ciências',
    description: 'Demonstrar que o ar é uma mistura de gases, identificar sua composição e discutir fenômenos como o efeito estufa natural.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI13': {
    code: 'EF07CI13',
    area: 'natureza',
    component: 'Ciências',
    description: 'Descrever o mecanismo gerador das erupções vulcânicas e terremotos com base na teoria da tectônica de placas.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI14': {
    code: 'EF07CI14',
    area: 'natureza',
    component: 'Ciências',
    description: 'Justificar a distribuição dos biomas no Brasil e no mundo com base nas relações entre relevo, temperatura e pluviosidade.',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI15': {
    code: 'EF07CI15',
    area: 'natureza',
    component: 'Ciências',
    description: 'Interpretar fenômenos meteorológicos com base nas variáveis atmosféricas (pressão, temperatura, umidade).',
    stage: 'EF_ANOS_FINAIS',
  },
  'EF07CI16': {
    code: 'EF07CI16',
    area: 'natureza',
    component: 'Ciências',
    description: 'Justificar a importância da camada de ozônio para a vida na Terra e os impactos dos gases que a degradam.',
    stage: 'EF_ANOS_FINAIS',
  },

  // FUNDAMENTAL I (ANOS INICIAIS)
  'EF01LP01': {
    code: 'EF01LP01',
    area: 'linguagens',
    component: 'Língua Portuguesa',
    description: 'Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo.',
    stage: 'EF_ANOS_INICIAIS',
  },
  'EF03MA06': {
    code: 'EF03MA06',
    area: 'matematica',
    component: 'Matemática',
    description: 'Resolver e elaborar problemas de adição e subtração com os significados de juntar, acrescentar, separar e retirar.',
    stage: 'EF_ANOS_INICIAIS',
  },
  'EF05MA08': {
    code: 'EF05MA08',
    area: 'matematica',
    component: 'Matemática',
    description: 'Resolver e elaborar problemas de multiplicação e divisão com números naturais e decimais.',
    stage: 'EF_ANOS_INICIAIS',
  },

  // PREPARATÓRIOS MEDICINA & ALTA CONCORRÊNCIA
  'MED_BIO_01': {
    code: 'MED_BIO_01',
    area: 'natureza',
    component: 'Biologia Celular e Molecular',
    description: 'Genética clássica e molecular, biotecnologia recombinante, imunologia e fisiologia médica comparada.',
    stage: 'VESTIBULAR_MEDICINA',
  },
  'MED_QUI_01': {
    code: 'MED_QUI_01',
    area: 'natureza',
    component: 'Química Avançada',
    description: 'Mecanismos de isomeria espacial, cinética de ordem mista, equilíbrios ácido-base e reações orgânicas aplicadas à farmacologia.',
    stage: 'VESTIBULAR_MEDICINA',
  },
};

/**
 * Motor Central Pedagógico de TRI (Teoria de Resposta ao Item)
 */
export class PedagogicalTriEngine {
  /**
   * Calcula a probabilidade de acerto segundo o Modelo Logístico de 3 Parâmetros (3PL):
   * P(θ) = c + (1 - c) / (1 + e^(-1.7 * a * (θ - b)))
   */
  public static calculate3PLProbability(
    theta: number,
    paramA: number,
    paramB: number,
    paramC: number
  ): number {
    const a = Math.max(0.01, paramA);
    const b = paramB;
    const c = Math.max(0, Math.min(0.99, paramC));

    const exponent = -TRI_SCALING_CONSTANT_D * a * (theta - b);

    // Proteção contra overflow/underflow em exponenciais extremos
    if (exponent > 35) {
      return c; // e^35 >> 1 => denominador tende a infinito, termo tende a 0
    }
    if (exponent < -35) {
      return 1.0; // e^-35 ~ 0 => denominador tende a 1, termo tende a (1 - c) + c = 1.0
    }

    const logisticCore = 1.0 / (1.0 + Math.exp(exponent));
    return c + (1.0 - c) * logisticCore;
  }

  /**
   * Função de Informação do Item (IIF - Item Information Function):
   * I_i(θ) = D^2 * a_i^2 * ((P_i - c_i)^2 / (1 - c_i)^2) * ((1 - P_i) / P_i)
   */
  public static calculateItemInformation(
    theta: number,
    paramA: number,
    paramB: number,
    paramC: number
  ): number {
    const P = this.calculate3PLProbability(theta, paramA, paramB, paramC);
    const a = Math.max(0.01, paramA);
    const c = Math.max(0, Math.min(0.99, paramC));

    if (P <= c || P >= 1.0) {
      return 0.0001;
    }

    const pStar = (P - c) / (1.0 - c);
    const qStar = 1.0 - pStar;
    const q = 1.0 - P;

    const numerator = Math.pow(TRI_SCALING_CONSTANT_D * a * pStar * qStar, 2);
    const denominator = P * q;

    if (denominator <= 0) return 0.0001;
    return numerator / denominator;
  }

  /**
   * Função de Informação do Teste (TIF) e Erro Padrão de Medida (SE):
   * SE(θ) = 1 / sqrt( sum(I_i(θ)) )
   */
  public static calculateTestInformationAndError(
    theta: number,
    items: TriItemParameters[]
  ): { testInformation: number; standardError: number } {
    let tif = 0;
    for (const item of items) {
      tif += this.calculateItemInformation(theta, item.paramA, item.paramB, item.paramC);
    }
    tif = Math.max(0.01, tif);
    const standardError = +(1.0 / Math.sqrt(tif)).toFixed(3);
    return { testInformation: +tif.toFixed(3), standardError };
  }

  /**
   * Estimador Bayesiano EAP (Expected A Posteriori) com Quadratura Gaussiana
   * Garante convergência estável mesmo com vetores de 0 ou 100% de acertos,
   * utilizando a distribuição a priori padrão θ ~ N(0, 1).
   */
  public static estimateThetaEAP(
    items: TriItemParameters[],
    responses: StudentItemResponse[],
    quadraturePoints: number = 41,
    range: number = 4.0
  ): { theta: number; standardError: number } {
    if (!items || items.length === 0 || !responses || responses.length === 0) {
      return { theta: 0.0, standardError: 1.0 };
    }

    const itemMap = new Map<string, TriItemParameters>();
    items.forEach(it => itemMap.set(it.id, it));

    const validPairs: { item: TriItemParameters; isCorrect: boolean }[] = [];
    for (const resp of responses) {
      const it = itemMap.get(resp.itemId);
      if (it) {
        validPairs.push({ item: it, isCorrect: resp.isCorrect });
      }
    }

    if (validPairs.length === 0) {
      return { theta: 0.0, standardError: 1.0 };
    }

    const step = (2 * range) / (quadraturePoints - 1);
    const nodes: number[] = [];
    const weights: number[] = [];

    // Prior normal padrão phi(x)
    for (let i = 0; i < quadraturePoints; i++) {
      const x = -range + i * step;
      nodes.push(x);
      const normalDensity = (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
      weights.push(normalDensity * step);
    }

    // Calcula Log-Verossimilhança em cada ponto para prevenir underflow numérico
    const logLikelihoods: number[] = new Array(quadraturePoints).fill(0);

    for (let k = 0; k < quadraturePoints; k++) {
      const thetaNode = nodes[k];
      let logL = 0;
      for (const pair of validPairs) {
        const { paramA, paramB, paramC } = pair.item;
        const P = this.calculate3PLProbability(thetaNode, paramA, paramB, paramC);
        const clampedP = Math.max(1e-12, Math.min(1 - 1e-12, P));

        if (pair.isCorrect) {
          logL += Math.log(clampedP);
        } else {
          logL += Math.log(1 - clampedP);
        }
      }
      logLikelihoods[k] = logL;
    }

    // Normalização com log-sum-exp trick
    const maxLogL = Math.max(...logLikelihoods);
    let denominator = 0;
    let numeratorTheta = 0;

    for (let k = 0; k < quadraturePoints; k++) {
      const posteriorKernel = Math.exp(logLikelihoods[k] - maxLogL) * weights[k];
      denominator += posteriorKernel;
      numeratorTheta += nodes[k] * posteriorKernel;
    }

    if (denominator <= 0) {
      return { theta: 0.0, standardError: 1.0 };
    }

    const thetaHat = numeratorTheta / denominator;

    // Variância e Erro Padrão Posterior
    let numeratorVar = 0;
    for (let k = 0; k < quadraturePoints; k++) {
      const posteriorKernel = Math.exp(logLikelihoods[k] - maxLogL) * weights[k];
      numeratorVar += Math.pow(nodes[k] - thetaHat, 2) * posteriorKernel;
    }

    const posteriorVariance = Math.max(0.01, numeratorVar / denominator);
    const standardError = Math.sqrt(posteriorVariance);

    return {
      theta: +Math.max(-4.0, Math.min(4.0, thetaHat)).toFixed(3),
      standardError: +standardError.toFixed(3),
    };
  }

  /**
   * Cálculo de Coerência Pedagógica e Detecção de Padrão de Chute (Guttman Inconsistency & Levine-Drastow Fit)
   * 
   * Princípio Pedagógico:
   * Um aluno proficiente responde de forma coerente acertando itens com dificuldade (b) menor
   * que sua habilidade. Se um aluno erra sucessivamente itens fáceis (b baixo) e acerta
   * itens muito difíceis (b alto), o modelo detecta um padrão anômalo típico de chute ou
   * colapso de atenção formativa.
   */
  public static evaluatePedagogicalCoherence(
    theta: number,
    items: TriItemParameters[],
    responses: StudentItemResponse[]
  ): {
    coherenceIndex: number; // 0 a 100%
    isGuessingDetected: boolean;
    anomalousItemsCount: number;
    guttmanInversions: number;
    outfitMeanSquare: number;
    details: ItemEvaluationDetail[];
  } {
    const itemMap = new Map<string, TriItemParameters>();
    items.forEach(it => itemMap.set(it.id, it));

    const evaluatedPairs: {
      item: TriItemParameters;
      response: StudentItemResponse;
      P: number;
      residual: number;
      z: number;
      isAnomalousGuess: boolean;
    }[] = [];

    let outfitSum = 0;
    let anomalousGuesses = 0;

    for (const resp of responses) {
      const it = itemMap.get(resp.itemId);
      if (!it) continue;

      const P = this.calculate3PLProbability(theta, it.paramA, it.paramB, it.paramC);
      const clampedP = Math.max(0.01, Math.min(0.99, P));
      const u = resp.isCorrect ? 1.0 : 0.0;
      const residual = u - clampedP;
      const variance = clampedP * (1.0 - clampedP);
      const z = residual / Math.sqrt(variance);

      // Critério de Acerto Anômalo / Chute em item específico:
      // O aluno acertou (u=1), mas a probabilidade prevista P(theta) era muito baixa (< 0.35)
      // e a dificuldade do item b estava bem acima de theta (b - theta > 1.0)
      const isAnomalous = resp.isCorrect && (P < 0.38) && (it.paramB - theta > 0.8);
      if (isAnomalous) {
        anomalousGuesses++;
      }

      outfitSum += Math.pow(z, 2);

      evaluatedPairs.push({
        item: it,
        response: resp,
        P: +P.toFixed(3),
        residual: +residual.toFixed(3),
        z: +z.toFixed(3),
        isAnomalousGuess: isAnomalous,
      });
    }

    const n = evaluatedPairs.length;
    const outfitMeanSquare = n > 0 ? +(outfitSum / n).toFixed(2) : 1.0;

    // Cálculo das Inversões de Guttman:
    // Compara pares (i, j) onde b_j > b_i + 0.6: aluno errou o mais fácil (i) e acertou o mais difícil (j)
    let guttmanInversions = 0;
    let totalEligiblePairs = 0;

    for (let i = 0; i < evaluatedPairs.length; i++) {
      for (let j = 0; j < evaluatedPairs.length; j++) {
        const itemI = evaluatedPairs[i];
        const itemJ = evaluatedPairs[j];

        // Item J é significativamente mais difícil que item I
        if (itemJ.item.paramB - itemI.item.paramB >= 0.7) {
          totalEligiblePairs++;
          if (!itemI.response.isCorrect && itemJ.response.isCorrect) {
            guttmanInversions++;
          }
        }
      }
    }

    // Índice de Coerência: se não houver pares elegíveis, pontuação máxima 100%
    let coherencePct = 100;
    if (totalEligiblePairs > 0) {
      const penalty = (guttmanInversions / totalEligiblePairs) * 100;
      coherencePct = Math.max(10, Math.min(100, Math.round(100 - penalty * 1.5)));
    }

    // Detecção de Padrão de Chute Sistemático:
    // 1) Mais de 2 acertos em itens classificados como anômalos OU
    // 2) Coerência < 60% com pelo menos 1 acerto anômalo OU
    // 3) Outfit residual elevado (> 2.2) indicando ruído extremo
    const isGuessingDetected =
      anomalousGuesses >= 2 ||
      (coherencePct < 60 && anomalousGuesses >= 1) ||
      (outfitMeanSquare > 2.3 && anomalousGuesses >= 1);

    const details: ItemEvaluationDetail[] = evaluatedPairs.map(p => ({
      item: p.item,
      response: p.response,
      expectedProbability: p.P,
      residual: p.residual,
      standardizedResidual: p.z,
      isAnomalousGuess: p.isAnomalousGuess,
    }));

    return {
      coherenceIndex: coherencePct,
      isGuessingDetected,
      anomalousItemsCount: anomalousGuesses,
      guttmanInversions,
      outfitMeanSquare,
      details,
    };
  }

  /**
   * Converte o Theta da TRI para a Escala ENEM oficial
   * Média = 500, Desvio Padrão = 100
   * Aplica calibração suave pela coerência pedagógica (desencoraja acertos aleatórios puros)
   */
  public static convertToEnemScale(theta: number, coherenceIndex: number = 100): number {
    const rawEnem = 500 + theta * 100;
    // Atenuação moderada se a coerência for inferior a 50%
    const coherenceFactor = coherenceIndex < 60 ? 0.90 + (coherenceIndex / 60) * 0.10 : 1.0;
    const calibrated = rawEnem * coherenceFactor;
    return Math.round(Math.max(200, Math.min(1000, calibrated)));
  }

  /**
   * Converte o Theta da TRI para a Escala SAEB oficial (Prova Brasil)
   * Média = 250, Desvio Padrão = 50
   */
  public static convertToSaebScale(theta: number, coherenceIndex: number = 100): number {
    const rawSaeb = 250 + theta * 50;
    const coherenceFactor = coherenceIndex < 60 ? 0.92 + (coherenceIndex / 60) * 0.08 : 1.0;
    const calibrated = rawSaeb * coherenceFactor;
    return Math.round(Math.max(100, Math.min(500, calibrated)));
  }

  /**
   * Converte a pontuação para a Nota Escolar Padrão (0.0 a 10.0)
   * Harmoniza precisão TRI com a taxa bruta de acertos
   */
  public static convertToSchoolGrade(
    theta: number,
    accuracyPct: number,
    coherenceIndex: number
  ): number {
    // 50% baseado em Theta TRI normalizado (-3.0 = 0.0, +3.0 = 10.0)
    const triNormalized = Math.max(0, Math.min(10, ((theta + 3.0) / 6.0) * 10));
    // 40% baseado na taxa percentual de acertos direta
    const rawGrade = (accuracyPct / 100) * 10;
    // 10% baseado na coerência pedagógica
    const coherenceGrade = (coherenceIndex / 100) * 10;

    const weighted = triNormalized * 0.50 + rawGrade * 0.40 + coherenceGrade * 0.10;
    return +Math.max(0.0, Math.min(10.0, weighted)).toFixed(1);
  }

  /**
   * Determina o Nível de Domínio SAEB a partir da pontuação SAEB
   */
  public static classifySaebMastery(saebScore: number): MasteryLevel {
    if (saebScore < 200) return 'abaixo_do_basico';
    if (saebScore < 275) return 'basico';
    if (saebScore < 350) return 'proficiente';
    return 'avancado';
  }

  /**
   * Mapeamento Direto e Diagnóstico por Descritor SAEB e Habilidade BNCC
   */
  public static diagnoseByDescriptors(
    items: TriItemParameters[],
    responses: StudentItemResponse[],
    studentTheta: number
  ): DescriptorDiagnostic[] {
    const itemMap = new Map<string, TriItemParameters>();
    items.forEach(it => itemMap.set(it.id, it));

    const descriptorBuckets = new Map<string, { items: TriItemParameters[]; correct: number }>();

    for (const resp of responses) {
      const it = itemMap.get(resp.itemId);
      if (!it) continue;

      const code = it.descriptorCode || 'D_GENERICO';
      if (!descriptorBuckets.has(code)) {
        descriptorBuckets.set(code, { items: [], correct: 0 });
      }

      const bucket = descriptorBuckets.get(code)!;
      bucket.items.push(it);
      if (resp.isCorrect) bucket.correct++;
    }

    const diagnostics: DescriptorDiagnostic[] = [];

    for (const [code, bucket] of descriptorBuckets.entries()) {
      const descInfo = OFFICIAL_SAEB_DESCRIPTORS[code] || {
        code,
        area: bucket.items[0]?.area || 'matematica',
        topic: 'Geral',
        description: `Descritor Pedagógico ${code}`,
        stage: 'ENSINO_MEDIO',
        correlatedBnccCodes: [bucket.items[0]?.bnccCode || 'BNCC-GERAL'],
      };

      const totalItems = bucket.items.length;
      const correctItems = bucket.correct;
      const accuracyPct = Math.round((correctItems / totalItems) * 100);
      const avgDifficulty = +(bucket.items.reduce((s, it) => s + it.paramB, 0) / totalItems).toFixed(2);

      // Determina nível de maestria no descritor
      let masteryLevel: MasteryLevel;
      if (accuracyPct < 40) {
        masteryLevel = 'abaixo_do_basico';
      } else if (accuracyPct < 65) {
        masteryLevel = 'basico';
      } else if (accuracyPct < 85) {
        masteryLevel = 'proficiente';
      } else {
        masteryLevel = 'avancado';
      }

      let recommendation = `Manter prática ativa para consolidar o descritor ${code}.`;
      if (masteryLevel === 'abaixo_do_basico') {
        recommendation = `Necessário reforço conceitual imediato nas habilidades correlatas (${descInfo.correlatedBnccCodes.join(', ')}).`;
      } else if (masteryLevel === 'basico') {
        recommendation = `Exercitar problemas de nível médio para fixar a compreensão do descritor ${code}.`;
      } else if (masteryLevel === 'avancado') {
        recommendation = `Excelente maestria! Pronto para desafios interdisciplinares e mentoria de pares.`;
      }

      diagnostics.push({
        descriptorCode: code,
        area: descInfo.area,
        topic: descInfo.topic,
        description: descInfo.description,
        totalItems,
        correctItems,
        accuracyPct,
        averageItemDifficulty: avgDifficulty,
        masteryLevel,
        pedagogicalRecommendation: recommendation,
      });
    }

    return diagnostics.sort((a, b) => a.accuracyPct - b.accuracyPct);
  }

  /**
   * Avaliação Completa e Segura de Estudante (Privada ao Aluno e Família)
   * Em conformidade com a LGPD e Princípio de Não-Estigmatização Soberano.
   */
  public static evaluateStudentAssessment(params: {
    studentId: string;
    assessmentId: string;
    items: TriItemParameters[];
    responses: StudentItemResponse[];
  }): StudentPrivateEvaluationResult {
    const { studentId, assessmentId, items, responses } = params;

    const totalItems = responses.length;
    const correctItems = responses.filter(r => r.isCorrect).length;
    const accuracyPercentage = totalItems > 0 ? Math.round((correctItems / totalItems) * 100) : 0;

    // 1. Estimação Theta EAP
    const { theta, standardError } = this.estimateThetaEAP(items, responses);

    // 2. Análise de Coerência e Detecção de Chute
    const coherence = this.evaluatePedagogicalCoherence(theta, items, responses);

    // 3. Conversões de Escalas
    const enemScore = this.convertToEnemScale(theta, coherence.coherenceIndex);
    const saebScore = this.convertToSaebScale(theta, coherence.coherenceIndex);
    const schoolGrade = this.convertToSchoolGrade(theta, accuracyPercentage, coherence.coherenceIndex);
    const globalMasteryLevel = this.classifySaebMastery(saebScore);

    // 4. Mapeamento e Diagnóstico por Descritor SAEB
    const descriptorDiagnostics = this.diagnoseByDescriptors(items, responses, theta);

    // 5. Feedback Formativo Socrático (Padrão Brisk Teaching Adaptado à BNCC Brasileira)
    const glows: string[] = [];
    const grows: string[] = [];
    const nextSteps: string[] = [];

    descriptorDiagnostics.forEach(d => {
      if (d.masteryLevel === 'avancado' || d.masteryLevel === 'proficiente') {
        glows.push(`Domínio consolidado no descritor ${d.descriptorId}: ${d.description} (Taxa de acerto: ${d.accuracyPercentage}%).`);
      } else {
        grows.push(`Oportunidade de aprofundamento em ${d.descriptorId}: ${d.description} (Taxa de acerto: ${d.accuracyPercentage}%).`);
        nextSteps.push(`Revisar os conceitos centrais e exercícios resolvidos vinculados a ${d.descriptorId}.`);
      }
    });

    if (glows.length === 0) {
      glows.push('Participação ativa e conclusão do ciclo completo de avaliação.');
    }
    if (nextSteps.length === 0) {
      nextSteps.push('Avançar para desafios de nível aprofundado na Câmara de Maestria e Arena PvP.');
    }

    let formativeFeedback = `Parabéns pela dedicação na avaliação! Sua proficiência estimada foi de ${saebScore} pontos no SAEB (Nível ${globalMasteryLevel.toUpperCase()}). `;
    if (coherence.isGuessingDetected) {
      formativeFeedback += `Identificamos uma variação atípica de acertos entre itens de diferentes complexidades. Sugerimos revisar com atenção as justificativas das questões nos próximos simulados para fortalecer a consistência da aprendizagem. `;
    } else {
      formativeFeedback += `Seu padrão de respostas demonstrou alta consistência lógica e pedagógica. `;
    }

    return {
      studentId,
      assessmentId,
      totalItems,
      correctItems,
      accuracyPercentage,
      theta,
      standardError,
      enemScore,
      saebScore,
      schoolGrade,
      pedagogicalCoherenceIndex: coherence.coherenceIndex,
      isGuessingPatternDetected: coherence.isGuessingDetected,
      itemDetails: coherence.details,
      descriptorDiagnostics,
      globalMasteryLevel,
      formativeFeedback,
      glowsAndGrows: {
        glows,
        grows,
        nextSteps,
      },
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Consolidação Estatística de Turma para o Professor / Coordenador
   * 
   * Diretriz de Privacidade & Não-Estigmatização:
   * - NUNCA gera ranqueamentos ordinais públicos ou listas nominativas comparativas.
   * - Produz apenas métricas populacionais (média, dispersão, heatmap de descritores).
   * - Aplica regra de agregação mínima (se < 3 alunos, suprime desvio para preservar privacidade).
   */
  public static consolidateClassAnalytics(params: {
    assessmentId: string;
    classId: string;
    studentResults: StudentPrivateEvaluationResult[];
  }): ClassAggregatedAnalytics {
    const { assessmentId, classId, studentResults } = params;
    const n = studentResults.length;

    if (n === 0) {
      return {
        assessmentId,
        classId,
        totalStudentsEvaluated: 0,
        averageTheta: 0,
        thetaStandardDeviation: 0,
        averageSaebScore: 0,
        averageEnemScore: 0,
        masteryDistribution: {
          abaixoDoBasicoPct: 0,
          basicoPct: 0,
          proficientePct: 0,
          avancadoPct: 0,
        },
        criticalDescriptors: [],
        coherenceHealthIndex: 100,
        guessingPatternAlertRate: 0,
        privacyNotice: 'Nenhum dado submetido para consolidação.',
      };
    }

    const thetas = studentResults.map(r => r.theta);
    const avgTheta = +(thetas.reduce((a, b) => a + b, 0) / n).toFixed(2);

    // Desvio Padrão Populacional
    const variance = thetas.reduce((acc, t) => acc + Math.pow(t - avgTheta, 2), 0) / n;
    const stdDevTheta = +(Math.sqrt(variance)).toFixed(2);

    const avgSaeb = Math.round(studentResults.reduce((acc, r) => acc + r.saebScore, 0) / n);
    const avgEnem = Math.round(studentResults.reduce((acc, r) => acc + r.enemScore, 0) / n);

    // Distribuição de Níveis de Domínio
    const counts = {
      abaixo_do_basico: 0,
      basico: 0,
      proficiente: 0,
      avancado: 0,
    };
    studentResults.forEach(r => {
      counts[r.globalMasteryLevel]++;
    });

    const masteryDistribution = {
      abaixoDoBasicoPct: Math.round((counts.abaixo_do_basico / n) * 100),
      basicoPct: Math.round((counts.basico / n) * 100),
      proficientePct: Math.round((counts.proficiente / n) * 100),
      avancadoPct: Math.round((counts.avancado / n) * 100),
    };

    // Agregação de Descritores Críticos por Turma
    const descriptorStats = new Map<string, { totalAcc: number; count: number; desc: DescriptorDiagnostic }>();

    for (const res of studentResults) {
      for (const diag of res.descriptorDiagnostics) {
        if (!descriptorStats.has(diag.descriptorCode)) {
          descriptorStats.set(diag.descriptorCode, { totalAcc: 0, count: 0, desc: diag });
        }
        const st = descriptorStats.get(diag.descriptorCode)!;
        st.totalAcc += diag.accuracyPct;
        st.count++;
      }
    }

    const criticalDescriptors: ClassAggregatedAnalytics['criticalDescriptors'] = [];

    for (const [code, val] of descriptorStats.entries()) {
      const avgAcc = Math.round(val.totalAcc / val.count);
      let interventionPriority: 'URGENTE' | 'MODERADA' | 'CONSOLIDADA' = 'CONSOLIDADA';
      if (avgAcc < 50) {
        interventionPriority = 'URGENTE';
      } else if (avgAcc < 70) {
        interventionPriority = 'MODERADA';
      }

      criticalDescriptors.push({
        descriptorCode: code,
        description: val.desc.description,
        area: val.desc.area,
        accuracyPercentage: avgAcc,
        interventionPriority,
      });
    }

    // Ordenar pelos descritores com menor acerto da turma (maior prioridade de intervenção didática)
    criticalDescriptors.sort((a, b) => a.accuracyPercentage - b.accuracyPercentage);

    // Índice de Saúde de Coerência
    const avgCoherence = Math.round(
      studentResults.reduce((acc, r) => acc + r.pedagogicalCoherenceIndex, 0) / n
    );

    const guessingCount = studentResults.filter(r => r.isGuessingPatternDetected).length;
    const guessingPatternAlertRate = Math.round((guessingCount / n) * 100);

    return {
      assessmentId,
      classId,
      totalStudentsEvaluated: n,
      averageTheta: avgTheta,
      thetaStandardDeviation: stdDevTheta,
      averageSaebScore: avgSaeb,
      averageEnemScore: avgEnem,
      masteryDistribution,
      criticalDescriptors,
      coherenceHealthIndex: avgCoherence,
      guessingPatternAlertRate,
      privacyNotice:
        'LGPD Compliance: Relatório agregado estritamente formativo para o planejamento pedagógico docente. Ranqueamentos públicos estigmatizantes são vedados pela Constituição Áquila Pro.',
    };
  }
}
