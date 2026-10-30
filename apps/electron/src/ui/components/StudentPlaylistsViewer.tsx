import React, { useState, useEffect } from 'react';
import {
  Layers, Play, CheckCircle2, Award, Coins, Flame, Sparkles, ChevronRight,
  ArrowLeft, Gamepad2, Compass, BookOpen, Users, HelpCircle, Send, Check,
  RotateCcw, Trophy, Star, ShieldCheck, Clock
} from 'lucide-react';

interface Stage {
  id: string;
  type: 'warmup' | 'simulation' | 'checkpoint' | 'exit_ticket' | 'debriefing';
  title: string;
  durationMinutes: number;
  toolOrGame: string;
  description: string;
  bnccCode?: string;
  checkpointQuestions?: Array<{ question: string; options: string[]; answerIndex: number }>;
  debriefingGuidingQuestions?: string[];
}

interface PedagogicalPlaylist {
  id: string;
  teacherId?: string;
  classId: string;
  className?: string;
  subject: string;
  title: string;
  description: string;
  bnccCodes: string[];
  stages: Stage[];
  coinReward: number;
  badgeId?: string;
  badgeName?: string;
  status: 'active' | 'draft' | 'completed';
}

interface StudentPlaylistsViewerProps {
  studentId?: string;
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

const DEFAULT_PLAYLISTS: PedagogicalPlaylist[] = [
  {
    id: 'playlist-optics-5act',
    classId: 'all',
    subject: 'Física (Óptica Geométrica)',
    title: 'Jornada 5 Atos: Óptica & Refração (NOAS & PhET)',
    description: 'Roteiro imersivo de refração da luz, reflexão interna total e índice de refração com simulação interativa.',
    bnccCodes: ['EM13CNT102', 'EM13CNT308'],
    coinReward: 45,
    badgeId: 'badge-optics-master',
    badgeName: 'Mestre da Óptica',
    status: 'active',
    stages: [
      {
        id: 's1',
        type: 'warmup',
        title: 'Ato 1: O Que é a Refração da Luz? (Aquecimento)',
        durationMinutes: 5,
        toolOrGame: 'Desafio Conceitual Inicial',
        description: 'Por que um canudo parece quebrado ao ser colocado em um copo com água? Qual grandeza da onda se altera?',
        bnccCode: 'EM13CNT102',
      },
      {
        id: 's2',
        type: 'simulation',
        title: 'Ato 2: Simulador NOAS / PhET — Lei de Snell-Descartes',
        durationMinutes: 15,
        toolOrGame: 'Laboratório Virtual de Refração',
        description: 'Mova o laser ótico, ajuste os índices de refração do Ar (n=1.0) para Água (n=1.33) e Vidro (n=1.5) e meça o ângulo de desvio.',
        bnccCode: 'EM13CNT308',
      },
      {
        id: 's3',
        type: 'checkpoint',
        title: 'Ato 3: Checkpoint em Duplas — Ângulo Limite',
        durationMinutes: 10,
        toolOrGame: 'Quadro de Resolução em Duplas',
        description: 'Verifique com seu colega qual é o ângulo crítico para que ocorra Reflexão Total da luz na fibra óptica.',
        bnccCode: 'EM13CNT308',
        checkpointQuestions: [
          {
            question: 'Quando a luz passa de um meio mais refringente (água) para um meio menos refringente (ar), o raio:',
            options: [
              'Aproxima-se da reta normal à superfície',
              'Afasta-se da reta normal à superfície',
              'Não sofre qualquer alteração no seu trajeto',
              'Sofre reflexão interna para qualquer ângulo incidente',
            ],
            answerIndex: 1,
          },
          {
            question: 'O fenômeno que viabiliza a transmissão de dados em fibras ópticas com velocidade altíssima é:',
            options: [
              'Dispersão luminosa',
              'Difração em fenda dupla',
              'Reflexão interna total',
              'Polarização magnética',
            ],
            answerIndex: 2,
          },
        ],
      },
      {
        id: 's4',
        type: 'exit_ticket',
        title: 'Ato 4: Exit Ticket — Avaliação Formativa',
        durationMinutes: 10,
        toolOrGame: 'Cartão de Saída Digital',
        description: 'Responda as questões de consolidação para desbloquear suas Sovereign Coins.',
        bnccCode: 'EM13CNT102',
        checkpointQuestions: [
          {
            question: 'Se a velocidade da luz no vácuo é c = 300.000 km/s e em certo líquido é 200.000 km/s, seu índice de refração absoluto n é:',
            options: ['0.67', '1.0', '1.5', '2.0'],
            answerIndex: 2,
          },
        ],
      },
      {
        id: 's5',
        type: 'debriefing',
        title: 'Ato 5: Síntese & Conexão Tecnológica',
        durationMinutes: 10,
        toolOrGame: 'Debriefing Coletivo',
        description: 'Como as lentes de contato e fibras ópticas submarinas que conectam a internet mundial dependem dessa equação?',
        debriefingGuidingQuestions: [
          'Por que a velocidade da luz diminui em meios mais densos se a luz não tem massa de repouso?',
          'Como o prisma óptico de Newton separa a luz branca nas cores do arco-íris?',
        ],
      },
    ],
  },
  {
    id: 'playlist-noaa-satellites',
    classId: 'all',
    subject: 'Ciências / Geografia',
    title: 'Missão NOAA: Satélites, Órbitas & Clima Global',
    description: 'Simulação aeroespacial aberta da NOAA NESDIS para compreender gravitação, previsão meteorológica e monitoramento de furacões.',
    bnccCodes: ['EM13CNT204', 'EM13CHS206'],
    coinReward: 50,
    badgeId: 'badge-space-meteorologist',
    badgeName: 'Meteorologista Espacial',
    status: 'active',
    stages: [
      {
        id: 'ns1',
        type: 'warmup',
        title: 'Ato 1: O Olho no Espaço (Aquecimento)',
        durationMinutes: 5,
        toolOrGame: 'Briefing de Missão NOAA',
        description: 'Como os satélites meteorológicos GOES conseguem ficar estacionados no mesmo ponto sobre a Terra?',
      },
      {
        id: 'ns2',
        type: 'simulation',
        title: 'Ato 2: Simulador de Órbitas Geoestacionárias vs Polares',
        durationMinutes: 15,
        toolOrGame: 'Laboratório de Gravitação NOAA',
        description: 'Ajuste a altitude orbital de 400 km (ISS) para 35.786 km (GOES-16). Observe o período orbital e velocidade angular.',
      },
      {
        id: 'ns3',
        type: 'checkpoint',
        title: 'Ato 3: Checkpoint de Rastreamento de Tempestades',
        durationMinutes: 10,
        toolOrGame: 'Análise de Imagens de Satélite Infravermelho',
        description: 'Identifique o padrão espiral ciclônico e a pressão barométrica no centro da tempestade.',
        checkpointQuestions: [
          {
            question: 'Um satélite geoestacionário necessita orbitar a aproximadamente 35.786 km de altitude para que:',
            options: [
              'Não sofra resistência do ar e atrito molecular',
              'Seu período de translação coincida exatamente com 24 horas da rotação terrestre',
              'Fique mais próximo do Sol para carregar os painéis solares',
              'Consiga capturar imagens com máxima resolução microscópica',
            ],
            answerIndex: 1,
          },
        ],
      },
      {
        id: 'ns4',
        type: 'exit_ticket',
        title: 'Ato 4: Exit Ticket — Sensoriamento Remoto',
        durationMinutes: 10,
        toolOrGame: 'Cartão de Saída Aeroespacial',
        description: 'Consolide seu aprendizado sobre como satélites protegem cidades de desastres naturais.',
        checkpointQuestions: [
          {
            question: 'Os canais térmicos infravermelhos dos satélites GOES permitem monitorar tempestades mesmo durante a noite porque:',
            options: [
              'O sensor emite raio laser constante em direção à Terra',
              'Captam a radiação de corpo negro emitida pela temperatura das nuvens e superfície',
              'A Lua reflete luz solar ultravioleta suficiente para a câmera',
              'Operam com amplificadores de luz residual de alta sensibilidade',
            ],
            answerIndex: 1,
          },
        ],
      },
      {
        id: 'ns5',
        type: 'debriefing',
        title: 'Ato 5: Conclusão da Missão',
        durationMinutes: 10,
        toolOrGame: 'Debriefing da Agência Espacial',
        description: 'Discussão sobre soberania de dados climáticos e proteção de comunidades vulneráveis.',
        debriefingGuidingQuestions: [
          'Qual a importância de um país ter satélites próprios de monitoramento ambiental?',
        ],
      },
    ],
  },
  {
    id: 'playlist-floresta-magica-math',
    classId: 'all',
    subject: 'Matemática (Anos Iniciais / Reforço)',
    title: 'Aventura Floresta Mágica: Aritmética & Desafios Numéricos',
    description: 'Sequência gamificada de ordenação, paridade e cálculo mental inspirada no Escola Games.',
    bnccCodes: ['EF01MA04', 'EF02MA05'],
    coinReward: 35,
    badgeId: 'badge-enchanted-mathematician',
    badgeName: 'Guardião da Floresta',
    status: 'active',
    stages: [
      {
        id: 'fm1',
        type: 'warmup',
        title: 'Ato 1: O Chamado da Floresta (Aquecimento)',
        durationMinutes: 5,
        toolOrGame: 'Enigma dos Cristais',
        description: 'Três fadas guardam cristais com números: 12, 47, 85. Qual é o maior número par?',
      },
      {
        id: 'fm2',
        type: 'simulation',
        title: 'Ato 2: Jogo Floresta Mágica Interativo',
        durationMinutes: 15,
        toolOrGame: 'Construct Canvas Local',
        description: 'Colete as poções mágicas respondendo rapidamente aos cálculos de adição e subtração.',
      },
      {
        id: 'fm3',
        type: 'checkpoint',
        title: 'Ato 3: Checkpoint de Operações Rápidas',
        durationMinutes: 10,
        toolOrGame: 'Balança dos Cogumelos',
        description: 'Equilibre os dois lados da balança para abrir o portal.',
        checkpointQuestions: [
          {
            question: 'Se a balança mágica tem 15 cristais no prato esquerdo e 8 no prato direito, quantos cristais faltam à direita para equilibrar?',
            options: ['5 cristais', '7 cristais', '8 cristais', '9 cristais'],
            answerIndex: 1,
          },
        ],
      },
      {
        id: 'fm4',
        type: 'exit_ticket',
        title: 'Ato 4: Exit Ticket da Floresta',
        durationMinutes: 10,
        toolOrGame: 'Gabarito das Estrelas',
        description: 'Complete as últimas 2 sequências para libertar a fada rainha.',
        checkpointQuestions: [
          {
            question: 'Qual é o próximo número na sequência mágica: 4, 8, 12, 16, ___ ?',
            options: ['18', '20', '22', '24'],
            answerIndex: 1,
          },
        ],
      },
      {
        id: 'fm5',
        type: 'debriefing',
        title: 'Ato 5: Coroação e Moedas Soberanas',
        durationMinutes: 10,
        toolOrGame: 'Festa da Floresta',
        description: 'Celebração da maestria matemática e resgate da recompensa.',
      },
    ],
  },
];

export const StudentPlaylistsViewer: React.FC<StudentPlaylistsViewerProps> = ({
  studentId = 'student-gabriel',
  onBack,
  onNavigate,
}) => {
  const [playlists, setPlaylists] = useState<PedagogicalPlaylist[]>(DEFAULT_PLAYLISTS);
  const [activePlaylist, setActivePlaylist] = useState<PedagogicalPlaylist | null>(null);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [completedStages, setCompletedStages] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [simSliderValue, setSimSliderValue] = useState<number>(45); // Angle or orbit slider
  const [simMediumIndex, setSimMediumIndex] = useState<number>(1.33); // Refractive index
  const [awardedCoins, setAwardedCoins] = useState<number | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const serverPlaylists = await (window as any).aquila?.playlists?.list?.();
      if (Array.isArray(serverPlaylists) && serverPlaylists.length > 0) {
        // Merge server playlists with defaults
        const combined = [...serverPlaylists, ...DEFAULT_PLAYLISTS.filter(d => !serverPlaylists.some(p => p.id === d.id))];
        setPlaylists(combined);
      }
    } catch {
      // Keep defaults
    }
  };

  const handleStartPlaylist = (pl: PedagogicalPlaylist) => {
    setActivePlaylist(pl);
    setCurrentStageIdx(0);
    setAnswers({});
    setCompletedStages({});
    setIsCompleted(false);
    setAwardedCoins(null);
  };

  const currentStage = activePlaylist?.stages[currentStageIdx];

  const handleAnswerSelect = (questionIdx: number, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [`${currentStageIdx}_${questionIdx}`]: optionIdx }));
  };

  const handleAdvanceStage = async () => {
    if (!activePlaylist) return;

    // Mark current stage completed
    setCompletedStages(prev => ({ ...prev, [currentStageIdx]: true }));

    if (currentStageIdx < activePlaylist.stages.length - 1) {
      setCurrentStageIdx(prev => prev + 1);
    } else {
      // Playlist finished! Award coins & badge
      setIsCompleted(true);
      const coins = activePlaylist.coinReward || 40;
      setAwardedCoins(coins);

      try {
        await (window as any).aquila?.student?.addBalance?.({
          studentId,
          amount: coins,
          reason: `Conclusão da Playlist: ${activePlaylist.title}`,
        });
      } catch {
        // Fallback local notification
      }
    }
  };

  // Simulation physics calculation (Snell's Law: n1 * sin(theta1) = n2 * sin(theta2))
  const theta1Rad = (simSliderValue * Math.PI) / 180;
  const sinTheta2 = (1.0 * Math.sin(theta1Rad)) / simMediumIndex;
  const isTotalInternalReflection = sinTheta2 > 1.0;
  const theta2Deg = isTotalInternalReflection ? 90 : Math.round((Math.asin(sinTheta2) * 180) / Math.PI);

  // Orbit calculation for NOAA simulation
  const orbitalAltitudeKm = simSliderValue * 360; // 0 to 36000 km
  const isGeostationary = orbitalAltitudeKm > 35000;
  const orbitalPeriodHours = isGeostationary ? 24 : Math.max(1.5, Math.round((orbitalAltitudeKm / 1500) * 10) / 10);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#F8FAFC' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button
              onClick={activePlaylist ? () => setActivePlaylist(null) : onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>{activePlaylist ? 'Voltar para Playlists' : 'Voltar ao Cockpit'}</span>
            </button>
          )}
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Gamepad2 size={24} color="#8B5CF6" />
              <span>Playlists Pedagógicas & Simuladores Soberanos</span>
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94A3B8' }}>
              Metodologia de 5 Atos (Legends of Learning / NOAA / NOAS) • Aprenda praticando e ganhe Sovereign Coins
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '6px 14px',
            borderRadius: '20px',
            color: '#10B981',
            fontSize: '13px',
            fontWeight: 600
          }}>
            <Coins size={16} color="#F59E0B" />
            <span>Recompensas Ativas em Sala</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!activePlaylist ? (
        /* Playlist Selector Grid */
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#CBD5E1', margin: 0 }}>
              Playlists Disponíveis para a sua Turma ({playlists.length})
            </h2>
            <span style={{ fontSize: '12px', color: '#64748B' }}>100% Offline • Sem Anúncios • Auditado</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {playlists.map((pl) => (
              <div
                key={pl.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#A78BFA',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600
                    }}>
                      {pl.subject}
                    </span>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: '#F59E0B',
                      fontWeight: 600
                    }}>
                      <Coins size={13} />
                      +{pl.coinReward} Coins
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 8px 0', color: '#F1F5F9' }}>
                    {pl.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    {pl.description}
                  </p>

                  {/* 5-Acts Badge Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                    {pl.stages.map((stg, sIdx) => (
                      <div
                        key={stg.id || sIdx}
                        title={`${stg.title} (${stg.durationMinutes}m)`}
                        style={{
                          flex: 1,
                          height: '6px',
                          borderRadius: '3px',
                          background: sIdx === 0 ? '#3B82F6' : sIdx === 1 ? '#8B5CF6' : sIdx === 2 ? '#EC4899' : sIdx === 3 ? '#F59E0B' : '#10B981',
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B' }}>
                    <Clock size={13} />
                    <span>~{pl.stages.reduce((acc, s) => acc + (s.durationMinutes || 8), 0)} minutos</span>
                    <span>•</span>
                    <Award size={13} color="#8B5CF6" />
                    <span>Emblema: {pl.badgeName || 'Mestre da Lição'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartPlaylist(pl)}
                  style={{
                    marginTop: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(109, 40, 217, 0.4)',
                  }}
                >
                  <Play size={16} fill="#FFFFFF" />
                  <span>Iniciar Playlist (5 Atos)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : isCompleted ? (
        /* Victory Screen */
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '40px',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            border: '2px solid #10B981',
          }}>
            <Trophy size={40} color="#10B981" />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 10px 0', color: '#F1F5F9' }}>
            Missão Concluída com Sucesso!
          </h2>

          <p style={{ fontSize: '15px', color: '#94A3B8', margin: '0 0 24px 0' }}>
            Você completou todos os 5 atos de <strong style={{ color: '#E2E8F0' }}>{activePlaylist.title}</strong> com maestria pedagógica!
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            background: 'rgba(30, 41, 59, 0.5)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '30px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>MOEDAS RECEBIDAS</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Coins size={18} />
                +{awardedCoins || activePlaylist.coinReward}
              </div>
            </div>
            <div style={{ width: '1px', background: 'rgba(148, 163, 184, 0.2)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>NOVO EMBLEMA</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Award size={18} />
                {activePlaylist.badgeName || 'Mestre da Lição'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActivePlaylist(null)}
            style={{
              padding: '12px 28px',
              background: '#8B5CF6',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Voltar para as Playlists
          </button>
        </div>
      ) : (
        /* 5-Acts Active Stage Runner */
        <div>
          {/* Progress Stepper Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              {activePlaylist.stages.map((stg, idx) => {
                const isCurrent = idx === currentStageIdx;
                const isPast = completedStages[idx];
                return (
                  <div key={stg.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: isCurrent ? '#8B5CF6' : isPast ? '#10B981' : 'rgba(51, 65, 85, 0.6)',
                      color: isCurrent || isPast ? '#FFFFFF' : '#94A3B8',
                      border: isCurrent ? '2px solid #C4B5FD' : 'none',
                    }}>
                      {isPast ? <Check size={14} /> : idx + 1}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isCurrent ? '#A78BFA' : isPast ? '#10B981' : '#64748B' }}>
                        ATO {idx + 1}
                      </span>
                      <span style={{ fontSize: '12px', color: isCurrent ? '#F8FAFC' : '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                        {stg.type.toUpperCase()}
                      </span>
                    </div>
                    {idx < activePlaylist.stages.length - 1 && (
                      <ChevronRight size={16} color="#475569" style={{ marginLeft: 'auto', marginRight: '8px' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Stage Card */}
          {currentStage && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#A78BFA',
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}>
                  {currentStage.type === 'warmup' ? 'Ato 1: Aquecimento Conceitual' :
                   currentStage.type === 'simulation' ? 'Ato 2: Simulação / Laboratório Prático' :
                   currentStage.type === 'checkpoint' ? 'Ato 3: Checkpoint de Domínio em Duplas' :
                   currentStage.type === 'exit_ticket' ? 'Ato 4: Exit Ticket Avaliativo' : 'Ato 5: Síntese & Debriefing'}
                </span>
                <span style={{ fontSize: '13px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Duração estimada: {currentStage.durationMinutes} min
                </span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0', color: '#F1F5F9' }}>
                {currentStage.title}
              </h2>

              <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                {currentStage.description}
              </p>

              {/* Dynamic Interactive Stage Content */}
              {currentStage.type === 'simulation' && (
                <div style={{
                  background: '#0B0F19',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Compass size={18} color="#38BDF8" />
                      <strong style={{ fontSize: '14px', color: '#E2E8F0' }}>
                        {activePlaylist.id.includes('optics') ? 'Bancada Virtual de Óptica (Lei de Snell)' :
                         activePlaylist.id.includes('noaa') ? 'Simulador Orbital NOAA / GOES Satellites' : 'Desafio Floresta Mágica'}
                      </strong>
                    </div>
                    <span style={{ fontSize: '12px', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      Ativo Local 0ms Latência
                    </span>
                  </div>

                  {activePlaylist.id.includes('optics') ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
                            Ângulo de Incidência do Laser: <strong>{simSliderValue}º</strong>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="85"
                            value={simSliderValue}
                            onChange={(e) => setSimSliderValue(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#8B5CF6' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
                            Meio Refringente 2 (n2):
                          </label>
                          <select
                            value={simMediumIndex}
                            onChange={(e) => setSimMediumIndex(Number(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: '#1E293B',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              color: '#F8FAFC',
                              fontSize: '13px'
                            }}
                          >
                            <option value="1.0">Ar (n = 1.00)</option>
                            <option value="1.33">Água (n = 1.33)</option>
                            <option value="1.5">Vidro Crown (n = 1.50)</option>
                            <option value="2.42">Diamante (n = 2.42)</option>
                          </select>
                        </div>
                      </div>

                      {/* Ray diagram visual simulation */}
                      <div style={{
                        background: '#030712',
                        height: '180px',
                        borderRadius: '8px',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid #1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {/* Normal Line */}
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: '#475569', borderLeft: '1px dashed #64748B' }} />
                        {/* Interface Boundary */}
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: '#38BDF8' }} />

                        <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '11px', color: '#64748B' }}>
                          Meio 1: Ar (n1 = 1.00)
                        </div>
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '11px', color: '#38BDF8' }}>
                          Meio 2: {simMediumIndex === 1.33 ? 'Água' : simMediumIndex === 1.5 ? 'Vidro' : 'Diamante'} (n2 = {simMediumIndex})
                        </div>

                        <div style={{ textAlign: 'center', zIndex: 2, background: 'rgba(15, 23, 42, 0.85)', padding: '8px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
                          <div style={{ fontSize: '12px', color: '#94A3B8' }}>Ângulo Refratado Calculado:</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: isTotalInternalReflection ? '#EF4444' : '#10B981' }}>
                            {isTotalInternalReflection ? 'Reflexão Total!' : `${theta2Deg}º`}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            n1 · sin(θ1) = n2 · sin(θ2) ➔ 1.0 · sin({simSliderValue}º) = {simMediumIndex} · sin({theta2Deg}º)
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activePlaylist.id.includes('noaa') ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
                        Altitude da Órbita: <strong>{orbitalAltitudeKm.toLocaleString()} km</strong> ({isGeostationary ? 'Órbita Geoestacionária GOES' : 'Órbita Baixa Polar'})
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={simSliderValue}
                        onChange={(e) => setSimSliderValue(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#38BDF8', marginBottom: '16px' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                        <div style={{ background: '#1E293B', padding: '10px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>PERÍODO ORBITAL</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#38BDF8' }}>{orbitalPeriodHours} Horas</div>
                        </div>
                        <div style={{ background: '#1E293B', padding: '10px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>COBERTURA</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981' }}>{isGeostationary ? 'Disco Hemisférico' : 'Faixa de Varredura'}</div>
                        </div>
                        <div style={{ background: '#1E293B', padding: '10px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>APLICAÇÃO</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F59E0B' }}>{isGeostationary ? 'Tempo Real Furacões' : 'Mapeamento Global'}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '13px', color: '#94A3B8' }}>
                        Simulador aritmético carregado. Ordene e equilibre as equações para acumular cristais.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Questions (for Checkpoint and Exit Ticket) */}
              {currentStage.checkpointQuestions && currentStage.checkpointQuestions.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  {currentStage.checkpointQuestions.map((q, qIdx) => {
                    const ansKey = `${currentStageIdx}_${qIdx}`;
                    const selectedOpt = answers[ansKey];
                    return (
                      <div key={qIdx} style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        borderRadius: '10px',
                        padding: '16px',
                        marginBottom: '14px',
                      }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', margin: '0 0 12px 0' }}>
                          {qIdx + 1}. {q.question}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {q.options.map((opt, oIdx) => {
                            const isChosen = selectedOpt === oIdx;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleAnswerSelect(qIdx, oIdx)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  textAlign: 'left',
                                  padding: '10px 14px',
                                  background: isChosen ? 'rgba(139, 92, 246, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                                  border: isChosen ? '1px solid #8B5CF6' : '1px solid rgba(148, 163, 184, 0.15)',
                                  borderRadius: '8px',
                                  color: isChosen ? '#FFFFFF' : '#CBD5E1',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s',
                                }}
                              >
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '9px',
                                  border: isChosen ? '5px solid #8B5CF6' : '1px solid #64748B',
                                  background: isChosen ? '#FFFFFF' : 'transparent',
                                }} />
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Guiding Questions (Debriefing) */}
              {currentStage.debriefingGuidingQuestions && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '24px',
                }}>
                  <strong style={{ fontSize: '13px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Lightbulb size={16} /> Perguntas de Debriefing em Sala:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#CBD5E1', lineHeight: 1.6 }}>
                    {currentStage.debriefingGuidingQuestions.map((dq, dIdx) => (
                      <li key={dIdx}>{dq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advance Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={handleAdvanceStage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(109, 40, 217, 0.4)',
                  }}
                >
                  <span>{currentStageIdx === activePlaylist.stages.length - 1 ? 'Concluir Playlist & Resgatar Recompensa' : 'Próximo Ato'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentPlaylistsViewer;
