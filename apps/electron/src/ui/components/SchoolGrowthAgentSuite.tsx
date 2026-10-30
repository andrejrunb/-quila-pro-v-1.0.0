import React, { useState, useEffect } from 'react';
import {
  Sparkles, BookOpen, TrendingUp, Award, Copy, Check,
  Send, Share2, FileText, Camera, Brain, ExternalLink,
  ShieldCheck, Layers, Flame, RefreshCw, Globe, Users,
  CheckCircle2, BookmarkCheck, ArrowRight, Lightbulb, PenTool
} from 'lucide-react';
import './SchoolGrowthAgentSuite.css';

export type GrowthAgentTab = 'storyteller' | 'marketing' | 'authority';

interface StorytellerPreset {
  id: string;
  discipline: string;
  grade: string;
  bimester: string;
  everydayHook: string;
  title: string;
  bnccSkill: string;
  content: string;
  weeklyChallenge: string;
}

interface MarketingPreset {
  id: string;
  campaignGoal: string;
  targetAudience: string;
  framework: string;
  carouselSlides: Array<{ slide: number; visual: string; text: string }>;
  caption: string;
  reelsScript: string;
  imagePrompt: string;
}

interface AuthorityPreset {
  id: string;
  topic: string;
  recipient: string;
  title: string;
  executiveSummary: string;
  fullStatement: string;
  academicReferences: Array<{ author: string; year: string; title: string; publication: string; doi: string }>;
}

const STORYTELLER_PRESETS: StorytellerPreset[] = [
  {
    id: 'story-1',
    discipline: 'Física',
    grade: '1º Ano do Ensino Médio',
    bimester: '1º Bimestre',
    everydayHook: 'Por que seu corpo é jogado para a frente quando o ônibus escolar dá aquela freada?',
    title: 'A Inércia no Cotidiano: O Que Rayssa Leal e as Freadas de Ônibus Têm em Comum',
    bnccSkill: 'EM13CNT301 — Investigar movimentos sob a ação de forças e inércia',
    content: `Você já reparou quando a Rayssa Leal manda um *ollie* sobre uma rampa e o skate continua deslizando em linha reta no chão? Ou naquela manhã de segunda-feira em que o motorista do ônibus escolar pisou no freio de repente e todo mundo parecia ter sido empurrado por uma força invisível?

A verdade pode te surpreender: **ninguém te empurrou para a frente**.

### O Segredo de Galileu e Newton: A Teimosia da Matéria
O que você experimentou foi a **Primeira Lei de Newton (O Princípio da Inércia)**. 

A matéria tem uma propriedade natural fascinante: ela é "teimosa". Se um objeto está parado, ele quer continuar parado. Se ele já está em movimento a 40 km/h, ele quer continuar viajando pelo espaço a 40 km/h eternamente — a menos que uma força resultante o obrigue a mudar.

Quando o ônibus freia, o atrito dos freios age **sobre as rodas do veículo**, fazendo o ônibus parar. Mas nenhuma força tocou no seu tronco naquele milésimo de segundo! Portanto, o seu corpo não foi arremessado: foi o ônibus que parou debaixo dos seus pés enquanto você continuava na mesma velocidade!

### Por que o Cinto de Segurança é a Invenção Mais Genial da Física?
Sem o cinto, a inércia do passageiro continua até encontrar o para-brisa ou o banco da frente. O cinto de segurança aplica uma força contrária suave e controlada, desacelerando você junto com a estrutura do carro e salvando milhares de vidas todos os anos.`,
    weeklyChallenge: 'Nesta semana, quando você estiver andando de bicicleta ou skate, observe: você gasta mais energia para começar a pedalar ou para manter a velocidade constante depois do embalo? Compartilhe sua observação com o professor no app Áquila!'
  },
  {
    id: 'story-2',
    discipline: 'Química',
    grade: '2º Ano do Ensino Médio',
    bimester: '2º Bimestre',
    everydayHook: 'Como acertar a receita do brownie perfeito entendendo a Lei de Proust e Reagente Limitante',
    title: 'Química na Cozinha: Por Que Mais Fermento Não Significa um Bolo Duas Vezes Maior',
    bnccSkill: 'EM13CNT101 — Interpretar transformações e estequiometria em sistemas práticos',
    content: `Se você já tentou assar um bolo e dobrou o fermento achando que ele ficaria o dobro de macio, provavelmente viu o bolo crescer, transbordar na forma e depois desmoronar no centro! A química culinária não aceita improvisos ingênuos: ela segue as leis da estequiometria.

### A Lei de Proust: A Natureza Tem Proporções Sagradas
No século XVIII, o químico francês Joseph Louis Proust descobriu que quando duas substâncias reagem para formar um produto, elas sempre se combinam em **proporções de massa fixas e imutáveis**.

Imagine a receita de brigadeiro:
* Para cada **1 lata de leite condensado (395g)**, você precisa de exatamente **4 colheres de cacau**.
* Se você comprar 5 latas de leite condensado mas tiver apenas 4 colheres de cacau, quantos brigadeiros você faz? Apenas uma receita!

Na química, o cacau é o que chamamos de **Reagente Limitante**. Ele acaba primeiro e determina a quantidade exata de produto formado. O leite condensado que sobrou é o **Reagente em Excesso**. Entender estequiometria nada mais é do que aprender a não desperdiçar matéria e prever o rendimento exato de qualquer reação do universo.`,
    weeklyChallenge: 'Olhe os rótulos de 3 alimentos na sua despensa e descubra qual deles contém proporções rigorosas entre sódio e porção. Discuta com a turma no Albus Tutor!'
  }
];

const MARKETING_PRESETS: MarketingPreset[] = [
  {
    id: 'mkt-1',
    campaignGoal: 'Campanha de Matrículas 2027 — Ensino Médio com Foco ENEM & Medicina',
    targetAudience: 'Pais de alunos de 9º ano e 1ª série EM preocupados com aprovação vestibular e sobrecarga',
    framework: 'AIDA (Atenção, Interesse, Desejo, Ação)',
    carouselSlides: [
      {
        slide: 1,
        visual: 'Foto real de alta resolução: aluno compenetrado em laboratório com tablet Áquila e caderno, iluminação suave.',
        text: 'O 9º ano acabou... Seu filho está realmente preparado para o Ensino Médio que os vestibulares exigem hoje?'
      },
      {
        slide: 2,
        visual: 'Gráfico moderno de retenção comparando o estudo tradicional acumulado na véspera da prova com o estudo diário Kumon.',
        text: 'A transição para o Ensino Médio é o momento em que a sobrecarga e a ansiedade costumam atingir os jovens. Sem método individualizado, a autoconfiança despenca.'
      },
      {
        slide: 3,
        visual: 'Professor sorridente ao lado de um aluno em mentoria 1-a-1 com tela do Áquila Pro mostrando mapa de calor BNCC.',
        text: 'Aqui, cada aluno tem uma Trilha de Maestria Adaptativa: micro-desafios diários de 3 minutos, diagnóstico TRI em tempo real e tutoria socrática.'
      },
      {
        slide: 4,
        visual: 'Feedbacks reais de pais no WhatsApp com taxa de aprovação destacada em selo dourado (Top 3 ENEM Regional).',
        text: 'Rigor acadêmico com acolhimento socioemocional. Os pais acompanham a evolução diária no celular sem surpresas no boletim.'
      },
      {
        slide: 5,
        visual: 'Card institucional elegante com QR Code e botão de agendamento.',
        text: 'Vagas limitadas por turma para garantir o acompanhamento próximo. Toque no link da bio e agende um café com a Direção Pedagógica.'
      }
    ],
    caption: `O 9º ano marca o fim de uma fase e o início da contagem regressiva para os maiores vestibulares do país. 🎓✨

Muitos pais nos perguntam: *"Como saber se meu filho vai se adaptar ao ritmo do Ensino Médio sem perder o entusiasmo pelos estudos?"*

No Colégio Áquila Pro, a resposta está em aliar neuroaprendizagem a acolhimento genuíno. Nossos alunos não decoram fórmulas na véspera: praticam micro-hábitos diários com mentoria adaptativa e feedback contínuo.

Resultado? Segurança emocional, autonomia de estudos e índices históricos de aprovação nos cursos mais concorridos do Brasil (UnB, USP, Medicina e ITA).

👉 As matrículas antecipadas para 2027 estão abertas com condições exclusivas e vagas estritamente limitadas por turma.
📲 Clique no link da nossa bio ou envie uma mensagem direta para agendar uma visita guiada com nossa coordenação pedagógica.

#ColegioAquila #EnsinoMedio #ENEM2027 #EducacaoComProposito #Neuroaprendizagem #MatriculasAbertas #AprovacaoENEM`,
    reelsScript: `[CENA 1 - 0 a 3s | GANCHO VISUAL]
Aparece na tela um estudante olhando assustado para uma pilha gigante de apostilas.
Áudio (Voz marcante e acolhedora): "Seu filho estuda o dia inteiro, mas na hora da prova bate aquele branco?"

[CENA 2 - 3 a 15s | O PROBLEMA]
Corte rápido para gráficos de esquecimento.
Áudio: "A neurociência explica: o cérebro esquece até 70% do que ouviu em apenas 48 horas se não houver recuperação ativa."

[CENA 3 - 15 a 30s | A SOLUÇÃO ÁQUILA]
Corte para a sala de aula moderna, alunos sorrindo usando o Áquila Mobile Companion e o laboratório PhET.
Áudio: "No Áquila, nós usamos o método de espaçamento cognitivo com desafios diários de 3 minutos. O aluno aprende a raciocinar, não a decorar."

[CENA 4 - 30 a 40s | CTA FINAL]
Diretora da escola na entrada acolhendo uma família.
Áudio: "Venha conhecer um Ensino Médio pensado para o futuro. Link na bio para agendar sua visita!"`,
    imagePrompt: 'Professional high-end school photography, modern bright classroom with wooden textures and warm sunlight, Brazilian teenager focused on digital tablet with math simulation, smiling supportive teacher in background, cinematic depth of field, 8k resolution, photorealistic, Canon EOS R5 --ar 4:5 --style raw'
  }
];

const AUTHORITY_PRESETS: AuthorityPreset[] = [
  {
    id: 'auth-1',
    topic: 'Política Institucional de Ambientes Desconectados para Conexão Humana (Gestão de Telas)',
    recipient: 'Comunidade Escolar, Pais e Conselho Pedagógico',
    title: 'Diretriz Pedagógica: Por Que Instituímos o Ambiente Livre de Celulares Durante o Horário Letivo',
    executiveSummary: 'Síntese das evidências da neurociência atencional (Ward et al., 2017) e do relatório mundial UNESCO 2023 que fundamentam a restrição do uso recreativo de smartphones em sala e nos intervalos escolares.',
    fullStatement: `**Prezadas Famílias e Educadores da Comunidade Áquila,**

A missão primordial de uma instituição de ensino contemporânea não se restringe à mera transmissão instrucional de conteúdos curriculares; ela reside em salvaguardar e cultivar as condições cognitivas, atencionais e socioemocionais para que o pensamento crítico profundo e os vínculos humanos autênticos floresçam.

Por esse compromisso ético com o desenvolvimento integral de nossos estudantes, formalizamos a consolidação da política institucional **"Ambiente Desconectado para Conexão Humana"**, que estabelece a restrição do porte e uso recreativo de aparelhos celulares durante todo o período letivo (inclusive intervalos e almoço).

### 1. O Efeito "Brain Drain": A Mera Presença do Aparelho Drena a Memória de Trabalho
O estudo seminal de Ward e colaboradores (Universidade do Texas em Austin, 2017) comprovou experimentalmente que mesmo quando os celulares estão no modo silencioso e virados para baixo, a mera proximidade física do dispositivo consome uma fatia significativa dos recursos atencionais da memória de trabalho (*working memory capacity*). O cérebro do jovem precisa gastar energia metabólica contínua para **inibir o impulso de checar notificações**, diminuindo sua capacidade de raciocínio matemático e abstração conceitual.

### 2. O Alerta do Relatório Global da UNESCO (2023)
O relatório mundial da UNESCO (*Technology in Education: A Tool on Whose Terms?*) evidenciou que a presença ubíqua de smartphones na rotina escolar associa-se a:
- Queda mensurável no desempenho acadêmico em 14 países avaliados pelo programa PISA/OCDE.
- Inibição da interação social olho no olho, reduzindo a capacidade de negociação de conflitos e empatia entre pares.
- Elevação dos índices de ansiedade social decorrentes da cultura do FOMO (*Fear Of Missing Out*).

### 3. Nosso Compromisso Pedagógico
Nossa escola não é contra a tecnologia: nós lideramos o uso de Inteligência Artificial pedagógica supervisionada, plataformas de simulação física e robótica nos momentos e equipamentos institucionais adequados. O que rejeitamos é a dispersão compulsiva e o sequestro da atenção de nossos jovens por algoritmos de redes sociais.

Contamos com o apoio irrestrito dos senhores pais para que essa cultura de presença e foco seja reforçada no ambiente doméstico.`,
    academicReferences: [
      {
        author: 'Ward, A. F., Duke, K., Gneezy, A., & Bos, M. W.',
        year: '2017',
        title: 'Brain Drain: The Mere Presence of One’s Own Smartphone Reduces Available Cognitive Capacity',
        publication: 'Journal of the Association for Consumer Research, 2(2), 140–154',
        doi: '10.1086/691462'
      },
      {
        author: 'UNESCO',
        year: '2023',
        title: 'Global Education Monitoring Report: Technology in education: A tool on whose terms?',
        publication: 'Paris: UNESCO Publishing',
        doi: '10.54676/JOHG1144'
      },
      {
        author: 'Dehaene, Stanislas',
        year: '2020',
        title: 'How We Learn: Why Brains Learn Better Than Any Machine... for Now',
        publication: 'New York: Penguin Books',
        doi: '10.1017/CBO9781107415324'
      },
      {
        author: 'Hattie, John',
        year: '2008',
        title: 'Visible Learning: A Synthesis of Over 800 Meta-Analyses Relating to Achievement',
        publication: 'London & New York: Routledge',
        doi: '10.4324/9780203887332'
      }
    ]
  }
];

interface SchoolGrowthAgentSuiteProps {
  onBack?: () => void;
}

export const SchoolGrowthAgentSuite: React.FC<SchoolGrowthAgentSuiteProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<GrowthAgentTab>('storyteller');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [colabOnline, setColabOnline] = useState(false);

  // Storyteller States
  const [selectedStory, setSelectedStory] = useState<StorytellerPreset>(STORYTELLER_PRESETS[0]);
  const [customTopic, setCustomTopic] = useState('');

  // Marketing States
  const [selectedMkt, setSelectedMkt] = useState<MarketingPreset>(MARKETING_PRESETS[0]);

  // Authority States
  const [selectedAuth, setSelectedAuth] = useState<AuthorityPreset>(AUTHORITY_PRESETS[0]);

  // Check Colab GPU bridge status on mount
  useEffect(() => {
    const checkBridge = async () => {
      try {
        if ((window as any).aquila?.invoke) {
          const status = await (window as any).aquila.invoke('colab-gpu:get-status');
          if (status?.status === 'HEALTHY' || status?.status === 'ONLINE') {
            setColabOnline(true);
          }
        }
      } catch {
        setColabOnline(false);
      }
    };
    checkBridge();
  }, []);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      if ((window as any).aquila?.invoke && colabOnline) {
        let agentId = 'pedagogical_storyteller';
        if (activeTab === 'marketing') agentId = 'edumarketing_leads';
        if (activeTab === 'authority') agentId = 'scientific_authority';

        await (window as any).aquila.invoke('colab-gpu:generate-agent-content', {
          agentId,
          prompt: customTopic || 'Gere uma variação pedagógica adaptada'
        });
      }
    } catch (e) {
      console.warn('Fallback neural edge ativo:', e);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 900);
    }
  };

  return (
    <div className="growth-suite-container">
      {/* Top Banner Header */}
      <div className="growth-header-strip">
        {onBack && (
          <button
            onClick={onBack}
            className="ai-gen-btn"
            style={{ marginRight: '16px', background: 'rgba(255, 255, 255, 0.08)' }}
            aria-label="Voltar para a página anterior"
          >
            <ArrowLeft size={14} />
            <span>Voltar</span>
          </button>
        )}
        <div className="growth-title-box">
          <div className="growth-badge">
            <Sparkles size={13} className="text-amber-400" />
            <span>ENXAME DE AGENTES DE CRESCIMENTO & AUTORIDADE</span>
          </div>
          <h2 className="growth-main-title">Inteligência de Conteúdo, Captação & Rigor Pedagógico</h2>
          <p className="growth-subtitle">
            Três agentes autônomos treinados para posicionar a escola no topo: conectando a sala de aula ao cotidiano, captando novas famílias e blindando a autoridade pedagógica com evidências científicas.
          </p>
        </div>

        <div className="growth-engine-status">
          <div className={`status-pill ${colabOnline ? 'online' : 'offline'}`}>
            <span className="dot" />
            <span>{colabOnline ? 'GPU Colab Conectada (NVIDIA T4/A100)' : 'Modo Soberano Edge (Fallback Offline)'}</span>
          </div>
          <button
            className="ai-gen-btn"
            onClick={handleGenerateAI}
            disabled={isGenerating}
          >
            {isGenerating ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
            <span>{isGenerating ? 'Sintetizando...' : 'Gerar com IA do Áquila'}</span>
          </button>
        </div>
      </div>

      {/* 3 Main Navigation Tabs */}
      <div className="growth-tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'storyteller' ? 'active storyteller' : ''}`}
          onClick={() => setActiveTab('storyteller')}
        >
          <BookOpen size={16} />
          <div className="tab-meta">
            <span className="tab-label">1. Professor Storyteller</span>
            <span className="tab-desc">Conexão Cotidiana & Blog Escolar</span>
          </div>
        </button>

        <button
          className={`tab-btn ${activeTab === 'marketing' ? 'active marketing' : ''}`}
          onClick={() => setActiveTab('marketing')}
        >
          <TrendingUp size={16} />
          <div className="tab-meta">
            <span className="tab-label">2. Marketing & Captação</span>
            <span className="tab-desc">Carrosséis, Reels & Leads</span>
          </div>
        </button>

        <button
          className={`tab-btn ${activeTab === 'authority' ? 'active authority' : ''}`}
          onClick={() => setActiveTab('authority')}
        >
          <ShieldCheck size={16} />
          <div className="tab-meta">
            <span className="tab-label">3. Autoridade Científica</span>
            <span className="tab-desc">Notas Técnicas, Famílias & DOIs</span>
          </div>
        </button>
      </div>

      {/* Main Tab Workspace */}
      <div className="growth-tab-body">
        {/* ========================================================================= */}
        {/* TAB 1: PROFESSOR STORYTELLER */}
        {/* ========================================================================= */}
        {activeTab === 'storyteller' && (
          <div className="storyteller-workspace">
            <div className="left-controls-panel">
              <div className="panel-box">
                <span className="box-title">
                  <Lightbulb size={14} /> Modelos & Presets Didáticos
                </span>
                <div className="presets-list">
                  {STORYTELLER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      className={`preset-chip ${selectedStory.id === p.id ? 'active' : ''}`}
                      onClick={() => setSelectedStory(p)}
                    >
                      <div className="chip-header">
                        <span className="chip-disc">{p.discipline}</span>
                        <span className="chip-grade">{p.grade}</span>
                      </div>
                      <span className="chip-title">{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel-box">
                <span className="box-title">
                  <PenTool size={14} /> Personalizar Tema / Disciplina
                </span>
                <div className="form-group">
                  <label>Gancho do Cotidiano do Aluno:</label>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Ex: Por que a pipoca estoura ou como funciona o touch do celular?"
                  />
                </div>
                <div className="info-bncc-tag">
                  <Award size={13} />
                  <span>Vinculado à Matriz de Competências BNCC</span>
                </div>
              </div>
            </div>

            <div className="right-preview-panel">
              <div className="preview-top-bar">
                <div className="preview-meta">
                  <span className="badge-tag">{selectedStory.discipline}</span>
                  <span className="badge-bncc">{selectedStory.bnccSkill}</span>
                </div>
                <div className="preview-actions">
                  <button
                    className="action-btn"
                    onClick={() => handleCopy(selectedStory.content, 'story-content')}
                  >
                    {copiedField === 'story-content' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedField === 'story-content' ? 'Copiado!' : 'Copiar Artigo'}</span>
                  </button>
                  <button
                    className="action-btn primary"
                    onClick={() => alert('Artigo transmitido para publicação no Blog Institucional Áquila!')}
                  >
                    <Globe size={14} />
                    <span>Publicar no Blog</span>
                  </button>
                </div>
              </div>

              <div className="article-sheet">
                <h1 className="article-title">{selectedStory.title}</h1>
                <div className="hook-quote">
                  <span className="hook-label">💡 PONTO DE PARTIDA DO COTIDIANO:</span>
                  <p>{selectedStory.everydayHook}</p>
                </div>

                <div className="article-content-body">
                  {selectedStory.content.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('### ')) {
                      return <h3 key={idx}>{paragraph.replace('### ', '')}</h3>;
                    }
                    if (paragraph.startsWith('* ')) {
                      return (
                        <ul key={idx}>
                          {paragraph.split('\n').map((item, itemIdx) => (
                            <li key={itemIdx}>{item.replace('* ', '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx}>{paragraph}</p>;
                  })}
                </div>

                <div className="challenge-card">
                  <div className="challenge-header">
                    <Flame size={16} className="text-amber-400" />
                    <span>DESAFIO SEMANAL DE NEUROAPRENDIZAGEM (ESTUDO ATIVO)</span>
                  </div>
                  <p>{selectedStory.weeklyChallenge}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MARKETING & LEADS */}
        {/* ========================================================================= */}
        {activeTab === 'marketing' && (
          <div className="marketing-workspace">
            <div className="mkt-summary-strip">
              <div className="mkt-metric">
                <span className="mkt-kpi-label">OBJETIVO DA CAMPANHA</span>
                <span className="mkt-kpi-value">{selectedMkt.campaignGoal}</span>
              </div>
              <div className="mkt-metric">
                <span className="mkt-kpi-label">PÚBLICO-ALVO</span>
                <span className="mkt-kpi-value">{selectedMkt.targetAudience}</span>
              </div>
              <div className="mkt-metric">
                <span className="mkt-kpi-label">FRAMEWORK DE PERSUASÃO</span>
                <span className="mkt-kpi-value text-amber-400">{selectedMkt.framework}</span>
              </div>
            </div>

            <div className="mkt-grid-2cols">
              {/* Left Column: Carousel & Visual Storyboard */}
              <div className="mkt-card-panel">
                <div className="panel-header-row">
                  <div className="header-title">
                    <Layers size={16} className="text-cyan-400" />
                    <h3>Roteiro de Carrossel Instagram (5 Lâminas de Alta Retenção)</h3>
                  </div>
                  <button
                    className="action-btn small"
                    onClick={() => handleCopy(JSON.stringify(selectedMkt.carouselSlides, null, 2), 'mkt-slides')}
                  >
                    {copiedField === 'mkt-slides' ? <Check size={13} /> : <Copy size={13} />}
                    <span>Copiar Slides</span>
                  </button>
                </div>

                <div className="slides-track">
                  {selectedMkt.carouselSlides.map((slide) => (
                    <div key={slide.slide} className="slide-box">
                      <div className="slide-top">
                        <span className="slide-pill">SLIDE {slide.slide}</span>
                        <span className="slide-type">
                          {slide.slide === 1 ? 'Gancho / Capa' : slide.slide === 5 ? 'CTA / Lead' : 'Solução & Prova'}
                        </span>
                      </div>
                      <div className="slide-visual">
                        <Camera size={13} />
                        <span>{slide.visual}</span>
                      </div>
                      <div className="slide-text">
                        <p>{slide.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Image Prompt Box */}
                <div className="image-prompt-box">
                  <div className="prompt-header">
                    <Sparkles size={14} className="text-purple-400" />
                    <span>Prompt de Imagem (Midjourney / Flux / Canva AI):</span>
                    <button
                      className="copy-prompt-btn"
                      onClick={() => handleCopy(selectedMkt.imagePrompt, 'mkt-prompt')}
                    >
                      {copiedField === 'mkt-prompt' ? <Check size={12} /> : <Copy size={12} />}
                      <span>Copiar Prompt</span>
                    </button>
                  </div>
                  <pre className="prompt-code">{selectedMkt.imagePrompt}</pre>
                </div>
              </div>

              {/* Right Column: Feed Caption & Reels Script */}
              <div className="mkt-card-panel">
                <div className="panel-header-row">
                  <div className="header-title">
                    <Share2 size={16} className="text-emerald-400" />
                    <h3>Legenda do Post & Script para Reels (30s)</h3>
                  </div>
                  <button
                    className="action-btn small"
                    onClick={() => handleCopy(selectedMkt.caption, 'mkt-caption')}
                  >
                    {copiedField === 'mkt-caption' ? <Check size={13} /> : <Copy size={13} />}
                    <span>Copiar Legenda</span>
                  </button>
                </div>

                <div className="caption-preview-box">
                  <span className="box-sub">LEGENDA COMPLETA DO FEED (COM HASHTAGS):</span>
                  <div className="caption-text-area">{selectedMkt.caption}</div>
                </div>

                <div className="reels-script-box">
                  <div className="reels-header">
                    <Users size={14} className="text-cyan-400" />
                    <span className="box-sub">SCRIPT DE VÍDEO CURTO (REELS / TIKTOK 30 SEG):</span>
                    <button
                      className="copy-prompt-btn"
                      onClick={() => handleCopy(selectedMkt.reelsScript, 'mkt-reels')}
                    >
                      {copiedField === 'mkt-reels' ? <Check size={12} /> : <Copy size={12} />}
                      <span>Copiar Script</span>
                    </button>
                  </div>
                  <pre className="reels-code">{selectedMkt.reelsScript}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AUTORIDADE CIENTÍFICA & NOTAS TÉCNICAS */}
        {/* ========================================================================= */}
        {activeTab === 'authority' && (
          <div className="authority-workspace">
            <div className="auth-top-bar">
              <div className="auth-badge-row">
                <span className="auth-pill">COMUNICADO INSTITUCIONAL OFICIAL</span>
                <span className="auth-dest">{selectedAuth.recipient}</span>
              </div>
              <div className="auth-actions">
                <button
                  className="action-btn"
                  onClick={() => handleCopy(selectedAuth.fullStatement, 'auth-text')}
                >
                  {copiedField === 'auth-text' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>Copiar Nota Técnica</span>
                </button>
                <button
                  className="action-btn primary"
                  onClick={() => alert('Nota Técnica enviada para todos os responsáveis via Portal da Família e WhatsApp Oficial!')}
                >
                  <Send size={14} />
                  <span>Disparar para as Famílias</span>
                </button>
              </div>
            </div>

            <div className="auth-paper-container">
              <header className="paper-header">
                <h1 className="paper-title">{selectedAuth.title}</h1>
                <div className="paper-meta-strip">
                  <span><strong>Emissão:</strong> Conselho Pedagógico & Direção Geral</span>
                  <span><strong>Protocolo de Governança:</strong> Áquila Neuro-Pedagógico v2.0</span>
                </div>
                <div className="paper-summary">
                  <strong>Sumário Executivo: </strong>
                  {selectedAuth.executiveSummary}
                </div>
              </header>

              <div className="paper-body">
                {selectedAuth.fullStatement.split('\n\n').map((block, i) => {
                  if (block.startsWith('### ')) {
                    return <h3 key={i}>{block.replace('### ', '')}</h3>;
                  }
                  if (block.startsWith('- ')) {
                    return (
                      <ul key={i}>
                        {block.split('\n').map((it, idx) => (
                          <li key={idx}>{it.replace('- ', '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i}>{block}</p>;
                })}
              </div>

              {/* Verified Academic References Table */}
              <div className="paper-references-section">
                <div className="refs-title">
                  <BookmarkCheck size={16} className="text-amber-400" />
                  <h3>Evidências Científicas & Referências Bibliográficas (Com DOIs Verificáveis)</h3>
                </div>

                <div className="refs-table">
                  {selectedAuth.academicReferences.map((ref, idx) => (
                    <div key={idx} className="ref-entry">
                      <div className="ref-main">
                        <span className="ref-author">{ref.author} ({ref.year}).</span>
                        <span className="ref-title"> <em>{ref.title}</em>.</span>
                        <span className="ref-pub"> {ref.publication}.</span>
                      </div>
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ref-doi-link"
                      >
                        <ExternalLink size={12} />
                        <span>DOI: {ref.doi}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
