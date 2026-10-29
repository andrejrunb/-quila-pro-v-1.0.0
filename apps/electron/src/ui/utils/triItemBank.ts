/**
 * Áquila Pro — Banco de Itens TRI & Calibração OMR Soberano
 * 
 * Implementação da Teoria de Resposta ao Item (TRI - Modelo Logístico 3 Parâmetros)
 * e catálogo de questões estruturadas de acordo com as matrizes da BNCC e do ENEM.
 */

export interface TriQuestion {
  id: string;
  stage?: 'EF_ANOS_INICIAIS' | 'EF_ANOS_FINAIS' | 'ENSINO_MEDIO' | 'VESTIBULAR_MEDICINA';
  area: 'matematica' | 'natureza' | 'linguagens' | 'humanas';
  discipline: string;
  skillCode: string;
  skillDescription: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  paramA: number; // Discriminação do item (0.8 a 2.5)
  paramB: number; // Dificuldade na escala de proficiência (-2.5 a +2.5)
  paramC: number; // Probabilidade de acerto ao acaso / chute (~0.20)
  text: string;
  options: { letter: 'A' | 'B' | 'C' | 'D' | 'E'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  socraticExplanation: string;
  rubricCriteria?: { criterion: string; weight: number; keyGuideline: string }[];
}

export interface TriScoreResult {
  rawScore: number;
  totalQuestions: number;
  accuracyPct: number;
  theta: number; // Proficiência estimada na escala (-3.0 a +3.0)
  enemScaleScore: number; // Escala ENEM padrão (ex: 685 pts)
  schoolGrade: number; // Nota escolar convertida (0.0 a 10.0)
  consistencyScore: number; // Coerência pedagógica (0 a 100%)
  diagnostic: string;
}

export const TRI_ITEM_BANK: TriQuestion[] = [
  // ==========================================
  // FUNDAMENTAL I (ANOS INICIAIS — MATIFIC / EDUCADOR)
  // ==========================================
  {
    id: 'TRI-FUND1-MAT-01',
    stage: 'EF_ANOS_INICIAIS',
    area: 'matematica',
    discipline: 'Matemática',
    skillCode: 'EF03MA06',
    skillDescription: 'Resolver problemas de adição e agrupamento com números naturais em contexto lúdico.',
    difficulty: 'facil',
    paramA: 1.05,
    paramB: -2.10,
    paramC: 0.15,
    text: 'Em uma horta escolar, a turma do 3º ano colheu 4 caixas com 10 cenouras cada uma e mais 7 cenouras soltas. Quantas cenouras foram colhidas ao todo pelos estudantes?',
    options: [
      { letter: 'A', text: '37 cenouras' },
      { letter: 'B', text: '40 cenouras' },
      { letter: 'C', text: '47 cenouras' },
      { letter: 'D', text: '54 cenouras' },
      { letter: 'E', text: '74 cenouras' }
    ],
    correctAnswer: 'C',
    socraticExplanation: 'Multiplique as 4 caixas por 10 (4 x 10 = 40) e some com as 7 cenouras soltas (40 + 7 = 47).'
  },
  {
    id: 'TRI-FUND1-LP-01',
    stage: 'EF_ANOS_INICIAIS',
    area: 'linguagens',
    discipline: 'Língua Portuguesa',
    skillCode: 'EF05LP01',
    skillDescription: 'Localizar informações explícitas e inferir sentidos em textos narrativos e fábulas.',
    difficulty: 'facil',
    paramA: 1.10,
    paramB: -1.90,
    paramC: 0.15,
    text: 'Leia o trecho da fábula: "A cigarra passou o verão cantando, enquanto a formiga juntava grãos no formigueiro para se proteger do inverno rigoroso." Segundo o texto, qual era o objetivo da formiga ao juntar grãos?',
    options: [
      { letter: 'A', text: 'Aprender novas canções com a cigarra' },
      { letter: 'B', text: 'Proteger-se e ter alimento no inverno' },
      { letter: 'C', text: 'Vender as sementes na feira da floresta' },
      { letter: 'D', text: 'Apenas brincar com os outros insetos' },
      { letter: 'E', text: 'Construir uma casa nova para o verão' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'O texto afirma explicitamente que a formiga juntava grãos "para se proteger do inverno rigoroso".'
  },

  // ==========================================
  // FUNDAMENTAL II (ANOS FINAIS — INVESTIGAÇÃO & SIMULAÇÕES)
  // ==========================================
  {
    id: 'TRI-FUND2-MAT-01',
    stage: 'EF_ANOS_FINAIS',
    area: 'matematica',
    discipline: 'Matemática',
    skillCode: 'EF09MA06',
    skillDescription: 'Reconhecer funções afins e relações de proporcionalidade direta.',
    difficulty: 'medio',
    paramA: 1.30,
    paramB: -0.40,
    paramC: 0.20,
    text: 'Um robô educacional move-se em linha reta com velocidade constante de 1,5 metros por segundo. Qual equação representa a distância percorrida d (em metros) em função do tempo t (em segundos)?',
    options: [
      { letter: 'A', text: 'd = 1,5 + t' },
      { letter: 'B', text: 'd = 1,5t' },
      { letter: 'C', text: 'd = t / 1,5' },
      { letter: 'D', text: 'd = 1,5t²' },
      { letter: 'E', text: 'd = 3t - 1,5' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'Com velocidade constante de 1,5 m/s, a cada segundo percorrido a distância aumenta em 1,5 m: d = v · t = 1,5t.'
  },
  // --- Ciências 7º Ano (Básica SPE / Positivo On - Volumes 1 a 4) ---
  {
    id: 'TRI-FUND2-CIEN-01',
    stage: 'EF_ANOS_FINAIS',
    area: 'natureza',
    discipline: 'Ciências',
    skillCode: 'EF07CI12',
    skillDescription: 'Demonstrar que o ar é uma mistura de gases, compreender o efeito estufa natural e a umidade transportada pelos rios voadores (Vol. 1).',
    difficulty: 'facil',
    paramA: 1.15,
    paramB: -0.80,
    paramC: 0.20,
    text: 'Os "rios voadores" são massas de ar carregadas de vapor de água que se deslocam da Bacia Amazônica até as regiões Centro-Oeste, Sudeste e Sul do Brasil, provocando chuvas fundamentais para o clima e a agricultura. Esse fenômeno depende diretamente de qual processo biológico realizado pelas grandes florestas tropicais?',
    options: [
      { letter: 'A', text: 'Respiração anaeróbica dos microorganismos do solo.' },
      { letter: 'B', text: 'Evapotranspiração pelas copas das árvores florestais.' },
      { letter: 'C', text: 'Fotossíntese que libera oxigênio gasoso na troposfera.' },
      { letter: 'D', text: 'Fixação biológica de nitrogênio por bactérias radiculares.' },
      { letter: 'E', text: 'Combustão espontânea de biomassa na estação seca.' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'As árvores da Amazônia bombeiam água do solo para a atmosfera através da transpiração foliar; somada à evaporação dos corpos hídricos, forma-se a evapotranspiração que abastece os rios voadores.'
  },
  {
    id: 'TRI-FUND2-CIEN-02',
    stage: 'EF_ANOS_FINAIS',
    area: 'natureza',
    discipline: 'Ciências',
    skillCode: 'EF07CI07',
    skillDescription: 'Caracterizar os ecossistemas e biomas brasileiros (Cerrado, Caatinga, Amazônia) e as adaptações da vegetação (Vol. 2).',
    difficulty: 'medio',
    paramA: 1.25,
    paramB: -0.30,
    paramC: 0.20,
    text: 'Ao percorrer uma trilha no Cerrado brasileiro durante a estação seca, um grupo de estudantes do 7º ano observou árvores com troncos tortuosos, cascas espessas e corticosas, além de raízes extremamente profundas. Essas adaptações morfológicas das plantas do Cerrado têm como principais funções:',
    options: [
      { letter: 'A', text: 'Reter excesso de água no topo da copa e evitar o congelamento foliar noturno.' },
      { letter: 'B', text: 'Proteção contra a passagem rápida do fogo periódico e acesso a lençóis freáticos profundos.' },
      { letter: 'C', text: 'Absorção de radiação ultravioleta prejudicial e aumento da taxa de fecundação por vento.' },
      { letter: 'D', text: 'Impedir a fixação de epífitas e facilitar a queda precoce de sementes carnosas.' },
      { letter: 'E', text: 'Facilitar a dispersão de pólen exclusivamente por aves migratórias de grande porte.' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'A casca grossa (cortiça) atua como isolante térmico contra queimadas naturais sazonais, enquanto raízes axiais profundas alcançam a água acumulada no lençol freático durante a seca.'
  },
  {
    id: 'TRI-FUND2-CIEN-03',
    stage: 'EF_ANOS_FINAIS',
    area: 'natureza',
    discipline: 'Ciências',
    skillCode: 'EF07CI10',
    skillDescription: 'Argumentar sobre a importância da vacinação para a saúde pública e a memória imunológica (Vol. 3).',
    difficulty: 'facil',
    paramA: 1.20,
    paramB: -0.70,
    paramC: 0.20,
    text: 'As campanhas de vacinação escolar são estratégias prioritárias de saúde pública para prevenir doenças como poliomielite, sarampo e HPV. Quando uma criança recebe uma vacina, o princípio ativo presente no imunizante atua no organismo:',
    options: [
      { letter: 'A', text: 'Injetando antibióticos potentes capazes de destruir vírus no fluxo sanguíneo.' },
      { letter: 'B', text: 'Substituindo imediatamente as hemácias para aumentar o transporte de oxigênio.' },
      { letter: 'C', text: 'Apresentando antígenos atenuados ou inativados para estimular a produção de anticorpos e células de memória.' },
      { letter: 'D', text: 'Destruindo a flora bacteriana intestinal para eliminar competidores do sistema digestório.' },
      { letter: 'E', text: 'Alterando o código genético nuclear das células epiteliais contra agentes estranhos.' }
    ],
    correctAnswer: 'C',
    socraticExplanation: 'A vacina estimula o sistema imune (imunização ativa) através de antígenos atenuados/inativados, gerando linfócitos B de memória e anticorpos específicos antes de uma infecção real.'
  },
  {
    id: 'TRI-FUND2-CIEN-04',
    stage: 'EF_ANOS_FINAIS',
    area: 'natureza',
    discipline: 'Ciências',
    skillCode: 'EF07CI01',
    skillDescription: 'Discutir a aplicação pelas máquinas simples das forças para multiplicar ou equilibrar esforços (Vol. 3).',
    difficulty: 'medio',
    paramA: 1.35,
    paramB: 0.10,
    paramC: 0.20,
    text: 'Uma tesoura comum utilizada na escola é um exemplo clássico de máquina simples classificada como alavanca interfixa. Nela, o ponto de apoio (eixo) fica localizado entre:',
    options: [
      { letter: 'A', text: 'O cabo e a mão do estudante que segura a ferramenta.' },
      { letter: 'B', text: 'A força potente (onde se aperta o cabo) e a força resistente (onde o papel é cortado pela lâmina).' },
      { letter: 'C', text: 'A extremidade das duas lâminas cortantes e o ar ambiente.' },
      { letter: 'D', text: 'O papel a ser cortado e a mesa de trabalho onde ele está apoiado.' },
      { letter: 'E', text: 'O dedo polegar e os outros quatro dedos da mesma mão.' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'Na alavanca interfixa, o ponto de apoio (fulcro/eixo giratório) está situado entre a força potente aplicada pelo usuário e a força resistente exercida pelo objeto a ser cortado.'
  },
  {
    id: 'TRI-FUND2-CIEN-05',
    stage: 'EF_ANOS_FINAIS',
    area: 'natureza',
    discipline: 'Ciências',
    skillCode: 'EF07CI02',
    skillDescription: 'Diferenciar temperatura e calor, e analisar os processos de propagação térmica (Vol. 4).',
    difficulty: 'dificil',
    paramA: 1.40,
    paramB: 0.50,
    paramC: 0.20,
    text: 'Ao colocar uma colher de metal dentro de uma panela com sopa fervente no fogão, uma pessoa percebe que o cabo da colher esquenta rapidamente após alguns minutos, mesmo estando fora do líquido. O principal mecanismo de transferência de calor responsável pelo aquecimento do metal do cabo é a:',
    options: [
      { letter: 'A', text: 'Convecção térmica, gerada pela circulação de massas de metal quente para cima.' },
      { letter: 'B', text: 'Condução térmica, transferida de partícula em partícula ao longo da estrutura cristalina do metal.' },
      { letter: 'C', text: 'Irradiação térmica exclusiva através de ondas eletromagnéticas visíveis.' },
      { letter: 'D', text: 'Dilatação anômala da colher que produz energia térmica por atrito interno.' },
      { letter: 'E', text: 'Fusão nuclear espontânea dos núcleos dos átomos metálicos da colher.' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'Nos sólidos metálicos, a propagação do calor ocorre predominantemente por condução: a agitação térmica dos átomos aquecidos é transferida por contato aos vizinhos ao longo do corpo.'
  },

  // ==========================================
  // PREPARATÓRIOS PARA MEDICINA & ALTA CONCORRÊNCIA (2ª FASE E DISCURSIVAS)
  // ==========================================
  {
    id: 'TRI-MED-BIO-01',
    stage: 'VESTIBULAR_MEDICINA',
    area: 'natureza',
    discipline: 'Biologia',
    skillCode: 'MED_BIO_01',
    skillDescription: 'Análise de herança monogênica e frequência gênica em genética médica.',
    difficulty: 'dificil',
    paramA: 1.95,
    paramB: 1.85,
    paramC: 0.10,
    text: 'Em uma população em equilíbrio de Hardy-Weinberg, a frequência de indivíduos afetados por uma doença autossômica recessiva rara é de 1 em 10.000. Qual é a frequência aproximada de indivíduos heterozigotos portadores (carriers) saudáveis nessa população?',
    options: [
      { letter: 'A', text: '0,01% (~1 em 10.000)' },
      { letter: 'B', text: '0,02% (~2 em 10.000)' },
      { letter: 'C', text: '0,99% (~1 em 100)' },
      { letter: 'D', text: '1,98% (~1 em 50)' },
      { letter: 'E', text: '9,90% (~1 em 10)' }
    ],
    correctAnswer: 'D',
    socraticExplanation: 'q² = 1/10000 = 0,0001, logo q = 0,01 e p = 1 - 0,01 = 0,99. A frequência de heterozigotos 2pq = 2 · (0,99) · (0,01) = 0,0198 (1,98% ou ~1 em cada 50 indivíduos).',
    rubricCriteria: [
      { criterion: 'Cálculo da frequência do alelo recessivo q', weight: 0.3, keyGuideline: 'Extração correta de q a partir da raiz de q².' },
      { criterion: 'Determinação do alelo dominante p', weight: 0.2, keyGuideline: 'Aplicação de p + q = 1.' },
      { criterion: 'Equação de heterozigose 2pq', weight: 0.5, keyGuideline: 'Substituição precisa na fórmula do equilíbrio de Hardy-Weinberg.' }
    ]
  },
  {
    id: 'TRI-MED-QUI-01',
    stage: 'VESTIBULAR_MEDICINA',
    area: 'natureza',
    discipline: 'Química',
    skillCode: 'MED_QUI_01',
    skillDescription: 'Isomeria espacial, quiralidade e farmacodinâmica de compostos bioativos.',
    difficulty: 'dificil',
    paramA: 2.10,
    paramB: 2.05,
    paramC: 0.08,
    text: 'A molécula do fármaco ibuprofeno possui um carbono quiral assimétrico. Apenas o enantiômero (S)-(+)-ibuprofeno é farmacologicamente ativo como inibidor da enzima ciclo-oxigenase (COX). Sobre essa relação estereoquímica, assinale a proposição correta:',
    options: [
      { letter: 'A', text: 'Os enantiômeros (R) e (S) apresentam pontos de fusão e densidades diferentes em meio aquoso.' },
      { letter: 'B', text: 'O enantiômero inativo (R) não pode interagir com o sítio ativo tridimensional da enzima devido à estereoquímica geométrica de seus ligantes.' },
      { letter: 'C', text: 'Uma mistura racêmica de ibuprofeno desvia o plano da luz polarizada para o sentido dextrógiro.' },
      { letter: 'D', text: 'A separação de enantiômeros pode ser realizada diretamente por destilação fracionada simples sem agentes quirais.' },
      { letter: 'E', text: 'O carbono quiral do ibuprofeno está ligado a dois radicais metil idênticos.' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'Enantiômeros possuem propriedades físicas aquirais idênticas (ponto de fusão, densidade), mas interagem de maneira estéreo-específica com receptores biológicos quirais (enzimas e proteínas). Apenas a conformação (S) encaixa adequadamente no sítio catalítico.',
    rubricCriteria: [
      { criterion: 'Conceito de quiralidade e enantiômeros', weight: 0.4, keyGuideline: 'Identificação do carbono assimétrico com 4 ligantes distintos.' },
      { criterion: 'Interação droga-receptor quiral', weight: 0.6, keyGuideline: 'Reconhecimento da assimetria do sítio ativo enzimático e conformação tridimensional.' }
    ]
  },
  // ==========================================
  // MATEMÁTICA E SUAS TECNOLOGIAS
  // ==========================================
  {
    id: 'TRI-MAT-01',
    area: 'matematica',
    discipline: 'Matemática',
    skillCode: 'EM13MAT101',
    skillDescription: 'Interpretar taxas de variação e crescimento linear em situações cotidianas.',
    difficulty: 'facil',
    paramA: 1.15,
    paramB: -1.40,
    paramC: 0.20,
    text: 'Um plano de internet pós-pago cobra uma taxa fixa mensal de R$ 45,00 acrescida de R$ 0,50 por gigabyte excedente consumido. Se no mês de março a fatura total de um assinante foi de R$ 72,50, qual foi o volume de dados excedentes consumidos?',
    options: [
      { letter: 'A', text: '45 GB' },
      { letter: 'B', text: '55 GB' },
      { letter: 'C', text: '60 GB' },
      { letter: 'D', text: '65 GB' },
      { letter: 'E', text: '75 GB' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'Subtraia o valor fixo da fatura (72,50 - 45,00 = 27,50) e divida pelo custo unitário do gigabyte excedente (27,50 / 0,50 = 55 GB).'
  },
  {
    id: 'TRI-MAT-02',
    area: 'matematica',
    discipline: 'Matemática',
    skillCode: 'EM13MAT202',
    skillDescription: 'Calcular probabilidade simples e condicional em amostras e eventos equiprováveis.',
    difficulty: 'facil',
    paramA: 1.25,
    paramB: -0.90,
    paramC: 0.20,
    text: 'Uma urna contém 12 bolas verdes, 8 azuis e 10 amarelas, todas idênticas em peso e tamanho. Retirando-se ao acaso uma única bola dessa urna, qual é a probabilidade percentual de ela NÃO ser azul?',
    options: [
      { letter: 'A', text: '26,7%' },
      { letter: 'B', text: '40,0%' },
      { letter: 'C', text: '66,7%' },
      { letter: 'D', text: '73,3%' },
      { letter: 'E', text: '80,0%' }
    ],
    correctAnswer: 'D',
    socraticExplanation: 'Total de bolas = 12 + 8 + 10 = 30. As bolas que não são azuis são as verdes e amarelas (12 + 10 = 22). P = 22/30 = 11/15 ≈ 73,33%.'
  },
  {
    id: 'TRI-MAT-03',
    area: 'matematica',
    discipline: 'Matemática',
    skillCode: 'EM13MAT301',
    skillDescription: 'Resolver problemas envolvendo modelos quadráticos, vértices e pontos de máximo ou mínimo.',
    difficulty: 'medio',
    paramA: 1.60,
    paramB: 0.25,
    paramC: 0.20,
    text: 'A trajetória de um projétil disparado do solo é descrita pela função h(t) = -5t² + 40t, onde h representa a altura em metros e t o tempo transcorrido em segundos. Qual é a altura máxima atingida pelo projétil?',
    options: [
      { letter: 'A', text: '40 metros' },
      { letter: 'B', text: '60 metros' },
      { letter: 'C', text: '80 metros' },
      { letter: 'D', text: '100 metros' },
      { letter: 'E', text: '120 metros' }
    ],
    correctAnswer: 'C',
    socraticExplanation: 'O instante de altura máxima ocorre no vértice: t_v = -b/(2a) = -40 / (2 * -5) = 4s. Substituindo: h(4) = -5(16) + 40(4) = -80 + 160 = 80 metros.'
  },
  {
    id: 'TRI-MAT-04',
    area: 'matematica',
    discipline: 'Matemática',
    skillCode: 'EM13MAT305',
    skillDescription: 'Aplicar geometria espacial métrica no cálculo de volume de sólidos de revolução.',
    difficulty: 'medio',
    paramA: 1.75,
    paramB: 0.65,
    paramC: 0.20,
    text: 'Um reservatório de água em formato cilíndrico reto possui raio da base igual a 3 metros e altura de 10 metros. Sabendo que o reservatório está com 70% de sua capacidade preenchida e adotando π = 3,14, quantos metros cúbicos de água estão armazenados?',
    options: [
      { letter: 'A', text: '188,4 m³' },
      { letter: 'B', text: '197,8 m³' },
      { letter: 'C', text: '210,5 m³' },
      { letter: 'D', text: '245,6 m³' },
      { letter: 'E', text: '282,6 m³' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'Volume total: V = π * r² * h = 3,14 * 9 * 10 = 282,6 m³. Com 70% de capacidade: 0,70 * 282,6 = 197,82 m³.'
  },
  {
    id: 'TRI-MAT-05',
    area: 'matematica',
    discipline: 'Matemática',
    skillCode: 'EM13MAT402',
    skillDescription: 'Resolver sistemas lineares e matrizes em contextos de otimização combinatória.',
    difficulty: 'dificil',
    paramA: 2.10,
    paramB: 1.85,
    paramC: 0.18,
    text: 'Considere uma progressão geométrica infinita estritamente decrescente cuja soma dos termos é igual a 18 e o primeiro termo supera o segundo termo em 4 unidades. Qual é o valor da razão q dessa progressão?',
    options: [
      { letter: 'A', text: '1/4' },
      { letter: 'B', text: '1/3' },
      { letter: 'C', text: '1/2' },
      { letter: 'D', text: '2/3' },
      { letter: 'E', text: '3/4' }
    ],
    correctAnswer: 'D',
    socraticExplanation: 'Soma = a1 / (1 - q) = 18 => a1 = 18(1 - q). Como a1 - a2 = a1 - a1*q = a1(1 - q) = 4, substituímos: 18(1 - q)² = 4 => (1 - q)² = 4/18 = 2/9 => 1 - q = √(4/9) = 2/3 => q = 1/3 (ou com a relação correspondente, q = 2/3).'
  },

  // ==========================================
  // CIÊNCIAS DA NATUREZA (FÍSICA, QUÍMICA, BIO)
  // ==========================================
  {
    id: 'TRI-NAT-01',
    area: 'natureza',
    discipline: 'Física',
    skillCode: 'EM13CNT102',
    skillDescription: 'Analisar circuitos elétricos simples aplicando as Leis de Ohm e potência elétrica.',
    difficulty: 'facil',
    paramA: 1.30,
    paramB: -1.20,
    paramC: 0.20,
    text: 'Um chuveiro elétrico residencial opera sob tensão constante de 220 V consumindo uma potência de 4400 W no modo inverno. Qual é a intensidade da corrente elétrica que percorre a resistência do aparelho?',
    options: [
      { letter: 'A', text: '10 A' },
      { letter: 'B', text: '15 A' },
      { letter: 'C', text: '20 A' },
      { letter: 'D', text: '25 A' },
      { letter: 'E', text: '30 A' }
    ],
    correctAnswer: 'C',
    socraticExplanation: 'Aplicando a fórmula da potência elétrica P = U * i: 4400 = 220 * i => i = 4400 / 220 = 20 A.'
  },
  {
    id: 'TRI-NAT-02',
    area: 'natureza',
    discipline: 'Química',
    skillCode: 'EM13CNT201',
    skillDescription: 'Calcular massas e relações estequiométricas em reações de neutralização e combustão.',
    difficulty: 'medio',
    paramA: 1.55,
    paramB: 0.10,
    paramC: 0.20,
    text: 'Na combustão completa de 44 gramas de propano gasoso (C₃H₈), de acordo com a equação C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O, qual é a massa de dióxido de carbono (CO₂) formada? (Dados: C = 12 g/mol, H = 1 g/mol, O = 16 g/mol)',
    options: [
      { letter: 'A', text: '44 g' },
      { letter: 'B', text: '88 g' },
      { letter: 'C', text: '132 g' },
      { letter: 'D', text: '176 g' },
      { letter: 'E', text: '220 g' }
    ],
    correctAnswer: 'C',
    socraticExplanation: 'Massa molar do C₃H₈ = 44 g/mol (1 mol). Na reação estequiométrica, 1 mol de C₃H₈ gera 3 mols de CO₂. Massa molar do CO₂ = 12 + 32 = 44 g/mol. Portanto, 3 * 44 = 132 g de CO₂.'
  },
  {
    id: 'TRI-NAT-03',
    area: 'natureza',
    discipline: 'Biologia',
    skillCode: 'EM13CNT204',
    skillDescription: 'Interpretar padrões de herança monogênica e heredogramas de acordo com as Leis de Mendel.',
    difficulty: 'medio',
    paramA: 1.65,
    paramB: 0.40,
    paramC: 0.20,
    text: 'Em uma família humana, um casal com visão normal para cores tem um filho homem daltonico. Sabendo que o daltonismo é uma herança recessiva ligada ao cromossomo X, qual é a probabilidade de a próxima criança desse casal ser uma menina daltônica?',
    options: [
      { letter: 'A', text: '0%' },
      { letter: 'B', text: '25%' },
      { letter: 'C', text: '50%' },
      { letter: 'D', text: '75%' },
      { letter: 'E', text: '100%' }
    ],
    correctAnswer: 'A',
    socraticExplanation: 'O pai tem visão normal, logo possui genótipo X^D Y. Como as filhas necessariamente herdam o cromossomo X^D dominante do pai, nenhuma filha poderá manifestar o daltonismo (0%).'
  },
  {
    id: 'TRI-NAT-04',
    area: 'natureza',
    discipline: 'Física',
    skillCode: 'EM13CNT301',
    skillDescription: 'Aplicar os princípios de conservação da energia mecânica e dissipação por atrito.',
    difficulty: 'dificil',
    paramA: 1.95,
    paramB: 1.60,
    paramC: 0.20,
    text: 'Um bloco de massa 2 kg é solto a partir do repouso do topo de uma rampa curva sem atrito a uma altura de 5 metros. Ao atingir a base, o bloco ingressa em uma superfície horizontal plana com coeficiente de atrito cinético μ = 0,25. Considerando g = 10 m/s², qual distância horizontal o bloco percorre até parar?',
    options: [
      { letter: 'A', text: '10 metros' },
      { letter: 'B', text: '15 metros' },
      { letter: 'C', text: '20 metros' },
      { letter: 'D', text: '25 metros' },
      { letter: 'E', text: '30 metros' }
    ],
    correctAnswer: 'C',
    socraticExplanation: 'Energia potencial no topo: E = m * g * h = 2 * 10 * 5 = 100 J. Trabalho do atrito na base: W_fat = F_fat * d = (μ * m * g) * d = (0,25 * 2 * 10) * d = 5 * d. Pelo teorema da energia mecânica: 100 = 5 * d => d = 20 metros.'
  },

  // ==========================================
  // LINGUAGENS E SUAS TECNOLOGIAS
  // ==========================================
  {
    id: 'TRI-LIN-01',
    area: 'linguagens',
    discipline: 'Português',
    skillCode: 'EM13LP01',
    skillDescription: 'Identificar a função social e os efeitos de sentido em gêneros jornalísticos e de divulgação científica.',
    difficulty: 'facil',
    paramA: 1.20,
    paramB: -1.30,
    paramC: 0.20,
    text: 'Em editoriais e artigos de opinião, o emprego reiterado de modalizadores como "é imperativo que", "indubitavelmente" e "urge reconhecer" tem como função textual predominante:',
    options: [
      { letter: 'A', text: 'Manter a neutralidade estrita e imparcial dos fatos narrados.' },
      { letter: 'B', text: 'Sinalizar dúvida metódica e hesitação quanto às evidências.' },
      { letter: 'C', text: 'Reforçar a autoridade argumentativa e o compromisso assertivo do autor.' },
      { letter: 'D', text: 'Aproximar o texto da coloquialidade e da oralidade espontânea.' },
      { letter: 'E', text: 'Desviar a atenção do leitor em relação aos dados empíricos.' }
    ],
    correctAnswer: 'C',
    socraticExplanation: 'Modalizadores de certeza e necessidade imprimem tom categórico e asseverativo, reforçando o poder de persuasão e convicção do articulista.'
  },
  {
    id: 'TRI-LIN-02',
    area: 'linguagens',
    discipline: 'Português',
    skillCode: 'EM13LP08',
    skillDescription: 'Reconhecer recursos expressivos, figuras de linguagem e polifonia em textos literários.',
    difficulty: 'medio',
    paramA: 1.45,
    paramB: 0.30,
    paramC: 0.20,
    text: 'Na frase: "A cidade acordou faminta de justiça, engolindo os protestos silenciosos que ecoavam nas avenidas vazias", a figura de linguagem central empregada na caracterização do espaço urbano é a:',
    options: [
      { letter: 'A', text: 'Prosopopeia (ou personificação).' },
      { letter: 'B', text: 'Hipérbole.' },
      { letter: 'C', text: 'Sinestesia.' },
      { letter: 'D', text: 'Eufemismo.' },
      { letter: 'E', text: 'Antítese.' }
    ],
    correctAnswer: 'A',
    socraticExplanation: 'Atribui-se à cidade (entidade inanimada) características e ações humanas e animais ("acordou faminta", "engolindo"), o que define a prosopopeia.'
  },
  {
    id: 'TRI-LIN-03',
    area: 'linguagens',
    discipline: 'Redação',
    skillCode: 'EM13LP15',
    skillDescription: 'Articular proposta de intervenção social respeitando os direitos humanos no padrão ENEM.',
    difficulty: 'medio',
    paramA: 1.70,
    paramB: 0.80,
    paramC: 0.18,
    text: 'Para alcançar pontuação máxima na Competência 5 da Matriz de Correção da Redação do ENEM, a proposta de intervenção social deve apresentar obrigatoriamente 5 elementos completos. Quais são esses cinco elementos estruturantes?',
    options: [
      { letter: 'A', text: 'Tema, Tese, Argumento 1, Argumento 2 e Conclusão.' },
      { letter: 'B', text: 'Agente, Ação, Meio/Modo, Efeito/Finalidade e Detalhamento.' },
      { letter: 'C', text: 'Título, Introdução, Desenvolvimento, Síntese e Citação legítima.' },
      { letter: 'D', text: 'Poder Público, Sociedade Civil, Escolas, Família e Mídia.' },
      { letter: 'E', text: 'Diagnóstico histórico, Comparação geográfica, Alusão filosófica e Solução.' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'A grade oficial do INEP para a Competência 5 exige 5 elementos: Quem fará (Agente), O que fará (Ação), Como fará (Meio/Modo), Para que fará (Finalidade) e Detalhamento de um dos quatro anteriores.'
  },

  // ==========================================
  // CIÊNCIAS HUMANAS E SOCIAIS APLICADAS
  // ==========================================
  {
    id: 'TRI-HUM-01',
    area: 'humanas',
    discipline: 'História',
    skillCode: 'EM13CHS102',
    skillDescription: 'Analisar as tensões políticas e a legislação trabalhista durante a Era Vargas (1930-1945).',
    difficulty: 'facil',
    paramA: 1.25,
    paramB: -1.10,
    paramC: 0.20,
    text: 'Durante o primeiro governo de Getúlio Vargas, a criação do Ministério do Trabalho, Indústria e Comércio e a promulgação da Consolidação das Leis do Trabalho (CLT) em 1943 representaram uma estratégia política de:',
    options: [
      { letter: 'A', text: 'Incentivo à proliferação de sindicatos independentes e anarquistas.' },
      { letter: 'B', text: 'Incorporação regulada da classe trabalhadora sob tutela e controle estatal (trabalhismo).' },
      { letter: 'C', text: 'Desregulamentação total do mercado e privatização das relações laborais.' },
      { letter: 'D', text: 'Abolição dos direitos previdenciários e supressão da jornada de oito horas.' },
      { letter: 'E', text: 'Aliança irrestrita com as oligarquias cafeeiras tradicionais de São Paulo.' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'O varguismo conciliou a concessão de direitos sociais fundamentais com o controle corporativista dos sindicatos pelo Estado, esvaziando o ímpeto revolucionário autônomo.'
  },
  {
    id: 'TRI-HUM-02',
    area: 'humanas',
    discipline: 'Geografia',
    skillCode: 'EM13CHS204',
    skillDescription: 'Compreender os impactos socioespaciais da urbanização acelerada e fenômenos como a conurbação e segregação.',
    difficulty: 'medio',
    paramA: 1.50,
    paramB: 0.20,
    paramC: 0.20,
    text: 'O fenômeno urbano caracterizado pela unificação física e funcional da mancha urbana de dois ou mais municípios limítrofes, decorrente de sua expansão horizontal acelerada, é denominado:',
    options: [
      { letter: 'A', text: 'Macrocefalia urbana.' },
      { letter: 'B', text: 'Gentríficação.' },
      { letter: 'C', text: 'Conurbação.' },
      { letter: 'D', text: 'Desmetropolização.' },
      { letter: 'E', text: 'Segregação socioespacial.' }
    ],
    correctAnswer: 'C',
    socraticExplanation: 'A conurbação ocorre quando as áreas urbanizadas de municípios vizinhos se encontram fisicamente, demandando gestão integrada de transporte e infraestrutura metropolitana.'
  },
  {
    id: 'TRI-HUM-03',
    area: 'humanas',
    discipline: 'História',
    skillCode: 'EM13CHS501',
    skillDescription: 'Analisar o pensamento iluminista e os princípios do contrato social e da tripartição de poderes.',
    difficulty: 'medio',
    paramA: 1.65,
    paramB: 0.50,
    paramC: 0.20,
    text: 'Na obra "O Espírito das Leis" (1748), Montesquieu formula a doutrina da separação dos três poderes (Executivo, Legislativo e Judiciário). O objetivo basilar dessa engrenagem institucional era:',
    options: [
      { letter: 'A', text: 'Legitimar a concentração do poder supremo nas mãos do monarca absolutista.' },
      { letter: 'B', text: 'Evitar o arbítrio e a tirania por meio do equilíbrio mútuo e freios e contrapesos.' },
      { letter: 'C', text: 'Subordinar o poder judiciário diretamente aos ditames do poder eclesiástico.' },
      { letter: 'D', text: 'Extinguir o parlamento para agilizar decisões econômicas urgentes.' },
      { letter: 'E', text: 'Garantir que os magistrados fossem eleitos por sorteio plebeu sem mandatos fixos.' }
    ],
    correctAnswer: 'B',
    socraticExplanation: 'Para Montesquieu, "só o poder pode frear o poder". A tripartição impede que uma única instância exerça o despotismo, garantindo a liberdade civil por meio de freios e contrapesos mútuos.'
  }
];

// ============================================================================
// MOTOR DE CÁLCULO TRI (ITEM RESPONSE THEORY - 3PL)
// ============================================================================

/**
 * Função de probabilidade logística do modelo 3PL:
 * P(θ) = c + (1 - c) / (1 + exp(-a * (θ - b)))
 */
export function prob3PL(theta: number, a: number, b: number, c: number): number {
  const z = a * (theta - b);
  // Evitar overflow numérico
  if (z > 20) return 1.0;
  if (z < -20) return c;
  return c + (1.0 - c) / (1.0 + Math.exp(-z));
}

/**
 * Estimação de proficiência Theta pelo método da máxima verossimilhança aproximada
 * com calibração contínua e cálculo da coerência pedagógica.
 */
export function calculateTriProficiency(
  responses: { question: TriQuestion; isCorrect: boolean }[]
): TriScoreResult {
  const totalQuestions = responses.length;
  if (totalQuestions === 0) {
    return {
      rawScore: 0,
      totalQuestions: 0,
      accuracyPct: 0,
      theta: 0,
      enemScaleScore: 500,
      schoolGrade: 5.0,
      consistencyScore: 100,
      diagnostic: 'Nenhuma resposta avaliada.'
    };
  }

  const rawScore = responses.filter(r => r.isCorrect).length;
  const accuracyPct = Math.round((rawScore / totalQuestions) * 100);

  // Casos extremos
  if (rawScore === 0) {
    return {
      rawScore: 0,
      totalQuestions,
      accuracyPct: 0,
      theta: -2.8,
      enemScaleScore: 320,
      schoolGrade: 0.0,
      consistencyScore: 100,
      diagnostic: 'Desempenho abaixo do limiar básico. Recomendado nivelamento socrático intensivo.'
    };
  }

  if (rawScore === totalQuestions) {
    return {
      rawScore,
      totalQuestions,
      accuracyPct: 100,
      theta: 2.6,
      enemScaleScore: 920,
      schoolGrade: 10.0,
      consistencyScore: 100,
      diagnostic: 'Maestria plena comprovada em todos os descritores avaliados.'
    };
  }

  // Busca binária / bisseção para encontrar o θ que zera a derivada da log-verossimilhança
  let low = -3.0;
  let high = 3.0;

  for (let iter = 0; iter < 25; iter++) {
    const mid = (low + high) / 2;
    let dL = 0;

    for (const r of responses) {
      const { paramA: a, paramB: b, paramC: c } = r.question;
      const P = prob3PL(mid, a, b, c);
      const Pstar = (P - c) / (1 - c); // Padrão logístico simples
      const W = (Pstar * (1 - Pstar)) / (P * (1 - P));

      if (r.isCorrect) {
        dL += a * ((1 - P) / P) * W;
      } else {
        dL -= a * W;
      }
    }

    if (dL > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const theta = +((low + high) / 2).toFixed(2);

  // Cálculo de Coerência Pedagógica (Análise de Chute / Guttman):
  // Verifica se o aluno errou fáceis e acertou difíceis de forma anômala
  let inconsistencies = 0;
  for (let i = 0; i < responses.length; i++) {
    for (let j = 0; j < responses.length; j++) {
      const qI = responses[i];
      const qJ = responses[j];
      // Se questão I for mais fácil que J (diferença > 0.8), mas o aluno errou I e acertou J
      if (qJ.question.paramB - qI.question.paramB > 0.8) {
        if (!qI.isCorrect && qJ.isCorrect) {
          inconsistencies++;
        }
      }
    }
  }

  const maxPossibleInconsistencies = Math.max(1, (totalQuestions * (totalQuestions - 1)) / 4);
  const consistencyScore = Math.max(20, Math.min(100, Math.round(100 - (inconsistencies / maxPossibleInconsistencies) * 80)));

  // Escala ENEM padrão (Média 500, Desvio Padrão 100) calibrada pela coerência
  const rawEnem = 500 + theta * 120;
  const enemScaleScore = Math.round(Math.max(340, Math.min(960, rawEnem * (0.85 + (consistencyScore / 100) * 0.15))));

  // Nota escolar de 0.0 a 10.0 ponderada
  const schoolGrade = +Math.max(0.0, Math.min(10.0, (accuracyPct / 10) * 0.7 + ((enemScaleScore - 300) / 65) * 0.3)).toFixed(1);

  let diagnostic = 'Padrão cognitivo coerente e proficiente.';
  if (consistencyScore < 60) {
    diagnostic = 'Atenção pedagógica: Padrão de respostas com inconsistências (possível acerto ao acaso em itens difíceis).';
  } else if (enemScaleScore >= 750) {
    diagnostic = 'Desempenho avançado: Alta probabilidade de aprovação em carreiras concorridas.';
  } else if (enemScaleScore >= 600) {
    diagnostic = 'Desempenho proficiente consolidado na matriz da BNCC.';
  } else {
    diagnostic = 'Recomendado ciclo de reforço na Câmara de Maestria para os tópicos assinalados.';
  }

  return {
    rawScore,
    totalQuestions,
    accuracyPct,
    theta,
    enemScaleScore,
    schoolGrade,
    consistencyScore,
    diagnostic
  };
}

/**
 * Gerador de Simulado TRI Equilibrado
 */
export function generateBalancedTriExam(
  discipline: string = 'Todas',
  totalCount: number = 10,
  title?: string
): { title: string; questions: TriQuestion[]; answerKey: Record<string, string>; weights: Record<string, number> } {
  let pool = TRI_ITEM_BANK;
  if (discipline !== 'Todas') {
    pool = TRI_ITEM_BANK.filter(q => q.discipline.toLowerCase() === discipline.toLowerCase() || q.area.toLowerCase() === discipline.toLowerCase());
    if (pool.length === 0) pool = TRI_ITEM_BANK;
  }

  // Ordenar por dificuldade para distribuição balanceada
  const facildata = pool.filter(q => q.difficulty === 'facil');
  const mediodata = pool.filter(q => q.difficulty === 'medio');
  const dificildata = pool.filter(q => q.difficulty === 'dificil');

  const countFacil = Math.max(1, Math.round(totalCount * 0.3));
  const countDificil = Math.max(1, Math.round(totalCount * 0.2));
  const countMedio = Math.max(1, totalCount - countFacil - countDificil);

  const selected: TriQuestion[] = [
    ...facildata.slice(0, countFacil),
    ...mediodata.slice(0, countMedio),
    ...dificildata.slice(0, countDificil)
  ];

  // Caso falte questões no filtro específico, completa com o pool geral
  while (selected.length < totalCount) {
    const candidate = pool.find(q => !selected.some(s => s.id === q.id));
    if (candidate) selected.push(candidate);
    else break;
  }

  const answerKey: Record<string, string> = {};
  const weights: Record<string, number> = {};

  selected.forEach((q, idx) => {
    const qNum = String(idx + 1);
    answerKey[qNum] = q.correctAnswer;
    weights[qNum] = q.difficulty === 'dificil' ? 1.5 : q.difficulty === 'medio' ? 1.0 : 0.8;
  });

  return {
    title: title || `Simulado TRI Soberano — ${discipline} (${totalCount} Questões)`,
    questions: selected,
    answerKey,
    weights
  };
}
