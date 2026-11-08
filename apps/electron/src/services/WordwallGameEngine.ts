/**
 * Áquila Pro — WordwallGameEngine (Onda 9 / Gamificação Soberana)
 *
 * Motor de Jogos Educativos com suporte às mecânicas interativas estilo Wordwall,
 * conversor universal de templates ("Switch Template" — o mesmo conteúdo jogável
 * em múltiplos estilos) e temas visuais desbloqueáveis na Câmara de Cosméticos.
 *
 * Soberania de Borda: 100% Offline-First, integrado ao SQLite e à Arena PvP.
 */

export type WordwallTemplateType =
  | 'group_sort'
  | 'maze_chase'
  | 'gameshow_quiz'
  | 'airplane'
  | 'matching_pairs'
  | 'true_false_run'
  | 'open_the_box'
  | 'random_wheel'
  | 'diagram_labeling'
  | 'cloze_sentence'
  | 'flashcards_srs';

export type WordwallVisualThemeId =
  | 'cosmic_galaxy'
  | 'tesla_cyberlab'
  | 'imperial_parchment'
  | 'amazon_biome'
  | 'arcade_neon';

export interface WordwallVisualTheme {
  id: WordwallVisualThemeId;
  name: string;
  badge: string;
  containerBg: string;
  cardBg: string;
  accentBorder: string;
  accentText: string;
  buttonGradient: string;
}

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

export interface GameMatchingPairsPayload {
  pairs: {
    id: string;
    leftTerm: string;
    rightDefinition: string;
    points: number;
  }[];
}

export interface GameTrueFalsePayload {
  statements: {
    id: string;
    statement: string;
    isTrue: boolean;
    explanation: string;
    points: number;
  }[];
}

export interface GameOpenTheBoxPayload {
  boxes: {
    id: string;
    number: number;
    label: string;
    question: string;
    options: string[];
    correctOption: string;
    points: number;
    bonusAureus: number;
  }[];
}

export interface GameRandomWheelPayload {
  slices: {
    id: string;
    label: string;
    color: string;
    challengeQuestion: string;
    options: string[];
    correctOption: string;
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

export type AnyGamePayload =
  | GameGroupSortPayload
  | GameMazeChasePayload
  | GameGameshowPayload
  | GameAirplanePayload
  | GameMatchingPairsPayload
  | GameTrueFalsePayload
  | GameOpenTheBoxPayload
  | GameRandomWheelPayload
  | GameDiagramLabelingPayload;

export interface CanonicalQAPair {
  id: string;
  prompt: string;
  correctAnswer: string;
  distractors: string[];
  explanation: string;
  category?: string;
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
  canonicalItems?: CanonicalQAPair[];
  payload: AnyGamePayload;
  createdAt: string;
}

export class WordwallGameEngine {
  /**
   * Temas visuais interativos estilo Wordwall (sincronizados com a Câmara de Cosméticos)
   */
  public static getVisualThemes(): WordwallVisualTheme[] {
    return [
      {
        id: 'cosmic_galaxy',
        name: 'Galáxia Quântica',
        badge: '🌌',
        containerBg: 'bg-slate-950/95 border-indigo-500/40',
        cardBg: 'bg-slate-900/80 border-indigo-500/30',
        accentBorder: 'border-indigo-500',
        accentText: 'text-indigo-300',
        buttonGradient: 'from-indigo-600 to-purple-600'
      },
      {
        id: 'tesla_cyberlab',
        name: 'Laboratório de Tesla',
        badge: '⚡',
        containerBg: 'bg-cyan-950/90 border-cyan-400/50',
        cardBg: 'bg-slate-900/90 border-cyan-500/40',
        accentBorder: 'border-cyan-400',
        accentText: 'text-cyan-300',
        buttonGradient: 'from-cyan-600 to-blue-600'
      },
      {
        id: 'amazon_biome',
        name: 'Expedição Amazônica',
        badge: '🌿',
        containerBg: 'bg-emerald-950/90 border-emerald-500/40',
        cardBg: 'bg-slate-900/85 border-emerald-500/30',
        accentBorder: 'border-emerald-400',
        accentText: 'text-emerald-300',
        buttonGradient: 'from-emerald-600 to-teal-600'
      },
      {
        id: 'imperial_parchment',
        name: 'Academia Real de Letras',
        badge: '📜',
        containerBg: 'bg-amber-950/90 border-amber-500/40',
        cardBg: 'bg-stone-900/90 border-amber-500/30',
        accentBorder: 'border-amber-400',
        accentText: 'text-amber-300',
        buttonGradient: 'from-amber-600 to-orange-600'
      },
      {
        id: 'arcade_neon',
        name: 'Arcade Retrô 80s',
        badge: '🕹️',
        containerBg: 'bg-fuchsia-950/90 border-pink-500/50',
        cardBg: 'bg-slate-950/90 border-pink-500/40',
        accentBorder: 'border-pink-500',
        accentText: 'text-pink-300',
        buttonGradient: 'from-pink-600 to-rose-600'
      }
    ];
  }

  /**
   * Catálogo das modalidades canônicas do Wordwall
   */
  public static getCatalogModalities(): { id: WordwallTemplateType; name: string; category: string; description: string; switchable: boolean }[] {
    return [
      { id: 'gameshow_quiz', name: 'Game Show de TV', category: 'Competição', description: 'Quiz animado com cronômetro, 50:50, bônus e som imersivo.', switchable: true },
      { id: 'group_sort', name: 'Classificação em Grupos', category: 'Categorização', description: 'Classifique itens em caixas conceituais correspondentes.', switchable: false },
      { id: 'maze_chase', name: 'Perseguição no Labirinto', category: 'Ação & Arcade', description: 'Corra pelo labirinto capturando a zona correta e fugindo dos erros.', switchable: true },
      { id: 'airplane', name: 'Aviãozinho nas Nuvens', category: 'Ação & Arcade', description: 'Pilote através das nuvens com as respostas corretas.', switchable: true },
      { id: 'matching_pairs', name: 'Encontre os Pares', category: 'Memória & Associação', description: 'Conecte conceitos científicos às suas fórmulas ou definições.', switchable: true },
      { id: 'true_false_run', name: 'Esteira Verdadeiro ou Falso', category: 'Reflexo Rápido', description: 'Julgue afirmações científicas contra o relógio em alta velocidade.', switchable: true },
      { id: 'open_the_box', name: 'Abra a Caixa Misteriosa', category: 'Descoberta', description: 'Escolha caixas numeradas com desafios TRI e bônus de moedas Aureus.', switchable: true },
      { id: 'random_wheel', name: 'Roleta Soberana', category: 'Sorteio & Arguição', description: 'Gire a roda animada para sortear desafios e multiplicar XP.', switchable: true }
    ];
  }

  /**
   * Extrai pares canônicos de qualquer jogo para permitir o "Switch Template" instantâneo estilo Wordwall
   */
  public static extractCanonicalItems(game: GameDefinition): CanonicalQAPair[] {
    if (game.canonicalItems && game.canonicalItems.length > 0) {
      return game.canonicalItems;
    }

    if (game.templateType === 'gameshow_quiz') {
      const p = game.payload as GameGameshowPayload;
      return p.questions.map((q) => {
        const correctOpt = q.options.find((o) => o.letter === q.correctAnswer);
        const distractors = q.options.filter((o) => o.letter !== q.correctAnswer).map((o) => o.text);
        return {
          id: q.id,
          prompt: q.text,
          correctAnswer: correctOpt ? correctOpt.text : q.correctAnswer,
          distractors: distractors.length > 0 ? distractors : ['Alternativa Incorreta A', 'Alternativa Incorreta B'],
          explanation: q.explanation
        };
      });
    }

    if (game.templateType === 'maze_chase') {
      const p = game.payload as GameMazeChasePayload;
      return p.stages.map((s, idx) => ({
        id: `maze-${idx}`,
        prompt: s.question,
        correctAnswer: s.correctZone,
        distractors: s.distractorZones,
        explanation: s.socraticHint
      }));
    }

    if (game.templateType === 'airplane') {
      const p = game.payload as GameAirplanePayload;
      return p.targets.map((t, idx) => ({
        id: `air-${idx}`,
        prompt: t.prompt,
        correctAnswer: t.correctCloudText,
        distractors: t.distractorClouds,
        explanation: 'Aplique a relação física direta do conceito.'
      }));
    }

    if (game.templateType === 'group_sort') {
      const p = game.payload as GameGroupSortPayload;
      return p.items.map((it) => {
        const correctGroup = p.groups.find((g) => g.id === it.correctGroupId);
        const otherGroups = p.groups.filter((g) => g.id !== it.correctGroupId).map((g) => g.title);
        return {
          id: it.id,
          prompt: `Em qual categoria classifica-se: "${it.text}"?`,
          correctAnswer: correctGroup ? correctGroup.title : it.correctGroupId,
          distractors: otherGroups,
          explanation: it.explanation || 'Classificação estrutural conforme propriedades físicas.'
        };
      });
    }

    if (game.templateType === 'matching_pairs') {
      const p = game.payload as GameMatchingPairsPayload;
      return p.pairs.map((pair) => {
        const others = p.pairs.filter((other) => other.id !== pair.id).map((other) => other.rightDefinition);
        return {
          id: pair.id,
          prompt: pair.leftTerm,
          correctAnswer: pair.rightDefinition,
          distractors: others.slice(0, 3),
          explanation: `Associação direta: ${pair.leftTerm} -> ${pair.rightDefinition}`
        };
      });
    }

    if (game.templateType === 'open_the_box') {
      const p = game.payload as GameOpenTheBoxPayload;
      return p.boxes.map((b) => ({
        id: b.id,
        prompt: b.question,
        correctAnswer: b.correctOption,
        distractors: b.options.filter((o) => o !== b.correctOption),
        explanation: `Caixa ${b.number}: ${b.label}`
      }));
    }

    if (game.templateType === 'random_wheel') {
      const p = game.payload as GameRandomWheelPayload;
      return p.slices.map((s) => ({
        id: s.id,
        prompt: s.challengeQuestion,
        correctAnswer: s.correctOption,
        distractors: s.options.filter((o) => o !== s.correctOption),
        explanation: `Tópico da Roleta: ${s.label}`
      }));
    }

    return [];
  }

  /**
   * Conversor Universal de Estilo (Wordwall "Switch Template"):
   * Converte qualquer atividade carregada para uma nova mecânica de jogo mantendo o mesmo conteúdo pedagógico!
   */
  public static convertGameToTemplate(game: GameDefinition, targetTemplate: WordwallTemplateType): GameDefinition {
    const canonical = this.extractCanonicalItems(game);
    if (canonical.length === 0) return game;

    const base = {
      ...game,
      templateType: targetTemplate,
      canonicalItems: canonical
    };

    switch (targetTemplate) {
      case 'gameshow_quiz': {
        const letters = ['A', 'B', 'C', 'D'];
        const payload: GameGameshowPayload = {
          lifelines: [
            { name: '50:50', available: true },
            { name: 'extra_time', available: true },
            { name: 'socratic_hint', available: true }
          ],
          roundTimeSeconds: 45,
          bonusRoundsCount: 1,
          questions: canonical.map((item, idx) => {
            const allTexts = [item.correctAnswer, ...item.distractors.slice(0, 3)];
            const rotated = allTexts.map((txt, i) => ({
              letter: letters[i] || 'D',
              text: txt
            }));
            return {
              id: `q-${idx}`,
              text: item.prompt,
              options: rotated,
              correctAnswer: 'A',
              points: 200,
              explanation: item.explanation
            };
          })
        };
        return {
          ...base,
          instructions: 'Modo Game Show de TV: Responda antes do tempo acabar usando ajudas 50:50 e Dica Socrática!',
          payload
        };
      }

      case 'maze_chase': {
        const payload: GameMazeChasePayload = {
          lives: 3,
          speed: 1.2,
          stages: canonical.map((item) => ({
            question: item.prompt,
            correctZone: item.correctAnswer,
            distractorZones: item.distractors.slice(0, 3),
            socraticHint: item.explanation
          }))
        };
        return {
          ...base,
          instructions: 'Modo Perseguição no Labirinto: Corra para a zona com a resposta correta sem perder suas 3 vidas!',
          payload
        };
      }

      case 'airplane': {
        const payload: GameAirplanePayload = {
          fuelLevel: 100,
          flightSpeed: 1.0,
          targets: canonical.map((item) => ({
            prompt: item.prompt,
            correctCloudText: item.correctAnswer,
            distractorClouds: item.distractors.slice(0, 3),
            points: 150
          }))
        };
        return {
          ...base,
          instructions: 'Modo Aviãozinho: Pilote através da nuvem correta e evite turbulências conceituais!',
          payload
        };
      }

      case 'matching_pairs': {
        const payload: GameMatchingPairsPayload = {
          pairs: canonical.slice(0, 6).map((item, idx) => ({
            id: `pair-${idx}`,
            leftTerm: item.prompt,
            rightDefinition: item.correctAnswer,
            points: 150
          }))
        };
        return {
          ...base,
          instructions: 'Modo Encontre os Pares: Selecione um enunciado/conceito à esquerda e conecte-o ao seu par exato à direita!',
          payload
        };
      }

      case 'true_false_run': {
        const payload: GameTrueFalsePayload = {
          statements: canonical.map((item, idx) => {
            const makeTrue = idx % 2 === 0;
            const shownAnswer = makeTrue ? item.correctAnswer : (item.distractors[0] || 'Incorreto');
            return {
              id: `tf-${idx}`,
              statement: `${item.prompt} -> Resposta: ${shownAnswer}`,
              isTrue: makeTrue,
              explanation: item.explanation,
              points: 120
            };
          })
        };
        return {
          ...base,
          instructions: 'Modo Esteira Verdadeiro ou Falso: Julgue rapidamente se a associação apresentada é Verdadeira ou Falsa!',
          payload
        };
      }

      case 'open_the_box': {
        const payload: GameOpenTheBoxPayload = {
          boxes: canonical.slice(0, 9).map((item, idx) => ({
            id: `box-${idx + 1}`,
            number: idx + 1,
            label: `Cofre #${idx + 1}`,
            question: item.prompt,
            options: [item.correctAnswer, ...item.distractors.slice(0, 3)],
            correctOption: item.correctAnswer,
            points: 150 + idx * 25,
            bonusAureus: 15 + idx * 5
          }))
        };
        return {
          ...base,
          instructions: 'Modo Abra a Caixa: Toque em qualquer cofre misterioso para revelar o desafio e conquistar moedas Aureus!',
          payload
        };
      }

      case 'random_wheel': {
        const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6'];
        const payload: GameRandomWheelPayload = {
          slices: canonical.slice(0, 6).map((item, idx) => ({
            id: `slice-${idx}`,
            label: `Desafio #${idx + 1}`,
            color: colors[idx % colors.length],
            challengeQuestion: item.prompt,
            options: [item.correctAnswer, ...item.distractors.slice(0, 3)],
            correctOption: item.correctAnswer,
            points: 200
          }))
        };
        return {
          ...base,
          instructions: 'Modo Roleta Soberana: Gire a roda para sortear o desafio da rodada e ganhar bônus de velocidade!',
          payload
        };
      }

      default:
        return game;
    }
  }

  /**
   * 1. Classificação em Grupos: Máquinas Simples e Alavancas (Ciências 7º Ano)
   */
  public static createAlavancasGroupSortGame(): GameDefinition {
    return {
      id: 'WW-CIEN7-ALAVANCAS-01',
      title: 'Classificação de Alavancas & Máquinas Simples',
      templateType: 'group_sort',
      discipline: 'Ciências',
      grade: '7º Ano',
      bnccSkillCode: 'EF07CI01',
      instructions: 'Classifique cada ferramenta no tipo correto de alavanca conforme a posição do ponto de apoio (A), potência (P) e resistência (R).',
      timeLimitSeconds: 120,
      payload: {
        groups: [
          { id: 'interfixa', title: 'Alavanca Interfixa (Apoio no meio)', color: '#3B82F6' },
          { id: 'inter_resistente', title: 'Alavanca Inter-resistente (Resistência no meio)', color: '#10B981' },
          { id: 'interpotente', title: 'Alavanca Interpotente (Potência no meio)', color: '#F59E0B' }
        ],
        items: [
          { id: 'it-1', text: 'Tesoura escolar', correctGroupId: 'interfixa', explanation: 'O eixo (apoio) fica entre o cabo (potência) e a lâmina (resistência).' },
          { id: 'it-2', text: 'Gangorra de parque', correctGroupId: 'interfixa', explanation: 'O ponto de apoio central suporta as forças nas duas extremidades.' },
          { id: 'it-3', text: 'Alicate de corte', correctGroupId: 'interfixa', explanation: 'O fulcro central multiplica a força aplicada no cabo.' },
          { id: 'it-4', text: 'Carrinho de mão', correctGroupId: 'inter_resistente', explanation: 'A carga (resistência) fica entre a roda dianteira (apoio) e os braços (potência).' },
          { id: 'it-5', text: 'Quebra-nozes', correctGroupId: 'inter_resistente', explanation: 'A noz resistente é comprimida entre o ponto de apoio na ponta e os cabos.' },
          { id: 'it-6', text: 'Abridor de garrafas', correctGroupId: 'inter_resistente', explanation: 'A tampa resistente fica entre o apoio no centro e a mão puxando a haste.' },
          { id: 'it-7', text: 'Pinça de laboratório', correctGroupId: 'interpotente', explanation: 'Os dedos apertam no meio (potência), com o apoio na junção traseira.' },
          { id: 'it-8', text: 'Vara de pescar', correctGroupId: 'interpotente', explanation: 'A mão dianteira aplica a força potente para levantar o peixe na ponta.' }
        ]
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 2. Perseguição no Labirinto: Rios Voadores e Clima (Ciências 7º Ano)
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
            socraticHint: 'Pense em como as árvores retiram água do solo profundo e a liberam pelos estômatos.'
          },
          {
            question: 'Qual barreira geográfica natural impede que o vapor amazônico escape para o Oceano Pacífico, defletindo-o para o Centro-Oeste e Sudeste?',
            correctZone: 'Cordilheira dos Andes',
            distractorZones: ['Planalto Central', 'Mata dos Cocais', 'Serra do Mar'],
            socraticHint: 'É a imensa cadeia montanhosa a oeste da América do Sul.'
          },
          {
            question: 'Qual impacto ambiental direto o desmatamento massivo causa no regime de chuvas do Centro-Oeste brasileiro?',
            correctZone: 'Redução drástica do volume pluviométrico e secas prolongadas',
            distractorZones: ['Aumento das enchentes no inverno', 'Esfriamento generalizado dos rios', 'Neutralização do efeito estufa'],
            socraticHint: 'Menos árvores significam menor volume de água bombeada para a atmosfera.'
          }
        ]
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 3. Aviãozinho: Eletricidade & Consumo kWh (Ciências 8º Ano)
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
            points: 100
          },
          {
            prompt: 'Qual componente elétrico tem a função de abrir o circuito interrompendo a corrente em caso de sobrecarga perigosa?',
            correctCloudText: 'Disjuntor / Fusível',
            distractorClouds: ['Resistor ôhmico', 'Voltímetro em paralelo', 'Fio terra condutor'],
            points: 100
          },
          {
            prompt: 'Qual das seguintes matrizes elétricas é considerada renovável e não emite gases estufa na sua operação?',
            correctCloudText: 'Energia Solar Fotovoltaica',
            distractorClouds: ['Termelétrica a carvão mineral', 'Usina a óleo diesel', 'Gás natural fóssil'],
            points: 100
          }
        ]
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 4. Game Show de TV: Física dos Vestibulares & ENEM (3ª Série EM)
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
          { name: 'socratic_hint', available: true }
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
              { letter: 'D', text: '120 cm' }
            ],
            correctAnswer: 'C',
            points: 200,
            explanation: 'f = R/2 = +30 cm. 1/30 = 1/45 + 1/p\' => 1/p\' = 1/30 - 1/45 = 1/90 => p\' = 90 cm.'
          },
          {
            id: 'q2',
            text: 'Em uma bicicleta, a coroa dianteira tem raio 3 vezes maior que a catraca traseira conectada por corrente. Se a coroa gira a 2 Hz, qual é a frequência da catraca?',
            options: [
              { letter: 'A', text: '2 Hz' },
              { letter: 'B', text: '4 Hz' },
              { letter: 'C', text: '6 Hz' },
              { letter: 'D', text: '8 Hz' }
            ],
            correctAnswer: 'C',
            points: 200,
            explanation: 'fA * RA = fB * RB => 2 * (3 * RB) = fB * RB => fB = 6 Hz.'
          },
          {
            id: 'q3',
            text: 'Uma máquina térmica ideal de Carnot opera entre 300 K e 600 K. Qual é o seu rendimento térmico percentual máximo?',
            options: [
              { letter: 'A', text: '30%' },
              { letter: 'B', text: '50%' },
              { letter: 'C', text: '60%' },
              { letter: 'D', text: '100%' }
            ],
            correctAnswer: 'B',
            points: 200,
            explanation: 'η = 1 - (300 / 600) = 1 - 0,5 = 0,50 (50%).'
          },
          {
            id: 'q4',
            text: 'Quando uma ambulância com a sirene ligada se aproxima em alta velocidade de uma pessoa em repouso na calçada, o que ocorre com o som percebido?',
            options: [
              { letter: 'A', text: 'A frequência aparente aumenta, tornando o som mais agudo.' },
              { letter: 'B', text: 'A frequência aparente diminui, tornando o som mais grave.' },
              { letter: 'C', text: 'A velocidade da onda sonora dobra no ar.' },
              { letter: 'D', text: 'O som sofre difração total e torna-se inaudível.' }
            ],
            correctAnswer: 'A',
            points: 200,
            explanation: 'No Efeito Doppler de aproximação, o comprimento de onda se comprime e a frequência aparente se eleva (som mais agudo).'
          }
        ]
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 5. Encontre os Pares (Match Up): Leis da Física & Equações Fundamentais
   */
  public static createLeisFisicaMatchingGame(): GameDefinition {
    return {
      id: 'WW-EM-FIS-MATCHING-05',
      title: 'Encontre os Pares: Leis da Física & Equações',
      templateType: 'matching_pairs',
      discipline: 'Física & Matemática',
      grade: '1ª a 3ª Série EM',
      bnccSkillCode: 'EM13CNT101',
      instructions: 'Clique em uma Lei/Conceito na coluna da esquerda e conecte-a à sua Equação/Definição correspondente na direita!',
      timeLimitSeconds: 120,
      payload: {
        pairs: [
          { id: 'p1', leftTerm: 'Segunda Lei de Newton (Dinâmica)', rightDefinition: 'F_res = m · a (Força resultante é massa vezes aceleração)', points: 150 },
          { id: 'p2', leftTerm: 'Primeira Lei de Ohm (Eletrodinâmica)', rightDefinition: 'U = R · i (Tensão elétrica proporcional à corrente)', points: 150 },
          { id: 'p3', leftTerm: 'Equação de Clapeyron (Gases Ideais)', rightDefinition: 'P · V = n · R · T (Estado termodinâmico de um gás)', points: 150 },
          { id: 'p4', leftTerm: 'Equação Fundamental da Ondulatória', rightDefinition: 'v = λ · f (Velocidade é comprimento de onda vezes frequência)', points: 150 },
          { id: 'p5', leftTerm: 'Conservação da Energia Mecânica', rightDefinition: 'E_cinética + E_potencial = Constante (sem atrito)', points: 150 }
        ]
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 6. Abra a Caixa Misteriosa (Open the Box): Cofres da BNCC & Olimpíadas
   */
  public static createOlimpiadasOpenTheBoxGame(): GameDefinition {
    return {
      id: 'WW-OLIMP-OPENBOX-06',
      title: 'Abra a Caixa: Cofres Olímpicos OBMEP & OBA',
      templateType: 'open_the_box',
      discipline: 'Matemática & Astronomia',
      grade: 'Ensino Fundamental II & EM',
      bnccSkillCode: 'EM13MAT301',
      instructions: 'Toque em qualquer Cofre Numerado para abrir a pergunta secreta e ganhar XP + Moedas Aureus!',
      timeLimitSeconds: 180,
      payload: {
        boxes: [
          {
            id: 'b1',
            number: 1,
            label: 'Cofre de Kepler',
            question: 'Segundo a 1ª Lei de Kepler, qual é o formato geométrico da órbita dos planetas ao redor do Sol?',
            options: ['Elíptica, com o Sol em um dos focos', 'Circular perfeita com o Sol no centro', 'Parabólica aberta', 'Espiral logarítmica'],
            correctOption: 'Elíptica, com o Sol em um dos focos',
            points: 150,
            bonusAureus: 20
          },
          {
            id: 'b2',
            number: 2,
            label: 'Cofre de Gauss',
            question: 'Qual é a soma de todos os números inteiros de 1 até 100 (Progressão Aritmética)?',
            options: ['5.050', '5.000', '10.100', '4.950'],
            correctOption: '5.050',
            points: 200,
            bonusAureus: 30
          },
          {
            id: 'b3',
            number: 3,
            label: 'Cofre de Lavoisier',
            question: 'Em um sistema químico fechado, a soma das massas dos reagentes é igual à soma das massas dos produtos. Essa é a Lei de:',
            options: ['Conservação das Massas (Lavoisier)', 'Proporções Definidas (Proust)', 'Avogadro', 'Dalton'],
            correctOption: 'Conservação das Massas (Lavoisier)',
            points: 150,
            bonusAureus: 20
          },
          {
            id: 'b4',
            number: 4,
            label: 'Cofre de Pitágoras',
            question: 'Um triângulo retângulo possui catetos medindo 6 cm e 8 cm. Qual é o comprimento da sua hipotenusa?',
            options: ['10 cm', '12 cm', '14 cm', '9 cm'],
            correctOption: '10 cm',
            points: 175,
            bonusAureus: 25
          },
          {
            id: 'b5',
            number: 5,
            label: 'Cofre de Turing',
            question: 'Quantos valores distintos podem ser representados por 1 byte (8 bits) em sistema binário?',
            options: ['256 valores (de 0 a 255)', '128 valores', '64 valores', '512 valores'],
            correctOption: '256 valores (de 0 a 255)',
            points: 200,
            bonusAureus: 35
          },
          {
            id: 'b6',
            number: 6,
            label: 'Cofre de Marie Curie',
            question: 'O número atômico (Z) de um elemento químico na Tabela Periódica corresponde exatamente ao número de:',
            options: ['Prótons no núcleo do átomo', 'Nêutrons isolados', 'Elétrons na camada de valência', 'Moléculas por mol'],
            correctOption: 'Prótons no núcleo do átomo',
            points: 175,
            bonusAureus: 25
          }
        ]
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 7. Roleta Soberana (Random Wheel): Desafio Relâmpago Multidisciplinar
   */
  public static createRoletaSoberanaGame(): GameDefinition {
    return {
      id: 'WW-MULTI-WHEEL-07',
      title: 'Roleta Soberana: Giro Relâmpago BNCC',
      templateType: 'random_wheel',
      discipline: 'Multidisciplinar',
      grade: 'Ensino Fundamental & Médio',
      bnccSkillCode: 'EM13MAT401',
      instructions: 'Gire a Roleta Soberana para sortear o tema científico da rodada e responda para acumular Aureus!',
      timeLimitSeconds: 180,
      payload: {
        slices: [
          {
            id: 'sl-1',
            label: '⚡ Eletromagnetismo',
            color: '#06B6D4',
            challengeQuestion: 'Quem descobriu que a variação de um campo magnético através de uma espira induz corrente elétrica?',
            options: ['Michael Faraday', 'Isaac Newton', 'Galileu Galilei', 'Robert Hooke'],
            correctOption: 'Michael Faraday',
            points: 200
          },
          {
            id: 'sl-2',
            label: '🧬 Genética & DNA',
            color: '#10B981',
            challengeQuestion: 'No DNA, a base nitrogenada Adenina (A) pareia sempre por ligações de hidrogênio com a:',
            options: ['Timina (T)', 'Citosina (C)', 'Guanina (G)', 'Uracila (U)'],
            correctOption: 'Timina (T)',
            points: 200
          },
          {
            id: 'sl-3',
            label: '📐 Função Exponencial',
            color: '#6366F1',
            challengeQuestion: 'Se uma colônia bacteriana dobra a cada hora e começa com 100 bactérias, quantas haverá após 4 horas?',
            options: ['1.600 bactérias', '400 bactérias', '800 bactérias', '3.200 bactérias'],
            correctOption: '1.600 bactérias',
            points: 200
          },
          {
            id: 'sl-4',
            label: '📜 Literatura Brasileira',
            color: '#F59E0B',
            challengeQuestion: 'Qual escritora maranhense publicou em 1859 "Úrsula", considerado o primeiro romance abolicionista da literatura brasileira?',
            options: ['Maria Firmina dos Reis', 'Clarice Lispector', 'Rachel de Queiroz', 'Cecília Meireles'],
            correctOption: 'Maria Firmina dos Reis',
            points: 200
          }
        ]
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Preset 8: Simulado Calibrado TRI 3PL (EM13MAT301, EM13MAT302, EF09CI03)
   * Sintetizado a partir da auditoria psicométrica do Enxame Multi-IA.
   */
  public static createSimuladoTriBncc2026Game(): GameDefinition {
    return {
      id: 'WW-TRI-3PL-BNCC-08',
      title: 'Desafio TRI 3PL: Funções & Modelos Atômicos (BNCC 2026)',
      templateType: 'gameshow_quiz',
      discipline: 'Matemática & Ciências da Natureza',
      grade: '9º Ano EF & Ensino Médio',
      bnccSkillCode: 'EM13MAT301 / EM13MAT302 / EF09CI03',
      instructions: 'Questões inéditas calibradas pela TRI 3PL (a, b, c) com diagnóstico cognitivo de distratores e Dica Socrática Albus!',
      timeLimitSeconds: 240,
      payload: {
        lifelines: [
          { name: '50:50', available: true },
          { name: 'extra_time', available: true },
          { name: 'socratic_hint', available: true }
        ],
        roundTimeSeconds: 60,
        bonusRoundsCount: 1,
        questions: [
          {
            id: 'ITEM-BNCC-2026-001',
            text: '[EM13MAT301 | b = -0.35] Cooperativa escolar tem custo fixo mensal de R$ 1.200,00 e recebe R$ 15,00 líquidos por lote reciclado. Para atingir saldo líquido positivo de R$ 1.800,00, quantos lotes são necessários?',
            options: [
              { letter: 'A', text: '80 lotes (ponto de equilíbrio)' },
              { letter: 'B', text: '120 lotes (sem cobrir custo fixo)' },
              { letter: 'C', text: '200 lotes (15x - 1200 = 1800)' },
              { letter: 'D', text: '40 lotes (subtração indevida)' }
            ],
            correctAnswer: 'C',
            points: 250,
            explanation: 'Dica Socrática Albus: Para sobrar R$ 1.800,00 líquidos, a receita 15x precisa pagar os R$ 1.200,00 de custo fixo E mais os R$ 1.800,00 de meta (total R$ 3.000,00).'
          },
          {
            id: 'ITEM-BNCC-2026-002',
            text: '[EM13MAT301 | b = +0.65] Plano Alfa cobra R$ 250,00 fixos + R$ 2,00/GB excedente; Plano Beta cobra R$ 400,00 fixos + R$ 0,50/GB excedente. A partir de qual consumo inteiro o Plano Beta fica estritamente mais barato?',
            options: [
              { letter: 'A', text: '100 GB (ponto de empate exato)' },
              { letter: 'B', text: '101 GB (primeiro inteiro com vantagem estrita)' },
              { letter: 'C', text: '60 GB (soma das taxas variáveis)' },
              { letter: 'D', text: '150 GB (diferença bruta das assinaturas)' }
            ],
            correctAnswer: 'B',
            points: 300,
            explanation: 'Dica Socrática Albus: Em 100 GB ambos custam exatamente R$ 450,00. Qual é o próximo número inteiro em que o Beta passa a custar menos?'
          },
          {
            id: 'ITEM-BNCC-2026-003',
            text: '[EM13MAT302 | b = +0.40] Uma colônia de micro-organismos dobra a cada 3 horas segundo P(t) = 500 · 2^(t/3). Qual será a população exata após 12 horas?',
            options: [
              { letter: 'A', text: '2.000 micro-organismos' },
              { letter: 'B', text: '4.000 micro-organismos' },
              { letter: 'C', text: '8.000 micro-organismos' },
              { letter: 'D', text: '6.000 micro-organismos' }
            ],
            correctAnswer: 'C',
            points: 250,
            explanation: 'Dica Socrática Albus: Em 12 horas ocorrem quantos ciclos de 3 horas? Eleve o número 2 a essa quantidade de ciclos e multiplique por 500.'
          },
          {
            id: 'ITEM-BNCC-2026-004',
            text: '[EM13MAT302 | b = +1.15] Uma impressora 3D escolar deprecia segundo V(t) = 16.000 · (0,75)^t. Qual é a PERDA ACUMULADA em reais ao final de 2 anos?',
            options: [
              { letter: 'A', text: 'R$ 7.000,00 (perda acumulada em 2 anos)' },
              { letter: 'B', text: 'R$ 9.000,00 (valor residual ao fim de 2 anos)' },
              { letter: 'C', text: 'R$ 8.000,00 (desconto linear de 50%)' },
              { letter: 'D', text: 'R$ 4.000,00 (perda apenas do 1º ano)' }
            ],
            correctAnswer: 'A',
            points: 350,
            explanation: 'Dica Socrática Albus: Cuidado! V(2) = 16.000 × (9/16) = R$ 9.000,00 é quanto ela ainda VALE. Quanto ela PERDEU em relação aos R$ 16.000,00 iniciais?'
          },
          {
            id: 'ITEM-BNCC-2026-005',
            text: '[EF09CI03 | b = +0.25] O espalhamento de partículas alfa na lâmina de ouro e a emissão de luz amarela específica pelo sódio nos fogos de artifício são explicados, respectivamente, pelos modelos de:',
            options: [
              { letter: 'A', text: 'Dalton e Thomson' },
              { letter: 'B', text: 'Thomson e Rutherford' },
              { letter: 'C', text: 'Rutherford e Bohr' },
              { letter: 'D', text: 'Bohr e Dalton' }
            ],
            correctAnswer: 'C',
            points: 250,
            explanation: 'Dica Socrática Albus: Quem descobriu o núcleo pequeno e denso com grande vazio ao redor (1º fenômeno) e quem propôs os saltos quânticos de energia luminosa (2º fenômeno)?'
          }
        ]
      },
      createdAt: new Date().toISOString()
    };
  }
}
