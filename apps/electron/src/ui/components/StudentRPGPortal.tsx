import React, { useState, useEffect } from 'react';

import './StudentRPGPortal.css';

import SovereignShop from './SovereignShop';

import { Proposal } from '../../services/SovereignCouncilService';

import { Sparkles, Brain, Trophy, Flame, Target, BookOpen, ShoppingBag, Vote, Swords, PenTool, GitFork, Network, Crown, Tv, Gamepad2, Layers } from 'lucide-react';



interface Achievement {

  id: string;

  icon: string;

  title: string;

  description: string;

  progress: number;

}



const ACHIEVEMENTS: Achievement[] = [

  { id: '1', icon: '🔥', title: 'Sequência Imbatível', description: '12 dias estudando sem falhar', progress: 85 },

  { id: '2', icon: '🧠', title: 'Mestre do RAG', description: 'Realizou 50 buscas no Córtex Lab', progress: 65 },

  { id: '3', icon: '⚔️', title: 'Duelista SRS', description: 'Venceu 10 revisões perfeitas', progress: 100 },

  { id: '4', icon: '🏰', title: 'Guardião ENEM', description: '30 questões TRI resolvidas na semana', progress: 75 },

];



const DEFAULT_PODS = [

  { id: 'pod-1', subject: 'Física • Eletrodinâmica & Circuitos TRI', created_at: '2026-10-18T08:30:00Z' },

  { id: 'pod-2', subject: 'Matemática • Geometria Espacial ENEM', created_at: '2026-10-17T10:15:00Z' },

  { id: 'pod-3', subject: 'Redação Nota 1000 • Repertório Constitucional', created_at: '2026-10-16T09:00:00Z' },

  { id: 'pod-4', subject: 'Química • Estequiometria & Rendimento', created_at: '2026-10-15T11:20:00Z' },

];



const DEFAULT_POLLS: Proposal[] = [

  {

    id: 'poll-1',

    title: 'Plantão Extra de Revisão ENEM (Sábado)',

    description: 'Escolha a disciplina prioritária para o Aulão Presencial deste sábado: Física ou Matemática?',

    status: 'ACTIVE' as any,

  } as any,

];



interface StudentRPGPortalProps {

  studentId?: string;

  onNavigate?: (page: string) => void;

}



const StudentRPGPortal: React.FC<StudentRPGPortalProps> = ({ studentId: propStudentId, onNavigate }) => {

  const [economy, setEconomy] = useState<any>({ level: 14, xp: 2680, balance: 1420 });

  const [activePolls, setActivePolls] = useState<Proposal[]>(DEFAULT_POLLS);

  const [learningPods, setLearningPods] = useState<any[]>(DEFAULT_PODS);

  const [behavioral, setBehavioral] = useState<any>({ emotion: 'Focado', engagement: 0.88 });

  const [showShop, setShowShop] = useState(false);

  const [studentId] = useState(propStudentId || 'demo_student_001');



  useEffect(() => {

    loadEconomy();

    loadGovernance();

    loadLearningContent();

    loadBehavioral();



    const behavioralInterval = setInterval(loadBehavioral, 10000);

    return () => clearInterval(behavioralInterval);

  }, []);



  const loadEconomy = async () => {

    try {

      const data = await window.aquila?.student?.getEconomy?.(studentId);

      if (data && (data.level || data.xp)) {

        setEconomy(data);

      }

    } catch {

      // Usa estado inicial rico

    }

  };



  const loadGovernance = async () => {

    try {

      const polls = await window.aquila?.council?.listPolls?.('STUDENT');

      if (Array.isArray(polls) && polls.length > 0) {

        setActivePolls(polls);

      }

    } catch {

      // Usa estado inicial rico

    }

  };



  const loadLearningContent = async () => {

    try {

      const pods = await window.aquila?.pod?.listPods?.(studentId);

      if (Array.isArray(pods) && pods.length > 0) {

        setLearningPods(pods);

      }

    } catch {

      // Usa estado inicial rico

    }

  };



  const loadBehavioral = async () => {

    try {

      const data = await window.aquila?.behavioral?.getLive?.(studentId);

      if (data?.emotions) {

        setBehavioral({

          emotion: data.emotions.stress > 0.6 ? 'Em Atenção' : data.emotions.fatigue > 0.6 ? 'Fadiga' : 'Focado',

          engagement: data.emotions.engagement ?? 0.88,

        });

      }

    } catch {

      // Mantém telemetria padrão

    }

  };



  const handleVote = async (id: string, choice: string) => {

    try {

      await window.aquila?.council?.castVote?.({ pollId: id, studentId, optionId: choice });

      loadGovernance();

    } catch {

      setActivePolls(prev => prev.filter(p => p.id !== id));

    }

  };



  const levelPct = Math.round(((economy?.xp || 2680) % 1000) / 10);



  return (

    <div className="student-portal-main">

      {/* Top Student Cockpit Bar — Rectangular Portrait ("Sem Bolinha") & Uniform 32px Buttons */}

      <header className="rpg-header">

        <div className="rpg-profile">

          <img

            src="./avatars/face-1.jpg"

            alt="Gabriel Rocha"

            className="rpg-student-photo-rect"

          />

          <div className="rpg-name-info">

            <div className="rpg-name-row">

              <h2>Gabriel Rocha • 3º Ano A</h2>

              <span className="rpg-tutor-pill">

                ● TUTOR IA: {behavioral.emotion.toUpperCase()} ({Math.round((behavioral.engagement || 0.88) * 100)}%)

              </span>

            </div>

            <div className="rpg-sub-telemetry">

              NÍVEL {economy?.level || 14} • {economy?.xp || 2680} XP ACUMULADO • RANKING SOBERANO

            </div>

          </div>

        </div>



        <div className="xp-container">

          <div className="xp-label">

            <span>PROGRESSO P/ NÍVEL {(economy?.level || 14) + 1}</span>

            <span>{levelPct}%</span>

          </div>

          <div className="xp-bar-bg">

            <div className="xp-bar-fill" style={{ '--rpg-progress': `${levelPct}%` } as React.CSSProperties} />

          </div>

        </div>



        <div className="rpg-header-actions">

          <button className="rpg-action-btn primary" onClick={() => onNavigate?.('arena')}>

            <Swords size={14} />

            <span>Arena PvP</span>

          </button>

          <button className="rpg-action-btn primary" onClick={() => onNavigate?.('mastery-chamber')}>

            <Sparkles size={14} />

            <span>Câmara ENEM</span>

          </button>

          <button className="rpg-action-btn primary" onClick={() => onNavigate?.('knowledge-canvas')}>

            <Network size={14} />

            <span>Canvas Áquila</span>

          </button>

          <button className="rpg-action-btn primary" onClick={() => onNavigate?.('essay-lab')}>

            <PenTool size={14} />

            <span>Redação 1000</span>

          </button>

          <button className="rpg-action-btn" onClick={() => onNavigate?.('skill-tree')}>

            <GitFork size={14} />

            <span>Árvore BNCC</span>

          </button>

          <button className="rpg-action-btn" onClick={() => onNavigate?.('ai-lab')}>

            <Brain size={14} />

            <span>Lab & Cientistas</span>

          </button>

          <button className="rpg-action-btn primary" onClick={() => onNavigate?.('cosmetics-chamber')} title="Câmara de Cosméticos e Battle Banners Clash Royale">

            <Crown size={14} color="#FBBF24" />

            <span>Cosméticos & Banners</span>

          </button>

          <button className="rpg-action-btn primary" onClick={() => onNavigate?.('youtube-radar')} title="Radar Pedagógico de Videoaulas YouTube">

            <Tv size={14} color="#EF4444" />

            <span>Videoaulas</span>

          </button>

          <button className="rpg-action-btn primary" onClick={() => onNavigate?.('playlists-live')} title="Playlists Pedagógicas em 5 Atos & Games Educativos">

            <Gamepad2 size={14} color="#10B981" />

            <span>Playlists & Games</span>

          </button>

          <button className="rpg-action-btn primary" onClick={() => onNavigate?.('h5p-perseus-lab')} title="Laboratório de Applets H5P & Perseus" data-testid="btn-nav-h5p-perseus">

            <Layers size={14} color="#A78BFA" />

            <span>Applets H5P & Perseus</span>

          </button>

          <button className="rpg-action-btn" onClick={() => setShowShop(v => !v)}>

            <ShoppingBag size={14} />

            <span>Mercado ({economy?.balance || 1420} 💎)</span>

          </button>

        </div>

      </header>



      {showShop && (

        <div className="rpg-panel">

          <div className="rpg-panel-header">

            <h3 className="rpg-title"><ShoppingBag size={14} color="#F59E0B" /> Mercado Soberano de Recompensas</h3>

            <button className="rpg-action-btn" style={{ height: 24, padding: '0 8px' }} onClick={() => setShowShop(false)}>

              Fechar

            </button>

          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>

            <button

              className="rpg-action-btn primary"

              style={{ width: '100%', padding: '10px 16px', justifyContent: 'center', height: 'auto', fontSize: '13px', fontWeight: 600 }}

              onClick={() => { setShowShop(false); onNavigate?.('cosmetics-chamber'); }}

            >

              <Crown size={15} color="#FBBF24" />

              <span>Abrir Câmara de Banners & Cosméticos Clash Royale (Avatares, Molduras, Emblemas)</span>

            </button>

          </div>

          <SovereignShop studentId={studentId} onPurchaseSuccess={loadEconomy} />

        </div>

      )}



      {/* 4-Column Student Telemetry KPI Strip */}

      <section className="rpg-kpi-strip">

        <div className="rpg-kpi-pod">

          <div className="rpg-kpi-meta">

            <span className="rpg-kpi-label">SEQUÊNCIA ATIVA</span>

            <span className="rpg-kpi-val" style={{ color: '#F59E0B' }}>12 DIAS 🔥</span>

            <span className="rpg-kpi-sub">Recorde pessoal: 18 dias</span>

          </div>

          <Flame size={20} color="#F59E0B" />

        </div>



        <div className="rpg-kpi-pod">

          <div className="rpg-kpi-meta">

            <span className="rpg-kpi-label">PRECISÃO TRI / ENEM</span>

            <span className="rpg-kpi-val" style={{ color: '#10B981' }}>84.5%</span>

            <span className="rpg-kpi-sub">+6.2% nesta semana</span>

          </div>

          <Target size={20} color="#10B981" />

        </div>



        <div className="rpg-kpi-pod">

          <div className="rpg-kpi-meta">

            <span className="rpg-kpi-label">CÁPSULAS REVISADAS</span>

            <span className="rpg-kpi-val" style={{ color: '#00F0FF' }}>28 AULAS</span>

            <span className="rpg-kpi-sub">100% da trilha semanal</span>

          </div>

          <BookOpen size={20} color="#00F0FF" />

        </div>



        <div className="rpg-kpi-pod">

          <div className="rpg-kpi-meta">

            <span className="rpg-kpi-label">POSICIONAMENTO</span>

            <span className="rpg-kpi-val" style={{ color: '#A78BFA' }}>TOP 5%</span>

            <span className="rpg-kpi-sub">Liga Diamante • 3º Ano</span>

          </div>

          <Trophy size={20} color="#A78BFA" />

        </div>

      </section>



      {/* Main 3-Column Bento Grid — Zero Wasted Space */}

      <div className="rpg-bento-grid">

        {/* Column 1: Câmara de Maestria + Cápsulas de Aula */}

        <section className="rpg-panel">

          <div className="rpg-panel-header">

            <h3 className="rpg-title">

              <Brain size={14} color="#00F0FF" />

              <span>Câmara ENEM & Cápsulas de Aula</span>

            </h3>

            <span className="rpg-panel-tag">GROUNDING IA</span>

          </div>



          <div className="rpg-mastery-card">

            <div className="rpg-mastery-top">

              <span className="rpg-mastery-badge">MOTOR NVIDIA 90B VISION</span>

              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#34D399', fontWeight: 700 }}>

                +250 XP / QUESTÃO

              </span>

            </div>

            <h4 className="rpg-mastery-title">🦅 Câmara de Maestria (ENEM & Vestibulares)</h4>

            <p className="rpg-mastery-desc">

              Desconstrua questões complexas em micro-passos interativos com diagnóstico de lacunas em tempo real.

            </p>

            <button

              className="rpg-action-btn primary"

              style={{ width: '100%', marginTop: 4 }}

              onClick={() => onNavigate?.('mastery-chamber')}

            >

              <Sparkles size={13} />

              <span>Entrar na Câmara de Maestria</span>

            </button>

          </div>



          <div className="pods-grid">

            {learningPods.map(pod => (

              <div key={pod.id} className="pod-hex-cell" onClick={() => onNavigate?.('ai-lab')}>

                <div className="pod-info">

                  <strong>{pod.subject}</strong>

                  <span>RESUMO IA • {new Date(pod.created_at).toLocaleDateString()}</span>

                </div>

                <span className="rpg-panel-tag" style={{ color: '#00F0FF' }}>ESTUDAR →</span>

              </div>

            ))}

          </div>

        </section>



        {/* Column 2: Arcade de Quests & Desafios Adaptativos */}

        <section className="rpg-panel">

          <div className="rpg-panel-header">

            <h3 className="rpg-title">

              <Target size={14} color="#F59E0B" />

              <span>Arcade de Quests (XP Multiplier)</span>

            </h3>

            <span className="rpg-panel-tag">MISSÕES HOJE</span>

          </div>



          <div className="arcade-grid">

            <div className="quest-card q-gold" onClick={() => onNavigate?.('cosmetics-chamber')}>

              <div className="quest-left">

                <span className="q-badge">👑 BATTLE BANNER & SKINS • +150 XP</span>

                <h4>Câmara de Cosméticos & Identidade Clash Royale</h4>

                <span className="quest-sub">Personalize seu Banner 3D com molduras animadas de campeão, emotes e avatares</span>

              </div>

              <button className="rpg-action-btn primary" style={{ height: 28, padding: '0 10px' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('cosmetics-chamber'); }}>

                Personalizar

              </button>

            </div>



            <div className="quest-card q-gold" onClick={() => onNavigate?.('youtube-radar')}>

              <div className="quest-left">

                <span className="q-badge">📺 RADAR PEDAGÓGICO • +120 XP</span>

                <h4>Videoaulas YouTube Curadas pelos Professores</h4>

                <span className="quest-sub">Aulas organizadas por níveis Kumon e descritores BNCC (Boaro, Ferretto, Jubilut)</span>

              </div>

              <button className="rpg-action-btn primary" style={{ height: 28, padding: '0 10px' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('youtube-radar'); }}>

                Assistir

              </button>

            </div>



            <div className="quest-card q-gold" onClick={() => onNavigate?.('essay-lab')}>

              <div className="quest-left">

                <span className="q-badge">✍️ REDAÇÃO NOTA 1000 • +300 XP</span>

                <h4>Laboratório de Redação INEP (5 Competências)</h4>

                <span className="quest-sub">Mentoria socrática de Machado de Assis & Checagem dos 5 Elementos</span>

              </div>

              <button className="rpg-action-btn primary" style={{ height: 28, padding: '0 10px' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('essay-lab'); }}>

                Escrever

              </button>

            </div>



            <div className="quest-card q-bronze" onClick={() => onNavigate?.('skill-tree')}>

              <div className="quest-left">

                <span className="q-badge">🌳 CURRÍCULO BNCC • +200 XP</span>

                <h4>Árvore de Habilidades & Parâmetros TRI</h4>

                <span className="quest-sub">Conquiste insígnias de mentores e avance de nível</span>

              </div>

              <button className="rpg-action-btn" style={{ height: 28, padding: '0 10px' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('skill-tree'); }}>

                Explorar

              </button>

            </div>



            <div className="quest-card q-gold" onClick={() => onNavigate?.('arena')}>

              <div className="quest-left">

                <span className="q-badge">⚔️ PVP & BOSS RAID • +250 XP</span>

                <h4>Arena de Batalhas Socráticas (LAN)</h4>

                <span className="quest-sub">Duelos 1v1 contra colegas e Boss Raids contra Mentores</span>

              </div>

              <button className="rpg-action-btn primary" style={{ height: 28, padding: '0 10px' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('arena'); }}>

                Batalhar

              </button>

            </div>



            <div className="quest-card q-gold" onClick={() => onNavigate?.('phet-mastery')}>

              <div className="quest-left">

                <span className="q-badge">🔬 PHET & KUMON • +350 XP</span>

                <h4>Laboratório PhET & Micro-Drills Kumon</h4>

                <span className="quest-sub">Simulações de Física, Eletrostática Nativa e Desafios Diários de 3 min</span>

              </div>

              <button className="rpg-action-btn primary" style={{ height: 28, padding: '0 10px' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('phet-mastery'); }}>

                Praticar

              </button>

            </div>



            <div className="quest-card q-gold" onClick={() => onNavigate?.('multimodal-studio')}>

              <div className="quest-left">

                <span className="q-badge">🎙️ PODCAST & WORDWALL • +200 XP</span>

                <h4>Estúdio Multimodal & Gamificação</h4>

                <span className="quest-sub">Podcast Sofia & Lucas, Pílulas Cognitivas Brisk e Abra a Caixa 30s</span>

              </div>

              <button className="rpg-action-btn primary" style={{ height: 28, padding: '0 10px' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('multimodal-studio'); }}>

                Jogar

              </button>

            </div>



            <div className="quest-card q-bronze" onClick={() => onNavigate?.('ai-lab')}>

              <div className="quest-left">

                <span className="q-badge">SIMULADORES • +180 XP</span>

                <h4>Laboratório de Simulação Científica</h4>

                <span className="quest-sub">Óptica, Balística, Circuitos e Genética de Mendel</span>

              </div>

              <button className="rpg-action-btn" style={{ height: 28, padding: '0 10px' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('ai-lab'); }}>

                Simular

              </button>

            </div>



            <div className="quest-card q-gold" onClick={() => onNavigate?.('ai-lab')}>

              <div className="quest-left">

                <span className="q-badge">MENTORIA • +150 XP</span>

                <h4>Diálogo com Cientistas & Pensadores</h4>

                <span className="quest-sub">75+ personagens históricos em domínio público</span>

              </div>

              <button className="rpg-action-btn primary" style={{ height: 28, padding: '0 10px' }} onClick={(e) => { e.stopPropagation(); onNavigate?.('ai-lab'); }}>

                Dialogar

              </button>

            </div>

          </div>



          {activePolls.length > 0 && (

            <>

              <div className="rpg-panel-header" style={{ marginTop: 6 }}>

                <h3 className="rpg-title">

                  <Vote size={14} color="#A78BFA" />

                  <span>Conselho Estudantil (Sovereign Vote)</span>

                </h3>

                <span className="rpg-panel-tag">+50 XP</span>

              </div>

              <div className="voting-mesh-grid">

                {activePolls.map(poll => (

                  <div key={poll.id} className="vote-card">

                    <h4>{poll.title}</h4>

                    <p>{poll.description}</p>

                    <div className="vote-actions">

                      <button className="btn-vote-yes" onClick={() => handleVote(poll.id, 'YES')}>

                        APOIAR FÍSICA (+XP)

                      </button>

                      <button className="btn-vote-no" onClick={() => handleVote(poll.id, 'NO')}>

                        VOTAR MATEMÁTICA

                      </button>

                    </div>

                  </div>

                ))}

              </div>

            </>

          )}

        </section>



        {/* Column 3: Conquistas da Temporada */}

        <section className="rpg-panel">

          <div className="rpg-panel-header">

            <h3 className="rpg-title">

              <Trophy size={14} color="#10B981" />

              <span>Conquistas da Temporada</span>

            </h3>

            <span className="rpg-panel-tag">4 ATIVAS</span>

          </div>



          <div className="achievements-grid">

            {ACHIEVEMENTS.map(ach => (

              <div key={ach.id} className="achievement-card">

                <div className="achievement-top">

                  <span className="achievement-title">{ach.icon} {ach.title}</span>

                  <span className="achievement-pct">{ach.progress}%</span>

                </div>

                <div className="achievement-desc">{ach.description}</div>

                <div className="xp-bar-bg" style={{ height: 5, marginTop: 4 }}>

                  <div

                    className="xp-bar-fill"

                    style={{ '--rpg-progress': `${ach.progress}%` } as React.CSSProperties}

                  />

                </div>

              </div>

            ))}

          </div>

        </section>

      </div>

    </div>

  );

};



export default StudentRPGPortal;

