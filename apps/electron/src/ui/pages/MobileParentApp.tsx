import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Shield, BookOpen, MessageCircle,
  MapPin, Send, LogIn, LogOut, Clock,
  Star, AlertTriangle, CheckCircle2, ChevronLeft,
  Wallet, QrCode, Copy, Check, Users, ShieldCheck,
  FileSignature, Sparkles, RefreshCw
} from 'lucide-react';
import './MobileParentApp.css';

interface EventFeedItem {
  id: string;
  type: 'entry' | 'exit' | 'class' | 'grade' | 'msg';
  title: string;
  subtitle: string;
  time: string;
}

interface GradeItem {
  subject: string;
  teacher: string;
  grade: number;
  color: string;
  feedback: string;
}

interface ChatMessage {
  id: string;
  from: 'school' | 'parent';
  sender: string;
  text: string;
  time: string;
}

interface IncidentItem {
  id: string;
  date: string;
  title: string;
  description: string;
  coordinator: string;
  signed: boolean;
  signedAt?: string;
  signatureHash?: string;
}

interface StudentRoll {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late';
  matchScore: number;
}

interface MobileParentAppProps {
  onBack?: () => void;
  studentName?: string;
  studentClass?: string;
}

export const MobileParentApp: React.FC<MobileParentAppProps> = ({
  onBack,
  studentName = 'João Gabriel Mendes',
  studentClass = '8º Ano B — Sala 12',
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'grades' | 'finance' | 'disciplinary' | 'attendance' | 'safety' | 'gate_guard' | 'chat'>('feed');
  const [isPresent] = useState(true);
  const [chegueiSent, setChegueiSent] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(2);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isGatewayConnected, setIsGatewayConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tactical gate queue for guard mode
  const [gateQueue, setGateQueue] = useState<any[]>([
    {
      studentId: 'stu-9a-02',
      studentName: 'João Gabriel Mendes',
      studentClass: '8º Ano B — Sala 12',
      parentName: 'Mariana Mendes (Mãe)',
      vehiclePlate: 'BRA-2E19',
      etaMinutes: 2,
      distanceMeters: 380,
      status: 'APPROACHING'
    },
    {
      studentId: 'stu-9a-01',
      studentName: 'Ana Beatriz Souza',
      studentClass: '8º Ano B — Sala 12',
      parentName: 'Carlos Souza (Pai)',
      vehiclePlate: 'ABC-4412',
      etaMinutes: 0,
      distanceMeters: 25,
      status: 'AT_GATE'
    }
  ]);
  const [guardReleasedCount, setGuardReleasedCount] = useState<number>(418);

  // Geofence simulation states
  const [simulatedDistance, setSimulatedDistance] = useState<number>(1000);
  const [simulatedEta, setSimulatedEta] = useState<number>(4);
  const [realStudent, setRealStudent] = useState<any>(null);

  // Ocorrências state
  const [incidents, setIncidents] = useState<IncidentItem[]>([
    {
      id: 'INC-2026-08',
      date: '18/10/2026 às 10:45',
      title: 'Uso de Fone de Ouvido em Avaliação',
      description: 'O aluno utilizou fone durante a prova de Física. Orientado pelo professor e encaminhado à coordenação preventiva.',
      coordinator: 'Prof. Paulo Andrade (Coordenação Pedagógica)',
      signed: false
    },
    {
      id: 'INC-2026-03',
      date: '02/09/2026 às 08:15',
      title: 'Chegada Tardia com Atraso de 35 Minutos',
      description: 'Aluno chegou após o início do segundo tempo. Responsável notificado e ciência registrada no sistema.',
      coordinator: 'Profa. Cristina (Secretaria)',
      signed: true,
      signedAt: '02/09/2026 às 08:30',
      signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    }
  ]);

  // Roll call state
  const [rollCall, setRollCall] = useState<StudentRoll[]>([
    { id: 'stu-9a-01', name: 'Ana Beatriz Souza', status: 'present', matchScore: 98.4 },
    { id: 'stu-9a-02', name: 'João Gabriel Mendes', status: 'present', matchScore: 99.1 },
    { id: 'stu-9a-03', name: 'Lucas Andrade', status: 'absent', matchScore: 0.0 },
    { id: 'stu-9a-04', name: 'Sofia Costa', status: 'present', matchScore: 97.6 },
    { id: 'stu-9a-05', name: 'Gabriel Santos', status: 'late', matchScore: 95.2 },
  ]);
  const [syncStatus, setSyncStatus] = useState<string>('Sincronizado com SQLite SQA-1000');

  useEffect(() => {
    // Check WebSocket gateway on port 9000
    try {
      const ws = new WebSocket('ws://localhost:9000');
      ws.onopen = () => setIsGatewayConnected(true);
      ws.onclose = () => setIsGatewayConnected(false);
      ws.onerror = () => setIsGatewayConnected(false);
      return () => ws.close();
    } catch {
      setIsGatewayConnected(false);
    }
  }, []);

  useEffect(() => {
    const loadRealStudent = async () => {
      try {
        if ((window as any).aquila && typeof (window as any).aquila.getStudents === 'function') {
          const list = await (window as any).aquila.getStudents();
          if (list && list.length > 0) {
            setRealStudent(list[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar estudantes reais:', err);
      }
    };
    loadRealStudent();
  }, []);

  const [events] = useState<EventFeedItem[]>([
    { id: 'e1', type: 'entry', title: 'Chegou à escola', subtitle: 'Catraca Principal • Reconhecimento NPU 99.1%', time: '07:18' },
    { id: 'e2', type: 'class', title: 'Aula de Matemática', subtitle: 'Presença confirmada — Sala 12', time: '07:30' },
    { id: 'e3', type: 'class', title: 'Aula de Português', subtitle: 'Presença confirmada — Sala 12', time: '09:00' },
    { id: 'e4', type: 'grade', title: 'Nova nota lançada', subtitle: 'Matemática: 9.4 — Prof. Arnaldo', time: '10:12' },
    { id: 'e5', type: 'msg', title: 'Mensagem da Coordenação', subtitle: 'Simulado ENEM Agendado para 28/10', time: '11:30' },
  ]);

  const [grades] = useState<GradeItem[]>([
    { subject: 'Matemática', teacher: 'Prof. Arnaldo', grade: 9.4, color: '#10b981', feedback: 'Excelente raciocínio lógico em matrizes e funções.' },
    { subject: 'Português', teacher: 'Profa. Cláudia', grade: 9.5, color: '#3b82f6', feedback: 'Redação exemplar dentro do padrão nota 1000.' },
    { subject: 'Física', teacher: 'Prof. Ricardo', grade: 8.8, color: '#a855f7', feedback: 'Ótima interpretação física em termodinâmica.' },
    { subject: 'Química', teacher: 'Profa. Luana', grade: 9.0, color: '#f59e0b', feedback: 'Excelente domínio em cálculos estequiométricos.' },
    { subject: 'Biologia', teacher: 'Prof. Marcos', grade: 8.5, color: '#10b981', feedback: 'Participação ativa em aulas práticas de genética.' },
    { subject: 'História', teacher: 'Prof. Daniel', grade: 9.2, color: '#3b82f6', feedback: 'Capacidade crítica e contextualização histórica.' },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'c1',
      from: 'school',
      sender: 'Secretaria Soberana',
      text: 'Bom dia! João Gabriel chegou às 07:18. Presença confirmada no colégio! 😊',
      time: '07:20',
    },
    {
      id: 'c2',
      from: 'school',
      sender: 'Coordenação Pedagógica',
      text: 'Lembrete: O simulado TRI 4º Bimestre ocorrerá na próxima terça-feira às 08h.',
      time: '10:30',
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `c${Date.now()}`,
      from: 'parent',
      sender: 'Você (Responsável)',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, msg]);
    const userQuery = chatInput.trim();
    setChatInput('');

    // Resposta inteligente da Secretaria / Albus IA
    setTimeout(() => {
      let reply = 'Recebemos sua mensagem! Nossa equipe retornará em breve. Em caso de urgência, contate a portaria interna.';
      if (userQuery.toLowerCase().includes('nota') || userQuery.toLowerCase().includes('boletim')) {
        reply = 'As notas do 4º Bimestre estão consolidadas com média 9.1! Você pode conferir a aba "Boletim" a qualquer momento.';
      } else if (userQuery.toLowerCase().includes('cheg') || userQuery.toLowerCase().includes('buscar')) {
        reply = 'Perfeito! Você pode acionar o botão "Estou Chegando" na aba Portaria para que o aluno seja adiantado.';
      }

      setChatMessages(prev => [...prev, {
        id: `r${Date.now()}`,
        from: 'school',
        sender: 'Secretaria Soberana (IA)',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 1000);
  };

  const handleCheguei = () => {
    setChegueiSent(true);
    setSimulatedDistance(1000);
    setSimulatedEta(4);

    const studentIds = realStudent ? [realStudent.id] : ['stu-9a-02'];
    const studentNameVal = realStudent ? realStudent.name : studentName;
    const schoolCoords = { lat: -23.5505, lon: -46.6333 };

    if ((window as any).aquila && typeof (window as any).aquila.parent === 'object' && typeof (window as any).aquila.parent.updateLocation === 'function') {
      (window as any).aquila.parent.updateLocation(
        'parent-sim',
        `Responsável por ${studentNameVal.split(' ')[0]}`,
        studentIds,
        { lat: schoolCoords.lat + 0.009, lon: schoolCoords.lon }
      );
    }

    let currentStep = 0;
    const steps = [
      { dist: 750, eta: 3, offset: 0.0068 },
      { dist: 500, eta: 2, offset: 0.0045 },
      { dist: 250, eta: 1, offset: 0.0022 },
      { dist: 35, eta: 0, offset: 0.0003 }
    ];

    const timer = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(timer);
        return;
      }
      const next = steps[currentStep];
      setSimulatedDistance(next.dist);
      setSimulatedEta(next.eta);

      if ((window as any).aquila && typeof (window as any).aquila.parent === 'object' && typeof (window as any).aquila.parent.updateLocation === 'function') {
        (window as any).aquila.parent.updateLocation(
          'parent-sim',
          `Responsável por ${studentNameVal.split(' ')[0]}`,
          studentIds,
          { lat: schoolCoords.lat + next.offset, lon: schoolCoords.lon }
        );
      }
      currentStep++;
    }, 3500);
  };

  const handleSignIncident = (incidentId: string) => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const mockHash = 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592';
    
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          signed: true,
          signedAt: timestamp,
          signatureHash: mockHash
        };
      }
      return inc;
    }));
  };

  const handleToggleRoll = (id: string, newStatus: 'present' | 'absent' | 'late') => {
    setRollCall(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    setSyncStatus('Alterações pendentes de sincronização...');
  };

  const handleSyncRoll = () => {
    setSyncStatus('Sincronizando com SQLite WAL...');
    setTimeout(() => {
      setSyncStatus('100% Sincronizado • Auditoria Local Registrada');
    }, 600);
  };

  const handleCopyPix = () => {
    navigator.clipboard?.writeText('00020101021226840014br.gov.bcb.pix2562pix-qr.colegiovisao.edu.br/qr/v2/9b7e415204000053039865802BR5913Colegio Visao6008Brasilia62070503***6304E2D1');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleReleaseStudentFromGate = (stId: string, stName: string) => {
    setGateQueue(prev => prev.filter(q => q.studentId !== stId));
    setGuardReleasedCount(c => c + 1);
    setChatMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        from: 'school',
        sender: 'Portaria Principal (Agente Silva)',
        text: `Saída do aluno ${stName} confirmada e liberada no portão.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const getGradeClass = (g: number) => {
    if (g >= 7) return 'grade-green';
    if (g >= 5) return 'grade-yellow';
    return 'grade-red';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'entry': return <LogIn size={16} />;
      case 'exit': return <LogOut size={16} />;
      case 'class': return <BookOpen size={16} />;
      case 'grade': return <Star size={16} />;
      case 'msg': return <MessageCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const currentStudentName = realStudent ? realStudent.name : studentName;

  return (
    <div className="mpa-root">
      {/* HEADER */}
      <header className="mpa-header">
        <div className="mpa-logo-group">
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
              <ChevronLeft size={22} />
            </button>
          )}
          <div className="mpa-logo-dot" />
          <div>
            <span className="mpa-app-name">Áquila <span>Família & Mobile</span></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: isGatewayConnected ? '#10b981' : '#f59e0b'
              }} />
              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                {isGatewayConnected ? 'WS 9000 ONLINE' : 'LAN SOBERANA'}
              </span>
            </div>
          </div>
        </div>
        <div className="mpa-header-actions">
          <button className="mpa-bell-btn">
            <Bell size={18} />
            {unreadCount > 0 && <span className="mpa-badge">{unreadCount}</span>}
          </button>
        </div>
      </header>

      {/* STUDENT HERO CARD */}
      <div className="mpa-student-hero">
        <div className="mpa-avatar">
          {currentStudentName.charAt(0)}
        </div>
        <div className="mpa-student-info">
          <p className="mpa-student-name">{currentStudentName}</p>
          <p className="mpa-student-meta">{studentClass}</p>
        </div>
        <div className={`mpa-presence-pill ${isPresent ? 'present' : 'absent'}`}>
          <span className="mpa-presence-dot" />
          {isPresent ? 'Na escola' : 'Ausente'}
        </div>
      </div>

      {/* TABS (SCROLLABLE BAR WITH ALL 7 MODULES) */}
      <div className="mpa-tabs">
        {([
          { key: 'feed', label: 'Hoje', icon: <Clock size={16} /> },
          { key: 'grades', label: 'Boletim', icon: <BookOpen size={16} /> },
          { key: 'finance', label: 'Financeiro', icon: <Wallet size={16} /> },
          { key: 'disciplinary', label: 'Ocorrências', icon: <AlertTriangle size={16} /> },
          { key: 'attendance', label: 'Chamada', icon: <Users size={16} /> },
          { key: 'safety', label: 'Portaria', icon: <Shield size={16} /> },
          { key: 'gate_guard', label: 'Ronda Portaria', icon: <ShieldCheck size={16} /> },
          { key: 'chat', label: 'Chat & IA', icon: <MessageCircle size={16} /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            className={`mpa-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.key); if (tab.key === 'chat') setUnreadCount(0); }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <main className="mpa-content">

        {/* TAB 1: FEED DO DIA */}
        {activeTab === 'feed' && (
          <>
            <p className="mpa-section-title">Linha do Tempo em Tempo Real</p>
            <div className="mpa-event-feed">
              {events.map(ev => (
                <div key={ev.id} className="mpa-event-item">
                  <div className={`mpa-event-icon ${ev.type}`}>
                    {getEventIcon(ev.type)}
                  </div>
                  <div className="mpa-event-body">
                    <p className="mpa-event-title">{ev.title}</p>
                    <p className="mpa-event-sub">{ev.subtitle}</p>
                  </div>
                  <span className="mpa-event-time">{ev.time}</span>
                </div>
              ))}
            </div>

            <p className="mpa-section-title" style={{ marginTop: 20 }}>Conformidade & Proteção</p>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <ShieldCheck size={24} style={{ color: '#10b981', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Notificação Preventiva (LDB Art. 12 VII)
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0 0' }}>
                  Acompanhamento biométrico 100% offline via NPU Edge. Zero tráfego na nuvem externa.
                </p>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: BOLETIM INTELIGENTE */}
        {activeTab === 'grades' && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(59, 130, 246, 0.1))',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: 16,
              padding: '16px',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: 10, color: '#a78bfa', textTransform: 'uppercase', fontWeight: 800 }}>
                  MÉDIA CONSOLIDADA • 4º BIMESTRE
                </span>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#10b981', margin: '2px 0 0 0', fontFamily: 'monospace' }}>
                  9.1
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Frequência Global: 98.4% • Aprovado com Louvor
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '4px 8px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 800
                }}>
                  TRI 840.5
                </span>
              </div>
            </div>

            <p className="mpa-section-title">Disciplinas & Feedback Docente</p>
            <div className="mpa-boletim-grid">
              {grades.map(g => (
                <div key={g.subject} className="mpa-grade-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="mpa-grade-color" style={{ background: g.color }} />
                      <div className="mpa-grade-info">
                        <p className="mpa-grade-subject">{g.subject}</p>
                        <p className="mpa-grade-teacher">{g.teacher}</p>
                      </div>
                    </div>
                    <span className={`mpa-grade-value ${getGradeClass(g.grade)}`}>
                      {g.grade.toFixed(1)}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                    "{g.feedback}"
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 3: FINANCEIRO & PIX */}
        {activeTab === 'finance' && (
          <>
            <div className="mpa-finance-card">
              <div className="mpa-finance-header">
                <div>
                  <span className="mpa-finance-badge">Fatura Aberta • Novembro 2026</span>
                  <h3 className="mpa-finance-title">Mensalidade Escolar</h3>
                  <p className="mpa-finance-due">Vencimento: 25/11/2026</p>
                </div>
                <span className="mpa-finance-val">R$ 890,00</span>
              </div>

              <div className="mpa-pix-box">
                <div className="mpa-pix-qr">
                  <QrCode size={94} color="#050b18" />
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textAlign: 'center' }}>
                  PIX Dinâmico com Liquidação Local Instantânea (SQA-1000)
                </p>
              </div>

              <button
                className={`mpa-copy-btn ${copiedPix ? 'copied' : ''}`}
                onClick={handleCopyPix}
              >
                {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                {copiedPix ? 'Código PIX Copiado com Sucesso!' : 'Copiar Código PIX Copia-e-Cola'}
              </button>
            </div>

            <p className="mpa-section-title">Demonstrativo de Parcelas</p>
            {[
              { month: 'Outubro / 2026', val: 'R$ 890,00', status: 'Pago em 10/10/2026', paid: true },
              { month: 'Setembro / 2026', val: 'R$ 890,00', status: 'Pago em 08/09/2026', paid: true },
              { month: 'Dezembro / 2026', val: 'R$ 890,00', status: 'A Vencer em 25/12/2026', paid: false },
            ].map((inv, idx) => (
              <div key={idx} className="mpa-invoice-row">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{inv.month}</p>
                  <p style={{ fontSize: 11, color: inv.paid ? '#10b981' : '#94a3b8', margin: '2px 0 0 0' }}>
                    {inv.status}
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace' }}>
                  {inv.val}
                </span>
              </div>
            ))}
          </>
        )}

        {/* TAB 4: OCORRÊNCIAS & ASSINATURA DIGITAL */}
        {activeTab === 'disciplinary' && (
          <>
            <p className="mpa-section-title">Ocorrências Pedagógicas & Ciência</p>
            {incidents.map((inc) => (
              <div key={inc.id} className={`mpa-incident-card ${!inc.signed ? 'pending' : ''}`}>
                <div className="mpa-incident-header">
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: inc.signed ? '#10b981' : '#ef4444',
                    background: inc.signed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    padding: '3px 8px',
                    borderRadius: 6
                  }}>
                    {inc.signed ? 'CIÊNCIA ASSINADA' : 'PENDENTE DE ASSINATURA'}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{inc.date}</span>
                </div>

                <h4 className="mpa-incident-title">{inc.title}</h4>
                <p className="mpa-incident-desc">{inc.description}</p>
                <p className="mpa-incident-meta">{inc.coordinator}</p>

                {inc.signed ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                        Assinado pelo Responsável em {inc.signedAt}
                      </span>
                    </div>
                    <span className="mpa-hash-badge" title={inc.signatureHash}>
                      SHA-256: {inc.signatureHash}
                    </span>
                  </div>
                ) : (
                  <button className="mpa-sign-btn" onClick={() => handleSignIncident(inc.id)}>
                    <FileSignature size={16} />
                    Dar Ciência Digital (Assinatura Soberana)
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {/* TAB 5: CHAMADA DOCENTE 1-TOQUE */}
        {activeTab === 'attendance' && (
          <>
            <p className="mpa-section-title">Chamada Rápida • Turma 8º B</p>
            <div className="mpa-roll-list">
              {rollCall.map((st) => (
                <div key={st.id} className="mpa-roll-item">
                  <div>
                    <p className="mpa-roll-name">{st.name}</p>
                    <span className="mpa-roll-meta">Confiança NPU: {st.matchScore}%</span>
                  </div>
                  <div className="mpa-roll-actions">
                    <button
                      className={`mpa-roll-btn present ${st.status === 'present' ? 'active' : ''}`}
                      onClick={() => handleToggleRoll(st.id, 'present')}
                    >
                      Presente
                    </button>
                    <button
                      className={`mpa-roll-btn late ${st.status === 'late' ? 'active' : ''}`}
                      onClick={() => handleToggleRoll(st.id, 'late')}
                    >
                      Atraso
                    </button>
                    <button
                      className={`mpa-roll-btn absent ${st.status === 'absent' ? 'active' : ''}`}
                      onClick={() => handleToggleRoll(st.id, 'absent')}
                    >
                      Falta
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mpa-sync-bar">
              <span style={{ fontSize: 11, color: '#a78bfa' }}>{syncStatus}</span>
              <button
                onClick={handleSyncRoll}
                style={{
                  height: 32,
                  padding: '0 14px',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <RefreshCw size={14} /> Sincronizar
              </button>
            </div>
          </>
        )}

        {/* TAB 6: PORTARIA / CHEGUEI */}
        {activeTab === 'safety' && (
          <>
            <p className="mpa-section-title">Módulo Portaria & Saída Segura</p>
            
            {chegueiSent ? (
              <div className="mpa-tracking-card animate-pulse-border">
                <div className="mpa-tracking-header">
                  <MapPin size={24} className="text-emerald-400 animate-bounce" />
                  <div>
                    <p className="mpa-tracking-title">
                      {simulatedDistance <= 40 ? 'Aluno em Liberação na Portaria!' : 'Navegação Ativa (GPS)'}
                    </p>
                    <p className="mpa-tracking-sub">
                      {simulatedDistance <= 40 
                        ? `${currentStudentName.split(' ')[0]} chamado para o portão principal` 
                        : `A caminho do colégio · ETA ${simulatedEta} min`}
                    </p>
                  </div>
                </div>

                <div className="mpa-progress-track">
                  <div 
                    className="mpa-progress-fill" 
                    style={{ width: `${Math.max(10, 100 - (simulatedDistance / 1000) * 100)}%` }}
                  />
                  <div 
                    className="mpa-progress-car"
                    style={{ left: `calc(${Math.max(10, 100 - (simulatedDistance / 1000) * 100)}% - 12px)` }}
                  >
                    🚗
                  </div>
                </div>

                <div className="mpa-tracking-metrics">
                  <div className="mpa-metric">
                    <span className="mpa-metric-label">Distância</span>
                    <span className="mpa-metric-val">{simulatedDistance}m</span>
                  </div>
                  <div className="mpa-metric">
                    <span className="mpa-metric-label">Portão Principal</span>
                    <span className={`mpa-metric-val ${simulatedDistance <= 40 ? 'active' : ''}`}>
                      {simulatedDistance <= 40 ? 'LIBERAÇÃO IMEDIATA' : 'APROXIMANDO'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="mpa-cheguei-btn"
                onClick={handleCheguei}
              >
                <MapPin size={32} />
                ESTOU CHEGANDO
                <small>
                  Notificar a escola que você está a caminho para buscar seu filho (Geofencing Local)
                </small>
              </button>
            )}

            <p className="mpa-section-title" style={{ marginTop: 12 }}>Localização Atual do Aluno</p>
            <div style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(16,185,129,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#10b981', flexShrink: 0
              }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#f1f5f9', margin: 0 }}>SALA DE AULA 12 — 2º Andar</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0 0' }}>
                  Última detecção biométrica: 11:45 · Câmera C-07 (NPU Edge)
                </p>
              </div>
            </div>
          </>
        )}

        {/* TAB 7: CHAT COM ESCOLA & ALBUS IA */}
        {activeTab === 'chat' && (
          <>
            <p className="mpa-section-title">Canal Direto com Secretaria & Albus IA</p>
            <div className="mpa-chat-window">
              <div className="mpa-chat-messages">
                {chatMessages.map(msg => (
                  <div key={msg.id}>
                    <p className="mpa-chat-sender">
                      {msg.sender} · {msg.time}
                    </p>
                    <div className={`mpa-chat-bubble ${msg.from}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="mpa-chat-input-row">
                <textarea
                  className="mpa-chat-input"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Pergunte sobre notas, portaria ou avise a secretaria..."
                  rows={1}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }}}
                />
                <button className="mpa-send-btn" onClick={handleSendChat}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 8: RONDA & PORTARIA TÁTICA (GUARDA) */}
        {activeTab === 'gate_guard' && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(5, 11, 24, 0.8))',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: 16,
              padding: '16px',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: 10, color: '#00f0ff', textTransform: 'uppercase', fontWeight: 800 }}>
                  PORTARIA TÁTICA & DISPATCHER
                </span>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: '2px 0 0 0' }}>
                  Portão Principal • NPU OK
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Liberados Hoje: {guardReleasedCount} alunos • Zero Incidentes
                </p>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(0, 240, 255, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#00f0ff'
              }}>
                <ShieldCheck size={20} />
              </div>
            </div>

            <p className="mpa-section-title">Fila de Liberação por Proximidade (GPS)</p>
            {gateQueue.length === 0 ? (
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: 16,
                padding: '24px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: 0 }}>Nenhum aluno pendente no portão</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0 0' }}>
                  Quando os pais acionarem "Estou Chegando", o chamado aparecerá aqui.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {gateQueue.map(item => (
                  <div key={item.studentId} style={{
                    background: item.status === 'AT_GATE' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.7)',
                    border: `1px solid ${item.status === 'AT_GATE' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 16,
                    padding: '14px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 18,
                          background: '#7c3aed', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 14
                        }}>
                          {item.studentName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{item.studentName}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{item.studentClass}</p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        color: item.status === 'AT_GATE' ? '#10b981' : '#f59e0b',
                        background: item.status === 'AT_GATE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        padding: '3px 8px', borderRadius: 6
                      }}>
                        {item.status === 'AT_GATE' ? 'NA PORTARIA' : `ETA ${item.etaMinutes} min`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                      <span>Resp: <strong style={{ color: '#cbd5e1' }}>{item.parentName}</strong></span>
                      <span>Placa: <strong style={{ color: '#00f0ff', fontFamily: 'monospace' }}>{item.vehiclePlate}</strong></span>
                    </div>

                    <button
                      onClick={() => handleReleaseStudentFromGate(item.studentId, item.studentName)}
                      style={{
                        width: '100%',
                        height: 34,
                        background: '#059669',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <UserCheck size={16} /> Liberar Saída do Aluno
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav className="mpa-bottom-nav">
        {([
          { key: 'feed', label: 'Hoje', icon: <Clock size={20} /> },
          { key: 'grades', label: 'Boletim', icon: <BookOpen size={20} /> },
          { key: 'finance', label: 'Financeiro', icon: <Wallet size={20} /> },
          { key: 'safety', label: 'Portaria', icon: <Shield size={20} /> },
          { key: 'chat', label: 'Chat', icon: <MessageCircle size={20} /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            className={`mpa-nav-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.key); if (tab.key === 'chat') setUnreadCount(0); }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default MobileParentApp;
