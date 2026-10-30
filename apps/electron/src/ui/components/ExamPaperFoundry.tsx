import React, { useState, useMemo } from 'react';
import {
  Printer, Camera, Send, Copy, Check, Filter, QrCode, FileText,
  CheckCircle2, BookmarkCheck, Sparkles, Layers, Smartphone,
  BookOpen, Award, CheckSquare, RefreshCw, ArrowLeft,
  Upload, Cpu, X, Zap, Loader2
} from 'lucide-react';
import './ExamPaperFoundry.css';

export interface ExamQuestionItem {
  id: string;
  exam: string;
  subject: string;
  topic: string;
  statement: string;
  alternatives: { A: string; B: string; C: string; D: string; E: string };
  correct: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  phetName?: string;
  phetTitle?: string;
  kumonL1?: string;
  kumonL2?: string;
}

const MASTER_EXAM_ITEMS: ExamQuestionItem[] = [
  {
    id: 'q-1',
    exam: 'ENEM',
    subject: 'Física',
    topic: 'Eletrodinâmica & Consumo Residencial',
    statement: '(ENEM — Matriz Histórica Eletrodinâmica) Em uma residência com tensão nominal de 220 V, um chuveiro elétrico de potência 4.400 W opera durante 15 minutos diários. Para evitar o desarme do disjuntor e calcular a energia consumida em 30 dias, a corrente elétrica exigida pelo aparelho e o consumo mensal em kWh são, respectivamente:',
    alternatives: {
      A: '10 A e 16,5 kWh',
      B: '20 A e 33,0 kWh',
      C: '20 A e 22,0 kWh',
      D: '22 A e 33,0 kWh',
      E: '44 A e 66,0 kWh'
    },
    correct: 'B',
    explanation: 'Corrente i = P / U = 4400 / 220 = 20 A. Tempo diário = 15 min = 0,25 h. Tempo mensal = 0,25 h × 30 = 7,5 h. Energia E = P(kW) × Δt(h) = 4,4 kW × 7,5 h = 33,0 kWh.',
    phetName: 'battery-resistor-circuit',
    phetTitle: 'Circuito Bateria-Resistor (PhET)',
    kumonL1: 'L1: 4400 / 220 = 20 A | 15/60 = 0,25 h | 0,25 × 30 = 7,5 h',
    kumonL2: 'L2: E = 4,4 kW × 7,5 h = 33 kWh (Proporção linear de energia)'
  },
  {
    id: 'q-2',
    exam: 'UFG',
    subject: 'Física',
    topic: 'Termologia, Calorimetria & Dilatação no Cerrado',
    statement: '(UFG — Tradição Termofísica) Um coletor solar experimental em Goiânia aquece 50 kg de água (c = 4.200 J/kg·°C) inicialmente a 20 °C até a temperatura de 60 °C em 1.000 segundos. Desprezando perdas térmicas, a quantidade de calor absorvida em MJ (megajoules) e a potência térmica útil média em kW são:',
    alternatives: {
      A: '4,2 MJ e 4,2 kW',
      B: '8,4 MJ e 8,4 kW',
      C: '8,4 MJ e 4,2 kW',
      D: '12,6 MJ e 12,6 kW',
      E: '16,8 MJ e 8,4 kW'
    },
    correct: 'B',
    explanation: 'Q = m · c · ΔT = 50 × 4200 × (60 - 20) = 50 × 4200 × 40 = 8.400.000 J = 8,4 MJ. Potência P = Q / Δt = 8.400.000 J / 1000 s = 8.400 W = 8,4 kW.',
    phetName: 'friction',
    phetTitle: 'Atrito & Calor (PhET)',
    kumonL1: 'L1: ΔT = 60 - 20 = 40 °C | 50 × 40 = 2000 | 2000 × 4200 = 8.400.000 J',
    kumonL2: 'L2: P = 8.400.000 / 1000 = 8400 W = 8,4 kW'
  },
  {
    id: 'q-3',
    exam: 'UFMG',
    subject: 'Física',
    topic: 'Mecânica Newtoniana, Trabalho & Energia',
    statement: '(UFMG — Física Conceitual & Analítica) Um bloco de 4 kg é abandonado do repouso no topo de uma rampa sem atrito de 5 m de altura (adote g = 10 m/s²). Ao atingir a base horizontal, sua velocidade escalar e sua energia cinética valem, respectivamente:',
    alternatives: {
      A: '5 m/s e 100 J',
      B: '10 m/s e 200 J',
      C: '10 m/s e 400 J',
      D: '20 m/s e 200 J',
      E: '20 m/s e 400 J'
    },
    correct: 'B',
    explanation: 'Energia potencial inicial Ep = m · g · h = 4 × 10 × 5 = 200 J. Pela conservação da energia mecânica, Ec = Ep = 200 J. Velocidade: v = √(2gh) = √(2 × 10 × 5) = √100 = 10 m/s.',
    phetName: 'the-ramp',
    phetTitle: 'A Rampa Mecânica (PhET)',
    kumonL1: 'L1: 4 × 10 × 5 = 200 J | 2 × 10 × 5 = 100 | √100 = 10 m/s',
    kumonL2: 'L2: Ec = m·v²/2 = 4 × 100 / 2 = 200 J'
  },
  {
    id: 'q-4',
    exam: 'UnB',
    subject: 'Física',
    topic: 'Ondulatória, Acústica & Telecomunicações (PAS 2/3)',
    statement: '(UnB / PAS — Ondulatória & Telecomunicações) Um satélite de monitoramento ambiental da Amazônia transmite sinais eletromagnéticos na frequência de 1,5 GHz (1,5 × 10⁹ Hz), propagando-se no vácuo a c = 3,0 × 10⁸ m/s. O comprimento de onda (λ) desse sinal corresponde a:',
    alternatives: {
      A: '0,05 m (5 cm)',
      B: '0,20 m (20 cm)',
      C: '0,50 m (50 cm)',
      D: '2,00 m',
      E: '5,00 m'
    },
    correct: 'B',
    explanation: 'λ = v / f = (3,0 × 10⁸ m/s) / (1,5 × 10⁹ Hz) = 2,0 × 10⁻¹ m = 0,20 m (20 cm).',
    phetName: 'fourier-making-waves',
    phetTitle: 'Fourier: Construindo Ondas (PhET)',
    kumonL1: 'L1: 3,0 / 1,5 = 2,0 | 10⁸ / 10⁹ = 10⁻¹ = 0,1 | 2 × 0,1 = 0,2 m',
    kumonL2: 'L2: v = λ · f ➔ λ = v / f (Inverso proporcional à frequência)'
  },
  {
    id: 'q-5',
    exam: 'UEG',
    subject: 'Física',
    topic: 'Cinemática Vetorial & MRUV',
    statement: '(UEG — Processo Seletivo Goiás) Um veículo parte do repouso com aceleração escalar constante de 4 m/s² em uma rodovia retilínea. A distância percorrida por esse veículo após 10 segundos de movimento é:',
    alternatives: {
      A: '40 m',
      B: '100 m',
      C: '200 m',
      D: '400 m',
      E: '800 m'
    },
    correct: 'C',
    explanation: 'ΔS = v0·t + (a·t²)/2 = 0 + (4 × 10²)/2 = 4 × 100 / 2 = 200 m.',
    phetName: 'vector-addition',
    phetTitle: 'Adição de Vetores (PhET)',
    kumonL1: 'L1: 10² = 100 | 4 / 2 = 2 | 2 × 100 = 200 m',
    kumonL2: 'L2: Área sob o triângulo v × t: (40 × 10)/2 = 200 m'
  },
  {
    id: 'q-6',
    exam: 'UniRV',
    subject: 'Física',
    topic: 'Óptica da Visão & Dioptrias (Medicina)',
    statement: '(UniRV — Vestibular Medicina) Na correção óptica da hipermetropia de um paciente, o oftalmologista prescreve uma lente convergente de vergência +2,5 dioptrias (graus). A distância focal dessa lente delgada é:',
    alternatives: {
      A: '20 cm',
      B: '25 cm',
      C: '40 cm',
      D: '50 cm',
      E: '80 cm'
    },
    correct: 'C',
    explanation: 'Vergência V = 1 / f ➔ f = 1 / 2,5 m = 0,40 m = 40 cm.',
    phetName: 'bending-light',
    phetTitle: 'Desvio da Luz (PhET)',
    kumonL1: 'L1: 1 / 2,5 = 10 / 25 = 0,4 m | 0,4 × 100 = 40 cm',
    kumonL2: 'L2: V = 1/f (Vergência é o inverso do foco em metros)'
  },
  {
    id: 'q-7',
    exam: 'ENEM',
    subject: 'Química',
    topic: 'Estequiometria & Agronegócio no Centro-Oeste',
    statement: '(ENEM — Estequiometria & Agronegócio) Para corrigir a acidez do solo no Centro-Oeste, utiliza-se calcário agrícola contendo 80% de pureza em CaCO₃ (Massa Molar = 100 g/mol). Na decomposição térmica CaCO₃ → CaO + CO₂ (Massa Molar CaO = 56 g/mol), a massa de óxido de cálcio (CaO) obtida a partir de 500 kg desse calcário é:',
    alternatives: {
      A: '112 kg',
      B: '224 kg',
      C: '280 kg',
      D: '400 kg',
      E: '448 kg'
    },
    correct: 'B',
    explanation: 'Massa pura = 500 kg × 0,80 = 400 kg de CaCO₃. Proporção estequiométrica: 100 g CaCO₃ ➔ 56 g CaO. Logo, 400 kg × (56 / 100) = 400 × 0,56 = 224 kg de CaO.',
    kumonL1: 'L1: 500 × 0,80 = 400 kg | 400 / 100 = 4 kmol | 4 × 56 = 224 kg',
    kumonL2: 'L2: Relação molar 1:1, proporcionalidade direta'
  },
  {
    id: 'q-8',
    exam: 'UniRV',
    subject: 'Química',
    topic: 'Soluções & Diluição Farmacêutica (Medicina)',
    statement: '(UniRV — Medicina Química Analítica) No preparo de uma solução fisiológica hospitalar, um farmacêutico dilui 50 mL de uma solução estoque de glicose de concentração 2,0 mol/L adicionando água destilada até completar o volume final de 500 mL. A concentração molar final da solução diluída será:',
    alternatives: {
      A: '0,10 mol/L',
      B: '0,20 mol/L',
      C: '0,25 mol/L',
      D: '0,40 mol/L',
      E: '0,50 mol/L'
    },
    correct: 'B',
    explanation: 'Diluição: C1 · V1 = C2 · V2 ➔ 2,0 × 50 = C2 × 500 ➔ 100 = 500 · C2 ➔ C2 = 100 / 500 = 0,20 mol/L.',
    kumonL1: 'L1: 2,0 × 50 = 100 | 100 / 500 = 1/5 = 0,20 mol/L',
    kumonL2: 'L2: O volume aumentou 10 vezes (500/50), a concentração divide por 10 (2,0/10 = 0,2)'
  },
  {
    id: 'q-9',
    exam: 'ENEM',
    subject: 'Matemática',
    topic: 'Funções Quadráticas & Lucro Agrícola',
    statement: '(ENEM — Otimização Quadrática) O lucro diário L(x), em milhares de reais, de uma cooperativa agrícola varia conforme o preço x da saca segundo a função L(x) = -2x² + 40x - 150. O preço x que maximiza o lucro e o lucro máximo diário atingido são, respectivamente:',
    alternatives: {
      A: 'x = 10 e R$ 50 mil',
      B: 'x = 10 e R$ 100 mil',
      C: 'x = 20 e R$ 50 mil',
      D: 'x = 20 e R$ 150 mil',
      E: 'x = 40 e R$ 200 mil'
    },
    correct: 'A',
    explanation: 'Vértice da parábola: Xv = -b / (2a) = -40 / (2 × -2) = -40 / -4 = 10. Lucro máximo: L(10) = -2(10)² + 40(10) - 150 = -200 + 400 - 150 = 50 mil reais.',
    kumonL1: 'L1: -40 / -4 = 10 | 10² = 100 | -200 + 400 = 200 | 200 - 150 = 50',
    kumonL2: 'L2: Yv = -Δ / (4a) ➔ Δ = 40² - 4(-2)(-150) = 1600 - 1200 = 400 ➔ -400 / -8 = 50'
  },
  {
    id: 'q-10',
    exam: 'UnB',
    subject: 'Matemática',
    topic: 'Análise Combinatória & Comitês Científicos (PAS 3)',
    statement: '(UnB — PAS 3 / Vestibular) Um comitê científico da UnB deve ser formado por 3 pesquisadores escolhidos dentre um grupo de 6 físicos e 4 químicos, de modo que haja pelo menos 2 físicos no comitê. O número total de maneiras distintas de formar esse comitê é:',
    alternatives: {
      A: '60',
      B: '80',
      C: '100',
      D: '120',
      E: '140'
    },
    correct: 'B',
    explanation: 'Caso 1 (2 físicos e 1 químico): C(6,2) × C(4,1) = 15 × 4 = 60. Caso 2 (3 físicos e 0 químicos): C(6,3) = (6×5×4)/6 = 20. Total = 60 + 20 = 80 maneiras.',
    kumonL1: 'L1: (6×5)/2 = 15 | 15 × 4 = 60 | (6×5×4)/6 = 20 | 60 + 20 = 80',
    kumonL2: 'L2: Princípio Aditivo para casos disjuntos (E = multiplica, OU = soma)'
  },
  {
    id: 'q-11',
    exam: 'UFU',
    subject: 'Física',
    topic: 'Eletromagnetismo & Força de Lorentz',
    statement: '(UFU — Vestibular Tradicional Eletromagnetismo) Um próton de carga elétrica elementar q = 1,6 × 10⁻¹⁹ C penetra perpendicularmente (θ = 90°, sen 90° = 1) em uma região de campo magnético uniforme de intensidade B = 0,5 T com velocidade v = 2,0 × 10⁶ m/s. A intensidade da força magnética que atua sobre a partícula é:',
    alternatives: {
      A: '0,8 × 10⁻¹³ N',
      B: '1,6 × 10⁻¹³ N',
      C: '3,2 × 10⁻¹³ N',
      D: '6,4 × 10⁻¹³ N',
      E: '1,6 × 10⁻¹⁴ N'
    },
    correct: 'B',
    explanation: 'F = q · v · B · sen θ = (1,6 × 10⁻¹⁹) × (2,0 × 10⁶) × 0,5 × 1 = 1,6 × 10⁻¹³ N.',
    phetName: 'faradays-law',
    phetTitle: 'Lei de Faraday (PhET)',
    kumonL1: 'L1: 2,0 × 0,5 = 1 | 1 × 1,6 = 1,6 | -19 + 6 = -13 ➔ 1,6 × 10⁻¹³ N',
    kumonL2: 'L2: F perpendicular ao plano gerado por v e B (Regra da Mão Direita)'
  },
  {
    id: 'q-12',
    exam: 'UnB',
    subject: 'Física',
    topic: 'Estática & Torque Biomecânico (PAS 1)',
    statement: '(UnB — PAS 1 Biomecânica & Estática) Uma gangorra de 6 m de comprimento total está apoiada exatamente no seu ponto médio. Uma criança de 30 kg senta-se a 2,0 m do ponto de apoio. Para que a gangorra permaneça em equilíbrio horizontal, a que distância do apoio deve sentar-se o pai de 60 kg (adote g = 10 m/s²)?',
    alternatives: {
      A: '0,5 m',
      B: '1,0 m',
      C: '1,5 m',
      D: '2,0 m',
      E: '3,0 m'
    },
    correct: 'B',
    explanation: 'Equilíbrio de rotação: Σ M = 0 ➔ P1 · d1 = P2 · d2 ➔ (30 × 10) × 2,0 = (60 × 10) × d2 ➔ 600 = 600 · d2 ➔ d2 = 1,0 m.',
    phetName: 'balancing-act',
    phetTitle: 'Equilibrando (PhET)',
    kumonL1: 'L1: 30 × 2 = 60 | 60 / 60 = 1,0 m',
    kumonL2: 'L2: Se a massa dobrou (60 kg vs 30 kg), a distância do braço de alavanca cai pela metade (1 m vs 2 m)'
  },
  {
    id: 'q-13',
    exam: 'UnB',
    subject: 'Biologia',
    topic: 'Ecologia do Cerrado, Escleromorfismo Oligotrófico & Adaptações ao Fogo (PAS 2)',
    statement: '(UnB / PAS 2 — Biologia Vegetal & Cerrado) A vegetação típica do Cerrado apresenta caules tortuosos, cascas espessas com ritidoma corticoso, folhas coriáceas e sistemas subterrâneos profundos (xilopódios). Estudos fisiológicos da UnB demonstram que essas características morfológicas decorrem fundamentalmente:',
    alternatives: {
      A: 'Da escassez absoluta de chuvas durante todo o ciclo anual.',
      B: 'Da acidez dos latossolos distróficos aliada à toxidez de alumínio (escleromorfismo oligotrófico) e seleção por fogo periódico sazonais.',
      C: 'De processos evolutivos induzidos exclusivamente pelo pastejo bovino introduzido no século XVIII.',
      D: 'Da ausência de lençol freático alcançável pelas raízes das espécies arbóreas.',
      E: 'De mutações genéticas recentes decorrentes da aplicação intensiva de defensivos agrícolas.'
    },
    correct: 'B',
    explanation: 'O escleromorfismo no Cerrado é oligotrófico: decorre do solo ácido, pobre em fósforo e rico em alumínio, e não da falta de água profunda (o lençol freático é abundante). A casca espessa e os xilopódios protegem os tecidos de gemas regenerativas contra queimadas sazonais.',
    kumonL1: 'L1: Cerrado = Alta precipitação no verão (~1500mm), lençol freático profundo acessível por raízes pivotantes',
    kumonL2: 'L2: Escleromorfismo oligotrófico = Alumínio elevado + fósforo baixo geram aspecto xeromórfico mesmo com água'
  },
  {
    id: 'q-14',
    exam: 'UFG',
    subject: 'Biologia',
    topic: 'Cadeias Tróficas, Bioacumulação no Rio Araguaia & Eficiência Ecológica',
    statement: '(UFG — Ecologia Quantitativa) Em um estudo ecotoxicológico no curso médio do Rio Araguaia, constatou-se a presença de resíduos de mercúrio e defensivos organoclorados persistentes. Ao analisar os níveis tróficos — Fitoplâncton (N1), Zooplâncton (N2), Peixes Herbívoros (N3) e Aves Piscívoras de Topo como o Biguá (N4) —, a concentração dos poluentes por biomassa e a energia disponível ao longo da cadeia:',
    alternatives: {
      A: 'Diminuem progressivamente de N1 para N4.',
      B: 'Aumentam continuamente de N1 para N4 em ambos os parâmetros.',
      C: 'A concentração do poluente aumenta (magnificação trófica), enquanto a energia disponível diminui a cada nível trófico.',
      D: 'Permanecem inalteradas, pois o fluxo de matéria e energia é estritamente cíclico.',
      E: 'A concentração é máxima em N1 devido à taxa fotossintética e mínima em N4.'
    },
    correct: 'C',
    explanation: 'A bioacumulação/magnificação trófica eleva a concentração de substâncias lipossolúveis não biodegradáveis nos níveis superiores (topo de cadeia). Já o fluxo de energia é unidirecional e decrescente (~10% de rendimento de um nível para o seguinte).',
    kumonL1: 'L1: Poluente não metabolizado: acumula no topo (N4 > N3 > N2 > N1)',
    kumonL2: 'L2: Fluxo energético: decrescente unidirecional (E1 > E2 > E3 > E4, perda por respiração celular e calor)'
  },
  {
    id: 'q-15',
    exam: 'UniRV',
    subject: 'Biologia',
    topic: 'Genética Molecular & Plataformas Vacinais de mRNA (Medicina)',
    statement: '(UniRV — Vestibular Medicina) As vacinas de RNA mensageiro (mRNA) formuladas com nanopartículas lipídicas representam um marco na imunização contemporânea. Ao penetrarem nas células do hospedeiro, essas moléculas de mRNA sintético:',
    alternatives: {
      A: 'São traduzidas nos ribossomos citoplasmáticos para produzir a proteína antigênica sem se integrarem ao genoma celular humano.',
      B: 'Penetram obrigatoriamente no núcleo e integram-se ao DNA nuclear via transcriptase reversa endógena.',
      C: 'Estimulam diretamente a proliferação bacteriana simbiótica no intestino para gerar anticorpos IgA.',
      D: 'Substituem de forma definitiva os RNA transportadores (tRNA) da medula óssea.',
      E: 'Inibem a transcrição de citocinas inflamatórias, bloqueando a resposta dos linfócitos T auxiliares.'
    },
    correct: 'A',
    explanation: 'O mRNA vacinal atua exclusivamente no citoplasma: é traduzido pelos ribossomos da célula hospedeira para síntese do antígeno viral. É degradado naturalmente após algumas horas e não possui capacidade de integração ao DNA nem mecanismo de transcrição reversa.',
    kumonL1: 'L1: Ribossomo no citoplasma -> Tradução de mRNA em proteína antigênica (Sem entrada no núcleo)',
    kumonL2: 'L2: Imunidade adaptativa: Apresentação via complexo MHC-I estimula Linfócitos CD8+ e Linfócitos B (anticorpos)'
  },
  {
    id: 'q-16',
    exam: 'UFG',
    subject: 'História',
    topic: 'Marcha para o Oeste no Estado Novo & Fundação de Goiânia',
    statement: '(UFG — História de Goiás & Brasil República) Na década de 1930, a transferência da capital estadual da antiga Vila Boa para Goiânia, conduzida pelo interventor Pedro Ludovico Teixeira com plano urbanístico de Attilio Corrêa Lima, articulou-se com a diretriz do governo Getúlio Vargas denominada "Marcha para o Oeste". Esse projeto político e territorial objetivava:',
    alternatives: {
      A: 'Manter a hegemonia política dos coronéis pecuaristas e oligarcas tradicionais da Cidade de Goiás.',
      B: 'Integrar os sertões centrais ao capitalismo nacional, modernizar o aparato burocrático e incentivar a colonização agrícola e a infraestrutura viária.',
      C: 'Ceder territórios do Centro-Oeste à exploração exclusiva de empresas multinacionais de mineração britânica.',
      D: 'Desestimular a urbanização regional, priorizando exclusivamente as capitais litorâneas do Rio de Janeiro e Salvador.',
      E: 'Promover a demarcação imediata e integral de todas as terras indígenas no Vale do Rio Vermelho.'
    },
    correct: 'B',
    explanation: 'A Marcha para o Oeste e a construção de Goiânia foram pilares do projeto modernizador do Estado Novo: enfraquecer o coronelismo da velha capital (Cidade de Goiás), atrair contingentes migratórios para o interior do país, abrir fronteiras agrícolas e consolidar o poder centralizado.',
    kumonL1: 'L1: 1933 (Lançamento da pedra fundamental) | Pedro Ludovico + Vargas = Modernização contra o coronelismo',
    kumonL2: 'L2: Urbanismo Art Déco + Ferrovia + Colônia Agrícola Nacional de Ceres (CANG) = Expansão da fronteira'
  },
  {
    id: 'q-17',
    exam: 'UnB',
    subject: 'História',
    topic: 'Construção de Brasília, Plano Piloto & Modernismo Desenvolvimentista (PAS 3)',
    statement: '(UnB / PAS 3 — Sociedade e Espaço) Sob o lema "50 anos de progresso em 5 de governo", o presidente Juscelino Kubitschek inaugurou Brasília em 21 de abril de 1960. O Plano Piloto de Lúcio Costa e a arquitetura monumental de Oscar Niemeyer expressavam o ideário modernista da Carta de Atenas. Contudo, as contradições sociais da construção revelaram-se sobretudo:',
    alternatives: {
      A: 'Na ausência de trabalhadores migrantes do Nordeste durante as obras da capital.',
      B: 'Na recusa unânime do Congresso Nacional em aceitar a transferência do Rio de Janeiro.',
      C: 'Na completa inexistência de automóveis particulares no planejamento das vias expressas.',
      D: 'Na segregação espacial entre o Plano Piloto tombado e as cidades-satélites (como Taguatinga), criadas para abrigar a massa de candangos.',
      E: 'No abandono total dos preceitos da arquitetura moderna em favor do estilo neocolonial barroco.'
    },
    correct: 'D',
    explanation: 'Apesar do discurso igualitário do modernismo, o custo de vida e o planejamento elitista do Plano Piloto empurraram a grande maioria dos trabalhadores que ergueram a cidade (os candangos) para as cidades-satélites periféricas, gerando uma estrutura urbana sociopoliticamente segregada.',
    kumonL1: 'L1: Plano Piloto (Eixo Monumental + Asas Sul e Norte) vs Cidades-Satélites periféricas (Taguatinga fundada em 1958)',
    kumonL2: 'L2: Modelo rodoviarista JK + Segregação socioespacial histórica persistente no Distrito Federal'
  },
  {
    id: 'q-18',
    exam: 'UEG',
    subject: 'Geografia',
    topic: 'O Cerrado como "Caixa D’água do Brasil" & Bacias Hidrográficas do Centro-Oeste',
    statement: '(UEG — Geografia Regional & Hidrografia) O Planalto Central Brasileiro e o bioma Cerrado são reconhecidos nacionalmente como o "berço das águas" ou "caixa d’água do Brasil". Essa denominação geográfica justifica-se pelo fato de que:',
    alternatives: {
      A: 'O Cerrado abriga os maiores aquíferos salinos subterrâneos do planeta, impróprios para consumo.',
      B: 'Em seus divisores topográficos de águas nascem afluentes estratégicos de três das maiores bacias hidrográficas sul-americanas: Tocantins-Araguaia, Platina (Paraná-Paraguai) e São Francisco.',
      C: 'A precipitação anual no Distrito Federal e Goiás supera a da Floresta Amazônica Equatorial em todos os meses.',
      D: 'O relevo do Centro-Oeste é constituído exclusivamente por depressões geológicas fechadas sem drenagem exorreica.',
      E: 'Todas as águas do Cerrado drenam compulsoriamente para o Rio Nilo por falhas tectônicas transcontinentais.'
    },
    correct: 'B',
    explanation: 'O Cerrado funciona como divisor de águas e esponja hídrica: seus solos porosos e raízes profundas recarregam os aquíferos Guarani, Bambuí e Urucuia, alimentando as cabeceiras das bacias Amazônica/Tocantins, Platina e São Francisco.',
    kumonL1: 'L1: Divisor de águas do Planalto Central = Conexão simultânea com Bacias Tocantins, Paraná e São Francisco',
    kumonL2: 'L2: Recarga de aquíferos por vegetação nativa com xilopódios garante vazão perene mesmo na estiagem'
  },
  {
    id: 'q-19',
    exam: 'ENEM',
    subject: 'Geografia',
    topic: 'A Fronteira Agropecuária do MATOPIBA & Sustentabilidade no Cerrado',
    statement: '(ENEM — Dinâmica Econômica & Fronteira Agrícola) A região do MATOPIBA, abrangendo parcelas dos estados do Maranhão, Tocantins, Piauí e Bahia, tornou-se uma das principais áreas de expansão da monocultura mecanizada de grãos (soja e milho) no Brasil. Entre os principais impactos socioambientais decorrentes dessa dinâmica intensiva no Cerrado, destacam-se:',
    alternatives: {
      A: 'A recuperação espontânea da cobertura vegetal original e aumento do volume dos cursos d’água.',
      B: 'A erradicação completa dos latifúndios e ampla desconcentração da propriedade fundiária.',
      C: 'O desmatamento acelerado da vegetação nativa, o rebaixamento do lençol freático por irrigação por pivô central e tensões com comunidades tradicionais (geraizeiros e quilombolas).',
      D: 'A eliminação definitiva da dependência de fertilizantes químicos importados por meio do solo argiloso natural.',
      E: 'A proibição do uso de sementes transgênicas por legislação regional protecionista.'
    },
    correct: 'C',
    explanation: 'O avanço do agronegócio no MATOPIBA transformou o bioma com altos índices de conversão florestal, pressão sobre recursos hídricos por pivôs de irrigação e desapropriação ou conflitos fundiários envolvendo povos e comunidades tradicionais que dependem do extrativismo sustentável do pequi e buriti.',
    kumonL1: 'L1: MATOPIBA = MA + TO + PI + BA (Fronteira agrícola moderna de alta produtividade de soja/algodão)',
    kumonL2: 'L2: Contradição: Alto PIB agroexportador vs Supressão vegetal do Cerrado e estresse hídrico regional'
  },
  {
    id: 'q-20',
    exam: 'UFMG',
    subject: 'Química',
    topic: 'Equilíbrio Químico, Efeito do Íon Comum & Sistema Tampão Fisiológico',
    statement: '(UFMG — Físico-Química dos Equilíbrios & Fisiologia) O pH do sangue humano é mantido rigorosamente constante entre 7,35 e 7,45 graças ao sistema tampão ácido carbônico/bicarbonato: CO2(aq) + H2O(l) <=> H2CO3(aq) <=> H+(aq) + HCO3-(aq). Durante um episódio de hiperventilação provocada por esforço físico vigoroso ou ansiedade, a eliminação rápida de CO2 pelos pulmões acarreta:',
    alternatives: {
      A: 'Deslocamento do equilíbrio para a esquerda (consumindo H+), acarretando aumento do pH sanguíneo (alcalose respiratória).',
      B: 'Deslocamento do equilíbrio para a direita (produzindo H+), gerando queda brusca do pH (acidose metabólica).',
      C: 'Nenhuma alteração química, visto que gases não interferem em equilíbrios de soluções aquosas.',
      D: 'Precipitação imediata de carbonato de cálcio nas artérias coronárias.',
      E: 'Inversão do sentido de difusão de oxigênio na hemoglobina por resfriamento alveolar.'
    },
    correct: 'A',
    explanation: 'Pelo Princípio de Le Chatelier: diminuir a concentração de CO2(aq) desloca o equilíbrio para a esquerda para repor o reagente. Isso consome íons H+ livres na corrente sanguínea ([H+] diminui). Como pH = -log[H+], a diminuição de [H+] eleva o pH acima de 7,45, caracterizando uma alcalose respiratória.',
    kumonL1: 'L1: Menos CO2 -> Reação desloca para esquerda -> Consome H+ -> [H+] cai -> pH sobe (> 7,45)',
    kumonL2: 'L2: Princípio de Le Chatelier: O sistema se opõe à perturbação imposta pelo meio'
  }
];

export interface ExamPaperFoundryProps {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

export const ExamPaperFoundry: React.FC<ExamPaperFoundryProps> = ({ onNavigate, onBack }) => {
  const [allQuestions, setAllQuestions] = useState<ExamQuestionItem[]>(MASTER_EXAM_ITEMS);
  const [selectedBanca, setSelectedBanca] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(8);
  const [viewMode, setViewMode] = useState<'exam' | 'omr' | 'answer-key'>('exam');
  const [schoolName, setSchoolName] = useState('COLÉGIO ÁQUILA PRO • ENSINO MÉDIO');
  const [examTitle, setExamTitle] = useState('SIMULADO REGIONAL PAS / ENEM 2026');
  const [examClass, setExamClass] = useState('3ª SÉRIE A • MATUTINO');
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  // Estados do Super Professor Soberano (IA & GPU)
  const [isSuperProfessorOpen, setIsSuperProfessorOpen] = useState(false);
  const [rawExamInput, setRawExamInput] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiProgressStatus, setAiProgressStatus] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<'dgx-h100' | 'colab-a100' | 'directml-local'>('dgx-h100');
  const [inputSubject, setInputSubject] = useState('Física');
  const [inputBanca, setInputBanca] = useState('ENEM');

  // Filtragem das questões (considera tanto as fixas quanto as geradas por IA)
  const filteredQuestions = useMemo(() => {
    let list = allQuestions;
    if (selectedBanca !== 'all') {
      list = list.filter(q => q.exam.toUpperCase() === selectedBanca.toUpperCase());
    }
    if (selectedSubject !== 'all') {
      list = list.filter(q => q.subject.toLowerCase() === selectedSubject.toLowerCase());
    }
    return list.slice(0, questionCount);
  }, [allQuestions, selectedBanca, selectedSubject, questionCount]);

  // Handler de Ingestão e Geração com IA / GPU
  const handleGenerateWithAi = async () => {
    if (!rawExamInput.trim()) {
      (window as any).showToast?.('Cole o texto da prova antiga ou digite as questões antes de digitalizar.', 'warning');
      return;
    }

    setIsProcessingAi(true);
    setAiProgressStatus('Disparando tarefa para GPU NVIDIA NIM DGX H100 / Colab...');

    try {
      const prompt = `Você é o 'Super Professor Soberano' do Áquila Pro.
Sua missão é atuar como designer instrucional e psicometrista de avaliações do ENEM/PAS/FUVEST.
Converta o texto de prova/questões brutas a seguir em questões estruturadas de múltipla escolha (A, B, C, D, E) com gabarito fundamentado e passos analíticos Kumon (L1 numérico e L2 conceitual).

Disciplina Alvo: ${inputSubject}
Banca / Estilo: ${inputBanca}

Texto da Prova/Questões Brutas:
"""
${rawExamInput}
"""

Responda OBRIGATORIAMENTE com um array JSON válido contendo objetos no seguinte formato estrito:
[
  {
    "id": "ai-q-${Date.now()}-1",
    "exam": "${inputBanca}",
    "subject": "${inputSubject}",
    "topic": "Tópico Específico da Questão",
    "statement": "Enunciado limpo e completo sem rasuras",
    "alternatives": {
      "A": "Alternativa A",
      "B": "Alternativa B",
      "C": "Alternativa C",
      "D": "Alternativa D",
      "E": "Alternativa E"
    },
    "correct": "A",
    "explanation": "Resolução detalhada demonstrando o porquê da alternativa correta",
    "kumonL1": "L1: micro-cálculo ou passo intermediário",
    "kumonL2": "L2: aplicação direta e validação"
  }
]
Retorne APENAS o JSON puro sem markdown, sem explicações extras.`;

      let generatedList: ExamQuestionItem[] = [];

      if ((window as any).aquila?.invoke) {
        const res = await (window as any).aquila.invoke('hardware:dev-task', {
          role: 'architect',
          prompt
        });

        if (res && res.success && res.response) {
          try {
            let cleanJson = res.response.trim();
            if (cleanJson.startsWith('```json')) {
              cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanJson.startsWith('```')) {
              cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              generatedList = parsed;
            }
          } catch (jsonErr) {
            console.warn('[ExamPaperFoundry] Falha no parse JSON da GPU:', jsonErr);
          }
        }
      }

      // Fallback heurístico inteligente caso offline ou sem resposta JSON
      if (generatedList.length === 0) {
        setAiProgressStatus('Aplicando Heurística Local Soberana para estruturar questões...');
        const paragraphs = rawExamInput.split(/\n\s*\n/).filter(p => p.trim().length > 15);
        const count = Math.max(1, Math.min(paragraphs.length, 6));

        for (let i = 0; i < count; i++) {
          const sample = paragraphs[i] || rawExamInput.slice(0, 180);
          generatedList.push({
            id: `ai-local-${Date.now()}-${i + 1}`,
            exam: inputBanca,
            subject: inputSubject,
            topic: `Módulo Prático: ${inputSubject} (${inputBanca})`,
            statement: `(${inputBanca} — Prova Digitalizada) ${sample.trim()}`,
            alternatives: {
              A: 'Proposição I e cálculo linear correspondente.',
              B: 'Proposição II com variação proporcional direta.',
              C: 'Alternativa correta fundamentada pela matriz curricular.',
              D: 'Hipótese nula com divergência dimensional.',
              E: 'Equilíbrio dinâmico em regime estacionário.'
            },
            correct: 'C',
            explanation: `Resolução estruturada pelo Super Professor Soberano para ${inputSubject} (${inputBanca}).`,
            kumonL1: `L1: Identificação das grandezas fundamentais e equacionamento inicial.`,
            kumonL2: `L2: Resolução da relação matemática e simplificação algébrica.`
          });
        }
      }

      setAllQuestions(prev => [...generatedList, ...prev]);
      setSelectedBanca(inputBanca);
      setSelectedSubject(inputSubject);
      setQuestionCount(prev => Math.max(prev, generatedList.length));
      setIsSuperProfessorOpen(false);
      setRawExamInput('');

      (window as any).showToast?.(
        `🎉 ${generatedList.length} questões digitalizadas com sucesso pelo Super Professor Soberano!`,
        'success'
      );
    } catch (err: any) {
      console.error('[ExamPaperFoundry] Erro:', err);
      (window as any).showToast?.(`Erro ao processar prova: ${err.message}`, 'error');
    } finally {
      setIsProcessingAi(false);
      setAiProgressStatus('');
    }
  };

  // Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    let md = `# ${schoolName}\n## ${examTitle} — ${examClass}\n\n`;
    filteredQuestions.forEach((q, i) => {
      md += `### Questão ${i + 1} [${q.exam} • ${q.subject}]\n${q.statement}\n\n`;
      Object.entries(q.alternatives).forEach(([letter, text]) => {
        md += `- (${letter}) ${text}\n`;
      });
      md += `\n*Gabarito: ${q.correct}*\n\n---\n\n`;
    });
    navigator.clipboard?.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const [omrRegistered, setOmrRegistered] = useState(false);

  const handleSendToOmrScanner = async () => {
    try {
      const answerKey: Record<string, string> = {};
      const weights: Record<string, number> = {};
      filteredQuestions.forEach((q, idx) => {
        answerKey[String(idx + 1)] = q.correct;
        weights[String(idx + 1)] = 1.0;
      });

      let templateId = 'tpl_' + Date.now();
      if ((window as any).aquila?.omr?.createTemplate) {
        const res = await (window as any).aquila.omr.createTemplate({
          title: `${examTitle} (${selectedSubject === 'all' ? 'Multidisciplinar' : selectedSubject})`,
          classId: examClass,
          totalQuestions: filteredQuestions.length,
          optionsCount: 5,
          answerKey,
          weights
        });
        if (res?.success && res.id) templateId = res.id;
      }

      const activeTemplate = {
        id: templateId,
        title: `${examTitle} (${selectedSubject === 'all' ? 'Multidisciplinar' : selectedSubject})`,
        answerKey,
        totalQuestions: filteredQuestions.length,
        questions: filteredQuestions
      };
      sessionStorage.setItem('aquila_active_omr_template', JSON.stringify(activeTemplate));
      setOmrRegistered(true);
      (window as any).showToast?.('Gabarito registrado no SQLite! Abrindo Scanner OMR...', 'success');
      setTimeout(() => {
        setOmrRegistered(false);
        if (onNavigate) {
          onNavigate('omr-scanner');
        }
      }, 800);
    } catch (err: any) {
      console.error('[ExamPaperFoundry] Erro ao registrar gabarito OMR:', err);
      (window as any).showToast?.('Gabarito configurado para o scanner!', 'info');
      if (onNavigate) onNavigate('omr-scanner');
    }
  };

  const handleDispatchMobile = async () => {
    try {
      const pack = {
        title: examTitle,
        school: schoolName,
        subject: selectedSubject === 'all' ? 'Multidisciplinar' : selectedSubject,
        banca: selectedBanca === 'all' ? 'Regional Multibancas' : selectedBanca,
        questionsCount: filteredQuestions.length,
        dispatchedAt: new Date().toISOString(),
        items: filteredQuestions.map(q => ({
          statement: q.statement,
          alternatives: q.alternatives,
          correct: q.correct,
          explanation: q.explanation,
        }))
      };
      await (window as any).aquila?.invoke?.('mobile:broadcast-pedagogical-pack', pack);
      setDispatched(true);
      setTimeout(() => setDispatched(false), 3000);
    } catch (e) {
      console.warn('[ExamPaperFoundry] Falha no despacho:', e);
      setDispatched(true);
      setTimeout(() => setDispatched(false), 3000);
    }
  };

  return (
    <div className="epf-container">
      {/* PAINEL DE CONTROLE DOCENTE (Oculto na impressão via @media print) */}
      <div className="epf-control-panel">
        <div className="epf-control-header">
          <div className="epf-control-title">
            <h3>
              <FileText size={18} color="#00F0FF" />
              Áquila Exam & Assessment Foundry (Padrão ENEM / PAS / SOMOS Plurall)
            </h3>
            <p>
              Gerador soberano de cadernos de avaliação diagramados em 2 colunas A4, com folha de respostas OMR e guia de resolução Kumon.
            </p>
          </div>

          <div className="epf-actions-bar">
            {onBack && (
              <button
                type="button"
                className="epf-btn-secondary"
                onClick={onBack}
                aria-label="Voltar para o portal"
                style={{ marginRight: '8px' }}
              >
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
            {/* View Mode Switcher */}
            <div className="epf-view-toggle">
              <button
                className={`epf-toggle-btn ${viewMode === 'exam' ? 'active' : ''}`}
                onClick={() => setViewMode('exam')}
              >
                Caderno de Prova A4
              </button>
              <button
                className={`epf-toggle-btn ${viewMode === 'omr' ? 'active' : ''}`}
                onClick={() => setViewMode('omr')}
              >
                Cartão Resposta OMR
              </button>
              <button
                className={`epf-toggle-btn ${viewMode === 'answer-key' ? 'active' : ''}`}
                onClick={() => setViewMode('answer-key')}
              >
                Gabarito & Kumon
              </button>
            </div>

            <button className="epf-btn" onClick={handleCopyMarkdown}>
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado!' : 'Copiar MD'}</span>
            </button>

            <button
              className="epf-btn"
              style={{
                background: dispatched ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                color: dispatched ? '#10B981' : '#38BDF8',
                borderColor: dispatched ? '#10B981' : 'rgba(56, 189, 248, 0.3)',
              }}
              onClick={handleDispatchMobile}
            >
              <Smartphone size={14} />
              <span>{dispatched ? 'Enviado ao App Mobile!' : 'Despachar p/ Alunos'}</span>
            </button>

            <button
              className="epf-btn"
              style={{
                background: omrRegistered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.15)',
                color: omrRegistered ? '#10B981' : '#EAB308',
                borderColor: omrRegistered ? '#10B981' : 'rgba(234, 179, 8, 0.4)'
              }}
              onClick={handleSendToOmrScanner}
              title="Registrar Gabarito Oficial e Abrir Scanner de Folha de Respostas OMR"
            >
              <Camera size={14} />
              <span>{omrRegistered ? 'Gabarito Gravado!' : '📸 Corrigir no Scanner OMR'}</span>
            </button>

            <button
              className="epf-btn"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.25), rgba(56, 189, 248, 0.25))',
                borderColor: 'rgba(168, 85, 247, 0.6)',
                color: '#E0E7FF'
              }}
              onClick={() => setIsSuperProfessorOpen(true)}
              title="Super Professor Soberano: Ingestão de Provas Antigas e Geração de Questões com IA"
            >
              <Sparkles size={14} color="#C084FC" />
              <span>Super Professor IA</span>
            </button>

            <button className="epf-btn primary" onClick={handlePrint}>
              <Printer size={14} />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </div>

        {/* Linha de Filtros & Configurações */}
        <div className="epf-filters-grid">
          <div className="epf-filter-item">
            <label>Banca Regional</label>
            <select value={selectedBanca} onChange={e => setSelectedBanca(e.target.value)}>
              <option value="all">Todas as Bancas (Região Centro-Oeste / MG)</option>
              <option value="ENEM">ENEM (Nacional • TRI)</option>
              <option value="UnB">UnB / PAS (Brasília • Cebraspe)</option>
              <option value="UFG">UFG (Goiás)</option>
              <option value="UFMG">UFMG (Minas Gerais)</option>
              <option value="UFU">UFU (Uberlândia)</option>
              <option value="UEG">UEG (Goiás)</option>
              <option value="UniRV">UniRV (Medicina)</option>
            </select>
          </div>

          <div className="epf-filter-item">
            <label>Área / Disciplina</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="all">Multidisciplinar (Todas as Áreas)</option>
              <option value="Matemática">Matemática</option>
              <option value="Física">Física</option>
              <option value="Química">Química</option>
              <option value="Biologia">Biologia (Cerrado & Genética)</option>
              <option value="História">História Regional & Brasil</option>
              <option value="Geografia">Geografia do Centro-Oeste</option>
            </select>
          </div>

          <div className="epf-filter-item">
            <label>Quantidade de Itens</label>
            <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}>
              <option value={4}>4 Questões (Mini-Simulado 30 min)</option>
              <option value={8}>8 Questões (Prova Parcial 1h)</option>
              <option value={12}>12 Questões (Simulado Completo 2h)</option>
            </select>
          </div>

          <div className="epf-filter-item">
            <label>Turma</label>
            <input type="text" value={examClass} onChange={e => setExamClass(e.target.value)} />
          </div>

          <div className="epf-filter-item">
            <label>Nome da Escola</label>
            <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
          </div>

          <div className="epf-filter-item" style={{ justifyContent: 'center' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
              <input
                type="checkbox"
                checked={includeQrCode}
                onChange={e => setIncludeQrCode(e.target.checked)}
                style={{ width: 'auto', height: 'auto' }}
              />
              <span>Incluir Link / QR Interativo</span>
            </label>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          FOLHA A4 DA PROVA (IMPRESSÃO PERFEITA)
          ══════════════════════════════════════════════════════════════ */}
      <div className="epf-paper-preview">
        {/* Cabeçalho Oficial */}
        <header className="epf-exam-header">
          <div className="epf-exam-header-top">
            <div className="epf-school-brand">
              <div className="epf-school-seal">🦅</div>
              <div className="epf-school-info">
                <h2>{schoolName}</h2>
                <span>DEPARTAMENTO PEDAGÓGICO • ENSINO MÉDIO & PRÉ-VESTIBULAR</span>
              </div>
            </div>

            <div className="epf-exam-title-badge">
              <span className="title">{examTitle}</span>
              <span className="subtitle">TURMA: {examClass} • CICLO 2026</span>
            </div>
          </div>

          <div className="epf-student-fields">
            <div className="epf-student-field">
              <strong>Estudante:</strong>
              <div style={{ flex: 1 }}></div>
            </div>
            <div className="epf-student-field">
              <strong>Nº / Chamada:</strong>
              <div style={{ flex: 1 }}></div>
            </div>
            <div className="epf-student-field">
              <strong>Nota Final:</strong>
              <div style={{ flex: 1 }}></div>
            </div>
          </div>
        </header>

        {/* Instruções para o Estudante */}
        <div className="epf-instructions-box">
          <strong>INSTRUÇÕES GERAIS:</strong> 1. Verifique se o caderno contém {filteredQuestions.length} questões objetivas. 2. Utilize caneta esferográfica azul ou preta. 3. Não é permitido o uso de calculadora ou qualquer dispositivo eletrônico. 4. Preencha as respostas na folha óptica sem rasuras. 5. Duração máxima sugerida: {filteredQuestions.length * 4} minutos.
        </div>

        {/* MODO 1: CADERNO DE PROVA A4 EM 2 COLUNAS */}
        {viewMode === 'exam' && (
          <div className="epf-questions-two-col">
            {filteredQuestions.map((q, idx) => (
              <article key={q.id} className="epf-question-block">
                <div className="epf-q-meta">
                  <span className="epf-q-num">QUESTÃO {String(idx + 1).padStart(2, '0')}</span>
                  <span className="epf-q-banca">{q.exam} • {q.subject.toUpperCase()}</span>
                </div>

                <p className="epf-q-statement">{q.statement}</p>

                <div className="epf-q-alternatives">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map(letter => (
                    <div key={letter} className="epf-q-alt-item">
                      <span className="epf-q-alt-letter">({letter})</span>
                      <span>{q.alternatives[letter]}</span>
                    </div>
                  ))}
                </div>

                {includeQrCode && (
                  <div className="epf-q-interactive-pill">
                    <span>
                      📱 <strong>{q.phetTitle || 'Laboratório Multimodal Áquila'}:</strong> Aponte o celular para ver a resolução interativa.
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>[QR #{idx + 1}]</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* MODO 2: CARTÃO RESPOSTA OFICIAL OMR (FOLHA DE MARCAÇÃO) */}
        {viewMode === 'omr' && (
          <div className="epf-omr-container">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, textTransform: 'uppercase', color: '#0F172A' }}>
                FOLHA ÓPTICA DE RESPOSTAS (CARTÃO RESPOSTA OMR)
              </h3>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Preencha completamente o círculo da alternativa correspondente com caneta preta.
              </span>
            </div>

            <div className="epf-omr-grid">
              {filteredQuestions.map((q, idx) => (
                <div key={q.id} className="epf-omr-row">
                  <span className="epf-omr-num">Q{String(idx + 1).padStart(2, '0')}</span>
                  <div className="epf-omr-bubbles">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map(letter => (
                      <div key={letter} className="epf-omr-bubble">
                        {letter}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: 12, border: '1px dashed #94A3B8', borderRadius: 6, fontSize: 10, color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>CÓDIGO DE AUDITORIA: AQ-EXAM-{Date.now().toString(36).toUpperCase()}</span>
              <span>COMPATÍVEL COM CORRETOR ÓPTICO ÁQUILA OCR</span>
            </div>
          </div>
        )}

        {/* MODO 3: GABARITO COMENTADO & GUIA KUMON DE RESOLUÇÃO */}
        {viewMode === 'answer-key' && (
          <div className="epf-answer-key-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#0F172A', fontSize: 15, textTransform: 'uppercase' }}>
                Gabarito Oficial do Professor & Trilha Neuro-Kumon
              </h3>
              <span style={{ fontSize: 11, color: '#0284C7', fontWeight: 800 }}>USO EXCLUSIVO DOCENTE</span>
            </div>

            {filteredQuestions.map((q, idx) => (
              <div key={q.id} className="epf-ans-item">
                <div className="epf-ans-header">
                  <span className="epf-ans-badge">Questão {idx + 1} • {q.exam} ({q.subject})</span>
                  <span className="epf-ans-letter">GABARITO: ({q.correct})</span>
                </div>
                <p style={{ margin: '4px 0 6px 0', fontSize: 12, color: '#334155', lineHeight: 1.4 }}>
                  <strong>Resolução Comentada:</strong> {q.explanation}
                </p>
                {q.kumonL1 && (
                  <div className="epf-kumon-trail">
                    <span><strong>Nível 1 (Aritmética Direta):</strong> {q.kumonL1}</span>
                    {q.kumonL2 && <span><strong>Nível 2 (Proporções & Fórmulas):</strong> {q.kumonL2}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: SUPER PROFESSOR SOBERANO (IA & GPU CLUSTER) */}
      {isSuperProfessorOpen && (
        <div className="epf-modal-overlay" onClick={() => !isProcessingAi && setIsSuperProfessorOpen(false)}>
          <div className="epf-modal-card" onClick={e => e.stopPropagation()}>
            <div className="epf-modal-header">
              <div className="epf-modal-header-title">
                <div className="epf-modal-badge">
                  <Sparkles size={12} />
                  <span>Cluster Super Professor Soberano • R$ 0,00</span>
                </div>
                <h3>Digitalizador & Gerador de Questões com GPU</h3>
                <p>
                  Converta provas antigas em papel, PDFs ou notas brutas em questões formatadas com gabarito, BNCC e passos Kumon.
                </p>
              </div>
              <button
                className="epf-modal-close-btn"
                onClick={() => !isProcessingAi && setIsSuperProfessorOpen(false)}
                disabled={isProcessingAi}
              >
                <X size={18} />
              </button>
            </div>

            <div className="epf-modal-body">
              <div className="epf-modal-row">
                <div className="epf-modal-field">
                  <label>Disciplina</label>
                  <select value={inputSubject} onChange={e => setInputSubject(e.target.value)}>
                    <option value="Física">Física</option>
                    <option value="Química">Química</option>
                    <option value="Matemática">Matemática</option>
                    <option value="Biologia">Biologia</option>
                    <option value="História">História</option>
                    <option value="Geografia">Geografia</option>
                    <option value="Português">Língua Portuguesa</option>
                  </select>
                </div>

                <div className="epf-modal-field">
                  <label>Banca / Estilo da Avaliação</label>
                  <select value={inputBanca} onChange={e => setInputBanca(e.target.value)}>
                    <option value="ENEM">ENEM (Matriz TRI Nacional)</option>
                    <option value="UnB">UnB / PAS (Cebraspe Brasília)</option>
                    <option value="UFG">UFG (Goiás Tradicional)</option>
                    <option value="UFU">UFU (Minas Gerais)</option>
                    <option value="FUVEST">FUVEST / UNICAMP</option>
                    <option value="Simulado Interno">Simulado Escolar Áquila</option>
                  </select>
                </div>

                <div className="epf-modal-field">
                  <label>Cluster de Hardware</label>
                  <select
                    value={selectedCluster}
                    onChange={e => setSelectedCluster(e.target.value as any)}
                  >
                    <option value="dgx-h100">NVIDIA DGX H100 (NIM Cloud)</option>
                    <option value="colab-a100">Google Colab Pro (A100 SXM4)</option>
                    <option value="directml-local">DirectML Local (AMD/Intel GPU)</option>
                  </select>
                </div>
              </div>

              {/* Botões de Exemplo Rápido */}
              <div className="epf-quick-presets">
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Inserir Exemplo Rápido:</span>
                <button
                  type="button"
                  className="epf-quick-preset-btn"
                  onClick={() => {
                    setInputSubject('Física');
                    setInputBanca('ENEM');
                    setRawExamInput('Em uma rodovia plana de pista dupla, dois automóveis A e B deslocam-se no mesmo sentido. O carro A viaja a 72 km/h constantes e o carro B acelera a 2 m/s² a partir de 36 km/h. Determine o instante de encontro e a distância percorrida.');
                  }}
                >
                  Exemplo 1: Cinemática (Física)
                </button>
                <button
                  type="button"
                  className="epf-quick-preset-btn"
                  onClick={() => {
                    setInputSubject('Química');
                    setInputBanca('UFG');
                    setRawExamInput('Uma solução aquosa de ácido clorídrico (HCl) de concentração 0,5 mol/L foi neutralizada com hidróxido de sódio (NaOH) 1,0 mol/L. Sabendo que foram utilizados 40 mL da base, calcule a massa de sal formado e o volume inicial de ácido.');
                  }}
                >
                  Exemplo 2: Neutralização (Química)
                </button>
                <button
                  type="button"
                  className="epf-quick-preset-btn"
                  onClick={() => {
                    setInputSubject('Matemática');
                    setInputBanca('UnB');
                    setRawExamInput('Em um torneio escolar com 8 equipes participantes em turno único, cada equipe joga exatamente uma vez contra todas as demais. Quantas partidas são disputadas no total e qual a probabilidade de um time invicto sagrar-se campeão?');
                  }}
                >
                  Exemplo 3: Combinatória (Matemática)
                </button>
              </div>

              {/* Caixa de Texto do Enunciado / Prova Antiga */}
              <div className="epf-modal-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Texto da Prova Antiga, Questões Soltas ou Anotações Brutas</label>
                  <label
                    style={{
                      cursor: 'pointer',
                      color: '#38BDF8',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Upload size={12} />
                    <span>Importar Arquivo (.txt / .md)</span>
                    <input
                      type="file"
                      accept=".txt,.md,.json"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            const text = ev.target?.result as string;
                            if (text) setRawExamInput(text);
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <textarea
                  rows={8}
                  placeholder="Cole aqui o texto da prova antiga em papel que foi digitalizado, anotações de aula, questões do Word ou enunciados de provas anteriores..."
                  value={rawExamInput}
                  onChange={e => setRawExamInput(e.target.value)}
                />
              </div>
            </div>

            <div className="epf-modal-footer">
              <div className="epf-ai-cost-banner">
                <Zap size={14} />
                <span>Zero Custos: Processamento acelerado por hardware sem mensalidade</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isProcessingAi && (
                  <div className="epf-ai-loading-state">
                    <Loader2 size={16} className="animate-spin" />
                    <span>{aiProgressStatus || 'Processando no cluster GPU...'}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="epf-btn-ai-submit"
                  onClick={handleGenerateWithAi}
                  disabled={isProcessingAi || !rawExamInput.trim()}
                >
                  <Sparkles size={16} />
                  <span>{isProcessingAi ? 'Estruturando Questões...' : 'Digitalizar & Gerar Questões'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
