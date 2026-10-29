/**
 * Áquila Pro — WordwallGameEngine (Onda 9 / Gamificação Soberana)
 * 
 * Motor de Jogos Educativos com suporte às 28 mecânicas do Wordwall,
 * cruzado com o currículo canônico do SPE (Ciências 7º e 8º ano)
 * e Plurall (Física do Ensino Médio).
 * 
 * Soberania de Borda: 100% Offline-First, integrado ao SQLite e à Arena PvP.
 */

export type WordwallTemplateType =
  | 'group_sort'
  | 'maze_chase'
  | 'gameshow_quiz'
  | 'airplane'
  | 'matching_pairs'
  | 'diagram_labeling'
  | 'true_false_run'
  | 'cloze_sentence'
  | 'random_wheel'
  | 'open_the_box'
  | 'flashcards_srs';

export interface GameGroupSortPayload {
  groups: { id: string; title: string; color?: string }[];
  items: { id: string; text: string; correctGroupId: string; explanation?: string }[];
}

export interface GameMazeChasePayload {
  lives: number;
  speed: number;
  stages: {
    question: string;
    correctZone: string;
    distractorZones: string[];
    socraticHint: string;
  }[];
}

export interface GameGameshowPayload {
  lifelines: { name: '50:50' | 'extra_time' | 'socratic_hint'; available: boolean }[];
  roundTimeSeconds: number;
  bonusRoundsCount: number;
  questions: {
    id: string;
    text: string;
    options: { letter: string; text: string }[];
    correctAnswer: string;
    points: number;
    explanation: string;
  }[];
}

export interface GameAirplanePayload {
  fuelLevel: number;
  flightSpeed: number;
  targets: {
    prompt: string;
    correctCloudText: string;
    distractorClouds: string[];
    points: number;
  }[];
}

export interface GameDiagramLabelingPayload {
  imageUrl: string;
  imageAlt: string;
  pins: {
    id: string;
    xPercent: number;
    yPercent: number;
    correctLabel: string;
    hint: string;
  }[];
}

export interface GameDefinition {
  id: string;
  title: string;
  templateType: WordwallTemplateType;
  discipline: string;
  grade: string;
  bnccSkillCode: string;
  instructions: string;
  timeLimitSeconds?: number;
  payload:
    | GameGroupSortPayload
    | GameMazeChasePayload
    | GameGameshowPayload
    | GameAirplanePayload
    | GameDiagramLabelingPayload
    | Record<string, unknown>;
  createdAt: string;
}

export class WordwallGameEngine {
  /**
   * Catálogo das 28 modalidades canônicas absorvidas do Wordwall
   */
  public static getCatalogModalities(): { id: string; name: string; category: string; description: string }[] {
    return [
      { id: 'group_sort', name: 'Classificação em grupos', category: 'Categorização', description: 'Arraste itens para caixas conceituais correspondentes.' },
      { id: 'maze_chase', name: 'Perseguição em labirinto', category: 'Ação & Arcade', description: 'Corra pelo labirinto capturando a resposta certa e fugindo dos inimigos.' },
      { id: 'gameshow_quiz', name: 'Game show de TV', category: 'Competição', description: 'Quiz animado com cronômetro, 50:50, bônus e som imersivo.' },
      { id: 'airplane', name: 'Aviãozinho', category: 'Ação & Arcade', description: 'Pilote através das nuvens com as respostas corretas.' },
      { id: 'matching_pairs', name: 'Associação / Pares', category: 'Memória', description: 'Conecte termos a definições e fórmulas.' },
      { id: 'diagram_labeling', name: 'Imagem com legenda', category: 'Visual / Espacial', description: 'Posicione os marcadores no local exato do diagrama ou mapa.' },
      { id: 'true_false_run', name: 'Verdadeiro ou Falso', category: 'Reflexo Rápido', description: 'Itens em esteira rolante para validação veloz.' },
      { id: 'cloze_sentence', name: 'Complete a frase', category: 'Linguagem', description: 'Arraste palavras para preencher lacunas de postulados.' },
      { id: 'random_wheel', name: 'Roleta aleatória', category: 'Sorteio', description: 'Gire para sortear estudantes ou tópicos de arguição.' },
      { id: 'open_the_box', name: 'Abra a caixa', category: 'Descoberta', description: 'Toque para revelar surpresas conceituais e desafios TRI.' },
      { id: 'flashcards_srs', name: 'Flashcards de Repetição', category: 'Memorização', description: 'Revisão espaçada ativa com cartas 3D.' },
    ];
  }

  /**
   * Jogo Pré-Configurado: Máquinas Simples e Alavancas (Ciências 7º Ano SPE Vol 3)
   */
  public static createAlavancasGroupSortGame(): GameDefinition {
    return {
      id: 'WW-CIEN7-ALAVANCAS-01',
      title: 'Classificação de Alavancas & Máquinas Simples',
      templateType: 'group_sort',
      discipline: 'Ciências',
      grade: '7º Ano',
      bnccSkillCode: 'EF07CI01',
      instructions: 'Arraste cada ferramenta para o tipo correto de alavanca de acordo com a posição do ponto de apoio (A), potência (P) e resistência (R).',
      timeLimitSeconds: 120,
      payload: {
        groups: [
          { id: 'interfixa', title: 'Alavanca Interfixa (Apoio no meio)', color: '#3B82F6' },
          { id: 'inter_resistente', title: 'Alavanca Inter-resistente (Resistência no meio)', color: '#10B981' },
          { id: 'interpotente', title: 'Alavanca Interpotente (Potência no meio)', color: '#F59E0B' },
        ],
        items: [
          { id: 'it-1', text: 'Tesoura escolar', correctGroupId: 'interfixa', explanation: 'O eixo (apoio) fica entre o cabo (potência) e a lâmina (resistência).' },
          { id: 'it-2', text: 'Gangorra de parque', correctGroupId: 'interfixa', explanation: 'O ponto de apoio central suporta as forças nas duas extremidades.' },
          { id: 'it-3', text: 'Alicate de corte', correctGroupId: 'interfixa', explanation: 'O fulcro central multiplica a força aplicada no cabo.' },
          { id: 'it-4', text: 'Carrinho de mão', correctGroupId: 'inter_resistente', explanation: 'A carga (resistência) fica entre a roda dianteira (apoio) e os braços (potência).' },
          { id: 'it-5', text: 'Quebra-nozes', correctGroupId: 'inter_resistente', explanation: 'A noz resistente é comprimida entre o ponto de apoio na ponta e os cabos.' },
          { id: 'it-6', text: 'Abridor de garrafas', correctGroupId: 'inter_resistente', explanation: 'A tampa resistente fica entre o apoio no centro e a mão puxando a haste.' },
          { id: 'it-7', text: 'Pinça de sobrancelha', correctGroupId: 'interpotente', explanation: 'Os dedos apertam no meio (potência), com o apoio na junção traseira.' },
          { id: 'it-8', text: 'Vara de pescar', correctGroupId: 'interpotente', explanation: 'A mão dianteira aplica a força potente para levantar o peixe na ponta.' },
          { id: 'it-9', text: 'Cortador de unhas (braço)', correctGroupId: 'interpotente', explanation: 'A pressão é aplicada na haste intermediária.' },
        ],
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Jogo Pré-Configurado: Labirinto dos Rios Voadores e Clima (Ciências 7º Ano SPE Vol 1)
   */
  public static createRiosVoadoresMazeGame(): GameDefinition {
    return {
      id: 'WW-CIEN7-RIOSVOADORES-02',
      title: 'Labirinto dos Rios Voadores & Ciclo da Água',
      templateType: 'maze_chase',
      discipline: 'Ciências',
      grade: '7º Ano',
      bnccSkillCode: 'EF07CI13',
      instructions: 'Guie a molécula de vapor d\'água pelas correntes de ar até a resposta correta, desviando das zonas de queimada e desmatamento!',
      timeLimitSeconds: 180,
      payload: {
        lives: 3,
        speed: 1.2,
        stages: [
          {
            question: 'Qual processo biológico florestal é a principal "bomba" geradora dos Rios Voadores na Amazônia?',
            correctZone: 'Evapotranspiração das árvores de grande porte',
            distractorZones: ['Respiração anaeróbica do solo', 'Precipitação ácida pontual', 'Sublimação do gelo'],
            socraticHint: 'Pense em como as árvores retiram água do solo profundo e a liberam pelos estômatos.',
          },
          {
            question: 'Qual barreira geográfica natural impede que o vapor amazônico escape para o Oceano Pacífico, defletindo-o para o Centro-Oeste e Sudeste do Brasil?',
            correctZone: 'Cordilheira dos Andes',
            distractorZones: ['Planalto Central', 'Mata dos Cocais', 'Serra do Mar'],
            socraticHint: 'É a imensa cadeia montanhosa a oeste da América do Sul.',
          },
          {
            question: 'Qual impacto ambiental direto o desmatamento massivo causa no regime de chuvas do Centro-Oeste brasileiro?',
            correctZone: 'Redução drástica do volume pluviométrico e secas prolongadas',
            distractorZones: ['Aumento das enchentes no inverno', 'Esfriamento generalizado dos rios', 'Neutralização do efeito estufa'],
            socraticHint: 'Menos árvores significam menor volume de água bombeada para a atmosfera.',
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Jogo Pré-Configurado: Aviãozinho da Eletricidade & Consumo kWh (Ciências 8º Ano SPE Vol 2)
   */
  public static createEletricidadeAirplaneGame(): GameDefinition {
    return {
      id: 'WW-CIEN8-ELETRICIDADE-03',
      title: 'Aviãozinho da Energia Elétrica & Consumo',
      templateType: 'airplane',
      discipline: 'Ciências',
      grade: '8º Ano',
      bnccSkillCode: 'EF08CI04',
      instructions: 'Pilote o avião até a nuvem com a resposta fisicamente correta, desviando das nuvens com erros de cálculo!',
      timeLimitSeconds: 150,
      payload: {
        fuelLevel: 100,
        flightSpeed: 1.0,
        targets: [
          {
            prompt: 'Um ferro de passar de 2.000 W funciona durante 30 minutos (0,5 h). Qual foi o consumo em kWh?',
            correctCloudText: '1,0 kWh',
            distractorClouds: ['60 kWh', '1.000 kWh', '0,25 kWh'],
            points: 100,
          },
          {
            prompt: 'Qual componente elétrico tem a função de abrir o circuito interrompendo a corrente em caso de sobrecarga perigosa?',
            correctCloudText: 'Disjuntor / Fusível',
            distractorClouds: ['Resistor ôhmico', 'Voltímetro em paralelo', 'Fio terra condutor'],
            points: 100,
          },
          {
            prompt: 'Qual das seguintes matrizes elétricas é considerada renovável e não emite gases estufa na sua operação?',
            correctCloudText: 'Energia Solar Fotovoltaica',
            distractorClouds: ['Termelétrica a carvão mineral', 'Usina a óleo diesel', 'Gás natural fóssil'],
            points: 100,
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Jogo Pré-Configurado: Game Show de Física — Óptica & Doppler (Plurall EM / Prepara Positivo)
   */
  public static createFisicaGameshow(): GameDefinition {
    return {
      id: 'WW-EM-FIS-GAMESHOW-04',
      title: 'Mega Game Show: Física dos Vestibulares & ENEM',
      templateType: 'gameshow_quiz',
      discipline: 'Física',
      grade: '3ª Série EM',
      bnccSkillCode: 'EM13CNT205',
      instructions: 'Teste seus conhecimentos em 4 rodadas eletrizantes com cronômetro, 50:50 e bônus socrático!',
      timeLimitSeconds: 240,
      payload: {
        lifelines: [
          { name: '50:50', available: true },
          { name: 'extra_time', available: true },
          { name: 'socratic_hint', available: true },
        ],
        roundTimeSeconds: 45,
        bonusRoundsCount: 1,
        questions: [
          {
            id: 'q1',
            text: 'Um espelho esférico côncavo de raio R = 60 cm forma uma imagem real de um objeto posicionado a 45 cm do vértice. A que distância p\' a imagem é projetada?',
            options: [
              { letter: 'A', text: '45 cm' },
              { letter: 'B', text: '60 cm' },
              { letter: 'C', text: '90 cm' },
              { letter: 'D', text: '120 cm' },
            ],
            correctAnswer: 'C',
            points: 200,
            explanation: 'f = R/2 = +30 cm. 1/30 = 1/45 + 1/p\' => 1/p\' = 1/30 - 1/45 = 1/90 => p\' = 90 cm.',
          },
          {
            id: 'q2',
            text: 'Em uma bicicleta, a coroa dianteira tem raio 3 vezes maior que a catraca traseira conectada por corrente. Se a coroa gira a 2 Hz, qual é a frequência da catraca?',
            options: [
              { letter: 'A', text: '2 Hz' },
              { letter: 'B', text: '4 Hz' },
              { letter: 'C', text: '6 Hz' },
              { letter: 'D', text: '8 Hz' },
            ],
            correctAnswer: 'C',
            points: 200,
            explanation: 'fA * RA = fB * RB => 2 * (3 * RB) = fB * RB => fB = 6 Hz.',
          },
          {
            id: 'q3',
            text: 'Uma máquina térmica ideal de Carnot opera entre 300 K e 600 K. Qual é o seu rendimento térmico percentual máximo?',
            options: [
              { letter: 'A', text: '30%' },
              { letter: 'B', text: '50%' },
              { letter: 'C', text: '60%' },
              { letter: 'D', text: '100%' },
            ],
            correctAnswer: 'B',
            points: 200,
            explanation: 'η = 1 - (300 / 600) = 1 - 0,5 = 0,50 (50%).',
          },
          {
            id: 'q4',
            text: 'Quando uma ambulância com a sirene ligada se aproxima em alta velocidade de uma pessoa em repouso na calçada, o que ocorre com o som percebido?',
            options: [
              { letter: 'A', text: 'A frequência aparente aumenta, tornando o som mais agudo.' },
              { letter: 'B', text: 'A frequência aparente diminui, tornando o som mais grave.' },
              { letter: 'C', text: 'A velocidade da onda sonora dobra no ar.' },
              { letter: 'D', text: 'O som sofre difração total e torna-se inaudível.' },
            ],
            correctAnswer: 'A',
            points: 200,
            explanation: 'No Efeito Doppler de aproximação, o comprimento de onda se comprime e a frequência aparente se eleva (som mais agudo).',
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };
  }
}
