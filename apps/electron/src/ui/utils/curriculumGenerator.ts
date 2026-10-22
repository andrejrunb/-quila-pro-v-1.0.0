// =====================================================================
// ÁQUILA PRO — GERADOR PEDAGÓGICO SOBERANO
// Motor Inteligente de Criação Curricular BNCC, Planos, Slides & PEI
// 100% Nativo Áquila — Livre de dependências e marcas de terceiros
// =====================================================================

export interface GeneratedLessonPlan {
  bnccCode: string;
  bnccDescription: string;
  bloomVerbs: string;
  hookQuestion: string;
  stages: Array<{ time: string; title: string; desc: string }>;
  assessmentCriteria: string[];
}

export interface GeneratedSlide {
  num: number;
  title: string;
  body: string;
  notes: string;
}

export interface GeneratedPei {
  tdah: string[];
  tea: string[];
  dislexia: string[];
  altasHabilidades: string[];
}

export interface GeneratedQuestion {
  id: string;
  exam: string;
  triDifficulty: number;
  statement: string;
  alternatives: { A: string; B: string; C: string; D: string; E: string };
  correct: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
}

export interface GeneratedCreativeStudy {
  headline: string;
  analogy: string;
  realWorldConnection: string;
  microChallenge: string;
}

export function generatePedagogicalContent(
  topic: string,
  subject: string,
  grade: string
): {
  lessonPlan: GeneratedLessonPlan;
  slides: GeneratedSlide[];
  pei: GeneratedPei;
  questions: GeneratedQuestion[];
  creative: GeneratedCreativeStudy;
} {
  const cleanTopic = (topic || 'Conceitos Fundamentais').trim();
  const lower = cleanTopic.toLowerCase();

  // Mapeamento dinâmico de códigos BNCC baseado em palavras-chave
  let bnccCode = 'EM13CNT101';
  let bnccDesc = 'Analisar e representar as transformações e conservações em sistemas naturais e tecnológicos.';
  let defaultHook = `Por que entender "${cleanTopic}" é essencial para os desafios tecnológicos e ambientais de hoje?`;

  if (lower.includes('calor') || lower.includes('termo') || lower.includes('temperatura')) {
    bnccCode = 'EM13CNT102';
    bnccDesc = 'Explicar circuitos e trocas de calor, calor específico, calor latente e rendimento de sistemas térmicos.';
    defaultHook = 'Se o tampo de metal e a madeira da sua carteira estão na mesma temperatura da sala, por que o metal parece muito mais frio ao toque?';
  } else if (lower.includes('onda') || lower.includes('luz') || lower.includes('som') || lower.includes('optica')) {
    bnccCode = 'EM13CNT103';
    bnccDesc = 'Utilizar o conhecimento sobre radiação eletromagnética e ondulatória para avaliar tecnologias de comunicação e diagnósticos.';
    defaultHook = 'Como o seu celular consegue carregar um vídeo em alta definição pelo ar sem nenhum cabo conectado?';
  } else if (lower.includes('eletro') || lower.includes('circuito') || lower.includes('corrente')) {
    bnccCode = 'EM13CNT106';
    bnccDesc = 'Avaliar o consumo de energia elétrica, dimensionamento de fiações e a eficiência de dispositivos residenciais e industriais.';
    defaultHook = 'Por que a conta de luz sobe drasticamente no inverno se usamos o chuveiro elétrico na mesma vazão?';
  } else if (lower.includes('genetica') || lower.includes('dna') || lower.includes('hered')) {
    bnccCode = 'EM13CNT202';
    bnccDesc = 'Analisar a transmissão de características hereditárias, mutações e biotecnologia na saúde e agricultura.';
    defaultHook = 'Se você herda 50% do DNA da mãe e 50% do pai, por que irmãos biológicos nunca são idênticos (exceto gêmeos univitelinos)?';
  } else if (lower.includes('quimic') || lower.includes('reacao') || lower.includes('estequio') || lower.includes('massa')) {
    bnccCode = 'EM13CNT104';
    bnccDesc = 'Avaliar os impactos e rendimentos de transformações químicas nos ciclos biogeoquímicos e na indústria.';
    defaultHook = 'Se queimarmos 1 kg de lenha e as cinzas pesarem apenas 50 gramas, onde foram parar os outros 950 gramas da matéria?';
  } else if (lower.includes('funcao') || lower.includes('grafico') || lower.includes('geometria') || lower.includes('triangulo')) {
    bnccCode = 'EM13MAT301';
    bnccDesc = 'Resolver e elaborar problemas com funções algébricas, trigonometria e modelagem matemática de fenômenos reais.';
    defaultHook = 'Como os algoritmos de navegação por satélite calculam o menor trajeto em milissegundos usando geometria analítica?';
  } else if (lower.includes('historia') || lower.includes('revolucao') || lower.includes('guerra') || lower.includes('brasil')) {
    bnccCode = 'EM13CHS102';
    bnccDesc = 'Identificar, analisar e comparar diferentes fontes e narrativas históricas sobre a formação da sociedade contemporânea.';
    defaultHook = 'De que maneira as decisões tomadas nesse período histórico ainda determinam os direitos e desigualdades do Brasil atual?';
  } else if (lower.includes('literatura') || lower.includes('texto') || lower.includes('redacao') || lower.includes('argument')) {
    bnccCode = 'EM13LP05';
    bnccDesc = 'Analisar criticamente produções textuais, recursos estilísticos, figuras de linguagem e projetos de texto argumentativo.';
    defaultHook = 'Como os grandes autores utilizam a ironia e a ambiguidade para dizer verdades incômodas sem serem censurados?';
  }

  // 1. Plano de Aula BNCC
  const lessonPlan: GeneratedLessonPlan = {
    bnccCode,
    bnccDescription: bnccDesc,
    bloomVerbs: 'Compreender os fundamentos conceituais, Analisar relações causais e Avaliar aplicações práticas no padrão ENEM.',
    hookQuestion: defaultHook,
    stages: [
      {
        time: '00–10 min',
        title: 'Quebra-Gelo Provocador & Conexão Inicial',
        desc: `Apresentação da questão disparadora: "${defaultHook}". Coleta de palpites dos alunos no quadro sem julgamento prévio.`
      },
      {
        time: '10–30 min',
        title: 'Mediação Conceitual & Formalização',
        desc: `Exposição estruturada de "${cleanTopic}", dedução das relações fundamentais e análise de representações gráficas/esquemas.`
      },
      {
        time: '30–45 min',
        title: 'Prática Ativa em Duplas & Resolução de Casos',
        desc: 'Aplicação imediata em 2 exercícios modelo de vestibulares recentes (ENEM/UFG/UnB) com foco na interpretação de distratores.'
      },
      {
        time: '45–50 min',
        title: 'Exit Ticket (Ticket de Saída) & Checagem de Retenção',
        desc: 'Resposta rápida individual de 2 minutos para verificar a consolidação do objetivo da aula antes do encerramento.'
      }
    ],
    assessmentCriteria: [
      `Capacidade de explicar "${cleanTopic}" utilizando vocabulário científico apropriado.`,
      'Interpretação correta de dados quantitativos e gráficos associados ao tema.',
      'Identificação de erros conceituais comuns e armadilhas de enunciados.'
    ]
  };

  // 2. Apresentação de 8 Slides
  const slides: GeneratedSlide[] = [
    {
      num: 1,
      title: `${cleanTopic}: Desafio Inicial`,
      body: `Como o estudo de ${cleanTopic} transforma nossa compreensão do mundo físico e tecnológico?\n\nPergunta Norteadora: ${defaultHook}`,
      notes: 'Iniciar a aula instigando a curiosidade. Ouvir 2 ou 3 hipóteses dos alunos antes de avançar.'
    },
    {
      num: 2,
      title: `Fundamentos Essenciais de ${cleanTopic}`,
      body: `• Definição rigorosa e contexto histórico da descoberta.\n• Grandezas, unidades de medida e condições de contorno.\n• O que permanece constante e o que varia no fenômeno.`,
      notes: 'Garantir que todos os estudantes anotem as definições centrais no caderno.'
    },
    {
      num: 3,
      title: 'Princípios e Relações Matemáticas',
      body: `• Relação de causa e efeito expressa formalmente.\n• Proporcionalidade direta e inversa entre as grandezas.\n• Análise dimensional no Sistema Internacional (SI).`,
      notes: 'Demonstrar no quadro o passo a passo algébrico sem pular etapas.'
    },
    {
      num: 4,
      title: 'Aplicações no Cotidiano & na Indústria',
      body: `• Onde encontramos ${cleanTopic} na tecnologia moderna?\n• Impacto econômico, ambiental e sustentabilidade.\n• Exemplos práticos presentes na rotina dos estudantes.`,
      notes: 'Conectar com temas contemporâneos e notícias recentes.'
    },
    {
      num: 5,
      title: 'Estudo de Caso Resolvido (Padrão ENEM)',
      body: `Análise passo a passo de uma questão clássica das bancas:\n1. Identificação do comando e dos dados fornecidos.\n2. Escolha da estratégia analítica sem rodeios.\n3. Cancelamento de distratores absurdos.`,
      notes: 'Mostrar como os alunos perdem tempo por falta de estratégia de leitura.'
    },
    {
      num: 6,
      title: 'Armadilhas Clássicas & Distratores',
      body: `⚠️ Erros frequentes cometidos pelos candidatos:\n• Esquecer de converter as unidades para a mesma base.\n• Confundir grandezas proporcionais com inversas.\n• Ignorar o contexto do enunciado em questões multidisciplinares.`,
      notes: 'Pedir que um aluno aponte onde estaria a pegadinha na questão anterior.'
    },
    {
      num: 7,
      title: 'Desafio Relâmpago para a Sala',
      body: `Vocês têm 3 minutos em duplas para resolver:\n\n"Se dobrarmos a variável principal em ${cleanTopic}, qual será o impacto percentual no resultado final?"`,
      notes: 'Circular pelas carteiras verificando o raciocínio das duplas.'
    },
    {
      num: 8,
      title: 'Síntese & Próxima Etapa',
      body: `✅ O que aprendemos hoje: Conceito-chave, equações e aplicações de ${cleanTopic}.\n\n📅 Próxima Aula: Aprofundamento e conexão interdisciplinar na Câmara de Maestria Áquila!`,
      notes: 'Coletar os ingressos de saída (Exit Tickets) na porta da sala.'
    }
  ];

  // 3. Adaptações Inclusivas PEI
  const pei: GeneratedPei = {
    tdah: [
      `Fragmentação de Enunciados (Chunking): Apresentar problemas de "${cleanTopic}" divididos em 3 etapas com caixas de checagem [ ].`,
      'Destaque Semântico Visual: Termos-chave e comandos (CALCULE, EXCETO, RELACIONE) em negrito e com marcadores coloridos.',
      'Acomodação no Mapa de Sala: Posicionamento nas carteiras frontais com visão direta da lousa e tempo estendido (+25%) em avaliações.'
    ],
    tea: [
      'Previsibilidade e Rotina: Antecipar na lousa o roteiro das 4 etapas da aula logo nos primeiros 2 minutos.',
      'Linguagem Literal: Evitar metáforas ambíguas ao explicar o conceito; utilizar esquemas visuais diretos e tabelas comparativas.',
      'Suporte Pré-Formatado: Fornecer folha estruturada com os campos de entrada, desenvolvimento e resposta final pré-delimitados.'
    ],
    dislexia: [
      'Espaçamento e Tipografia Acessível: Uso de fontes sem serifa, espaçamento 1.5x e alinhamento à esquerda (sem justificação forçada).',
      'Glossário Conceitual Lateral: Quadro de apoio contendo símbolos, grandezas e fórmulas essenciais de fácil consulta.',
      'Possibilidade de Avaliação Oral / Digital: Permitir que o estudante dite suas justificativas analíticas.'
    ],
    altasHabilidades: [
      `Enriquecimento Curricular Olímpico: Modelagem avançada de "${cleanTopic}" com casos de contorno não-lineares (Padrão OBF / OBM / ITA).`,
      'Papel de Monitoria Ativa: Incentivar o aluno a atuar como mediador socrático em desafios colaborativos de duplas.',
      'Projeto Investigativo Autoral: Proposta de artigo curto ou experimento prático demonstrando o fenômeno para a feira científica.'
    ]
  };

  // 4. Questões Vestibular / ENEM com TRI
  const questions: GeneratedQuestion[] = [
    {
      id: `q1_${Date.now()}`,
      exam: 'ENEM (Matriz Oficial)',
      triDifficulty: 715,
      statement: `(ENEM) Em uma aplicação prática relacionada a ${cleanTopic}, um grupo de pesquisadores analisa o comportamento quantitativo do sistema sob condições controladas. Sabendo que o modelo teórico prevê conservação e equilíbrio estrito, a alternativa que expressa corretamente a relação observada é:`,
      alternatives: {
        A: 'O valor dobra proporcionalmente sem dissipação residual de energia.',
        B: 'A grandeza diminui linearmente à medida que a resistência do meio aumenta.',
        C: 'O parâmetro de saída atinge o estado estacionário previsto pelo balanço fundamental.',
        D: 'Ocorre variação exponencial descontrolada em virtude da ausência de atrito.',
        E: 'O sistema anula completamente suas trocas térmicas com as vizinhanças imediatas.'
      },
      correct: 'C',
      explanation: `A alternativa C é a correta. Em conformidade com os princípios teóricos de ${cleanTopic}, o sistema atinge o estado estacionário de equilíbrio quando as taxas de transferência se igualam. As alternativas A e D são distratores de extrapolação irreal, enquanto B e E desconsideram as condições nominais do enunciado.`
    },
    {
      id: `q2_${Date.now()}`,
      exam: 'UFG / UniRV (Vestibular Tradicional)',
      triDifficulty: 760,
      statement: `(Vestibular Medicina) Considerando as implicações diretas de ${cleanTopic} nos processos industriais e biológicos, assinale a proposição correta:`,
      alternatives: {
        A: 'A eficiência teórica máxima independe das condições de contorno e do gradiente térmico.',
        B: 'A taxa de transformação é diretamente modulada pela conservação estequiométrica e energética.',
        C: 'Todas as transformações reais são reversíveis e isentas de perdas por irreversibilidade.',
        D: 'A entropia total de um sistema isolado reduz-se espontaneamente durante o processo.',
        E: 'A velocidade da reação duplica quando o volume do reator é reduzido à quarta potência.'
      },
      correct: 'B',
      explanation: `A alternativa B expressa o princípio basilar da ciência moderna. A alternativa A erra ao afirmar independência; C contraria a 2ª Lei da Termodinâmica; D viola o princípio de aumento de entropia do universo.`
    }
  ];

  // 5. Estudo Criativo / Engajamento
  const creative: GeneratedCreativeStudy = {
    headline: `A Revolução de ${cleanTopic} em 3 Minutos`,
    analogy: `Imagine que ${cleanTopic} funciona como o tráfego em uma rodovia inteligente: para que tudo flua sem engarrafamentos, as trocas devem seguir regras matemáticas universais!`,
    realWorldConnection: `Sem o domínio de ${cleanTopic}, invenções como smartphones, vacinas de RNA e carros elétricos simplesmente não existiriam.`,
    microChallenge: `Desafio da Semana: Encontre um exemplo de ${cleanTopic} dentro da sua própria casa e tire uma foto explicando o fenômeno para o mural da turma!`
  };

  return {
    lessonPlan,
    slides,
    pei,
    questions,
    creative
  };
}
