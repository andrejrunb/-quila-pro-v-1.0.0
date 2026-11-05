import React, { useState, useEffect, useMemo } from 'react';

import './StudentRPGPortal.css';

import SovereignShop from './SovereignShop';

import { Proposal } from '../../services/SovereignCouncilService';

import { resolveStudentGradeContext, matchesStudentGradeScope, formatSafeDatePtBr } from '../utils/studentGradeScope';

import { Sparkles, Brain, Trophy, Flame, Target, BookOpen, ShoppingBag, Vote, Swords, PenTool, GitFork, Network, Crown, Tv, Gamepad2, Layers, CheckCircle2, Clock, MessageSquare } from 'lucide-react';



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



const DEFAULT_PODS_BY_STAGE: Record<string, Array<{ id: string; subject: string; created_at: string; stage: string }>> = {
  ENSINO_MEDIO: [
    { id: 'pod-em-1', subject: 'Física • Eletrodinâmica & Circuitos (3ª Série EM)', created_at: '2026-10-18T08:30:00Z', stage: 'ENSINO_MEDIO' },
    { id: 'pod-em-2', subject: 'Matemática • Funções Quadráticas & Geometria Espacial (3ª Série EM)', created_at: '2026-10-17T10:15:00Z', stage: 'ENSINO_MEDIO' },
    { id: 'pod-em-3', subject: 'Redação • Estrutura Argumentativa & Repertório (3ª Série EM)', created_at: '2026-10-16T09:00:00Z', stage: 'ENSINO_MEDIO' },
    { id: 'pod-em-4', subject: 'Química • Estequiometria & Rendimento (3ª Série EM)', created_at: '2026-10-15T11:20:00Z', stage: 'ENSINO_MEDIO' },
  ],
  EF_ANOS_FINAIS: [
    { id: 'pod-ef2-1', subject: 'Ciências • Ecossistemas, Biomas & Rios Voadores (7º Ano EF)', created_at: '2026-10-18T08:30:00Z', stage: 'EF_ANOS_FINAIS' },
    { id: 'pod-ef2-2', subject: 'Matemática • Números Racionais, Razão & Proporção (7º Ano EF)', created_at: '2026-10-17T10:15:00Z', stage: 'EF_ANOS_FINAIS' },
    { id: 'pod-ef2-3', subject: 'Ciências • Máquinas Simples, Alavancas & Termologia (7º Ano EF)', created_at: '2026-10-16T09:00:00Z', stage: 'EF_ANOS_FINAIS' },
  ],
  EF_ANOS_INICIAIS: [
    { id: 'pod-ef1-1', subject: 'Matemática • Adição, Agrupamento & Multiplicação (3º Ano EF)', created_at: '2026-10-18T08:30:00Z', stage: 'EF_ANOS_INICIAIS' },
    { id: 'pod-ef1-2', subject: 'Língua Portuguesa • Leitura e Compreensão de Fábulas (3º Ano EF)', created_at: '2026-10-17T10:15:00Z', stage: 'EF_ANOS_INICIAIS' },
  ],
};

interface StudentTaskItem {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'completed';
  classId: string;
}

const DEFAULT_TASKS_BY_STAGE: Record<string, StudentTaskItem[]> = {
  ENSINO_MEDIO: [
    { id: 'tsk-em-1', title: 'Funções Quadráticas — Questão 3 de 8 (Lista Semanal)', subject: 'Matemática', dueDate: 'Amanhã', status: 'pending', classId: 'M-EM3A' },
    { id: 'tsk-em-2', title: 'Proposta de Intervenção e Repertório Legítimo', subject: 'Redação', dueDate: 'Sexta-feira', status: 'pending', classId: 'M-EM3A' },
    { id: 'tsk-em-3', title: 'Leis de Ohm e Potência Elétrica em Circuitos', subject: 'Física', dueDate: 'Próxima segunda', status: 'pending', classId: 'M-EM3A' },
  ],
  EF_ANOS_FINAIS: [
    { id: 'tsk-ef2-1', title: 'Adaptações da Vegetação do Cerrado e Ciclo da Água', subject: 'Ciências', dueDate: 'Amanhã', status: 'pending', classId: 'F-EF27A' },
    { id: 'tsk-ef2-2', title: 'Localização de Frações na Reta Numérica', subject: 'Matemática', dueDate: 'Sexta-feira', status: 'pending', classId: 'F-EF27A' },
  ],
  EF_ANOS_INICIAIS: [
    { id: 'tsk-ef1-1', title: 'Problemas de Agrupamento e Dezenas na Horta', subject: 'Matemática', dueDate: 'Amanhã', status: 'pending', classId: 'F-EF13A' },
    { id: 'tsk-ef1-2', title: 'Interpretação da Fábula A Cigarra e a Formiga', subject: 'Língua Portuguesa', dueDate: 'Sexta-feira', status: 'pending', classId: 'F-EF13A' },
  ],
};



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
  const [studentId, setStudentId] = useState(propStudentId || 'demo_student_001');
  useEffect(() => {
    if (propStudentId && propStudentId !== studentId) {
      setStudentId(propStudentId);
    }
  }, [propStudentId]);
  const studentCtx = useMemo(() => resolveStudentGradeContext(studentId), [studentId]);

  const [economy, setEconomy] = useState<any>({ level: 14, xp: 2680, balance: 1420 });
  const [activePolls, setActivePolls] = useState<Proposal[]>(DEFAULT_POLLS);
  const [learningPods, setLearningPods] = useState<any[]>(() => DEFAULT_PODS_BY_STAGE[studentCtx.stage] || DEFAULT_PODS_BY_STAGE.ENSINO_MEDIO);
  const [assignedTasks, setAssignedTasks] = useState<StudentTaskItem[]>(() => DEFAULT_TASKS_BY_STAGE[studentCtx.stage] || DEFAULT_TASKS_BY_STAGE.ENSINO_MEDIO);
  const [behavioral, setBehavioral] = useState<any>({ emotion: 'Ativo', engagement: 0.88 });
  const [showShop, setShowShop] = useState(false);

  useEffect(() => {
    loadEconomy();
    loadGovernance();
    loadLearningContent();
    loadStudentTasksForGrade();
    loadBehavioral();

    const behavioralInterval = setInterval(loadBehavioral, 10000);
    return () => clearInterval(behavioralInterval);
  }, [studentCtx]);

  const loadStudentTasksForGrade = async () => {
    try {
      const res = await (window as any).aquila?.invoke?.('tasks:list', { classId: studentCtx.classId });
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        // Filtra estritamente apenas tarefas da turma/série do aluno logado (ou revisão atribuída por professor)
        const scopedTasks = res.data
          .filter((t: any) =>
            matchesStudentGradeScope(
              {
                classId: t.classId,
                stage: t.stage,
                gradeLevel: t.gradeLevel,
                crossGradeAssignment: t.crossGradeAssignment,
              },
              studentCtx
            )
          )
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            subject: t.subject || 'Atividade Curricular',
            dueDate: formatSafeDatePtBr(t.dueDate, 'Data não informada'),
            status: t.status || 'pending',
            classId: t.classId || studentCtx.classId,
          }));
        if (scopedTasks.length > 0) {
          setAssignedTasks(scopedTasks);
          return;
        }
      }
    } catch {
      // Mantém tarefas padrão da série do estudante
    }
    setAssignedTasks(DEFAULT_TASKS_BY_STAGE[studentCtx.stage] || DEFAULT_TASKS_BY_STAGE.ENSINO_MEDIO);
  };

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
        const scopedPods = pods.filter((p: any) =>
          matchesStudentGradeScope({ classId: p.classId, stage: p.stage, gradeLevel: p.gradeLevel }, studentCtx)
        );
        if (scopedPods.length > 0) {
          setLearningPods(scopedPods);
          return;
        }
      }
    } catch {
      // Usa estado inicial da série do aluno
    }
    setLearningPods(DEFAULT_PODS_BY_STAGE[studentCtx.stage] || DEFAULT_PODS_BY_STAGE.ENSINO_MEDIO);
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

    <div className="student-portal-main aquila-ui">

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

              <h2>Olá, {studentCtx.studentName} • {studentCtx.className}</h2>

              <span className="rpg-tutor-pill" title="Apenas atividades e conteúdos da sua série aparecem neste portal">

                ● SÉRIE ATIVA: {studentCtx.seriesLabel.toUpperCase()}

              </span>

            </div>

            <div className="rpg-sub-telemetry">

              MEU INÍCIO • NÍVEL {economy?.level || 14} ({economy?.xp || 2680} XP) • SOMENTE TAREFAS DO {studentCtx.seriesLabel.toUpperCase()}

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

          <button className="rpg-action-btn primary" onClick={() => onNavigate?.('mastery-chamber')}>

            <Sparkles size={14} />

            <span>Praticar questões</span>

          </button>

          <button className="rpg-action-btn" onClick={() => onNavigate?.('ai-lab')}>

            <Brain size={14} />

            <span>Assistente de estudos</span>

          </button>

          <button className="rpg-action-btn" onClick={() => onNavigate?.('essay-lab')}>

            <PenTool size={14} />

            <span>Redação assistida</span>

          </button>

          <button className="rpg-action-btn" onClick={() => onNavigate?.('skill-tree')}>

            <GitFork size={14} />

            <span>Progresso por habilidade</span>

          </button>

          <button className="rpg-action-btn" onClick={() => onNavigate?.('youtube-radar')} title="Videoaulas da sua série">

            <Tv size={14} color="#38BDF8" />

            <span>Videoaulas</span>

          </button>

          <button className="rpg-action-btn" onClick={() => onNavigate?.('playlists-live')} title="Roteiros práticos da sua série">

            <Gamepad2 size={14} color="#10B981" />

            <span>Roteiros & Jogos</span>

          </button>

          <button className="rpg-action-btn" onClick={() => onNavigate?.('h5p-perseus-lab')} title="Atividades interativas da sua série" data-testid="btn-nav-h5p-perseus">

            <Layers size={14} color="#A78BFA" />

            <span>Atividades interativas</span>

          </button>

          <button className="rpg-action-btn" onClick={() => onNavigate?.('cosmetics-chamber')} title="Personalizar cartão de perfil">

            <Crown size={14} color="#FBBF24" />

            <span>Cartão de perfil</span>

          </button>

          <button className="rpg-action-btn" onClick={() => setShowShop(v => !v)}>

            <ShoppingBag size={14} />

            <span>Loja de cosméticos ({economy?.balance || 1420} 💎)</span>

          </button>

        </div>

      </header>

      {/* Bloco Prioritário "Meu Início": Continue sua atividade + Para entregar (Série do Aluno) + Feedback do Professor */}
      <section
        className="student-routine-priority-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
          marginBottom: '12px'
        }}
      >
        {/* 1. Continue de onde parou */}
        <div className="rpg-panel" style={{ padding: '14px 16px', borderLeft: '3px solid #2563EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase' }}>
              Continue de onde parou • {studentCtx.seriesLabel}
            </span>
            <Clock size={14} color="#60A5FA" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 4px 0' }}>
            {assignedTasks[0]?.title || 'Prática de questões da sua série'}
          </h3>
          <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '0 0 12px 0' }}>
            Disciplina: <strong>{assignedTasks[0]?.subject || 'Matemática'}</strong> • Prazo: {assignedTasks[0]?.dueDate || 'Amanhã'}
          </p>
          <button
            className="rpg-action-btn primary"
            style={{ width: '100%', justifyContent: 'center', height: '36px' }}
            onClick={() => onNavigate?.('mastery-chamber')}
          >
            <Sparkles size={14} />
            <span>Continuar atividade</span>
          </button>
        </div>

        {/* 2. Para entregar (Somente tarefas da série do estudante) */}
        <div className="rpg-panel" style={{ padding: '14px 16px', borderLeft: '3px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase' }}>
              Para entregar ({studentCtx.className})
            </span>
            <CheckCircle2 size={14} color="#F59E0B" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {assignedTasks.slice(0, 3).map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '6px',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  fontSize: '12px'
                }}
              >
                <span style={{ color: '#F1F5F9', fontWeight: 600 }}>
                  {t.subject}: <span style={{ fontWeight: 400, color: '#CBD5E1' }}>{t.title}</span>
                </span>
                <span style={{ color: '#FBBF24', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                  {t.dueDate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Feedback recebido do professor */}
        <div className="rpg-panel" style={{ padding: '14px 16px', borderLeft: '3px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6EE7B7', textTransform: 'uppercase' }}>
              Feedback do professor
            </span>
            <MessageSquare size={14} color="#10B981" />
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 4px 0' }}>
            Comentário docente registrado na sua última entrega
          </h3>
          <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '0 0 12px 0' }}>
            &ldquo;Boa resolução algébrica. Revise a justificativa na etapa 2 antes do fechamento.&rdquo;
          </p>
          <button
            className="rpg-action-btn"
            style={{ width: '100%', justifyContent: 'center', height: '36px' }}
            onClick={() => onNavigate?.('ai-lab')}
          >
            <span>Consultar comentário e materiais</span>
          </button>
        </div>
      </section>



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

                  <span>RESUMO DE AULA • {formatSafeDatePtBr(pod.created_at || pod.createdAt, 'Data não informada')}</span>

                </div>

                <span className="rpg-panel-tag" style={{ color: '#00F0FF' }}>ABRIR RESUMO →</span>

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

