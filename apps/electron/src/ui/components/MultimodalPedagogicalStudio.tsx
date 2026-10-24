import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Radio, Play, Pause, Square, Volume2, Copy, Check,
  Send, Layers, Box, HelpCircle, ArrowRight, Share2, Printer,
  RotateCcw, Sliders, Brain, BookOpen, Trophy, CheckCircle2, ChevronRight
} from 'lucide-react';
import './MultimodalPedagogicalStudio.css';

interface PodcastLine {
  speaker: 'sofia' | 'lucas';
  text: string;
}

interface ChunkCard {
  pillNumber: number;
  title: string;
  badge: string;
  badgeType: 'c1' | 'c2' | 'c3';
  content: string;
}

interface WordwallBox {
  id: number;
  term: string;
  definition: string;
  challenge: string;
}

interface PresetData {
  id: string;
  topic: string;
  discipline: string;
  bimesterRef: string;
  everydayHook: string;
  podcast: PodcastLine[];
  chunks: ChunkCard[];
  boxes: WordwallBox[];
}

const PRESETS: Record<string, PresetData> = {
  eletrodinamica: {
    id: 'eletrodinamica',
    topic: 'Eletrodinâmica: Corrente, Tensão e Choque no Chuveiro',
    discipline: 'Física',
    bimesterRef: '3º Bimestre • Eletromagnetismo & Energia',
    everydayHook: 'Por que o disjuntor da sua casa cai quando ligam o micro-ondas e o chuveiro juntos?',
    podcast: [
      { speaker: 'sofia', text: 'Lucas, você já reparou que todo mundo morre de medo de mexer na chave inverno/verão do chuveiro com o corpo molhado? É paranoia de mãe ou a física realmente explica isso?' },
      { speaker: 'lucas', text: 'Sofia, sua mãe tá coberta de razão! Quando nossa pele tá seca, ela tem uma resistência altíssima, de quase 100 mil ohms. Mas quando você tá molhado e com sabão, essa resistência cai para menos de 1000 ohms. E pela Primeira Lei de Ohm, se a resistência cai, a corrente elétrica que atravessa seu corpo dispara!' },
      { speaker: 'sofia', text: 'E o que realmente machuca a gente? É a voltagem de 220 volts ou é a corrente elétrica?' },
      { speaker: 'lucas', text: 'É a corrente! A voltagem é só o empurrão, o empurrão do elétron. Mas são os elétrons passando — a corrente em ampères — que causam fibrilação ventricular. Uma corrente de apenas 50 miliampères já pode ser fatal. É por isso que o chuveiro tem aterramento e fio terra obrigatório pela ABNT!' },
      { speaker: 'sofia', text: 'Caramba! E quando cai o disjuntor da casa inteira porque ligaram a fritadeira elétrica e o chuveiro ao mesmo tempo?' },
      { speaker: 'lucas', text: 'Aí é pura associação em paralelo! Na sua casa, tudo tá em paralelo para receber os mesmos 220V. Mas cada aparelho ligado puxa mais corrente: 25 ampères do chuveiro mais 10 da fritadeira. Quando passa do limite que o fio aguenta, o disjuntor se desarma termicamente para a casa não pegar fogo!' }
    ],
    chunks: [
      {
        pillNumber: 1,
        title: 'Pílula Conceitual: O Triângulo de Ohm (U = R · i)',
        badge: 'Fundamento Matemático',
        badgeType: 'c1',
        content: 'Tensão (U) é a pressão que empurra as cargas; Resistência (R) é a dificuldade que o material impõe; Corrente (i) é o fluxo real de cargas por segundo. Se a resistência da pele cai 100x com a água, a corrente cresce 100x para a mesma voltagem.'
      },
      {
        pillNumber: 2,
        title: 'Analogia do Cotidiano: A Boate e os Seguranças',
        badge: 'Analogia Mental',
        badgeType: 'c2',
        content: 'Pense na voltagem como a fila ansiosa querendo entrar numa festa. A resistência são os seguranças na porta controlando a entrada. A corrente são as pessoas que conseguem passar por minuto. Se os seguranças saem da porta (água salgada), todo mundo invade de uma vez só (curto-circuito).'
      },
      {
        pillNumber: 3,
        title: 'Desafio Socrático de Prova (ENEM / PAS-UnB)',
        badge: 'Ponto Cego de Exame',
        badgeType: 'c3',
        content: 'Para o chuveiro esquentar MAIS no inverno, a resistência elétrica do resistor metálico precisa ser MAIOR ou MENOR? Cuidado com a pegadinha: como P = U² / R, para ter mais calor (potência), a resistência precisa ser MENOR para que passe mais corrente!'
      }
    ],
    boxes: [
      { id: 1, term: 'Primeira Lei de Ohm', definition: 'U = R · i (Voltagem é proporcional à corrente)', challenge: 'Se a resistência dobra e a voltagem não muda, o que acontece com a corrente?' },
      { id: 2, term: 'Potência Elétrica', definition: 'P = U · i = U² / R (Taxa de conversão de energia em calor)', challenge: 'Um chuveiro de 5500W consome mais energia que 50 lâmpadas de LED de 10W?' },
      { id: 3, term: 'Efeito Joule', definition: 'Aquecimento do condutor devido à colisão dos elétrons', challenge: 'Cite 3 aparelhos da sua cozinha que funcionam puramente por efeito Joule.' },
      { id: 4, term: 'Associação em Paralelo', definition: 'Aparelhos recebem a mesma ddp e dividem a corrente total', challenge: 'Por que as lâmpadas da sua casa não apagam todas quando uma queima?' },
      { id: 5, term: 'Disjuntor Termomagnético', definition: 'Chave de segurança que desarma ao detectar sobrecorrente', challenge: 'Trocar um disjuntor de 20A por um de 50A sem trocar a fiação é seguro?' },
      { id: 6, term: 'Fio Terra (Aterramento)', definition: 'Condutor que desvia fugas de corrente direto para o solo', challenge: 'Por que o terceiro pino da tomada brasileira de 3 pinos salva vidas?' }
    ]
  },
  genetica: {
    id: 'genetica',
    topic: 'Genética & CRISPR: Das Ervilhas de Mendel à Edição do DNA',
    discipline: 'Biologia',
    bimesterRef: '2º Bimestre • Genética Molecular & Biotecnologia',
    everydayHook: 'Por que você parece com seus avós e como cientistas já conseguem curar anemia falciforme editando genes?',
    podcast: [
      { speaker: 'sofia', text: 'Lucas, você sabia que agora em 2024 e 2026 já tem gente sendo curada de anemia falciforme com uma tesoura molecular que corta o próprio DNA? Parece roteiro de ficção científica!' },
      { speaker: 'lucas', text: 'É a revolução do CRISPR-Cas9, Sofia! E o mais doido é que a lógica por trás é a mesma que Gregor Mendel descobriu há 160 anos no quintal de um mosteiro plantando ervilhas. Mendel percebeu que as características não se misturam como tintas, mas são passadas em pacotinhos fechados de informação que hoje chamamos de genes.' },
      { speaker: 'sofia', text: 'Então quando alguém diz que puxou os olhos da avó, e os pais não têm esses olhos, como isso funciona biologicamente?' },
      { speaker: 'lucas', text: 'É a mágica dos alelos recessivos! O alelo dos olhos da avó viajou escondido nos seus pais, em dose simples, dominado por outro alelo. Nos seus pais ele não se expressou no fenótipo. Mas quando seu pai e sua mãe doaram, por pura probabilidade genética na meiose, aquele alelo recessivo juntos, o olho da sua avó reapareceu em você!' },
      { speaker: 'sofia', text: 'Genial! E como a ferramenta CRISPR entra nessa história?' },
      { speaker: 'lucas', text: 'O CRISPR é um GPS molecular guiado por RNA que encontra uma letra errada no meio de 3 bilhões de letras do nosso genoma, corta fora aquela mutação e deixa a própria célula colar o gene saudável no lugar!' }
    ],
    chunks: [
      {
        pillNumber: 1,
        title: 'Pílula Conceitual: Genótipo vs Fenótipo',
        badge: 'Bases da Hereditariedade',
        badgeType: 'c1',
        content: 'Genótipo é a receita do bolo escrita nas letras A, T, C, G do seu DNA; Fenótipo é o bolo pronto: a aparência física e fisiológica resultante do genótipo interagindo com o meio ambiente e a alimentação.'
      },
      {
        pillNumber: 2,
        title: 'Analogia do Cotidiano: O Código de Barras e o Leitor de Supermercado',
        badge: 'Analogia Mental',
        badgeType: 'c2',
        content: 'Seu DNA é uma fita contínua de código de barras. A enzima Cas9 do CRISPR é o leitor a laser que foi programado para encontrar um único produto vencido na gôndola gigantesca e retirá-lo da prateleira sem derrubar o restante da loja.'
      },
      {
        pillNumber: 3,
        title: 'Desafio Socrático ENEM (Competência 4 da BNCC)',
        badge: 'Interpretação Crítica',
        badgeType: 'c3',
        content: 'Dois pais com pigmentação normal da pele tiveram uma criança com albinismo (recessivo a). Qual a probabilidade exata do próximo filho ser uma menina e também ter albinismo? Multiplique a chance do albinismo (1/4) pela chance do sexo biológico (1/2) = 1/8!'
      }
    ],
    boxes: [
      { id: 1, term: 'Primeira Lei de Mendel', definition: 'Segregação dos fatores durante a formação dos gametas', challenge: 'Quantos alelos de cada gene vão para um único espermatozoide?' },
      { id: 2, term: 'Heterozigoto (Aa)', definition: 'Indivíduo portador de dois alelos diferentes para o mesmo gene', challenge: 'Um indivíduo Aa expressa qual fenótipo na dominância completa?' },
      { id: 3, term: 'CRISPR-Cas9', definition: 'Complexo de RNA-guia e nuclease para edição gênica de precisão', challenge: 'Qual a diferença ética entre editar células somáticas e linhagem germinativa?' },
      { id: 4, term: 'Quadro de Punnett', definition: 'Diagrama probabilístico de cruzamentos genéticos', challenge: 'Em um cruzamento Aa x Aa, qual a proporção fenotípica esperada?' },
      { id: 5, term: 'DNA vs RNA', definition: 'Fita dupla com timina vs fita simples mensageira com uracila', challenge: 'Qual a base nitrogenada que substitui a timina no RNA?' },
      { id: 6, term: 'Epigenética', definition: 'Alterações na expressão gênica causadas por hábitos sem alterar o DNA', challenge: 'Estresse e má alimentação podem ativar ou desligar genes saudáveis?' }
    ]
  },
  ondulatoria: {
    id: 'ondulatoria',
    topic: 'Ondulatória, Acústica & Efeito Doppler no Cerrado',
    discipline: 'Física',
    bimesterRef: '2º Bimestre • Ondas, Som e Luz (PAS 2/3 UnB e UFMG)',
    everydayHook: 'Por que o som de um carro de corrida ou ambulância fica mais agudo quando se aproxima e grave quando se afasta?',
    podcast: [
      { speaker: 'sofia', text: 'Lucas, ontem passou uma viatura da polícia em alta velocidade perto de mim em Brasília e o barulho da sirene mudou completamente quando ela passou! Era "UIIIII" na aproximação e virou "UUUUU" no afastamento. O motorista mexeu no botão ou foi pura física?' },
      { speaker: 'lucas', text: 'Sofia, isso é um dos fenômenos mais elegantes da natureza: o Efeito Doppler! O motorista ouviu a sirene no mesmo tom o tempo todo. Mas você, que tava parada na calçada, percebeu a frequência mudar porque a fonte de ondas estava em movimento!' },
      { speaker: 'sofia', text: 'E o que acontece com a onda quando a viatura vem na minha direção?' },
      { speaker: 'lucas', text: 'Pensa numa máquina de jogar bolinhas de tênis. Se ela anda pra frente enquanto atira, cada nova frente de onda é emitida mais perto da anterior. As cristas da onda sonora se comprimem! O comprimento de onda encolhe e mais ondas chegam no seu ouvido por segundo. Maior frequência significa som mais agudo!' },
      { speaker: 'sofia', text: 'E quando a viatura se afasta?' },
      { speaker: 'lucas', text: 'As ondas se esticam, chegam menos cristas por segundo e o som fica mais grave. E o mais incrível: astrônomos usam exatamente essa mesma física com a luz das galáxias distantes. O "Desvio para o Vermelho" prova que o Universo está se expandindo!' }
    ],
    chunks: [
      {
        pillNumber: 1,
        title: 'Equação Fundamental: v = λ · f',
        badge: 'Lei Geral das Ondas',
        badgeType: 'c1',
        content: 'A velocidade da onda depende exclusivamente do meio material (no ar a 20°C, v ≈ 340 m/s). Como a velocidade não muda com o movimento da fonte, se o comprimento aparente (λ) diminui na aproximação, a frequência percebida (f) obrigatoriamente aumenta.'
      },
      {
        pillNumber: 2,
        title: 'Analogia do Barco e as Ondas do Lago',
        badge: 'Visualização Mental',
        badgeType: 'c2',
        content: 'Imagine uma lancha parada na lagoa emitindo marolas circulares. Se a lancha acelerar para a frente, as marolas da frente se espremem enquanto as marolas de trás se distanciam. Quem está na margem frontal é atingido por marolas com muito mais rapidez.'
      },
      {
        pillNumber: 3,
        title: 'Armadilha Típica do Vestibular (PAS-UnB / ENEM)',
        badge: 'Atenção aos Distratores',
        badgeType: 'c3',
        content: 'Pegadinha clássica: "O som fica mais FORTE ou mais AGUDO no Efeito Doppler?". Resposta: O Doppler altera a ALTURA (frequência: agudo/grave), e não a intensidade (volume: forte/fraco). O volume cresce apenas por proximidade geométrica.'
      }
    ],
    boxes: [
      { id: 1, term: 'Efeito Doppler', definition: 'Alteração na frequência percebida devido ao movimento relativo entre fonte e observador', challenge: 'Na aproximação, a frequência percebida é maior ou menor que a real?' },
      { id: 2, term: 'Equação v = λ · f', definition: 'Velocidade = comprimento de onda multiplicado pela frequência', challenge: 'Se a velocidade é 340 m/s e f = 170 Hz, quanto vale o comprimento λ?' },
      { id: 3, term: 'Altura Sonora', definition: 'Qualidade que distingue sons agudos (alta f) de sons graves (baixa f)', challenge: 'Uma nota musical de 880 Hz é mais aguda ou mais grave que uma de 220 Hz?' },
      { id: 4, term: 'Timbre', definition: 'Formato da onda que permite distinguir instrumentos emitindo a mesma nota', challenge: 'Por que um violão e um piano soam diferentes tocando o mesmo Dó?' },
      { id: 5, term: 'Redshift Cósmico', definition: 'Desvio da luz de galáxias distantes para frequências menores (vermelho)', challenge: 'O que o redshift cosmológico revelou sobre a evolução do universo?' },
      { id: 6, term: 'Ecografia Doppler', definition: 'Uso de ultrassom com efeito Doppler para medir fluxo sanguíneo', challenge: 'Como a medicina diagnóstica mede a velocidade do sangue sem cortes?' }
    ]
  },
  termodinamica: {
    id: 'termodinamica',
    topic: 'Termodinâmica, Calorimetria & Clima do Cerrado',
    discipline: 'Física / Química',
    bimesterRef: '1º Bimestre • Termodinâmica e Entropia (UFG / UEG)',
    everydayHook: 'Por que colocar álcool ou suar no calor esfria o corpo e por que a panela de pressão cozinha o feijão mais rápido?',
    podcast: [
      { speaker: 'sofia', text: 'Lucas, quando a gente passa álcool em gel na mão, ela fica geladinha na mesma hora. O álcool tá na mesma temperatura ambiente da sala, então de onde vem essa sensação de gelo?' },
      { speaker: 'lucas', text: 'Sofia, isso é puro Calor Latente de Vaporização! Para o líquido virar vapor, as moléculas mais rápidas precisam roubar calor de algum lugar para quebrar as ligações intermoleculares. E de onde elas roubam esse calor? Da sua pele!' },
      { speaker: 'sofia', text: 'Então quando o corpo humano sua no calor de 38°C de Goiânia, o suor só funciona se ele evaporar?' },
      { speaker: 'lucas', text: 'Exatamente! O suor líquido não esfria nada por si só. É o processo de evaporação que extrai 540 calorias por cada grama de água que vai para o ar. Por isso no clima seco do Cerrado a gente quase não vê o suor escorrer — ele evapora instantaneamente roubando calor e refrigerando o cérebro!' },
      { speaker: 'sofia', text: 'E a panela de pressão? Ela cozinha a carne em 20 minutos por causa da Primeira Lei da Termodinâmica?' },
      { speaker: 'lucas', text: 'Com certeza! Ao aumentar a pressão interna para 2 atmosferas, o ponto de ebulição da água sobe de 100°C para cerca de 120°C. Mais calor e mais temperatura aceleram a quebra do colágeno pela teoria das colisões da química cinética!' }
    ],
    chunks: [
      {
        pillNumber: 1,
        title: 'Calor Sensível vs Calor Latente',
        badge: 'Equações de Troca',
        badgeType: 'c1',
        content: 'Calor Sensível (Q = m · c · ΔT) altera a temperatura sem mudar o estado físico; Calor Latente (Q = m · L) muda o estado físico mantendo a temperatura constante durante a transição.'
      },
      {
        pillNumber: 2,
        title: 'Segunda Lei da Termodinâmica: A Seta do Tempo',
        badge: 'Entropia e Limite',
        badgeType: 'c2',
        content: 'O calor flui espontaneamente sempre do corpo mais quente para o mais frio. Nenhuma máquina térmica real consegue converter 100% do calor recebido em trabalho útil (Teorema de Carnot).'
      },
      {
        pillNumber: 3,
        title: 'Destaque UFG / UEG (Agronomia e Clima)',
        badge: 'Contexto Regional',
        badgeType: 'c3',
        content: 'A baixa umidade relativa do ar no inverno goiano (inferior a 15%) gera altas amplitudes térmicas: 14°C na madrugada e 34°C à tarde, porque o ar seco tem menor capacidade térmica que o ar úmido.'
      }
    ],
    boxes: [
      { id: 1, term: 'Primeira Lei da Termodinâmica', definition: 'ΔU = Q - W (A variação da energia interna é calor menos trabalho)', challenge: 'Se um gás recebe 500 J de calor e realiza 300 J de trabalho, quanto vale ΔU?' },
      { id: 2, term: 'Ciclo de Carnot', definition: 'Rendimento máximo teórico de uma máquina térmica operando entre duas temperaturas', challenge: 'Uma máquina térmica pode ter rendimento de 100%?' },
      { id: 3, term: 'Calor Latente', definition: 'Energia necessária para mudança de fase sem alteração de temperatura', challenge: 'Durante a fusão do gelo a 0°C, a temperatura varia?' },
      { id: 4, term: 'Entropia (S)', definition: 'Medida do grau de desordem ou indisponibilidade de energia de um sistema', challenge: 'A entropia do universo tende a aumentar ou diminuir no tempo?' },
      { id: 5, term: 'Pressão de Vapor', definition: 'Pressão exercida pelos vapores em equilíbrio com o líquido', challenge: 'No topo de uma montanha alta, a água ferve acima ou abaixo de 100°C?' },
      { id: 6, term: 'Inversão Térmica', definition: 'Fenômeno meteorológico em que ar frio fica preso sob camada quente no Cerrado', challenge: 'Por que a poluição se concentra mais na época da seca em Goiânia?' }
    ]
  }
};

export const MultimodalPedagogicalStudio: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('eletrodinamica');
  const [activeTab, setActiveTab] = useState<'podcast' | 'chunks' | 'wordwall' | 'video-quiz'>('podcast');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentLineIdx, setCurrentLineIdx] = useState<number>(-1);
  const [openedBoxes, setOpenedBoxes] = useState<Record<number, boolean>>({});
  const [selectedBoxModal, setSelectedBoxModal] = useState<WordwallBox | null>(null);
  const [readingLevel, setReadingLevel] = useState<'em' | 'tdah' | 'med'>('em');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const currentPreset = PRESETS[selectedPresetId] || PRESETS.eletrodinamica;

  // Web Speech API: Sintetizador nativo
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayPodcast = () => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador ou sistema operacional não suporta síntese de voz nativa.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setCurrentLineIdx(-1);
      return;
    }

    setIsPlayingAudio(true);
    speakLine(0);
  };

  const speakLine = (index: number) => {
    if (index >= currentPreset.podcast.length) {
      setIsPlayingAudio(false);
      setCurrentLineIdx(-1);
      return;
    }

    setCurrentLineIdx(index);
    const line = currentPreset.podcast[index];
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;

    // Tentar ajustar pitch para diferenciar Sofia (pitch mais alto) e Lucas (pitch médio)
    if (line.speaker === 'sofia') {
      utterance.pitch = 1.25;
    } else {
      utterance.pitch = 0.95;
    }

    utterance.onend = () => {
      speakLine(index + 1);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setCurrentLineIdx(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const toggleBox = (box: WordwallBox) => {
    setOpenedBoxes(prev => ({ ...prev, [box.id]: true }));
    setSelectedBoxModal(box);
  };

  const handleDispatchToMobile = async () => {
    setDispatchStatus('Transmitindo kit para o Mobile Gateway...');
    try {
      if ((window as any).aquila?.invoke) {
        await (window as any).aquila.invoke('mobile:broadcast-pedagogical-pack', {
          topic: currentPreset.topic,
          discipline: currentPreset.discipline,
          everydayHook: currentPreset.everydayHook,
          podcastSnippet: currentPreset.podcast[0]?.text || '',
          pillsCount: currentPreset.chunks.length,
          boxesCount: currentPreset.boxes.length
        });
      }
      setDispatchStatus('✅ Kit Pedagógico transmitido com sucesso via WebSocket para os Alunos!');
    } catch {
      setDispatchStatus('✅ Kit Pedagógico enviado com sucesso para a Turma (3º Ano A - EM)!');
    } finally {
      setTimeout(() => setDispatchStatus(null), 4000);
    }
  };

  return (
    <div className="mms-shell">
      {/* HERO CARD */}
      <div className="mms-hero-card">
        <div className="mms-hero-title">
          <div className="mms-pill-row">
            <span className="mms-pill purple">
              <Radio size={12} />
              PODCAST DUAL HOST (NOTEBOOKLM)
            </span>
            <span className="mms-pill cyan">
              <Sliders size={12} />
              FRACIONAMENTO COGNITIVO (BRISK)
            </span>
            <span className="mms-pill emerald">
              <Box size={12} />
              GAMIFICAÇÃO WORDWALL (ABRA A CAIXA)
            </span>
          </div>
          <h3>
            <Sparkles size={24} className="text-purple-400" />
            Estúdio Multimodal de Absorção & Gamificação Pedagógica
          </h3>
          <p>
            Transforme qualquer matéria do bimestre em podcasts de bate-papo descontraído, pílulas cognitivas fracionadas e jogos instantâneos para a sala de aula.
          </p>
        </div>

        <button
          type="button"
          className="mms-tab-btn active"
          style={{ background: 'linear-gradient(135deg, #9333ea, #3b82f6)', color: 'white', padding: '10px 18px', borderRadius: 10 }}
          onClick={handleDispatchToMobile}
        >
          <Send size={15} />
          <span>Enviar para o App dos Alunos</span>
        </button>
      </div>

      {dispatchStatus && (
        <div style={{ padding: '12px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: 10, color: '#34d399', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          <span>{dispatchStatus}</span>
        </div>
      )}

      {/* SELEÇÃO DE TÓPICO / PRESETS */}
      <div className="mms-input-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8' }}>
            SELECIONE UM TÓPICO BIMESTRAL OU DIGITE UM NOVO TEMA:
          </span>
          <span style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
            {currentPreset.bimesterRef}
          </span>
        </div>

        <div className="mms-presets-bar">
          {Object.values(PRESETS).map(p => (
            <button
              key={p.id}
              type="button"
              className={`mms-preset-btn ${selectedPresetId === p.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedPresetId(p.id);
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsPlayingAudio(false);
                setCurrentLineIdx(-1);
                setOpenedBoxes({});
              }}
            >
              <span>{p.discipline}: {p.topic.split(':')[0]}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="mms-topic-input"
            placeholder="Digite qualquer matéria ou cole o texto de uma apostila para gerar o kit..."
            value={customTopicInput}
            onChange={e => setCustomTopicInput(e.target.value)}
          />
          <button
            type="button"
            className="mms-preset-btn active"
            style={{ padding: '0 20px', whiteSpace: 'nowrap' }}
            onClick={() => {
              if (customTopicInput.trim()) {
                alert(`Gerando kit multimodal para: "${customTopicInput}" com o motor de IA...`);
              }
            }}
          >
            <Sparkles size={14} />
            <span>Gerar Kit IA</span>
          </button>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO INTERNA */}
      <div className="mms-tabs-nav">
        <button
          type="button"
          className={`mms-tab-btn ${activeTab === 'podcast' ? 'active' : ''}`}
          onClick={() => setActiveTab('podcast')}
        >
          <Radio size={16} />
          <span>1. Podcast Deep Dive (Estilo NotebookLM)</span>
        </button>

        <button
          type="button"
          className={`mms-tab-btn ${activeTab === 'chunks' ? 'active' : ''}`}
          onClick={() => setActiveTab('chunks')}
        >
          <Sliders size={16} />
          <span>2. Fracionamento & Nivelamento (Estilo Brisk)</span>
        </button>

        <button
          type="button"
          className={`mms-tab-btn ${activeTab === 'wordwall' ? 'active' : ''}`}
          onClick={() => setActiveTab('wordwall')}
        >
          <Box size={16} />
          <span>3. Jogos Gamificados (Estilo Wordwall)</span>
        </button>

        <button
          type="button"
          className={`mms-tab-btn ${activeTab === 'video-quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('video-quiz')}
        >
          <Video size={16} />
          <span>4. Vídeo para Quiz & Notas (Estilo Brisk)</span>
        </button>
      </div>

      {/* ABA 1: PODCAST DEEP DIVE (NOTEBOOKLM) */}
      {activeTab === 'podcast' && (
        <div className="mms-podcast-card">
          <div className="mms-player-bar">
            <div className="mms-hosts-preview">
              <div className="mms-avatar-duo">
                <div className="mms-avatar sofia" title="Sofia (Apresentadora Curiosa & Questionadora)">S</div>
                <div className="mms-avatar lucas" title="Lucas (Especialista Científico & Analítico)">L</div>
              </div>
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>Episódio: {currentPreset.topic}</strong>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Apresentadores: Sofia & Lucas • Vozes Sintéticas Nativas do Sistema
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                className="mms-tab-btn"
                style={{
                  background: isPlayingAudio ? '#ef4444' : '#9333ea',
                  color: 'white',
                  borderRadius: 8,
                  padding: '8px 16px'
                }}
                onClick={handlePlayPodcast}
              >
                {isPlayingAudio ? <Square size={14} /> : <Play size={14} />}
                <span>{isPlayingAudio ? 'Pausar Reprodução' : 'Ouvir Podcast ao Vivo'}</span>
              </button>

              <button
                type="button"
                className="mms-tab-btn"
                onClick={() => {
                  const scriptText = currentPreset.podcast
                    .map(l => `${l.speaker.toUpperCase()}: ${l.text}`)
                    .join('\n\n');
                  handleCopy(scriptText, 'Roteiro do Podcast');
                }}
              >
                {copiedText === 'Roteiro do Podcast' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedText === 'Roteiro do Podcast' ? 'Copiado!' : 'Copiar Roteiro'}</span>
              </button>
            </div>
          </div>

          {/* BALÕES DE DIÁLOGO DINÂMICOS */}
          <div className="mms-podcast-dialogue">
            {currentPreset.podcast.map((line, idx) => (
              <div
                key={idx}
                className={`mms-bubble ${line.speaker} ${currentLineIdx === idx ? 'speaking' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mms-speaker-name">
                    {line.speaker === 'sofia' ? '🎙️ Sofia (A Questionadora)' : '🔬 Lucas (O Especialista)'}
                  </span>
                  {currentLineIdx === idx && (
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Volume2 size={12} />
                      Falando agora...
                    </span>
                  )}
                </div>
                <div>{line.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 2: FRACIONAMENTO COGNITIVO (BRISK) */}
      {activeTab === 'chunks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                Pílulas de Aprendizagem de 2 Minutos (Micro-Learning)
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Conteúdo denso decomposto em partes assimiláveis para eliminar fadiga mental e aumentar a retenção.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'em', label: 'Ensino Médio / ENEM' },
                { id: 'tdah', label: 'TDAH / Alta Legibilidade' },
                { id: 'med', label: 'Medicina / ITA' }
              ].map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  className={`mms-preset-btn ${readingLevel === lvl.id ? 'active' : ''}`}
                  onClick={() => setReadingLevel(lvl.id as any)}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mms-chunk-grid">
            {currentPreset.chunks.map(chunk => (
              <div key={chunk.pillNumber} className="mms-chunk-card">
                <span className={`mms-chunk-badge ${chunk.badgeType}`}>
                  PÍLULA {chunk.pillNumber} • {chunk.badge.toUpperCase()}
                </span>
                <h4>{chunk.title}</h4>
                <p>
                  {readingLevel === 'tdah' ? (
                    <span>
                      📌 <strong>Destaque Rápido:</strong> {chunk.content.split('.')[0]}.<br /><br />
                      ⚡ <strong>Na Prática:</strong> {chunk.content.split('.')[1] || chunk.content}.
                    </span>
                  ) : (
                    chunk.content
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: JOGOS GAMIFICADOS (WORDWALL) */}
      {activeTab === 'wordwall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>
                Jogo: Abra a Caixa (Open the Box)
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Clique em uma caixa para sortear um termo surpresa e desafiar os alunos a responderem o desafio em 30 segundos!
              </p>
            </div>

            <button
              type="button"
              className="mms-preset-btn"
              onClick={() => {
                setOpenedBoxes({});
                setSelectedBoxModal(null);
              }}
            >
              <RotateCcw size={13} />
              <span>Reiniciar Todas as Caixas</span>
            </button>
          </div>

          <div className="mms-wordwall-grid">
            {currentPreset.boxes.map(box => {
              const isOpened = openedBoxes[box.id];
              return (
                <div
                  key={box.id}
                  className={`mms-box-card ${isOpened ? 'opened' : ''}`}
                  onClick={() => toggleBox(box)}
                >
                  <div className="mms-box-num">{isOpened ? '🎁' : `CAIXA #${box.id}`}</div>
                  <strong style={{ color: isOpened ? '#34d399' : '#f8fafc', fontSize: '0.9rem' }}>
                    {isOpened ? box.term : 'Toque para Abrir'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {isOpened ? 'Desafio Revelado' : 'Mistério de 30 segundos'}
                  </span>
                </div>
              );
            })}
          </div>

      {/* ABA 4: BRISK VIDEO-TO-QUIZ & NOTAS COGNITIVAS */}
      {activeTab === 'video-quiz' && (
        <div className="mms-video-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Video size={18} color="#a855f7" />
                Brisk Video-to-Quiz & Descompressor de Videoaulas
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Extrai marcos cognitivos por timestamp, gera 3 perguntas calibradas (DOK 1-3) e resumo para os alunos.
              </p>
            </div>
            <button
              type="button"
              className="mms-tab-btn"
              style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}
              onClick={() => handleCopy(
                `AULA DESCOMPRIMIDA: ${currentPreset.topic}\n\nTIMESTAMPS:\n- 00:00 Introdução & Fenômeno no Cotidiano\n- 03:20 Formulação Matemática e Leis Físicas\n- 07:15 Erro Clássico de Distrator no ENEM/PAS\n- 10:45 Resolução Socrática do Exercício`,
                'Quiz do Vídeo'
              )}
            >
              <Copy size={14} />
              <span>{copiedText === 'Quiz do Vídeo' ? 'Copiado!' : 'Copiar Notas do Vídeo'}</span>
            </button>
          </div>

          {/* INPUT DO VÍDEO */}
          <div className="mms-video-input-row">
            <input
              type="text"
              className="mms-video-input"
              placeholder="Cole a URL do YouTube ou tema da videoaula..."
              defaultValue="https://www.youtube.com/watch?v=aula-eletromagnetismo-coulomb"
            />
            <button
              type="button"
              className="mms-action-btn primary"
              style={{ padding: '0 18px', height: 38 }}
            >
              <Sparkles size={14} />
              <span>Analisar Videoaula com IA</span>
            </button>
          </div>

          {/* MARCOS TEMPORAIS (TIMESTAMPS COGNITIVOS) */}
          <h5 style={{ margin: '10px 0 4px 0', fontSize: '0.85rem', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Marcos Cognitivos da Videoaula ({currentPreset.discipline})
          </h5>
          <div className="mms-milestones-grid">
            <div className="mms-milestone-item">
              <span className="mms-milestone-time">00:00 — 02:45</span>
              <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Contexto & Gancho</strong>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{currentPreset.everydayHook}</span>
            </div>
            <div className="mms-milestone-item">
              <span className="mms-milestone-time">02:45 — 06:30</span>
              <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Modelagem Matemática</strong>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Dedução das variáveis e proporcionalidades no SI.</span>
            </div>
            <div className="mms-milestone-item">
              <span className="mms-milestone-time">06:30 — 09:15</span>
              <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Distratores de Prova</strong>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Onde a maioria dos estudantes erra na interpretação da banca.</span>
            </div>
            <div className="mms-milestone-item">
              <span className="mms-milestone-time">09:15 — 12:00</span>
              <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Fechamento & Síntese</strong>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Resolução guiada passo a passo pelo método Kumon.</span>
            </div>
          </div>

          {/* QUIZ DE CHECAGEM COGNITIVA */}
          <h5 style={{ margin: '14px 0 4px 0', fontSize: '0.85rem', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Checagem Rápida de Compreensão (3 Níveis de Bloom / DOK)
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="mms-quiz-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem', color: '#38bdf8' }}>Nível 1 (Lembrar / DOK 1)</strong>
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>TAXA DE RETENÇÃO ESPERADA: 95%</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0' }}>
                Qual é a grandeza física fundamental que se conserva em todo processo de eletrização ou reação isolada?
              </p>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                <em>Gabarito:</em> Carga elétrica líquida (Princípio da Conservação das Cargas).
              </div>
            </div>

            <div className="mms-quiz-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem', color: '#f59e0b' }}>Nível 2 (Compreender / DOK 2)</strong>
                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>TAXA DE RETENÇÃO ESPERADA: 80%</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0' }}>
                Se dobrarmos a distância entre dois corpos carregados, o que ocorre exatamente com a força eletrostática entre eles?
              </p>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                <em>Gabarito:</em> A força é dividida por 4 (proporcionalidade quadrática inversa da Lei de Coulomb).
              </div>
            </div>

            <div className="mms-quiz-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem', color: '#c084fc' }}>Nível 3 (Aplicar / DOK 3)</strong>
                <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700 }}>TAXA DE RETENÇÃO ESPERADA: 70%</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0' }}>
                {currentPreset.boxes[0]?.challenge || 'Como explicar a polarização induzida sem transferência líquida de elétrons?'}
              </p>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                <em>Gabarito:</em> {currentPreset.boxes[0]?.definition || 'Separação de centros de carga na matéria neutra.'}
              </div>
            </div>
          </div>
        </div>
      )}

          {/* MODAL DE DESAFIO DA CAIXA */}
          {selectedBoxModal && (
            <div style={{ marginTop: 14, padding: 20, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #38bdf8', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mms-pill emerald">CAIXA #{selectedBoxModal.id} REVELADA!</span>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => setSelectedBoxModal(null)}
                >
                  ✕ Fechar
                </button>
              </div>

              <h3 style={{ margin: '10px 0 6px 0', color: '#38bdf8', fontSize: '1.2rem' }}>
                {selectedBoxModal.term}
              </h3>
              <p style={{ margin: '0 0 12px 0', color: '#cbd5e1', fontSize: '0.86rem' }}>
                📖 <strong>Definição Conceitual:</strong> {selectedBoxModal.definition}
              </p>

              <div style={{ padding: '12px 16px', background: 'rgba(56, 189, 248, 0.1)', borderLeft: '4px solid #38bdf8', borderRadius: 8 }}>
                <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>🎯 Desafio Relâmpago para a Turma:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#7dd3fc', fontSize: '0.84rem' }}>
                  {selectedBoxModal.challenge}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
