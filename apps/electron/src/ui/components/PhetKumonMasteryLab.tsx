import React, { useState, useEffect } from 'react';
import {
  Atom, Brain, Calendar, Sparkles, CheckCircle2, XCircle,
  ExternalLink, RotateCcw, Maximize2, Minimize2, Search,
  Award, HelpCircle, ArrowRight, Zap, BookOpen, Layers
} from 'lucide-react';
import './PhetKumonMasteryLab.css';

export interface KumonDrill {
  id: string;
  drill: string;
  ans: string;
  hint: string;
  explanation: string;
}

export interface MasteryTopic {
  id: string;
  title: string;
  badge: string;
  bncc: string;
  canonRef: string;
  phetName: string;
  phetTitle: string;
  phetUrl: string;
  phetThumb: string;
  drillsL1: KumonDrill[];
  drillsL2: KumonDrill[];
  drillsL3: KumonDrill[];
  spacedSchedule: Array<{
    day: string;
    focus: string;
    duration: string;
    description: string;
  }>;
}

const MASTER_TOPICS: MasteryTopic[] = [
  {
    id: 'gravitacao_universal',
    title: 'Gravitação Universal & Lei do Inverso do Quadrado',
    badge: 'Mecânica Celeste',
    bncc: 'EM13CNT301',
    canonRef: 'Halliday & Resnick, Vol. 2, Cap. 13 • Ramalho & Nicolau, Vol. 1, Cap. 15',
    phetName: 'gravity-and-orbits',
    phetTitle: 'Gravidade e Órbitas',
    phetUrl: 'https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_all.html',
    phetThumb: 'https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits-600.png',
    drillsL1: [
      {
        id: 'g1',
        drill: 'Calcule a tabuada mental: 6 · 7 =',
        ans: '42',
        hint: 'Multiplicação direta sem calculadora',
        explanation: 'Automaticidade de tabuada elimina sobrecarga na memória de trabalho.'
      },
      {
        id: 'g2',
        drill: 'Multiplique potências de 10: 10^(-11) · 10^(24) =',
        ans: '10^13',
        hint: 'Some os expoentes: (-11) + 24',
        explanation: 'Na constante G de Newton (6,67·10^-11) vezes a massa da Terra (6·10^24), somamos os expoentes.'
      },
      {
        id: 'g3',
        drill: 'Eleve ao quadrado a distância: (2 · 10^3)^2 =',
        ans: '4*10^6',
        hint: 'Eleve o 2 ao quadrado e multiplique o expoente 3 por 2',
        explanation: '(2)^2 = 4 e (10^3)^2 = 10^6, logo 4 · 10^6 m².'
      }
    ],
    drillsL2: [
      {
        id: 'g4',
        drill: 'Em F = G·M·m / d², se a distância d duplica (2x), por quanto a força F é dividida?',
        ans: '4',
        hint: 'Como d está ao quadrado no denominador, (2)^2 = 4',
        explanation: 'Lei do inverso do quadrado da distância: ao dobrar a distância, a gravidade cai para 1/4.'
      },
      {
        id: 'g5',
        drill: 'Se a massa de um planeta triplica (3x) e a distância não muda, a força F aumenta quantas vezes?',
        ans: '3',
        hint: 'F é diretamente proporcional à massa M',
        explanation: 'Como a massa está no numerador com expoente 1, a proporcionalidade é linear direta.'
      }
    ],
    drillsL3: [
      {
        id: 'g6',
        drill: 'Dois satélites de massas 1000 kg e 2000 kg distam 10 m. Sendo G = 6,7·10^(-11), qual a ordem de grandeza da força em newtons? (digite ex: 10^-7)',
        ans: '10^-7',
        hint: 'F = 6,7·10^-11 · 2·10^6 / 100 = 13,4·10^-7 N',
        explanation: 'F = 1,34 · 10^-6 N, cuja ordem de grandeza é 10^-7 a 10^-6 N.'
      }
    ],
    spacedSchedule: [
      { day: 'Sexta-feira (+24h)', focus: 'Reativação Conceitual PhET', duration: '3 min', description: 'Abrir a simulação Gravidade e Órbitas e alterar a massa do Sol para observar a trajetória elíptica.' },
      { day: 'Sábado (+48h)', focus: 'Automaticidade Kumon L1', duration: '5 min', description: 'Treino de fluência em potências de 10 e notação científica no app mobile sem calculadora.' },
      { day: 'Segunda-feira (+96h)', focus: 'Raciocínio Algébrico Kumon L2', duration: '5 min', description: 'Manipulação de proporções inversas ao quadrado (distância vs intensidade de campo).' },
      { day: 'Quarta-feira (+144h)', focus: 'Desafio Integrado PAS-UnB / ENEM', duration: '6 min', description: 'Resolução completa de questão de gravitação contextualizada pronta para debate em aula.' }
    ]
  },
  {
    id: 'eletrodinamica_consumo',
    title: 'Eletrodinâmica, Lei de Ohm & Consumo Residencial',
    badge: 'Eletromagnetismo',
    bncc: 'EM13CNT102',
    canonRef: 'Gualter & Newton, Vol. 3, Cap. 2 • Tipler & Mosca, Vol. 2, Cap. 25',
    phetName: 'circuit-construction-kit-dc',
    phetTitle: 'Kit de Construção de Circuitos DC',
    phetUrl: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html',
    phetThumb: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc-600.png',
    drillsL1: [
      {
        id: 'e1',
        drill: 'Divida 4400 por 220 (potência dividida por tensão):',
        ans: '20',
        hint: 'Corte os zeros: 440 / 22 = 20',
        explanation: 'P = U · i => i = 4400 / 220 = 20 A de corrente no disjuntor.'
      },
      {
        id: 'e2',
        drill: 'Converta 4400 W em kW (divida por 1000):',
        ans: '4.4',
        hint: 'Desloque a vírgula 3 casas para a esquerda',
        explanation: 'O prefixo quilo (k) significa 10^3 = 1000 W.'
      },
      {
        id: 'e3',
        drill: 'Converta 15 minutos em fração decimal de hora (15/60):',
        ans: '0.25',
        hint: '15/60 = 1/4 = 0,25 h',
        explanation: 'Fundamental para calcular energia E = P · Δt em kWh.'
      }
    ],
    drillsL2: [
      {
        id: 'e4',
        drill: 'Em P = U · i, com P = 2200 W e U = 110 V, qual a corrente i (em A)?',
        ans: '20',
        hint: 'i = 2200 / 110',
        explanation: 'i = 20 ampères.'
      },
      {
        id: 'e5',
        drill: 'Em E = P · Δt, com P = 2 kW operando durante 5 horas, quantos kWh são gastos?',
        ans: '10',
        hint: 'Multiplique 2 por 5',
        explanation: 'E = 2 kW · 5 h = 10 kWh.'
      }
    ],
    drillsL3: [
      {
        id: 'e6',
        drill: 'Em uma casa de Brasília com 4 pessoas tomando banho de 15 min em chuveiro de 6 kW, qual o consumo mensal em kWh (30 dias)?',
        ans: '180',
        hint: 'Tempo diário total: 4 · 0,25h = 1h/dia. Energia/dia = 6 kW · 1h = 6 kWh. No mês de 30 dias: 6 · 30.',
        explanation: 'Consumo mensal de 180 kWh (representa cerca de 50% da conta de luz familiar).'
      }
    ],
    spacedSchedule: [
      { day: 'Sexta-feira (+24h)', focus: 'Montagem de Circuitos PhET', duration: '3 min', description: 'Construir no simulador uma lâmpada em série com resistor e medir a corrente com amperímetro virtual.' },
      { day: 'Sábado (+48h)', focus: 'Automaticidade Kumon L1', duration: '5 min', description: 'Conversão rápida de unidades: W para kW, minutos para fração de hora decimal.' },
      { day: 'Segunda-feira (+96h)', focus: 'Equações de Potência Kumon L2', duration: '5 min', description: 'Manipulação simultânea de P = U·i, P = R·i² e P = U²/R sem decorar tabela.' },
      { day: 'Quarta-feira (+144h)', focus: 'Simulado ENEM / UFG L3', duration: '6 min', description: 'Cálculo de custo da conta de energia elétrica com tarifas e bandeiras tarifárias da Neoenergia.' }
    ]
  },
  {
    id: 'cinematica_balistica',
    title: 'Lançamento Oblíquo de Projéteis & Vetores',
    badge: 'Cinemática Vetorial',
    bncc: 'EM13CNT301',
    canonRef: 'Ramalho, Nicolau & Toledo, Vol. 1, Cap. 8 • Feynman Lectures, Cap. 9',
    phetName: 'projectile-motion',
    phetTitle: 'Movimento de Projéteis',
    phetUrl: 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html',
    phetThumb: 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion-600.png',
    drillsL1: [
      {
        id: 'c1',
        drill: 'Calcule 50 · sen(30°) sabendo que sen(30°) = 0,5:',
        ans: '25',
        hint: 'Metade de 50',
        explanation: 'Velocidade vertical inicial: v0y = v0 · sen(θ) = 50 · 0,5 = 25 m/s.'
      },
      {
        id: 'c2',
        drill: 'Divida 20 por 10 (velocidade vertical dividida pela gravidade g=10):',
        ans: '2',
        hint: 'Tempo de subida: t_sub = v0y / g',
        explanation: 'Leva 2 segundos para o projétil atingir o ponto mais alto.'
      }
    ],
    drillsL2: [
      {
        id: 'c3',
        drill: 'Se o tempo de subida até o ponto mais alto é 3 s, qual o tempo total de voo?',
        ans: '6',
        hint: 'O tempo de subida é igual ao tempo de descida em terreno plano',
        explanation: 'Tempo total = 2 · t_subida = 2 · 3 = 6 segundos.'
      },
      {
        id: 'c4',
        drill: 'Com velocidade horizontal constante de 15 m/s e tempo de voo de 4 s, qual o alcance em metros?',
        ans: '60',
        hint: 'Alcance = vx · t_total = 15 · 4',
        explanation: 'Na horizontal o movimento é uniforme: x = 15 · 4 = 60 metros.'
      }
    ],
    drillsL3: [
      {
        id: 'c5',
        drill: 'Um canhão no PAS-UnB dispara projétil a 40 m/s com ângulo de 30° do solo (g=10 m/s²). Qual a altura máxima em metros?',
        ans: '20',
        hint: 'v0y = 40 · sen(30°) = 20 m/s. H = v0y² / (2g) = 400 / 20 = 20 m.',
        explanation: 'H_máx = 20 metros atingidos no ápice da parábola.'
      }
    ],
    spacedSchedule: [
      { day: 'Sexta-feira (+24h)', focus: 'Disparo Parabólico PhET', duration: '3 min', description: 'Testar no simulador PhET disparos com 30°, 45° e 60° para verificar o alcance máximo.' },
      { day: 'Sábado (+48h)', focus: 'Automaticidade Kumon L1', duration: '5 min', description: 'Decomposição trigonométrica com ângulos notáveis (30°, 45°, 60°).' },
      { day: 'Segunda-feira (+96h)', focus: 'Independência dos Movimentos L2', duration: '5 min', description: 'Princípio de Galileu: MRU horizontal + MRUV vertical desacoplados.' },
      { day: 'Quarta-feira (+144h)', focus: 'Questão Cebraspe / PAS-UnB L3', duration: '6 min', description: 'Julgamento de itens CERTO/ERRADO típicos do Cebraspe sobre conservação de vx.' }
    ]
  },
  {
    id: 'conservacao_energia',
    title: 'Conservação da Energia Mecânica & Pista de Skate',
    badge: 'Trabalho & Energia',
    bncc: 'EM13CNT101',
    canonRef: 'Halliday & Resnick, Vol. 1, Cap. 8 • Sears & Zemansky, Física I',
    phetName: 'energy-skate-park',
    phetTitle: 'Energia na Pista de Skate',
    phetUrl: 'https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_all.html',
    phetThumb: 'https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park-600.png',
    drillsL1: [
      {
        id: 'k1',
        drill: 'Calcule m · g · h para m = 60 kg, g = 10 m/s² e h = 5 m:',
        ans: '3000',
        hint: '60 · 10 · 5',
        explanation: 'Energia potencial gravitacional Ep = 3.000 joules.'
      },
      {
        id: 'k2',
        drill: 'Calcule 10 ao quadrado (v²):',
        ans: '100',
        hint: '10 · 10 = 100',
        explanation: 'Automaticidade de quadrados para a fórmula Ec = (m·v²)/2.'
      }
    ],
    drillsL2: [
      {
        id: 'k3',
        drill: 'Se um skatista desce de uma altura h sem atrito e a altura quadruplica (4x), a velocidade v aumenta quantas vezes?',
        ans: '2',
        hint: 'v = √(2gh). Como a altura está dentro da raiz quadrada: √4 = 2',
        explanation: 'A velocidade aumenta pela raiz da variação da altura (2x).'
      },
      {
        id: 'k4',
        drill: 'No ponto mais alto da rampa onde o skatista para instantaneamente, quanto vale a energia cinética?',
        ans: '0',
        hint: 'Velocidade zero implica energia cinética nula',
        explanation: 'Ec = 0 J. Toda energia mecânica está armazenada sob a forma potencial gravitacional.'
      }
    ],
    drillsL3: [
      {
        id: 'k5',
        drill: 'Um skatista de 50 kg parte do repouso de 3,2 m de altura no Parque da Cidade em Brasília (g=10 m/s²). Qual sua velocidade no ponto mais baixo em m/s?',
        ans: '8',
        hint: 'v = √(2 · g · h) = √(2 · 10 · 3,2) = √64 = 8 m/s',
        explanation: 'Velocidade de 8 m/s (cerca de 28,8 km/h).'
      }
    ],
    spacedSchedule: [
      { day: 'Sexta-feira (+24h)', focus: 'Gráficos de Barras no PhET', duration: '3 min', description: 'Ligar o gráfico de pizza de energia e acompanhar a conversão mútua de Ep em Ec.' },
      { day: 'Sábado (+48h)', focus: 'Automaticidade Kumon L1', duration: '5 min', description: 'Raízes quadradas perfeitas e ordens de grandeza em Joules.' },
      { day: 'Segunda-feira (+96h)', focus: 'Sistemas Dissipativos Kumon L2', duration: '5 min', description: 'Trabalho da força de atrito: Emec_final - Emec_inicial = - Fat · d.' },
      { day: 'Quarta-feira (+144h)', focus: 'Questão ENEM / UniRV L3', duration: '6 min', description: 'Análise de montanha-russa com looping circular e força centrípeta.' }
    ]
  }
,
  {
    id: 'ondulatoria_acustica_doppler',
    title: 'Ondulatória, Acústica & Efeito Doppler (PAS-UnB / UFMG)',
    badge: 'Ondulatória & Som',
    bncc: 'EM13CNT302',
    canonRef: 'Halliday & Resnick, Vol. 2, Cap. 16-17 • Ramalho & Nicolau, Vol. 2, Cap. 18',
    phetName: 'waves-intro',
    phetTitle: 'Introdução às Ondas',
    phetUrl: 'https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_all.html',
    phetThumb: 'https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro-600.png',
    drillsL1: [
      {
        id: 'w1',
        drill: 'Simplifique potências de 10: 10^8 / 10^9 em decimal:',
        ans: '0.1',
        hint: 'Subtraia os expoentes: 8 - 9 = -1, e 10^-1 = 0,1',
        explanation: 'Fundamental ao calcular comprimento de onda de satélites e ondas de rádio (c = 3·10^8 m/s).'
      },
      {
        id: 'w2',
        drill: 'Em v = λ · f, com v = 340 m/s e f = 170 Hz, qual o valor de λ (em m)?',
        ans: '2',
        hint: 'λ = 340 / 170',
        explanation: 'Comprimento de onda acústico de 2 metros propagando-se no ar atmosférico.'
      },
      {
        id: 'w3',
        drill: 'Se a frequência f = 50 Hz, quanto vale o período T = 1/f em segundos?',
        ans: '0.02',
        hint: '1 / 50 = 2 / 100 = 0,02 s',
        explanation: 'Cada oscilação completa dura exatamente 20 milissegundos.'
      }
    ],
    drillsL2: [
      {
        id: 'w4',
        drill: 'Em v = λ · f, se a frequência de uma onda sonora duplica (2x) no mesmo ar, o comprimento de onda λ:',
        ans: 'cai pela metade',
        hint: 'Como a velocidade do som no meio é fixa, λ e f são inversamente proporcionais',
        explanation: 'Ao dobrar a frequência (som mais agudo), as cristas ficam 2x mais próximas (λ divide por 2).'
      },
      {
        id: 'w5',
        drill: 'No Efeito Doppler, quando uma ambulância se aproxima do pedestre parado, a frequência ouvida é:',
        ans: 'maior',
        hint: 'As frentes de onda se comprimem na direção do movimento',
        explanation: 'A frequência percebida é mais alta (som mais agudo) durante a aproximação.'
      }
    ],
    drillsL3: [
      {
        id: 'w6',
        drill: 'Um sinal de telecomunicação da UnB tem f = 1,5 GHz (1,5·10^9 Hz) e viaja a 3,0·10^8 m/s. Qual seu comprimento de onda em metros (ex: 0.2)?',
        ans: '0.2',
        hint: 'λ = c / f = (3,0·10^8) / (1,5·10^9) = 2 · 10^-1 = 0,2 m',
        explanation: 'O comprimento de onda é 20 cm (faixa de micro-ondas para satélites ambientais).'
      }
    ],
    spacedSchedule: [
      { day: 'Sexta-feira (+24h)', focus: 'Visualização de Ondas PhET', duration: '3 min', description: 'Abrir a simulação Introdução às Ondas e alternar entre gotejador de água e gerador de som.' },
      { day: 'Sábado (+48h)', focus: 'Fluência Kumon L1', duration: '5 min', description: 'Manipulação rápida de grandezas inversas T = 1/f e notação científica de frequências em Hz, kHz e MHz.' },
      { day: 'Segunda-feira (+96h)', focus: 'Interferência & Difração Kumon L2', duration: '5 min', description: 'Identificação de nós e ventres em tubos sonoros abertos e fechados.' },
      { day: 'Quarta-feira (+144h)', focus: 'Questão Discursiva PAS-UnB L3', duration: '6 min', description: 'Análise de radar Doppler meteorológico monitorando tempestades no Planalto Central.' }
    ]
  },
  {
    id: 'termodinamica_gases_cerrado',
    title: 'Termodinâmica, Máquinas Térmicas & Clima do Cerrado (UFG / UEG)',
    badge: 'Termofísica & Gases',
    bncc: 'EM13CNT102',
    canonRef: 'Sears & Zemansky, Física II, Cap. 19-20 • Ramalho & Nicolau, Vol. 2, Cap. 10',
    phetName: 'gas-properties',
    phetTitle: 'Propriedades dos Gases',
    phetUrl: 'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_all.html',
    phetThumb: 'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties-600.png',
    drillsL1: [
      {
        id: 't1',
        drill: 'Converta a temperatura de 27 °C para a escala absoluta Kelvin (27 + 273):',
        ans: '300',
        hint: 'T(K) = T(°C) + 273',
        explanation: 'Em equações termodinâmicas (p·V = n·R·T), a temperatura deve estar sempre em Kelvin.'
      },
      {
        id: 't2',
        drill: 'Calcule o produto p · V para p = 2 atm e V = 15 L:',
        ans: '30',
        hint: '2 · 15 = 30',
        explanation: 'O produto p·V é constante em transformações isotérmicas (Lei de Boyle).'
      },
      {
        id: 't3',
        drill: 'Em uma máquina térmica que recebe 1000 J e rejeita 600 J, quanto trabalho útil W é produzido (1000 - 600)?',
        ans: '400',
        hint: '1ª Lei: W = Q1 - Q2',
        explanation: 'O trabalho útil realizado é a diferença entre o calor da fonte quente e o rejeitado à fonte fria.'
      }
    ],
    drillsL2: [
      {
        id: 't4',
        drill: 'Em um botijão rígido (volume constante), se a temperatura absoluta Kelvin dobra (2x), a pressão interna:',
        ans: 'dobra',
        hint: 'Em transformação isovolumétrica, p/T = constante',
        explanation: 'A pressão e a temperatura absoluta são diretamente proporcionais (Lei de Charles/Gay-Lussac).'
      },
      {
        id: 't5',
        drill: 'Segundo a 2ª Lei da Termodinâmica, é possível construir uma máquina térmica com 100% de rendimento?',
        ans: 'não',
        hint: 'Enunciado de Kelvin-Planck',
        explanation: 'Nenhuma máquina que opera em ciclos pode transformar integralmente calor em trabalho.'
      }
    ],
    drillsL3: [
      {
        id: 't6',
        drill: 'Um aquecedor solar em Goiânia eleva em 40 °C a temperatura de 50 kg de água (c=4200 J/kg°C) em 1000 s. Qual a potência média útil em kW?',
        ans: '8.4',
        hint: 'Q = 50 · 4200 · 40 = 8.400.000 J = 8,4 MJ. Potência P = 8.400.000 / 1000 = 8400 W = 8,4 kW.',
        explanation: 'Potência térmica útil média de 8,4 kW gerada por captação da radiação solar do Cerrado.'
      }
    ],
    spacedSchedule: [
      { day: 'Sexta-feira (+24h)', focus: 'Cinética de Moléculas PhET', duration: '3 min', description: 'Bombear moléculas pesadas e leves no simulador e acompanhar o termômetro e manômetro.' },
      { day: 'Sábado (+48h)', focus: 'Fluência Kumon L1', duration: '5 min', description: 'Cálculo instantâneo de rendimento percentual η = (1 - T2/T1) e calores sensíveis.' },
      { day: 'Segunda-feira (+96h)', focus: 'Diagramas p-V Kumon L2', duration: '5 min', description: 'Cálculo de trabalho através da área sob a curva no ciclo de Carnot e Otto.' },
      { day: 'Quarta-feira (+144h)', focus: 'Questão Estilo UFG / UEG L3', duration: '6 min', description: 'Resolução de balanço térmico e umidade relativa do ar no inverno goiano.' }
    ]
  }
];

export const PhetKumonMasteryLab: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('gravitacao_universal');
  const [activeTab, setActiveTab] = useState<'phet' | 'kumon' | 'ebbinghaus'>('phet');
  const [searchSimQuery, setSearchSimQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, 'correct' | 'incorrect'>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [masteryScore, setMasteryScore] = useState<number>(0);
  const [colabStatus, setColabStatus] = useState<{ online: boolean; gpu: string }>({ online: false, gpu: 'Detectando...' });

  const currentTopic = MASTER_TOPICS.find(t => t.id === selectedTopicId) || MASTER_TOPICS[0];

  // Checa status do Colab GPU via IPC se disponível
  useEffect(() => {
    async function checkGpu() {
      try {
        // @ts-ignore
        if (window.aquila?.colab?.getGpuStatus) {
          // @ts-ignore
          const status = await window.aquila.colab.getGpuStatus();
          setColabStatus({ online: status?.online || false, gpu: status?.health?.gpu?.utilization_pct !== undefined ? 'NVIDIA A100/T4 Conectada' : 'Edge Local' });
        }
      } catch {
        setColabStatus({ online: false, gpu: 'Edge Offline-First' });
      }
    }
    checkGpu();
  }, []);

  const handleAnswerChange = (drillId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [drillId]: val }));
  };

  const normalizeAnswer = (str: string) => {
    return str.trim().toLowerCase().replace(',', '.').replace(/\s+/g, '');
  };

  const handleCheckAnswer = (drill: KumonDrill) => {
    const userVal = normalizeAnswer(answers[drill.id] || '');
    const correctVal = normalizeAnswer(drill.ans);
    const isCorrect = userVal === correctVal || userVal === correctVal.replace('.', ',');

    setEvaluations(prev => ({
      ...prev,
      [drill.id]: isCorrect ? 'correct' : 'incorrect'
    }));

    if (isCorrect && evaluations[drill.id] !== 'correct') {
      setMasteryScore(prev => prev + 25);
    }
  };

  const toggleExplanation = (drillId: string) => {
    setShowExplanation(prev => ({ ...prev, [drillId]: !prev[drillId] }));
  };

  return (
    <div className="phet-kumon-shell">
      {/* CABEÇALHO SOBERANO */}
      <div className="phet-kumon-header">
        <div className="phet-kumon-title-block">
          <div className="phet-kumon-badges">
            <span className="phet-badge cyan">
              <Atom size={12} />
              PHET COLORADO SOBERANO (165 SIMULAÇÕES HTML5)
            </span>
            <span className="phet-badge purple">
              <Brain size={12} />
              MÉTODO KUMON: MICRO-PASSOS L1, L2 & L3
            </span>
            <span className="phet-badge emerald">
              <Zap size={12} />
              CURVA DE EBBINGHAUS: ZERO ESQUECIMENTO SEMANAL
            </span>
          </div>
          <h3>
            <Layers size={22} className="text-cyan-400" />
            Laboratório Interativo STEM & Automaticidade Cognitiva
          </h3>
          <p>
            Engenharia reversa pedagógica: explore os fenômenos visuais antes do cálculo formal e elimine a sobrecarga aritmética na memória de trabalho.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PONTUAÇÃO DE MAESTRIA</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{masteryScore} XP</div>
          </div>
        </div>
      </div>

      {/* SELETOR DE TÓPICOS CANÔNICOS */}
      <div className="phet-topics-selector">
        {MASTER_TOPICS.map(topic => (
          <button
            key={topic.id}
            type="button"
            className={`phet-topic-chip ${selectedTopicId === topic.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedTopicId(topic.id);
              setAnswers({});
              setEvaluations({});
              setShowExplanation({});
            }}
          >
            <span>{topic.title}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({topic.badge})</span>
          </button>
        ))}
      </div>

      {/* ABAS DE NAVEGAÇÃO INTERNA */}
      <div className="phet-nav-tabs">
        <button
          type="button"
          className={`phet-nav-tab ${activeTab === 'phet' ? 'active' : ''}`}
          onClick={() => setActiveTab('phet')}
        >
          <Atom size={16} />
          <span>1. Laboratório PhET Interativo</span>
        </button>

        <button
          type="button"
          className={`phet-nav-tab ${activeTab === 'kumon' ? 'active' : ''}`}
          onClick={() => setActiveTab('kumon')}
        >
          <Brain size={16} />
          <span>2. Micro-Drills Kumon (L1, L2, L3)</span>
        </button>

        <button
          type="button"
          className={`phet-nav-tab ${activeTab === 'ebbinghaus' ? 'active' : ''}`}
          onClick={() => setActiveTab('ebbinghaus')}
        >
          <Calendar size={16} />
          <span>3. Cronograma Quinta-a-Quinta (Repetição Espaçada)</span>
        </button>
      </div>

      {/* ABA 1: SIMULAÇÃO PHET INTERATIVA */}
      {activeTab === 'phet' && (
        <div className="phet-sim-card">
          <div className="phet-sim-toolbar">
            <div className="phet-sim-toolbar-title">
              <span className="phet-badge cyan">{currentTopic.phetTitle}</span>
              <span>•</span>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Habilidade BNCC: {currentTopic.bncc}</span>
            </div>

            <div className="phet-sim-toolbar-actions">
              <button
                type="button"
                className="phet-tool-btn"
                onClick={() => {
                  const iframe = document.getElementById('phet-viewer-frame') as HTMLIFrameElement;
                  if (iframe) iframe.src = iframe.src;
                }}
                title="Reiniciar simulação"
              >
                <RotateCcw size={13} />
                <span>Reiniciar</span>
              </button>

              <button
                type="button"
                className="phet-tool-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Alternar tela cheia"
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{isFullscreen ? 'Reduzir' : 'Tela Cheia'}</span>
              </button>

              <a
                href={currentTopic.phetUrl}
                target="_blank"
                rel="noreferrer"
                className="phet-tool-btn"
                style={{ textDecoration: 'none' }}
                title="Abrir em aba externa"
              >
                <ExternalLink size={13} />
                <span>PhET Original</span>
              </a>
            </div>
          </div>

          <div className="phet-iframe-wrapper" style={{ height: isFullscreen ? '85vh' : '580px' }}>
            <iframe
              id="phet-viewer-frame"
              src={currentTopic.phetUrl}
              title={currentTopic.phetTitle}
              className="phet-iframe"
              allowFullScreen
            />
          </div>

          <div className="phet-canon-footer">
            <div className="phet-canon-ref">
              <BookOpen size={14} className="text-cyan-400" />
              <span><strong>Referência Bibliográfica Canônica:</strong> {currentTopic.canonRef}</span>
            </div>
            <div style={{ color: '#64748b' }}>
              Simulador Autônomo PhET Interactive Simulations (University of Colorado Boulder) • Licença CC-BY 4.0
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: MICRO-DRILLS KUMON (L1, L2, L3) */}
      {activeTab === 'kumon' && (
        <div className="kumon-drills-container">
          {/* NÍVEL L1: AUTOMATICIDADE ARITMÉTICA */}
          <div className="kumon-level-card">
            <div className="kumon-level-header">
              <div className="kumon-level-title">
                <span className="kumon-level-tag l1">NÍVEL L1</span>
                <h4>Automaticidade Aritmética & Fluência de Cálculo (Zero Calculadora)</h4>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Foco: Eliminar bloqueios em tabuada, frações e potências de 10
              </span>
            </div>

            {currentTopic.drillsL1.map(drill => (
              <div key={drill.id} className="kumon-drill-item">
                <div className="kumon-drill-question">
                  <strong>{drill.drill}</strong>
                </div>

                <div className="kumon-drill-input-group">
                  <input
                    type="text"
                    className="kumon-input"
                    placeholder="Sua resposta..."
                    value={answers[drill.id] || ''}
                    onChange={e => handleAnswerChange(drill.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCheckAnswer(drill)}
                  />
                  <button
                    type="button"
                    className="kumon-check-btn"
                    onClick={() => handleCheckAnswer(drill)}
                  >
                    Verificar
                  </button>

                  {evaluations[drill.id] === 'correct' && (
                    <span className="kumon-feedback-pill correct">
                      <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Correto! (+25 XP)
                    </span>
                  )}
                  {evaluations[drill.id] === 'incorrect' && (
                    <span className="kumon-feedback-pill incorrect">
                      <XCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Tente novamente
                    </span>
                  )}

                  <button
                    type="button"
                    className="phet-tool-btn"
                    style={{ padding: '5px 8px' }}
                    onClick={() => toggleExplanation(drill.id)}
                    title="Ver raciocínio"
                  >
                    <HelpCircle size={13} />
                  </button>
                </div>

                {showExplanation[drill.id] && (
                  <div style={{ width: '100%', marginTop: 8, padding: '8px 12px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 6, fontSize: '0.78rem', color: '#7dd3fc' }}>
                    💡 <strong>Raciocínio Kumon:</strong> {drill.explanation} (Gabarito: <code>{drill.ans}</code>)
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* NÍVEL L2: RACIOCÍNIO ALGÉBRICO & PROPORÇÕES */}
          <div className="kumon-level-card">
            <div className="kumon-level-header">
              <div className="kumon-level-title">
                <span className="kumon-level-tag l2">NÍVEL L2</span>
                <h4>Manipulação Algébrica & Proporcionalidade Direta e Inversa</h4>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Foco: Isolar incógnitas sem decorar regras decoradas
              </span>
            </div>

            {currentTopic.drillsL2.map(drill => (
              <div key={drill.id} className="kumon-drill-item">
                <div className="kumon-drill-question">
                  <strong>{drill.drill}</strong>
                </div>

                <div className="kumon-drill-input-group">
                  <input
                    type="text"
                    className="kumon-input"
                    placeholder="Sua resposta..."
                    value={answers[drill.id] || ''}
                    onChange={e => handleAnswerChange(drill.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCheckAnswer(drill)}
                  />
                  <button
                    type="button"
                    className="kumon-check-btn"
                    onClick={() => handleCheckAnswer(drill)}
                  >
                    Verificar
                  </button>

                  {evaluations[drill.id] === 'correct' && (
                    <span className="kumon-feedback-pill correct">
                      <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Excelente! (+25 XP)
                    </span>
                  )}
                  {evaluations[drill.id] === 'incorrect' && (
                    <span className="kumon-feedback-pill incorrect">
                      <XCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Revise a proporção
                    </span>
                  )}

                  <button
                    type="button"
                    className="phet-tool-btn"
                    style={{ padding: '5px 8px' }}
                    onClick={() => toggleExplanation(drill.id)}
                    title="Ver raciocínio"
                  >
                    <HelpCircle size={13} />
                  </button>
                </div>

                {showExplanation[drill.id] && (
                  <div style={{ width: '100%', marginTop: 8, padding: '8px 12px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: 6, fontSize: '0.78rem', color: '#d8b4fe' }}>
                    💡 <strong>Raciocínio Algébrico:</strong> {drill.explanation} (Gabarito: <code>{drill.ans}</code>)
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* NÍVEL L3: APLICAÇÃO INTEGRADA EM VESTIBULARES REGIONAIS */}
          <div className="kumon-level-card">
            <div className="kumon-level-header">
              <div className="kumon-level-title">
                <span className="kumon-level-tag l3">NÍVEL L3</span>
                <h4>Aplicação Integrada de Exames (ENEM, PAS-UnB, UFG, UniRV, UFMG)</h4>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Foco: Resolução contextualizada de alta complexidade com rigor conceitual
              </span>
            </div>

            {currentTopic.drillsL3.map(drill => (
              <div key={drill.id} className="kumon-drill-item">
                <div className="kumon-drill-question">
                  <strong>{drill.drill}</strong>
                </div>

                <div className="kumon-drill-input-group">
                  <input
                    type="text"
                    className="kumon-input"
                    placeholder="Sua resposta..."
                    value={answers[drill.id] || ''}
                    onChange={e => handleAnswerChange(drill.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCheckAnswer(drill)}
                  />
                  <button
                    type="button"
                    className="kumon-check-btn"
                    onClick={() => handleCheckAnswer(drill)}
                  >
                    Verificar
                  </button>

                  {evaluations[drill.id] === 'correct' && (
                    <span className="kumon-feedback-pill correct">
                      <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Perfeito! (+25 XP)
                    </span>
                  )}
                  {evaluations[drill.id] === 'incorrect' && (
                    <span className="kumon-feedback-pill incorrect">
                      <XCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Verifique as unidades
                    </span>
                  )}

                  <button
                    type="button"
                    className="phet-tool-btn"
                    style={{ padding: '5px 8px' }}
                    onClick={() => toggleExplanation(drill.id)}
                    title="Ver raciocínio"
                  >
                    <HelpCircle size={13} />
                  </button>
                </div>

                {showExplanation[drill.id] && (
                  <div style={{ width: '100%', marginTop: 8, padding: '8px 12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 6, fontSize: '0.78rem', color: '#6ee7b7' }}>
                    💡 <strong>Resolução Passo a Passo:</strong> {drill.explanation} (Gabarito: <code>{drill.ans}</code>)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: CRONOGRAMA QUINTA-A-QUINTA (REPETIÇÃO ESPAÇADA) */}
      {activeTab === 'ebbinghaus' && (
        <div className="kumon-level-card">
          <div className="kumon-level-header">
            <div className="kumon-level-title">
              <span className="kumon-level-tag l3">PROTOCOLO SOBERANO</span>
              <h4>Estratégia Quinta-a-Quinta: Superação da Curva do Esquecimento de Hermann Ebbinghaus</h4>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Micro-estímulos diários de 3 a 5 minutos entregues no App Mobile do Aluno
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Na rotina escolar tradicional, um aluno que tem aula de física na quinta-feira fica até 168 horas sem contato com o tema. Pela Curva do Esquecimento de Ebbinghaus, ele retém menos de 15% do conteúdo na semana seguinte. O Áquila Pro agenda micro-desafios graduais para consolidar a memória de longo prazo:
          </p>

          <div className="ebbinghaus-timeline">
            {currentTopic.spacedSchedule.map((step, idx) => (
              <div key={idx} className="ebbinghaus-card">
                <div className="ebbinghaus-day">
                  <Calendar size={13} />
                  <span>{step.day}</span>
                </div>
                <div className="ebbinghaus-focus">{step.focus}</div>
                <div className="ebbinghaus-desc">{step.description}</div>
                <div className="ebbinghaus-duration">Duração: {step.duration}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
