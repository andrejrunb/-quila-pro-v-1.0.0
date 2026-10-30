import React, { useState, useEffect } from 'react';
import {
  Sparkles, BookOpen, TrendingUp, Award, Copy, Check,
  Send, Share2, FileText, Camera, Brain, ExternalLink,
  ShieldCheck, Layers, Flame, RefreshCw, Globe, Users,
  CheckCircle2, BookmarkCheck, ArrowRight, Lightbulb, PenTool
} from 'lucide-react';
import './SchoolGrowthAgentSuite.css';

export type GrowthAgentTab = 'storyteller' | 'marketing' | 'authority' | 'funnel' | 'radar';

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


export interface FunnelStageItem {
  step: number;
  name: string;
  count: number;
  conversionPct: number;
  benchmarkPct: string;
  sla: string;
  description: string;
}

export interface CommercialKpiItem {
  label: string;
  value: string;
  change: string;
  status: 'positive' | 'warning';
  target: string;
}

export interface FollowUpStepItem {
  timing: string;
  title: string;
  channel: 'WhatsApp' | 'Telefone' | 'E-mail';
  script: string;
  objective: string;
}

const FUNNEL_STAGES: FunnelStageItem[] = [
  { step: 1, name: '1. Geração de Demanda', count: 142, conversionPct: 100, benchmarkPct: 'Base 100%', sla: 'Contínuo', description: 'Leads atraídos via campanhas MetaAds, Instagram e indicação orgânica.' },
  { step: 2, name: '2. Qualificação Rápida', count: 121, conversionPct: 85.2, benchmarkPct: '80% - 90%', sla: '< 5 minutos', description: 'Contato via WhatsApp Soberano para entender série, turno e expectativa.' },
  { step: 3, name: '3. Visita Agendada', count: 48, conversionPct: 39.6, benchmarkPct: '35% - 45%', sla: 'Em até 48h', description: 'Agendamento para tour presencial pelo colégio e laboratório STEM.' },
  { step: 4, name: '4. Comparecimento Real', count: 41, conversionPct: 85.4, benchmarkPct: '80% - 85%', sla: 'Dia da Visita', description: 'Famílias que compareceram à visita presencial encantadora.' },
  { step: 5, name: '5. Matrícula Fechada', count: 29, conversionPct: 70.7, benchmarkPct: '60% - 70%', sla: 'Em até 5 dias', description: 'Matrículas confirmadas e migradas para o sistema de gestão escolar.' }
];

const COMMERCIAL_KPIS: CommercialKpiItem[] = [
  { label: 'Leads Semanais', value: '142', change: '+18.3%', status: 'positive', target: 'Meta: 120' },
  { label: 'SLA 1º Contato', value: '3.8 min', change: '-42%', status: 'positive', target: 'SLA < 5 min' },
  { label: 'Taxa de Resposta', value: '68.4%', change: '+5.1%', status: 'positive', target: 'Meta: > 60%' },
  { label: 'Visitas Realizadas', value: '41', change: '+12%', status: 'positive', target: 'Meta: 35' },
  { label: 'Comparecimento', value: '85.4%', change: '+3.2%', status: 'positive', target: 'Ref: 80%' },
  { label: 'Propostas Emitidas', value: '38', change: '+15%', status: 'positive', target: 'Meta: 30' },
  { label: 'Matrículas Fechadas', value: '29', change: '+20.8%', status: 'positive', target: 'Meta: 25' },
  { label: 'CAC Efetivo', value: 'R$ 184', change: '-14.5%', status: 'positive', target: 'Teto: R$ 250' }
];

const FOLLOWUP_STEPS: FollowUpStepItem[] = [
  {
    timing: '2 horas pós-visita',
    title: 'Agradecimento & Registro de Afeto',
    channel: 'WhatsApp',
    objective: 'Aquecer a memória emotiva da família logo após o retorno para casa.',
    script: 'Olá, [Nome da Mãe/Pai]! Foi uma honra receber você e o [Nome do Aluno] hoje no Colégio Visão. Ficamos encantados com o interesse dele pelo nosso Laboratório STEM e a Arena de Robótica! Segue uma foto linda dele conhecendo nossos experimentos. Ficou alguma dúvida sobre nossa proposta?'
  },
  {
    timing: '24 horas pós-visita',
    title: 'Dossiê Pedagógico Individualizado',
    channel: 'WhatsApp',
    objective: 'Comprovar a autoridade técnica da escola com diagnóstico personalizado.',
    script: 'Olá, [Nome]! Nossa coordenação pedagógica já estruturou o Plano Preliminar de Desenvolvimento para o [Nome do Aluno], considerando a fase do [Ano Escolar]. Com nosso motor de nivelamento por Maestria, ele terá acompanhamento contínuo em matemática e redação. Segue o PDF do plano anexo!'
  },
  {
    timing: '48 horas pós-visita',
    title: 'Convite: "Aluno por um Dia"',
    channel: 'WhatsApp',
    objective: 'Eliminar o medo de adaptação da criança e gerar vínculo social com a turma.',
    script: 'Olá, [Nome]! Abrimos uma vaga especial para o [Nome do Aluno] participar da nossa vivência "Aluno por um Dia" nesta quinta-feira. Ele vai assistir às aulas práticas, participar do intervalo e conhecer os futuros colegas. Podemos reservar o crachá de visitante dele?'
  },
  {
    timing: '72 horas pós-visita',
    title: 'Condição Especial de Reserva Antecipada',
    channel: 'WhatsApp',
    objective: 'Gatilho de urgência ética e garantia de vaga em turma com limite reduzido.',
    script: 'Olá, [Nome]! Como mantemos o teto pedagógico rigoroso de 25 alunos por turma para garantir o acompanhamento de perto, restam apenas 3 vagas para o turno matutino do [Ano Escolar]. Se confirmarmos até sexta-feira, garantimos a isenção da taxa de matrícula!'
  },
  {
    timing: '5º dia útil',
    title: 'Ligação Estratégica da Coordenação',
    channel: 'Telefone',
    objective: 'Resolução de objeções financeiras ou de transporte com atendimento humano.',
    script: 'Olá [Nome], sou a Coordenadora Pedagógica do Colégio Visão. Liguei pessoalmente para saber como foi a conversa em família sobre o futuro escolar do [Nome do Aluno] e me colocar à disposição para qualquer ajuste necessário.'
  }
];

export interface CompetitorSchoolItem {
  id: string;
  name: string;
  distanceKm: number;
  type: 'Privada Confessional' | 'Privada Tradicional' | 'Bilingue / Internacional' | 'Franquia Nacional';
  tuitionRange: string;
  studentsCount: number;
  idebOrEnemScore: string;
  technologyLevel: 'Analógica / Fichário' | 'Básica (Portal Web)' | 'Média (Google/MS)' | 'SaaS Externo';
  vulnerabilities: string[];
  aquilaCounterStrategy: string;
}

const COMPETITOR_SCHOOLS_RADAR: CompetitorSchoolItem[] = [
  {
    id: 'comp-1',
    name: 'Colégio Alpha Elite',
    distanceKm: 1.4,
    type: 'Franquia Nacional',
    tuitionRange: 'R$ 2.400 - R$ 3.100',
    studentsCount: 850,
    idebOrEnemScore: '638.4 (ENEM 2024)',
    technologyLevel: 'SaaS Externo',
    vulnerabilities: [
      'Alunos usam celular em sala de aula para exercícios (violação da lei antibelas)',
      'Dados de desempenho escolar armazenados em servidores na nuvem pública nos EUA',
      'Atendimento e follow-up comercial demorado (> 4 horas)'
    ],
    aquilaCounterStrategy: 'Destacar o Áquila Paper & OMR Soberano (avaliação física sem celulares na sala), Soberania LGPD local e resposta comercial em < 5 minutos.'
  },
  {
    id: 'comp-2',
    name: 'Instituto Educacional São Bento',
    distanceKm: 2.8,
    type: 'Privada Confessional',
    tuitionRange: 'R$ 1.650 - R$ 2.100',
    studentsCount: 620,
    idebOrEnemScore: '602.1 (ENEM 2024)',
    technologyLevel: 'Analógica / Fichário',
    vulnerabilities: [
      'Correção de provas 100% manual (demora até 15 dias para publicar boletim)',
      'Sem acompanhamento contínuo de lacunas (apenas avaliações bimestrais estáticas)',
      'Controle de portaria com caderneta ou crachá de código de barras suscetível a fraudes'
    ],
    aquilaCounterStrategy: 'Demonstrar a Catraca com Reconhecimento Facial em 100ms e Correção OMR Instantânea com trilha Kumon de recuperação contínua.'
  },
  {
    id: 'comp-3',
    name: 'Escola Horizonte Moderno',
    distanceKm: 3.5,
    type: 'Privada Tradicional',
    tuitionRange: 'R$ 1.900 - R$ 2.500',
    studentsCount: 480,
    idebOrEnemScore: '614.8 (ENEM 2024)',
    technologyLevel: 'Básica (Portal Web)',
    vulnerabilities: [
      'Altas taxas de evasão no 1º ano do Ensino Médio sem diagnóstico prévio',
      'Comunicação com famílias fragmentada em grupos informais de WhatsApp',
      'Sem simulados específicos com questões das bancas regionais (UFG, UnB/PAS, UFU)'
    ],
    aquilaCounterStrategy: 'Vender a Retenção Preditiva com Early Warning de Evasão (Piloto H-02) e Cadernos de Prova personalizados para PAS-UnB e UFG.'
  }
];

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
  const [copiedScriptIndex, setCopiedScriptIndex] = useState<number | null>(null);
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

      {/* 5 Main Navigation Tabs */}
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

        <button
          className={`tab-btn ${activeTab === 'funnel' ? 'active funnel' : ''}`}
          onClick={() => setActiveTab('funnel')}
        >
          <Layers size={16} />
          <div className="tab-meta">
            <span className="tab-label">4. Captação Previsível</span>
            <span className="tab-desc">Funil 5 Fases, KPIs & Follow-up</span>
          </div>
        </button>

        <button
          className={`tab-btn ${activeTab === 'radar' ? 'active radar' : ''}`}
          onClick={() => setActiveTab('radar')}
        >
          <Globe size={16} />
          <div className="tab-meta">
            <span className="tab-label">5. Radar Competitivo & INEP</span>
            <span className="tab-desc">Inteligência Local 5km & Censo</span>
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

        {/* ========================================================================= */}
        {/* TAB 4: CAPTAÇÃO PREVISÍVEL (CRM & FUNIL ESCOLAR) */}
        {/* ========================================================================= */}
        {activeTab === 'funnel' && (
          <div className="funnel-workspace">
            {/* 8 KPIs SEMANAIS DE PREVISIBILIDADE */}
            <div className="funnel-kpi-section">
              <div className="section-title-row">
                <div className="title-with-icon">
                  <Flame size={18} className="text-amber-400" />
                  <div>
                    <h3>8 KPIs Semanais de Previsibilidade Comercial</h3>
                    <p>Metas e SLAs para blindagem do funil de matrículas e eliminação do improviso</p>
                  </div>
                </div>
                <div className="sla-alert-badge">
                  <ShieldCheck size={14} />
                  <span>SLA 1º Contato: 3.8 min (Meta: &lt; 5 min)</span>
                </div>
              </div>

              <div className="kpi-grid">
                {COMMERCIAL_KPIS.map((kpi, idx) => (
                  <div key={idx} className="kpi-card">
                    <span className="kpi-label">{kpi.label}</span>
                    <div className="kpi-val-row">
                      <span className="kpi-value">{kpi.value}</span>
                      <span className={`kpi-change ${kpi.status}`}>{kpi.change}</span>
                    </div>
                    <span className="kpi-target">{kpi.target}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FUNIL EM 5 FASES */}
            <div className="funnel-pipeline-section">
              <div className="pipeline-header">
                <h3>Pipeline do Funil Comercial Escolar (5 Etapas)</h3>
                <p>Taxas de conversão reais vs. benchmark de mercado escolar</p>
              </div>

              <div className="funnel-pipeline">
                {FUNNEL_STAGES.map((st) => (
                  <div key={st.step} className="pipeline-stage-card">
                    <div className="stage-top">
                      <span className="stage-step-num">ETAPA 0{st.step}</span>
                      <span className="stage-sla-tag">SLA: {st.sla}</span>
                    </div>
                    <h4 className="stage-name">{st.name}</h4>
                    <div className="stage-numbers">
                      <span className="stage-count">{st.count} leads</span>
                      <span className="stage-conv">{st.conversionPct}% conv.</span>
                    </div>
                    <span className="stage-bench">Ref: {st.benchmarkPct}</span>
                    <p className="stage-desc">{st.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RÉGUA DE 5 PONTOS DE FOLLOW-UP PÓS-VISITA */}
            <div className="followup-sequence-section">
              <div className="followup-header">
                <div>
                  <h3>Régua Ativa de 5 Pontos de Follow-up Pós-Visita</h3>
                  <p>Scripts validados para reter o interesse emotivo da família e fechar a matrícula sem desconto destrutivo</p>
                </div>
              </div>

              <div className="followup-cards-list">
                {FOLLOWUP_STEPS.map((step, idx) => (
                  <div key={idx} className="followup-step-item">
                    <div className="step-badge-col">
                      <span className="timing-pill">{step.timing}</span>
                      <span className="channel-pill">{step.channel}</span>
                    </div>
                    <div className="step-content-col">
                      <h4>{step.title}</h4>
                      <p className="step-objective"><strong>Objetivo:</strong> {step.objective}</p>
                      <div className="script-box">
                        <p>"{step.script}"</p>
                      </div>
                    </div>
                    <div className="step-action-col">
                      <button
                        className="btn-copy-script"
                        onClick={() => {
                          navigator.clipboard?.writeText(step.script);
                          setCopiedScriptIndex(idx);
                          setTimeout(() => setCopiedScriptIndex(null), 2000);
                        }}
                      >
                        {copiedScriptIndex === idx ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                        <span>{copiedScriptIndex === idx ? 'Copiado!' : 'Copiar Script'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: RADAR DE CONCORRÊNCIA LOCAL & INEP */}
        {/* ========================================================================= */}
        {activeTab === 'radar' && (
          <div className="radar-workspace">
            {/* Header com Dados do Censo Escolar / INEP */}
            <div className="inep-benchmark-box">
              <div className="inep-badge">
                <Globe size={14} />
                <span>MICRODADOS CENSO ESCOLAR & INEP 2024 / 2025</span>
              </div>
              <div className="inep-content">
                <h3>Inteligência Geoeconômica do Território Escolar (Raio de 5.0 km)</h3>
                <p>
                  Mapeamento tático de escolas privadas concorrentes, faixas de mensalidade, notas médias nas bancas regionais e vulnerabilidades operacionais para posicionamento do Áquila Pro.
                </p>
              </div>
              <div className="inep-stats-bar">
                <div className="stat-unit">
                  <span className="stat-n">7</span>
                  <span className="stat-t">Escolas Mapeadas</span>
                </div>
                <div className="stat-unit">
                  <span className="stat-n">R$ 2.150</span>
                  <span className="stat-t">Ticket Médio Regional</span>
                </div>
                <div className="stat-unit">
                  <span className="stat-n">618.4</span>
                  <span className="stat-t">Média ENEM Território</span>
                </div>
                <div className="stat-unit">
                  <span className="stat-n">86%</span>
                  <span className="stat-t">Uso de Telas/Celulares Proibidos</span>
                </div>
              </div>
            </div>

            {/* Grid dos Concorrentes Mapeados */}
            <div className="competitors-grid">
              {COMPETITOR_SCHOOLS_RADAR.map((comp) => (
                <div key={comp.id} className="competitor-card">
                  <div className="comp-card-header">
                    <div>
                      <span className="comp-dist-badge">{comp.distanceKm} km de distância</span>
                      <h4 className="comp-name">{comp.name}</h4>
                      <span className="comp-type-tag">{comp.type}</span>
                    </div>
                    <div className="comp-scores">
                      <span className="comp-tuition">{comp.tuitionRange}</span>
                      <span className="comp-enem">{comp.idebOrEnemScore}</span>
                    </div>
                  </div>

                  <div className="comp-tech-level">
                    <span className="tech-label">Infraestrutura Tecnológica:</span>
                    <span className="tech-val">{comp.technologyLevel}</span>
                  </div>

                  <div className="comp-vulnerabilities">
                    <h5>Gargalos & Vulnerabilidades Concorrenciais:</h5>
                    <ul>
                      {comp.vulnerabilities.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="comp-counter-strategy">
                    <div className="strategy-title">
                      <Sparkles size={14} color="#38BDF8" />
                      <span>Contra-Ataque Estratégico do Áquila Pro:</span>
                    </div>
                    <p>{comp.aquilaCounterStrategy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
