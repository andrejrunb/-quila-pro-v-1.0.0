import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Printer,
  Copy,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Check,
  ChevronDown,
  Clock,
  Send
} from 'lucide-react';
import './EssayLab1000.css';

export interface EssayTheme {
  id: string;
  year: string;
  title: string;
  area: string;
  motivationalSummary: string;
  repertoireSuggestions: string[];
  sampleModel1000?: string;
}

export const OFFICIAL_ENEM_THEMES: EssayTheme[] = [
  {
    id: 'fuvest-medicina-2025',
    year: 'FUVEST / MEDICINA 2025',
    title: 'A fronteira ética na edição genética, clonagem e nos transplantes de órgãos na contemporaneidade',
    area: 'Bioética, Medicina & Biotecnologia',
    motivationalSummary: 'O aprimoramento da tecnologia CRISPR-Cas9 e a escassez de órgãos humanos tensionam a bioética global. O debate exige ponderação entre a cura de enfermidades hereditárias e o risco da eugenia e da mercantilização de tecidos biológicos.',
    repertoireSuggestions: [
      'Hans Jonas (O Princípio Responsabilidade)',
      'Michael Sandel (Contra a Perfeição: Ética na Era da Engenharia Genética)',
      'Juramento de Hipócrates e Declaração Universal sobre Bioética e Direitos Humanos (UNESCO)',
      'Código de Ética Médica (CFM Brasil)'
    ],
    sampleModel1000: `Na obra "O Princípio Responsabilidade", o filósofo Hans Jonas adverte que o poderio tecnológico humano atingiu magnitude capaz de comprometer a própria essência da vida futura, exigindo uma ética de autocontenção. No cenário contemporâneo, a rápida evolução da edição genômica e das técnicas de xenotransplante confirma a premonição jonasiana, colocando a bioética no epicentro das decisões médicas. Nesse horizonte desafiador, é imperativo conciliar a busca por terapias avançadas com a preservação irrestrita da dignidade ontológica da humanidade.

Em primeira análise, o domínio de ferramentas de recombinação genética como a CRISPR-Cas9 abre perspectivas promissoras para erradicar patologias monogênicas graves, como a anemia falciforme e a fibrose cística. Entretanto, a fronteira tênue entre a terapia curativa e o aprimoramento eugênico ameaça aprofundar desigualdades abissais. Conforme alerta o filósofo Michael Sandel em "Contra a Perfeição", a busca desmedida pela manipulação de traços fenotípicos desagrega o senso de solidariedade social, transformando a vida em mera mercadoria biológica acessível apenas às elites financeiras.

Ademais, a crise de escassez de órgãos para transplantes no Brasil expõe dilemas distributivos prementes. A despeito de o Sistema Nacional de Transplantes (SNT) ser um dos maiores modelos públicos do mundo, a taxa de recusa familiar e a carência de equipes de captação em hospitais do interior perpetuam filas angustiantes. Sob a perspectiva do utilitarismo ético, a adoção de avanços biotecnológicos deve estar subordinada a protocolos clínicos transparentes que impeçam a precarização dos critérios de morte encefálica e o comércio ilícito de órgãos.

Portanto, faz-se urgente a regulação prudente da prática biotecnológica. Cabe ao Conselho Nacional de Saúde, em sinergia com o Conselho Federal de Medicina e os comitês de bioética hospitalares, instituir diretrizes mandatórias para pesquisas em linhagens germinativas e protocolos de transplante. Tal medida deve ser detalhada por meio de consultas públicas interdisciplinares com juristas, médicos e a sociedade civil, de modo a salvaguardar o juramento hipocrático de não maleficência e assegurar que a ciência permaneça a serviço da vida, e não da segregação humana.`
  },
  {
    id: 'fund2-cidadania-telas',
    year: 'FUNDAMENTAL II / ANOS FINAIS',
    title: 'O impacto das telas e das redes sociais na convivência escolar e na infância',
    area: 'Cidadania Digital, Convivência Escolar & Psicologia',
    motivationalSummary: 'O tempo excessivo em smartphones durante a infância e adolescência afeta o sono, a atenção nas aulas e as relações presenciais, exigindo equilíbrio entre tecnologia e bem-estar.',
    repertoireSuggestions: [
      'ECA - Estatuto da Criança e do Adolescente (Lei nº 8.069/1990)',
      'Sociedade Brasileira de Pediatria (Manual de Saúde Digital)',
      'Marco Civil da Internet (Lei nº 12.965/2014)'
    ],
    sampleModel1000: `O Estatuto da Criança e do Adolescente preconiza o direito ao desenvolvimento integral, ao brincar e à convivência comunitária como prioridades absolutas. No entanto, o uso desenfreado de smartphones e redes sociais por crianças e adolescentes impõe desafios inéditos à saúde física e emocional dos estudantes. Torna-se indispensável, assim, refletir sobre a perda do convívio afetivo real e a necessidade de uma educação mediática consciente.

Em primeiro lugar, o tempo excessivo diante de dispositivos eletrônicos compromete a capacidade de concentração e estimula o isolamento social. Segundo a Sociedade Brasileira de Pediatria, a exposição desregulada a telas reduz as horas de sono e afeta o rendimento pedagógico, gerando ansiedade e dependência de estímulos visuais instantâneos. Nas escolas, a substituição do diálogo e das brincadeiras coletivas por telas individuais enfraquece o sentimento de pertença e a empatia entre os colegas.

Outrossim, a ausência de mediação parental no acesso a algoritmos predatórios expõe os jovens a conteúdos inadequados e ao cyberbullying. Sem orientação crítica, o ambiente digital deixa de ser um instrumento educativo para se transformar em espaço de comparação social destrutiva e baixa autoestima.

Infere-se, portanto, a necessidade de equilíbrio e orientação. Cabe às escolas, em parceria com as famílias e especialistas em pedagogia, promover campanhas de conscientização digital e espaços livres de celular durante o recreio. Essa ação deve ser complementada por oficinas de letramento digital e esportes ao ar livre, a fim de resgatar o valor do encontro presencial e proteger o pleno desenvolvimento da infância.`
  },
  {
    id: 'enem-2023',
    year: 'ENEM 2023',
    title: 'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil',
    area: 'Sociologia & Direitos Humanos',
    motivationalSummary: 'Historicamente, a sobrecarga de afazeres domésticos e cuidados com crianças, enfermos e idosos recai desproporcionalmente sobre a mulher brasileira, sem remuneração correspondente e invisibilizada nas políticas públicas.',
    repertoireSuggestions: [
      'Constituição Cidadã de 1988 (Artigo 6º - Direitos Sociais)',
      'Silvia Federici (O Ponto Zero da Revolução)',
      'Simone de Beauvoir (O Segundo Sexo)',
      'IBGE (Pesquisa Nacional por Amostra de Domicílios Contínua - PNAD)'
    ],
    sampleModel1000: `A Constituição Cidadã de 1988 assegura a dignidade da pessoa humana e o acesso universal aos direitos sociais como pilares inegociáveis do Estado Democrático. No entanto, a persistente invisibilidade do trabalho de cuidado realizado pela mulher no Brasil evidencia uma lacuna abissal entre a prerrogativa legal e a vivência cotidiana. Com efeito, essa conjuntura perversa perpetua tanto a sobrecarga física e emocional feminina quanto a desvalorização estrutural dessa labuta indispensável à manutenção da sociedade.

Em primeiro plano, cabe destacar a herança patriarcal e a divisão sexual do trabalho como catalisadores desse cenário opressor. Segundo a socióloga Silvia Federici, o trabalho reprodutivo não remunerado foi historicamente relegado às mulheres como um suposto atributo natural, desprovido de valor econômico formal. Sob essa ótica, milhares de brasileiras acumulam jornadas duplas ou triplas, privando-se de oportunidades educacionais e profissionais para cuidar de idosos, crianças e lares, o que reitera a tese de "cidadãos de papel" formulada pelo jurista Gilberto Dimenstein.

Ademais, constata-se a insuficiência de equipamentos públicos de suporte e a omissão estatal no custeio dessa rede assistencial. De acordo com o filósofo Thomas Hobbes, o Estado surge para garantir a integridade e o bem-estar da coletividade. Todavia, a escassez de creches em tempo integral, de centros-dia para convivência de idosos e de subsídios previdenciários perpetua a feminização da pobreza, deixando famílias desamparadas e a mercê da exaustão individual.

Portanto, medidas imperativas são necessárias para erradicar essa invisibilidade histórica. Cabe ao Ministério do Desenvolvimento e Assistência Social, em convergência com o Ministério das Mulheres, instituir a Política Nacional de Cuidados Compartilhados, mediante a expansão massiva de creches públicas e a concessão de auxílio-cuidador com contagem de tempo para aposentadoria. Tal ação deve ser detalhada por meio de consultas populares e mapeamento censitário regionalizado, a fim de assegurar o devido reconhecimento econômico às mulheres e consolidar, em sua plenitude, a justiça social preconizada pela Carta Magna.`
  },
  {
    id: 'enem-2022',
    year: 'ENEM 2022',
    title: 'Desafios para a valorização de comunidades e povos tradicionais no Brasil',
    area: 'Antropologia & Meio Ambiente',
    motivationalSummary: 'Povos indígenas, quilombolas, ribeirinhos e comunidades extrativistas guardam saberes ancestrais e protegem a biodiversidade, mas enfrentam invasão de terras, apagamento cultural e marginalização jurídica.',
    repertoireSuggestions: [
      'Darcy Ribeiro (O Povo Brasileiro)',
      'Ailton Krenak (Ideias para Adiar o Fim do Mundo)',
      'Constituição Federal de 1988 (Artigos 215, 216 e 231)',
      'Convenção 169 da OIT (Organização Internacional do Trabalho)'
    ],
    sampleModel1000: `No texto constitucional de 1988, o Estado brasileiro reconhece e protege a diversidade étnica e cultural das populações originárias e tradicionais, assegurando-lhes a posse permanente de suas terras ancestrais. Contudo, na contemporaneidade, a ineficácia fiscalizatória e o preconceito arraigado impõem severos entraves à valorização de indígenas, quilombolas e ribeirinhos. Dessa forma, urge analisar tanto o avanço predatório do extrativismo ilegal quanto a invisibilidade epistemológica desses saberes.

Em primeira análise, o etnocentrismo e a ganância econômica fragilizam a integridade física e territorial desses grupos. Conforme adverte o líder indígena Ailton Krenak em sua obra "Ideias para Adiar o Fim do Mundo", a humanidade moderna dissociou-se da natureza em nome de um progresso destrutivo. Nesse contexto, a invasão de terras demarcadas por madeireiros e grileiros não apenas destrói ecossistemas fundamentais para o equilíbrio climático, mas também comete um verdadeiro epistemicídio ao silenciar cosmologias vitais para a sobrevivência planetária.

Outrossim, a morosidade burocrática nos processos de demarcação e titulação territorial agrava a vulnerabilidade social dessas comunidades. O sociólogo Zygmunt Bauman pontua que a negligência das instituições democráticas gera "vidas desperdiçadas", desprovidas de amparo seguro. Desse modo, a falta de segurança jurídica obstaculiza o acesso a serviços básicos de saúde diferenciada e saneamento, perpetuando ciclos de vulnerabilidade histórica.

Infere-se, portanto, a urgência de uma resposta articulada dos poderes públicos. O Ministério dos Povos Indígenas, em consonância com o Ministério da Justiça e a Polícia Federal, deve intensificar as operações de desintrusão permanente e fiscalização via satélite em terras tradicionais, por meio da alocação de drones e postos avançados de patrulha armada. Essa iniciativa deve ser minuciosamente detalhada com a participação direta de lideranças locais em conselhos deliberativos, a fim de salvaguardar as vidas ancestrais e garantir a plena soberania cultural brasileira.`
  },
  {
    id: 'enem-2020',
    year: 'ENEM 2020',
    title: 'O estigma associado às doenças mentais na sociedade brasileira',
    area: 'Saúde Pública & Psicologia Social',
    motivationalSummary: 'O preconceito, a falta de informação e os estereótipos históricos dificultam a busca por tratamento psiquiátrico e psicológico, isolando indivíduos em sofrimento psíquico.',
    repertoireSuggestions: [
      'Michel Foucault (História da Loucura)',
      'Machado de Assis (O Alienista)',
      'Reforma Psiquiátrica Brasileira (Lei nº 10.216/2001)',
      'Nise da Silveira (Pioneira da Terapia Ocupacional Humanizada)'
    ],
    sampleModel1000: `Na célebre novela "O Alienista", de Machado de Assis, o médico Simão Bacamarte interna arbitrariamente boa parte da população de Itaguaí na Casa Verde, revelando como os rótulos acerca da sanidade mental podem servir à opressão social. Fora da ficção, a persistência do estigma associado aos transtornos psíquicos no Brasil hodierno comprova a atualidade da crítica machadiana. Esse cenário alarmante é impulsionado tanto pela falta de literacia em saúde emocional quanto pelo tabu que permeia o sofrimento psicológico.

De início, convém ressaltar que a ausência de debates científicos nas escolas fomenta preconceitos desumanizadores. Sob a ótica do sociólogo Émile Durkheim, o indivíduo é fruto da socialização; logo, quando os círculos familiares e acadêmicos tratam a depressão e a ansiedade como fraqueza moral ou mero descontentamento passageiro, constrói-se um estigma que silencia os afetados. Consequentemente, milhares de jovens hesitam em procurar auxílio médico especializado por temerem a marginalização e o julgamento alheio.

Ademais, a insuficiência de cobertura dos Centros de Atenção Psicossocial (CAPS) agrava a exclusão dos indivíduos em sofrimento psíquico. Conforme preceitua a filósofa Hannah Arendt, a desumanização inicia-se quando o indivíduo perde o seu "direito a ter direitos". Assim, a precariedade orçamentária do Sistema Único de Saúde no atendimento comunitário impede que a Reforma Psiquiátrica de Nise da Silveira se concretize de forma ampla em periferias e cidades do interior.

Portanto, faz-se imperioso desmantelar os estigmas vigentes. Compete ao Ministério da Saúde, em coparceria com o Ministério da Educação, promover o Programa Nacional de Saúde Mental nas Escolas, mediante oficinas psicopedagógicas periódicas e triagens gratuitas conduzidas por psicólogos clínicos. Tal intervenção deve ser detalhada através de cartilhas didáticas e rodas de conversa comunitárias para desmistificar o uso de terapias e fármacos, com o intuito de restituir a dignidade subjetiva e assegurar a acolhida humanitária de todos os cidadãos.`
  },
  {
    id: 'enem-inedito-2026',
    year: 'TEMA INÉDITO 2026',
    title: 'A inteligência artificial autônoma e a soberania educacional e produtiva no Brasil',
    area: 'Tecnologia, Ética & Soberania Nacional',
    motivationalSummary: 'O avanço exponencial de modelos fundacionais de inteligência artificial suscita debates urgentes sobre a soberania de dados nacionais, a dependência tecnológica externa e a equidade no letramento digital nas escolas públicas.',
    repertoireSuggestions: [
      'Milton Santos (Por uma Outra Globalização)',
      'Manuel Castells (A Sociedade em Rede)',
      'LGPD - Lei Geral de Proteção de Dados (Lei nº 13.709/2018)',
      'Marco Legal da Inteligência Artificial no Brasil'
    ],
    sampleModel1000: `No alvorecer da quarta revolução industrial, a soberania tecnológica emerge como condição indispensável para a emancipação política e econômica dos povos. No Brasil, contudo, a dependência extrema de infraestruturas computacionais estrangeiras e o abismo no letramento algorítmico ameaçam a soberania educacional e o futuro do trabalho nacional. Torna-se imperativo, portanto, analisar as causas dessa vulnerabilidade geopolítica e as assimetrias formativas geradas pelo avanço da inteligência artificial.

Em primeiro plano, a exportação de dados brutos e a importação acrítica de modelos neurais proprietários configuram uma nova forma de colonialismo digital. De acordo com o geógrafo Milton Santos em "Por uma Outra Globalização", a tirania da informação e do dinheiro impõe uma ordem global que subordina os países periféricos a meros consumidores de tecnologia estrangeira. Sem centros de dados locais e algoritmos soberanos calibrados à nossa matriz curricular, a educação brasileira torna-se refém de interesses corporativos transnacionais.

Outrossim, a desigualdade de acesso a recursos de hardware e computação em nuvem nas escolas públicas aprofunda a disparidade social. Conforme pontua o sociólogo Manuel Castells, na "Sociedade em Rede", a exclusão tecnológica gera marginalidade estrutural. Dessa forma, estudantes que não dominam o pensamento computacional e o uso ético da inteligência artificial encontram-se desprovidos de ferramentas para competir no mercado global de trabalho, perpetuando o ciclo de dependência externa.

Em suma, medidas estratégicas são inadiáveis para assegurar a autonomia nacional. Cabe ao Ministério da Ciência, Tecnologia e Inovação, em articulação com o Ministério da Educação, implementar a Rede Nacional de Inteligência Artificial Soberana nas Escolas Públicas, mediante a instalação de laboratórios de computação de borda e formação continuada de docentes em IA ética e LGPD. Essa política deve ser pormenorizada com a criação de repositórios abertos de dados científicos nacionais, a fim de garantir a autodeterminação pedagógica e preparar a juventude brasileira para a soberania do século XXI.`
  }
];

interface EssayLab1000Props {
  studentId?: string;
  studentName?: string;
  onBack?: () => void;
  onRewardXp?: (amount: number, reason: string) => void;
}

export const EssayLab1000: React.FC<EssayLab1000Props> = ({
  studentId = 'demo_student_001',
  studentName = 'Gabriel Rocha',
  onBack,
  onRewardXp
}) => {
  const [selectedTheme, setSelectedTheme] = useState<EssayTheme>(OFFICIAL_ENEM_THEMES[0]);
  const [customThemeTitle, setCustomThemeTitle] = useState('');
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [essayText, setEssayText] = useState<string>('');
  const [isMachadoSpeaking, setIsMachadoSpeaking] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [hasAudited, setHasAudited] = useState(false);
  const [xpToast, setXpToast] = useState<{ amount: number; message: string } | null>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  // Carrega rascunho anterior salvo localmente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`aquila_essay_draft_${selectedTheme.id}`);
      if (saved) {
        setEssayText(saved);
      }
    } catch {}
  }, [selectedTheme]);

  // Salva rascunho automaticamente
  const handleTextChange = (text: string) => {
    setEssayText(text);
    try {
      localStorage.setItem(`aquila_essay_draft_${selectedTheme.id}`, text);
    } catch {}
  };

  // Carregar redação nota 1000 exemplo para estudo
  const handleLoadSample = () => {
    if (selectedTheme.sampleModel1000) {
      setEssayText(selectedTheme.sampleModel1000);
      setHasAudited(true);
    }
  };

  // Limpar texto
  const handleClear = () => {
    if (window.confirm('Deseja limpar todo o texto da redação?')) {
      setEssayText('');
      setHasAudited(false);
    }
  };

  // Análise em tempo real do texto
  const analysis = useMemo(() => {
    const raw = essayText.trim();
    if (!raw) {
      return {
        wordCount: 0,
        charCount: 0,
        estimatedLines: 0,
        paragraphs: [],
        c5Elements: { agente: false, acao: false, meio: false, efeito: false, detalhamento: false },
        connectorsInterCount: 0,
        connectorsIntraCount: 0,
        repertoireHits: [],
        c1Score: 0,
        c2Score: 0,
        c3Score: 0,
        c4Score: 0,
        c5Score: 0,
        totalScore: 0,
        machadoCommentary: 'Meu caro discípulo das letras, sua folha ainda se encontra em branco. Deposite aqui as primeiras sementes de seu pensamento crítico.'
      };
    }

    const words = raw.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = raw.length;
    const estimatedLines = Math.min(30, Math.ceil(wordCount / 10.5));

    // Quebra por parágrafos
    const paragraphs = raw.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Conectivos Interparágrafo reconhecidos pelo ENEM
    const interPatterns = [
      /\b(em primeiro plano|em primeira análise|de início|a princípio|a priori)\b/i,
      /\b(ademais|outrossim|além disso|em segundo plano|outro fator|paralelamente)\b/i,
      /\b(portanto|infere-se|em suma|dessa forma|desse modo|assim sendo|logo|por conseguinte)\b/i
    ];
    let connectorsInterCount = 0;
    paragraphs.forEach((p, idx) => {
      if (idx > 0) {
        interPatterns.forEach(regex => {
          if (regex.test(p.substring(0, 80))) {
            connectorsInterCount++;
          }
        });
      }
    });

    // Conectivos intraparágrafo
    const intraMatches = raw.match(/\b(pois|visto que|uma vez que|conquanto|contudo|entretanto|porém|todavia|consequentemente|nesse sentido|sob essa ótica|segundo|conforme)\b/gi);
    const connectorsIntraCount = intraMatches ? intraMatches.length : 0;

    // Repertório sociocultural reconhecido
    const repertoireMatches: string[] = [];
    const repPatterns = [
      { name: 'Constituição Federal / Carta Magna', regex: /\b(constituiç[aã]o|carta magna|artigo\s+\d+)\b/i },
      { name: 'Filósofo Thomas Hobbes', regex: /\b(hobbes)\b/i },
      { name: 'Filósofo John Locke', regex: /\b(locke)\b/i },
      { name: 'Sociólogo Zygmunt Bauman', regex: /\b(bauman)\b/i },
      { name: 'Sociólogo Émile Durkheim', regex: /\b(durkheim)\b/i },
      { name: 'Filósofa Hannah Arendt', regex: /\b(arendt)\b/i },
      { name: 'Gilberto Dimenstein (Cidadão de Papel)', regex: /\b(dimenstein|cidad[aã]o de papel)\b/i },
      { name: 'Silvia Federici', regex: /\b(federici)\b/i },
      { name: 'Geógrafo Milton Santos', regex: /\b(milton santos)\b/i },
      { name: 'Escritor Machado de Assis', regex: /\b(machado de assis|alienista)\b/i },
      { name: 'Paulo Freire', regex: /\b(paulo freire)\b/i },
      { name: 'Ailton Krenak / Darcy Ribeiro', regex: /\b(krenak|darcy ribeiro)\b/i }
    ];
    repPatterns.forEach(item => {
      if (item.regex.test(raw)) {
        repertoireMatches.push(item.name);
      }
    });

    // Análise da Proposta de Intervenção (Competência 5) no último parágrafo
    const conclusionPara = paragraphs.length >= 3 ? paragraphs[paragraphs.length - 1] : raw;
    const c5Elements = {
      agente: /\b(ministério|governo|poder público|escola|sociedade|secretaria|mídia|família|polícia|ongs?|conselho)\b/i.test(conclusionPara),
      acao: /\b(deve|precisa|necessita|promover|implementar|criar|instituir|intensificar|articular|expandir|fiscalizar)\b/i.test(conclusionPara),
      meio: /\b(mediante|por meio de|por intermédio de|através de|com o auxílio de|a partir de)\b/i.test(conclusionPara),
      efeito: /\b(a fim de|com o fito de|com o intuito de|para que|no sentido de|visando|com o objetivo de)\b/i.test(conclusionPara),
      detalhamento: /\b(como|a exemplo de|com foco em|detalhada?|por exemplo|especialmente|minuciosamente|com a participação)\b/i.test(conclusionPara) || /,.*?,/i.test(conclusionPara)
    };

    // Cálculo das notas INEP (0 a 200 cada)
    // C1: Norma Culta e Tamanho do Texto
    let c1Score = 120;
    if (wordCount >= 280) c1Score = 160;
    if (wordCount >= 340 && paragraphs.length >= 4) c1Score = 200;
    if (wordCount < 150) c1Score = 80;

    // C2: Tema e Repertório
    let c2Score = 120;
    if (repertoireMatches.length >= 1) c2Score = 160;
    if (repertoireMatches.length >= 2 && paragraphs.length >= 4) c2Score = 200;

    // C3: Projeto de Texto e Paragrafação
    let c3Score = 120;
    if (paragraphs.length === 4) c3Score = 160;
    if (paragraphs.length === 4 && wordCount >= 320) c3Score = 200;
    if (paragraphs.length < 3) c3Score = 80;

    // C4: Conectivos inter e intra
    let c4Score = 120;
    if (connectorsInterCount >= 2 && connectorsIntraCount >= 4) c4Score = 160;
    if (connectorsInterCount >= 2 && connectorsIntraCount >= 8) c4Score = 200;

    // C5: Proposta de Intervenção (40 pts por elemento)
    let c5Score = 0;
    if (c5Elements.agente) c5Score += 40;
    if (c5Elements.acao) c5Score += 40;
    if (c5Elements.meio) c5Score += 40;
    if (c5Elements.efeito) c5Score += 40;
    if (c5Elements.detalhamento) c5Score += 40;

    const totalScore = c1Score + c2Score + c3Score + c4Score + c5Score;

    // Comentário Socrático de Machado de Assis
    let machadoCommentary = '';
    if (totalScore >= 960) {
      machadoCommentary = 'Sublime, meu caro confrade das letras! Sua pena ornou este argumento com a lucidez dos mestres e a precisão da melhor tradição gramatical. O projeto de texto é inatacável e a intervenção, exemplarmente detalhada.';
    } else if (totalScore >= 840) {
      machadoCommentary = 'Muito louvável! Observo uma arquitetura retórica sólida e um repertório legítimo. Cuide apenas de lapidar a transição dos argumentos e de garantir que o detalhamento de sua proposta de intervenção não deixe margem a dúvidas burocráticas.';
    } else if (totalScore >= 680) {
      machadoCommentary = 'Há vigor nas ideias, decerto, mas convém atentar aos elos da coesão. Uma tese necessita de operadores firmes para não parecer mero acúmulo de impressões. Enriqueça o texto com mais referências humanísticas.';
    } else {
      machadoCommentary = 'Ainda nos falta fôlego dissertativo. É imperioso estruturar quatro parágrafos bem delineados (Introdução, dois Desenvolvimentos e Conclusão com os cinco elementos de ação). Continue a escrever; o estilo forja-se na insistência.';
    }

    return {
      wordCount,
      charCount,
      estimatedLines,
      paragraphs,
      c5Elements,
      connectorsInterCount,
      connectorsIntraCount,
      repertoireHits: repertoireMatches,
      c1Score,
      c2Score,
      c3Score,
      c4Score,
      c5Score,
      totalScore,
      machadoCommentary
    };
  }, [essayText]);

  // Auditoria Socrática oficial (com recompensa de XP)
  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setHasAudited(true);
      if (analysis.totalScore >= 800) {
        const xpEarned = Math.round(analysis.totalScore / 3);
        setXpToast({ amount: xpEarned, message: `Redação Nota ${analysis.totalScore} Auditada!` });
        if (onRewardXp) {
          onRewardXp(xpEarned, `Redação Nota ${analysis.totalScore}`);
        }
        try {
          if ((window as any).aquila?.student?.addXp && studentId) {
            (window as any).aquila.student.addXp(studentId, xpEarned, `Redação Nota ${analysis.totalScore}`);
          }
        } catch {}
        setTimeout(() => setXpToast(null), 4000);
      }
    }, 900);
  };

  // Leitura em voz alta via Web Speech API (Machado de Assis)
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Síntese de voz não suportada pelo navegador.');
      return;
    }

    if (isMachadoSpeaking) {
      window.speechSynthesis.cancel();
      setIsMachadoSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(analysis.machadoCommentary);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 0.92; // Tom mais grave e sóbrio do bruxo do Cosme Velho

    utterance.onend = () => setIsMachadoSpeaking(false);
    utterance.onerror = () => setIsMachadoSpeaking(false);

    setIsMachadoSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copiar texto para a área de transferência
  const handleCopyText = () => {
    navigator.clipboard.writeText(essayText);
    alert('Texto da redação copiado para a área de transferência!');
  };

  // Imprimir folha oficial padrão ENEM
  const handlePrint = () => {
    window.print();
  };

  // Cor do placar final
  const getScoreColor = (score: number) => {
    if (score >= 900) return '#10B981'; // Dourado/Verde Esmeralda
    if (score >= 760) return '#00F0FF'; // Ciano
    if (score >= 600) return '#F59E0B'; // Âmbar
    return '#EF4444'; // Vermelho
  };

  return (
    <div className="essay-lab-container animate-fade-in">
      {/* Header Soberano */}
      <header className="essay-header">
        <div className="header-left">
          {onBack && (
            <button className="btn-back" onClick={onBack} title="Voltar ao Painel">
              ← Voltar
            </button>
          )}
          <div className="header-titles">
            <div className="brand-tag">
              <Sparkles size={12} color="#00F0FF" />
              <span>LABORATÓRIO SOBERANO // MATRIZ OFICIAL INEP</span>
            </div>
            <h1>Laboratório de Redação Nota 1000</h1>
            <p className="subtitle">
              Diagnóstico em tempo real das 5 competências do ENEM, verificação dos 5 elementos da intervenção e mentoria de Machado de Assis.
            </p>
          </div>
        </div>

        <div className="header-right">
          {xpToast && (
            <div className="xp-floating-pill">
              <Zap size={14} color="#F59E0B" />
              <span>+{xpToast.amount} XP • {xpToast.message}</span>
            </div>
          )}
          <div className="score-gauge-pill" style={{ borderColor: getScoreColor(analysis.totalScore) }}>
            <Award size={20} color={getScoreColor(analysis.totalScore)} />
            <div>
              <span className="score-val" style={{ color: getScoreColor(analysis.totalScore) }}>
                {analysis.totalScore} / 1000
              </span>
              <span className="score-sub">PROJEÇÃO OFICIAL ENEM</span>
            </div>
          </div>
        </div>
      </header>

      {/* Seleção do Tema e Repertório Guiado */}
      <section className="theme-selector-panel">
        <div className="theme-header-row">
          <div className="theme-title-wrap">
            <BookOpen size={16} color="#00F0FF" />
            <span className="theme-year-tag">{selectedTheme.year}</span>
            <h3 className="theme-title">{selectedTheme.title}</h3>
          </div>

          <div className="theme-actions">
            <select
              className="theme-select-dropdown"
              value={selectedTheme.id}
              onChange={e => {
                const found = OFFICIAL_ENEM_THEMES.find(t => t.id === e.target.value);
                if (found) setSelectedTheme(found);
              }}
            >
              {OFFICIAL_ENEM_THEMES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.year}: {t.title.slice(0, 50)}...
                </option>
              ))}
            </select>

            <button
              className="btn-load-sample"
              onClick={handleLoadSample}
              title="Carregar redação nota 1000 de exemplo para estudo"
            >
              <Sparkles size={13} />
              <span>Estudar Exemplo 1000</span>
            </button>
          </div>
        </div>

        {/* Repertoire Tips */}
        <div className="repertoire-strip">
          <span className="rep-label">REPERTÓRIO LEGÍTIMO SUGERIDO:</span>
          <div className="rep-tags">
            {selectedTheme.repertoireSuggestions.map((rep, idx) => (
              <span key={idx} className="rep-tag">
                📜 {rep}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Principal: Editor de Texto + Diagnóstico das 5 Competências */}
      <div className="essay-workspace-grid">
        {/* Painel Esquerdo: Área de Redação */}
        <div className="editor-card">
          <div className="editor-toolbar">
            <div className="editor-metrics">
              <span className="metric-item">
                <strong>{analysis.wordCount}</strong> palavras
              </span>
              <span className="metric-item">
                ~<strong>{analysis.estimatedLines}</strong> / 30 linhas
              </span>
              <span className="metric-item">
                <strong>{analysis.paragraphs.length}</strong> parágrafos
              </span>
            </div>

            <div className="editor-actions">
              <div className="editor-zoom-cluster" title="Zoom da Folha de Redação">
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => setZoomPercent(z => Math.max(70, z - 10))}
                  title="Diminuir Zoom (70% mín)"
                >
                  -
                </button>
                <span
                  className="zoom-label"
                  onClick={() => setZoomPercent(100)}
                  title="Clique para redefinir para 100%"
                >
                  {zoomPercent}%
                </span>
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => setZoomPercent(z => Math.min(140, z + 10))}
                  title="Aumentar Zoom (140% máx)"
                >
                  +
                </button>
              </div>

              <button className="editor-action-btn" onClick={handleClear} title="Limpar folha">
                <RotateCcw size={13} />
                <span>Limpar</span>
              </button>
              <button className="editor-action-btn" onClick={handleCopyText} title="Copiar texto">
                <Copy size={13} />
                <span>Copiar</span>
              </button>
              <button className="editor-action-btn" onClick={handlePrint} title="Imprimir folha ENEM">
                <Printer size={13} />
                <span>Imprimir Folha</span>
              </button>
            </div>
          </div>

          <div className="textarea-wrapper" style={{ zoom: `${zoomPercent}%` }}>
            <div className="line-numbers-col">
              {Array.from({ length: 30 }, (_, i) => (
                <span key={i} className={`line-num ${i + 1 <= analysis.estimatedLines ? 'active' : ''}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              ))}
            </div>
            <textarea
              className="essay-textarea"
              placeholder={`Escreva ou cole sua dissertação-argumentativa aqui...\n\nRecomendação estrutural:\n• Parágrafo 1: Introdução com repertório e tese clara;\n• Parágrafo 2: Desenvolvimento 1 (Causa / Contexto histórico);\n• Parágrafo 3: Desenvolvimento 2 (Consequência social / Omissão);\n• Parágrafo 4: Proposta de Intervenção com os 5 elementos (Agente, Ação, Meio/Modo, Efeito e Detalhamento).`}
              value={essayText}
              onChange={e => handleTextChange(e.target.value)}
              rows={24}
              spellCheck
            />
          </div>

          <div className="editor-footer">
            <button
              className="btn-submit-audit"
              onClick={handleRunAudit}
              disabled={isAuditing || analysis.wordCount < 30}
            >
              {isAuditing ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  <span>Auditando via Córtex Neural...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submeter para Auditoria Socrática (+XP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Painel Direito: Diagnóstico das 5 Competências & Machado de Assis */}
        <div className="diagnostics-panel">
          {/* Card de Machado de Assis */}
          <div className="machado-mentor-card">
            <div className="machado-top">
              <div className="machado-avatar">🪶</div>
              <div className="machado-info">
                <h4>Machado de Assis</h4>
                <span>Patrono das Letras & Crítico Socrático</span>
              </div>
              <button
                className={`btn-tts ${isMachadoSpeaking ? 'speaking' : ''}`}
                onClick={handleToggleSpeech}
                title="Ouvir comentário de Machado de Assis"
              >
                {isMachadoSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isMachadoSpeaking ? 'Pausar' : 'Ouvir'}</span>
              </button>
            </div>
            <p className="machado-speech">"{analysis.machadoCommentary}"</p>
          </div>

          {/* Checklist dos 5 Elementos da Proposta de Intervenção (C5) */}
          <div className="c5-inspector-card">
            <div className="c5-header">
              <Target size={14} color="#00F0FF" />
              <h4>Proposta de Intervenção (Competência 5)</h4>
              <span className="c5-score-badge">{analysis.c5Score} / 200 pts</span>
            </div>
            <p className="c5-subtitle">O INEP exige impreterivelmente 5 elementos para nota máxima:</p>

            <div className="c5-elements-list">
              <div className={`c5-element-row ${analysis.c5Elements.agente ? 'valid' : 'invalid'}`}>
                <div className="elem-icon">{analysis.c5Elements.agente ? <Check size={12} /> : '×'}</div>
                <div className="elem-meta">
                  <strong>1. Agente</strong>
                  <span>Quem executa? (Governo, Ministérios, Escolas, Mídia)</span>
                </div>
              </div>

              <div className={`c5-element-row ${analysis.c5Elements.acao ? 'valid' : 'invalid'}`}>
                <div className="elem-icon">{analysis.c5Elements.acao ? <Check size={12} /> : '×'}</div>
                <div className="elem-meta">
                  <strong>2. Ação</strong>
                  <span>O que deve ser feito? (Verbo de ação propositiva)</span>
                </div>
              </div>

              <div className={`c5-element-row ${analysis.c5Elements.meio ? 'valid' : 'invalid'}`}>
                <div className="elem-icon">{analysis.c5Elements.meio ? <Check size={12} /> : '×'}</div>
                <div className="elem-meta">
                  <strong>3. Meio / Modo</strong>
                  <span>Como será feito? ("por meio de", "mediante")</span>
                </div>
              </div>

              <div className={`c5-element-row ${analysis.c5Elements.efeito ? 'valid' : 'invalid'}`}>
                <div className="elem-icon">{analysis.c5Elements.efeito ? <Check size={12} /> : '×'}</div>
                <div className="elem-meta">
                  <strong>4. Efeito / Finalidade</strong>
                  <span>Para que será feito? ("a fim de", "com o intuito de")</span>
                </div>
              </div>

              <div className={`c5-element-row ${analysis.c5Elements.detalhamento ? 'valid' : 'invalid'}`}>
                <div className="elem-icon">{analysis.c5Elements.detalhamento ? <Check size={12} /> : '×'}</div>
                <div className="elem-meta">
                  <strong>5. Detalhamento</strong>
                  <span>Exemplificação ou especificação pormenorizada</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown das 5 Competências INEP */}
          <div className="competencies-card">
            <h4>Detalhamento das 5 Competências</h4>

            <div className="comp-item">
              <div className="comp-top">
                <span className="comp-name">C1: Norma Culta Formal</span>
                <span className="comp-val">{analysis.c1Score} / 200</span>
              </div>
              <div className="comp-bar-bg">
                <div className="comp-bar-fill" style={{ width: `${(analysis.c1Score / 200) * 100}%` }} />
              </div>
            </div>

            <div className="comp-item">
              <div className="comp-top">
                <span className="comp-name">C2: Compreensão do Tema & Repertório</span>
                <span className="comp-val">{analysis.c2Score} / 200</span>
              </div>
              <div className="comp-bar-bg">
                <div className="comp-bar-fill" style={{ width: `${(analysis.c2Score / 200) * 100}%` }} />
              </div>
            </div>

            <div className="comp-item">
              <div className="comp-top">
                <span className="comp-name">C3: Projeto de Texto & Argumentação</span>
                <span className="comp-val">{analysis.c3Score} / 200</span>
              </div>
              <div className="comp-bar-bg">
                <div className="comp-bar-fill" style={{ width: `${(analysis.c3Score / 200) * 100}%` }} />
              </div>
            </div>

            <div className="comp-item">
              <div className="comp-top">
                <span className="comp-name">C4: Coesão Inter e Intraparágrafo</span>
                <span className="comp-val">{analysis.c4Score} / 200</span>
              </div>
              <div className="comp-bar-bg">
                <div className="comp-bar-fill" style={{ width: `${(analysis.c4Score / 200) * 100}%` }} />
              </div>
            </div>

            <div className="comp-item">
              <div className="comp-top">
                <span className="comp-name">C5: Proposta de Intervenção Social</span>
                <span className="comp-val">{analysis.c5Score} / 200</span>
              </div>
              <div className="comp-bar-bg">
                <div className="comp-bar-fill" style={{ width: `${(analysis.c5Score / 200) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
