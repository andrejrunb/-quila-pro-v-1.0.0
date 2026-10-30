/**
 * Áquila Pro — H5P & Perseus Offline Container Engine (Onda 10 / REA Soberano)
 *
 * Motor de execução offline-first de itens paramétricos no padrão Khan Academy (Perseus)
 * e pacotes interativos no padrão H5P (Branching Scenarios, Image Hotspots e Drag The Words).
 *
 * Integração:
 * - 100% Offline-First (zero dependência de CDNs ou servidores externos)
 * - Avaliação pedagógica formativa com Scaffolding Socrático de 3 níveis
 * - Persistência no SQLite WAL com concessão de XP e Sovereign Coins
 * - Trilha de Auditoria imutável (zero_bypass_audits / LGPD Art. 14)
 */

export type AppletType =
  | 'perseus_math_slider'
  | 'perseus_number_line'
  | 'perseus_radio_scaffolding'
  | 'h5p_branching_scenario'
  | 'h5p_image_hotspots'
  | 'h5p_drag_words';

export type AppletCategory =
  | 'MATEMATICA'
  | 'FISICA'
  | 'QUIMICA'
  | 'BIOLOGIA'
  | 'HISTORIA'
  | 'SOCIOLOGIA';

export interface PerseusSliderPayload {
  variableName: string;
  min: number;
  max: number;
  step: number;
  initialValue: number;
  targetValue: number;
  tolerance: number;
  interceptName?: string;
  minIntercept?: number;
  maxIntercept?: number;
  stepIntercept?: number;
  initialIntercept?: number;
  targetIntercept?: number;
  formulaTemplate: string;
  prompt: string;
  hints: string[];
  targetDescription: string;
}

export interface PerseusNumberLinePayload {
  min: number;
  max: number;
  divisions: number;
  targetFraction: { num: number; den: number };
  initialValue: number;
  tolerance: number;
  prompt: string;
  hints: string[];
}

export interface PerseusRadioPayload {
  questionText: string;
  contextLatex?: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  socraticHints: { level: number; title: string; hintText: string; penaltyPercent: number }[];
  explanation: string;
}

export interface H5PBranchingChoice {
  id: string;
  text: string;
  nextNodeId: string;
  feedback: string;
  points: number;
  isGoodOutcome?: boolean;
}

export interface H5PBranchingNode {
  id: string;
  title: string;
  narrative: string;
  imageUrl?: string;
  isTerminal?: boolean;
  choices: H5PBranchingChoice[];
}

export interface H5PBranchingPayload {
  scenarioTitle: string;
  startNodeId: string;
  nodes: Record<string, H5PBranchingNode>;
}

export interface H5PHotspotItem {
  id: string;
  name: string;
  xPercent: number;
  yPercent: number;
  description: string;
  funFact: string;
  microQuiz?: {
    question: string;
    options: string[];
    correctIdx: number;
  };
}

export interface H5PHotspotsPayload {
  diagramTitle: string;
  svgType: 'cell_diagram' | 'carnot_cycle' | 'water_cycle';
  hotspots: H5PHotspotItem[];
}

export interface H5PDragWordsPayload {
  instruction: string;
  sentenceSegments: string[];
  blanks: { id: string; slotIdx: number; correctWord: string; hint: string }[];
  distractorWords: string[];
}

export interface AppletDefinition {
  id: string;
  title: string;
  description: string;
  type: AppletType;
  category: AppletCategory;
  gradeLevel: string;
  bnccCode: string;
  estimatedMinutes: number;
  maxCoins: number;
  maxEnergyPoints: number;
  perseusSlider?: PerseusSliderPayload;
  perseusNumberLine?: PerseusNumberLinePayload;
  perseusRadio?: PerseusRadioPayload;
  h5pBranching?: H5PBranchingPayload;
  h5pHotspots?: H5PHotspotsPayload;
  h5pDragWords?: H5PDragWordsPayload;
}

export interface AppletProgressRecord {
  id?: string;
  studentId: string;
  appletId: string;
  appletType: AppletType;
  category: AppletCategory;
  score: number;
  maxScore: number;
  hintsUsed: number;
  timeSpentSeconds: number;
  coinsAwarded: number;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AppletValidationResult {
  isCorrect: boolean;
  score: number;
  maxScore: number;
  coinsEarned: number;
  energyPointsEarned: number;
  feedbackMessage: string;
  hintPenaltyPercent: number;
}

export class H5PPerseusEngine {
  /**
   * Catálogo de Applets Nativos Pré-Empacotados (Offline-First)
   */
  public static getCatalog(): AppletDefinition[] {
    return [
      // 1. Perseus Math Slider: Função Afim e Coeficiente Angular
      {
        id: 'perseus-math-afim-01',
        title: 'Função Afim: Controle de Coeficiente Angular e Linear',
        description: 'Manipule os controles deslizantes de m e b no plano cartesiano até a reta interceptar os dois pontos-alvo da trajetória balística.',
        type: 'perseus_math_slider',
        category: 'MATEMATICA',
        gradeLevel: 'Ensino Médio 1º Ano',
        bnccCode: 'EM13MAT302',
        estimatedMinutes: 5,
        maxCoins: 35,
        maxEnergyPoints: 100,
        perseusSlider: {
          variableName: 'Coeficiente Angular (m)',
          min: -4,
          max: 4,
          step: 0.5,
          initialValue: 1,
          targetValue: 2,
          tolerance: 0.05,
          interceptName: 'Coeficiente Linear (b)',
          minIntercept: -5,
          maxIntercept: 5,
          stepIntercept: 1,
          initialIntercept: 0,
          targetIntercept: -3,
          formulaTemplate: 'f(x) = {m}x + ({b})',
          prompt: 'Ajuste a reta para que ela passe exatamente pelos pontos A(1, -1) e B(3, 3).',
          hints: [
            'Dica 1/3 (Conceitual): Lembre-se que o coeficiente angular m = (yB - yA) / (xB - xA).',
            'Dica 2/3 (Cálculo): m = (3 - (-1)) / (3 - 1) = 4 / 2 = 2. A reta deve ter inclinação 2.',
            'Dica 3/3 (Resolução): Com m = 2, calcule b usando A(1, -1): -1 = 2(1) + b => b = -3. Portanto f(x) = 2x - 3.'
          ],
          targetDescription: 'A reta f(x) = 2x - 3 corta o eixo y em (0, -3) e tem raiz em (1.5, 0).'
        }
      },

      // 2. Perseus Number Line: Frações e Racionais
      {
        id: 'perseus-numline-racionais-01',
        title: 'Reta Numérica: Localização Fina de Racionais e Frações',
        description: 'Posicione o marcador sobre o ponto exato correspondente à fração 7/4 na reta numérica contínua.',
        type: 'perseus_number_line',
        category: 'MATEMATICA',
        gradeLevel: 'Fundamental II 7º Ano',
        bnccCode: 'EF07MA03',
        estimatedMinutes: 4,
        maxCoins: 25,
        maxEnergyPoints: 75,
        perseusNumberLine: {
          min: 0,
          max: 3,
          divisions: 12,
          targetFraction: { num: 7, den: 4 },
          initialValue: 1.0,
          tolerance: 0.08,
          prompt: 'Arraste o cursor até a posição exata de 7/4 (sete quartos).',
          hints: [
            'Dica 1/3: Transforme 7/4 em um número misto ou decimal. Quantas vezes o 4 cabe no 7?',
            'Dica 2/3: 7 dividido por 4 é igual a 1,75 (ou 1 inteiro e 3/4).',
            'Dica 3/3: O valor está exatamente a três quartos da distância entre 1 e 2 (posição 1.75).'
          ]
        }
      },

      // 3. Perseus Radio com Scaffolding: MRUV e Aceleração
      {
        id: 'perseus-radio-mruv-01',
        title: 'Cinemática: Cálculo de Distância no MRUV com Frenagem',
        description: 'Um veículo autônomo escolar trafega a 72 km/h quando os sensores detectam uma faixa de pedestres a 50m. Sabendo que os freios produzem desaceleração de 4 m/s², determine se o veículo para antes da faixa e a distância percorrida.',
        type: 'perseus_radio_scaffolding',
        category: 'FISICA',
        gradeLevel: 'Ensino Médio 1º Ano',
        bnccCode: 'EM13CNT204',
        estimatedMinutes: 6,
        maxCoins: 40,
        maxEnergyPoints: 120,
        perseusRadio: {
          questionText: 'Qual a distância percorrida até o repouso absoluto pelo veículo e ele colidirá com a faixa?',
          contextLatex: 'v^2 = v_0^2 + 2 \\cdot a \\cdot \\Delta s',
          options: [
            { id: 'opt-a', text: '50 m — o veículo para exatamente no limite da faixa.', isCorrect: true },
            { id: 'opt-b', text: '72 m — o veículo avança 22 metros sobre a faixa.', isCorrect: false },
            { id: 'opt-c', text: '40 m — o veículo para 10 metros antes da faixa com total segurança.', isCorrect: false },
            { id: 'opt-d', text: '100 m — os freios não são suficientes e o veículo invade a pista.', isCorrect: false }
          ],
          socraticHints: [
            {
              level: 1,
              title: 'Conversão de Unidades (SI)',
              hintText: 'A velocidade inicial está em km/h (72 km/h). Converta para m/s dividindo por 3,6: 72 / 3,6 = 20 m/s.',
              penaltyPercent: 10
            },
            {
              level: 2,
              title: 'Equação de Torricelli',
              hintText: 'Como não temos o tempo, use Torricelli: v² = v0² + 2·a·Δs. Lembre-se que na frenagem a = -4 m/s² e ao parar v = 0.',
              penaltyPercent: 25
            },
            {
              level: 3,
              title: 'Substituição e Conclusão',
              hintText: '0 = 20² + 2(-4)·Δs => 0 = 400 - 8·Δs => 8·Δs = 400 => Δs = 50 metros. Ele para exatamente no limite da faixa.',
              penaltyPercent: 50
            }
          ],
          explanation: 'Convertendo 72 km/h para o SI obtemos 20 m/s. Aplicando Torricelli com v=0 e a=-4 m/s²: 0 = 400 - 8Δs, logo Δs = 50m. O veículo para no limite da faixa.'
        }
      },

      // 4. H5P Branching Scenario: Dilema da Matriz Energética Escolar
      {
        id: 'h5p-branching-energia-01',
        title: 'Cenário Ramificado: O Dilema da Matriz Energética Soberana',
        description: 'Tome decisões estratégicas de engenharia para alimentar o campus escolar Áquila Edge com 100% de energia limpa e resiliência a apagões.',
        type: 'h5p_branching_scenario',
        category: 'FISICA',
        gradeLevel: 'Ensino Médio 2º Ano',
        bnccCode: 'EM13CNT309',
        estimatedMinutes: 8,
        maxCoins: 50,
        maxEnergyPoints: 150,
        h5pBranching: {
          scenarioTitle: 'Projeto Campus Solar & Baterias LiFePO4',
          startNodeId: 'node-inicio',
          nodes: {
            'node-inicio': {
              id: 'node-inicio',
              title: 'Diagnóstico de Consumo e Quedas de Rede',
              narrative: 'O conselho escolar precisa escolher a fonte primária para sustentar os servidores Edge de IA e a climatização durante o verão.',
              choices: [
                {
                  id: 'c-solar-bateria',
                  text: 'Investir em Telhado Fotovoltaico com Banco de Baterias LiFePO4 de Borda',
                  nextNodeId: 'node-solar-sucesso',
                  feedback: 'Excelente visão sustentável e autônoma. O investimento inicial é maior, mas zera a pegada de carbono e garante uptime de 99,9%.',
                  points: 50,
                  isGoodOutcome: true
                },
                {
                  id: 'c-gerador-diesel',
                  text: 'Alugar um Gerador a Diesel Central para Contingência',
                  nextNodeId: 'node-diesel-dilema',
                  feedback: 'Opção de menor custo imediato, porém gera ruído na vizinhança das salas e emissão de gases de efeito estufa.',
                  points: 15,
                  isGoodOutcome: false
                }
              ]
            },
            'node-solar-sucesso': {
              id: 'node-solar-sucesso',
              title: 'Gestão Inteligente de Carga com AI Throttling',
              narrative: 'Em dias nublados consecutivos, a capacidade das baterias atinge 35%. Qual política o Agente Antigravity deve adotar?',
              choices: [
                {
                  id: 'c-throttling-ia',
                  text: 'Ativar Eco-Mode: reduzir FPS da visão computacional para 10 FPS e priorizar luzes e catracas',
                  nextNodeId: 'node-terminal-vitoria',
                  feedback: 'Decisão de mestre! Preserva o perímetro de segurança sem esgotar as reservas elétricas críticas.',
                  points: 50,
                  isGoodOutcome: true
                },
                {
                  id: 'c-desligar-ar',
                  text: 'Desligar todo o sistema de refrigeração das salas de aula mantendo IA a 100%',
                  nextNodeId: 'node-terminal-desconforto',
                  feedback: 'Isso provocou fadiga térmica nos estudantes e queda de rendimento pedagógico.',
                  points: 20,
                  isGoodOutcome: false
                }
              ]
            },
            'node-diesel-dilema': {
              id: 'node-diesel-dilema',
              title: 'Aumento do Custo do Combustível e Falha de Filtro',
              narrative: 'Após 3 meses, o preço do diesel subiu 22% e os filtros emitiram fuligem próximo à horta escolar. O que a coordenação decide?',
              choices: [
                {
                  id: 'c-migrar-solar',
                  text: 'Vender o gerador e migrar emergencialmente para cotas solares comunitárias',
                  nextNodeId: 'node-terminal-recuperado',
                  feedback: 'A escola corrigiu o rumo a tempo e recuperou a chancela de sustentabilidade.',
                  points: 35,
                  isGoodOutcome: true
                },
                {
                  id: 'c-insistir-diesel',
                  text: 'Aumentar a verba de combustível cortando o orçamento do laboratório de ciências',
                  nextNodeId: 'node-terminal-fracasso',
                  feedback: 'Decisão altamente prejudicial à formação prática dos estudantes.',
                  points: 5,
                  isGoodOutcome: false
                }
              ]
            },
            'node-terminal-vitoria': {
              id: 'node-terminal-vitoria',
              title: '🏆 Campus Soberano Autossustentável',
              narrative: 'Parabéns! Sua gestão garantiu 100% de estabilidade energética, zero emissões e máxima eficiência pedagógica!',
              isTerminal: true,
              choices: []
            },
            'node-terminal-desconforto': {
              id: 'node-terminal-desconforto',
              title: '⚠️ Conforto Térmico Comprometido',
              narrative: 'A escola manteve os servidores online, mas a experiência dos alunos foi prejudicada pelo calor excessivo.',
              isTerminal: true,
              choices: []
            },
            'node-terminal-recuperado': {
              id: 'node-terminal-recuperado',
              title: '🌱 Transição Ecológica Efetivada',
              narrative: 'Apesar do atraso inicial, o campus adotou a soberania solar.',
              isTerminal: true,
              choices: []
            },
            'node-terminal-fracasso': {
              id: 'node-terminal-fracasso',
              title: '❌ Colapso Orçamentário e Pedagógico',
              narrative: 'A dependência de combustíveis fósseis consumiu recursos essenciais para as aulas experimentais.',
              isTerminal: true,
              choices: []
            }
          }
        }
      },

      // 5. H5P Image Hotspots: Célula Eucarionte Animal e Organelas
      {
        id: 'h5p-hotspots-celula-01',
        title: 'Hotspots Interativos: Ultraestrutura Celular e Organelas',
        description: 'Explore os pontos quentes da célula eucariótica animal em corte 2D para identificar o retículo, complexo golgiense e mitocôndrias.',
        type: 'h5p_image_hotspots',
        category: 'BIOLOGIA',
        gradeLevel: 'Fundamental II 8º Ano',
        bnccCode: 'EF08CI02',
        estimatedMinutes: 5,
        maxCoins: 30,
        maxEnergyPoints: 90,
        h5pHotspots: {
          diagramTitle: 'Esquema Tridimensional de Célula Eucarionte Animal',
          svgType: 'cell_diagram',
          hotspots: [
            {
              id: 'hs-mitocondria',
              name: 'Mitocôndria',
              xPercent: 28,
              yPercent: 32,
              description: 'Organela com dupla membrana e cristas mitocondriais responsável pela respiração celular aeróbica e síntese de ATP.',
              funFact: 'Possui DNA próprio circular de herança estritamente materna, sustentando a Teoria Endossimbiótica.',
              microQuiz: {
                question: 'Qual a principal molécula energética gerada na mitocôndria?',
                options: ['Glicose', 'ATP (Trifosfato de Adenosina)', 'Hemoglobina', 'DNA Polimerase'],
                correctIdx: 1
              }
            },
            {
              id: 'hs-nucleo',
              name: 'Núcleo e Nucléolo',
              xPercent: 50,
              yPercent: 50,
              description: 'Compartimento delimitado pela carioteca contendo a cromatina (DNA + histonas) e o nucléolo, sítio de transcrição de RNAr.',
              funFact: 'Os poros nucleares controlam o tráfego de mais de 1.000 moléculas por segundo entre núcleo e citoplasma.',
              microQuiz: {
                question: 'Qual organela no interior do núcleo sintetiza os ribossomos?',
                options: ['Lisossomo', 'Nucléolo', 'Centríolo', 'Peroxissomo'],
                correctIdx: 1
              }
            },
            {
              id: 'hs-golgi',
              name: 'Complexo Golgiense',
              xPercent: 72,
              yPercent: 38,
              description: 'Conjunto de cisternas membranosas empilhadas que modificam, empacotam e endereçam proteínas e lipídios via vesículas.',
              funFact: 'Também é responsável pela síntese de polissacarídeos e formação do acrossomo nos espermatozoides.',
              microQuiz: {
                question: 'As vesículas originadas no Golgi que contêm enzimas digestivas são chamadas:',
                options: ['Lisossomos', 'Cloroplastos', 'Vacúolos contráteis', 'Ribossomos'],
                correctIdx: 0
              }
            },
            {
              id: 'hs-reticulo-rugoso',
              name: 'Retículo Endoplasmático Rugoso (RER)',
              xPercent: 35,
              yPercent: 68,
              description: 'Rede de túbulos e bolsas recoberta externamente por ribossomos associados, especializada na síntese de proteínas de exportação.',
              funFact: 'Muito abundante em células glandulares como as do pâncreas que secretam enzimas digestivas.',
              microQuiz: {
                question: 'Por que o retículo é chamado de "rugoso"?',
                options: ['Presença de ribossomos aderidos à face citosólica', 'Falta de lipídios', 'Presença de cálcio', 'Cílios vibráteis'],
                correctIdx: 0
              }
            }
          ]
        }
      },

      // 6. H5P Drag The Words: Lei da Conservação das Massas (Lavoisier)
      {
        id: 'h5p-drag-lavoisier-01',
        title: 'Drag the Words: Lei de Lavoisier e Balanceamento Químico',
        description: 'Complete as lacunas fundamentais da química clássica arrastando os conceitos termodinâmicos para suas posições corretas.',
        type: 'h5p_drag_words',
        category: 'QUIMICA',
        gradeLevel: 'Ensino Médio 1º Ano',
        bnccCode: 'EM13CNT101',
        estimatedMinutes: 4,
        maxCoins: 25,
        maxEnergyPoints: 80,
        h5pDragWords: {
          instruction: 'Arraste os termos corretos para preencher o enunciado e a análise da combustão do metano.',
          sentenceSegments: [
            'Em um sistema fechado, a massa total dos reagentes é ',
            ' à massa total dos produtos. Na combustão completa de 1 mol de CH4, consomem-se 2 mols de ',
            ', produzindo 1 mol de CO2 e 2 mols de ',
            ', demonstrando que os átomos apenas se '
          ],
          blanks: [
            { id: 'b-0', slotIdx: 0, correctWord: 'igual', hint: 'Princípio da conservação de massa' },
            { id: 'b-1', slotIdx: 1, correctWord: 'O2 (oxigênio)', hint: 'Comburente indispensável' },
            { id: 'b-2', slotIdx: 2, correctWord: 'H2O (água)', hint: 'Subproduto hidrogenado' },
            { id: 'b-3', slotIdx: 3, correctWord: 'rearranjam', hint: 'Os átomos não são criados nem destruídos' }
          ],
          distractorWords: ['menor', 'maior', 'N2 (nitrogênio)', 'destroem', 'aquecem']
        }
      }
    ];
  }

  /**
   * Obtém um applet específico por ID
   */
  public static getAppletById(id: string): AppletDefinition | undefined {
    return this.getCatalog().find(a => a.id === id);
  }

  /**
   * Validação do Perseus Math Slider
   */
  public static evaluateSlider(
    applet: AppletDefinition,
    currentValue: number,
    currentIntercept: number = 0,
    hintsUsedCount: number = 0
  ): AppletValidationResult {
    const payload = applet.perseusSlider;
    if (!payload) {
      throw new Error('Applet não possui payload PerseusSlider.');
    }

    const slopeDiff = Math.abs(currentValue - payload.targetValue);
    const hasIntercept = payload.targetIntercept !== undefined;
    const interceptDiff = hasIntercept
      ? Math.abs(currentIntercept - (payload.targetIntercept ?? 0))
      : 0;

    const slopeCorrect = slopeDiff <= payload.tolerance;
    const interceptCorrect = !hasIntercept || interceptDiff <= 0.1;
    const isCorrect = slopeCorrect && interceptCorrect;

    const penalty = this.calculateHintPenalty(hintsUsedCount);
    const score = isCorrect ? Math.round(100 * (1 - penalty)) : 0;
    const coinsEarned = isCorrect ? Math.max(5, Math.round(applet.maxCoins * (1 - penalty))) : 0;
    const energyEarned = isCorrect ? Math.max(10, Math.round(applet.maxEnergyPoints * (1 - penalty))) : 0;

    let message = '';
    if (isCorrect) {
      message = penalty > 0
        ? `Excelente! Reta ajustada com precisão (Pontuação reduzida em ${Math.round(penalty * 100)}% pelo uso de ${hintsUsedCount} dica(s) socrática(s)).`
        : 'Perfeito! Reta ajustada com maestria máxima sem auxílio de dicas!';
    } else {
      message = `Quase lá! A inclinação atual é ${currentValue.toFixed(2)}${hasIntercept ? ` e intercepto ${currentIntercept.toFixed(2)}` : ''}. Ajuste para atingir a trajetória exata.`;
    }

    return {
      isCorrect,
      score,
      maxScore: 100,
      coinsEarned,
      energyPointsEarned: energyEarned,
      feedbackMessage: message,
      hintPenaltyPercent: Math.round(penalty * 100)
    };
  }

  /**
   * Validação da Reta Numérica Perseus
   */
  public static evaluateNumberLine(
    applet: AppletDefinition,
    selectedPos: number,
    hintsUsedCount: number = 0
  ): AppletValidationResult {
    const payload = applet.perseusNumberLine;
    if (!payload) {
      throw new Error('Applet não possui payload PerseusNumberLine.');
    }

    const targetVal = payload.targetFraction.num / payload.targetFraction.den;
    const diff = Math.abs(selectedPos - targetVal);
    const isCorrect = diff <= payload.tolerance;

    const penalty = this.calculateHintPenalty(hintsUsedCount);
    const score = isCorrect ? Math.round(100 * (1 - penalty)) : 0;
    const coinsEarned = isCorrect ? Math.max(5, Math.round(applet.maxCoins * (1 - penalty))) : 0;
    const energyEarned = isCorrect ? Math.max(10, Math.round(applet.maxEnergyPoints * (1 - penalty))) : 0;

    const message = isCorrect
      ? `Localização exata! O valor de ${payload.targetFraction.num}/${payload.targetFraction.den} é ${targetVal.toFixed(2)}.`
      : `Posição selecionada: ${selectedPos.toFixed(2)}. O alvo está um pouco ${selectedPos < targetVal ? 'mais à direita' : 'mais à esquerda'}.`;

    return {
      isCorrect,
      score,
      maxScore: 100,
      coinsEarned,
      energyPointsEarned: energyEarned,
      feedbackMessage: message,
      hintPenaltyPercent: Math.round(penalty * 100)
    };
  }

  /**
   * Validação de Questão de Múltipla Escolha com Scaffolding Perseus
   */
  public static evaluatePerseusRadio(
    applet: AppletDefinition,
    selectedOptionId: string,
    hintsUsedCount: number = 0
  ): AppletValidationResult {
    const payload = applet.perseusRadio;
    if (!payload) {
      throw new Error('Applet não possui payload PerseusRadio.');
    }

    const selected = payload.options.find(o => o.id === selectedOptionId);
    const isCorrect = selected?.isCorrect === true;

    const penalty = this.calculateHintPenalty(hintsUsedCount);
    const score = isCorrect ? Math.round(100 * (1 - penalty)) : 0;
    const coinsEarned = isCorrect ? Math.max(5, Math.round(applet.maxCoins * (1 - penalty))) : 0;
    const energyEarned = isCorrect ? Math.max(10, Math.round(applet.maxEnergyPoints * (1 - penalty))) : 0;

    const message = isCorrect
      ? `Correto! ${payload.explanation}`
      : 'Resposta incorreta. Revise os passos conceituais ou consulte as dicas socráticas disponíveis.';

    return {
      isCorrect,
      score,
      maxScore: 100,
      coinsEarned,
      energyPointsEarned: energyEarned,
      feedbackMessage: message,
      hintPenaltyPercent: Math.round(penalty * 100)
    };
  }

  /**
   * Validação de Drag The Words H5P
   */
  public static evaluateDragWords(
    applet: AppletDefinition,
    answersBySlot: Record<number, string>
  ): AppletValidationResult {
    const payload = applet.h5pDragWords;
    if (!payload) {
      throw new Error('Applet não possui payload H5PDragWords.');
    }

    let correctCount = 0;
    const totalBlanks = payload.blanks.length;

    for (const b of payload.blanks) {
      const studentWord = answersBySlot[b.slotIdx]?.trim().toLowerCase();
      const expected = b.correctWord.trim().toLowerCase();
      if (studentWord === expected) {
        correctCount++;
      }
    }

    const isCorrect = correctCount === totalBlanks;
    const ratio = totalBlanks > 0 ? correctCount / totalBlanks : 0;
    const score = Math.round(ratio * 100);
    const coinsEarned = Math.round(applet.maxCoins * ratio);
    const energyEarned = Math.round(applet.maxEnergyPoints * ratio);

    const message = isCorrect
      ? 'Excelente! Todas as lacunas conceituais foram preenchidas com precisão científica absoluta!'
      : `Você acertou ${correctCount} de ${totalBlanks} lacuna(s). Tente reorganizar os termos que restam.`;

    return {
      isCorrect,
      score,
      maxScore: 100,
      coinsEarned,
      energyPointsEarned: energyEarned,
      feedbackMessage: message,
      hintPenaltyPercent: 0
    };
  }

  /**
   * Cálculo de Penalização por Dicas Socráticas
   * Dica 1: -10%, Dica 2: -25%, Dica 3: -50%
   */
  public static calculateHintPenalty(hintsUsedCount: number): number {
    if (hintsUsedCount <= 0) return 0;
    if (hintsUsedCount === 1) return 0.10;
    if (hintsUsedCount === 2) return 0.25;
    return 0.50;
  }
}
