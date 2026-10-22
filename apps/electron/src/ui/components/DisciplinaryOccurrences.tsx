import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, Shield, CheckCircle2, Clock, Users, Plus,
  Search, FileText, Send, Check, Download, AlertCircle, X, Award
} from 'lucide-react';
import { STUDENTS } from '../../database/studentsData';

export interface OccurrenceItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  time: string;
  category: 'atraso' | 'pedagogica' | 'celular' | 'uniforme' | 'disciplinar' | 'merito';
  severity: 'leve' | 'media' | 'grave' | 'merito';
  description: string;
  actionTaken: string;
  parentAckStatus: 'pending' | 'signed';
  parentSignedAt?: string;
  parentSignedBy?: string;
  signatureHash?: string;
}

const INITIAL_OCCURRENCES: OccurrenceItem[] = [
  {
    id: 'occ-101',
    studentId: 'std-1',
    studentName: 'Lucas Andrade',
    className: '2º Ano B — Ensino Médio',
    date: '18/10/2026',
    time: '08:45',
    category: 'pedagogica',
    severity: 'media',
    description: 'Aluno não entregou o relatório experimental de Termodinâmica no prazo estipulado e apresentou desatenção reiterada na aula de Física.',
    actionTaken: 'Atendimento pedagógico individualizado realizado; concedido prazo adicional de 48h com plano de acompanhamento na Câmara de Maestria.',
    parentAckStatus: 'pending',
  },
  {
    id: 'occ-102',
    studentId: 'std-2',
    studentName: 'Sofia Costa',
    className: '3º Ano A — Ensino Médio',
    date: '17/10/2026',
    time: '10:15',
    category: 'merito',
    severity: 'merito',
    description: 'Destaque acadêmico exemplar no Simulado Nacional ENEM, obtendo 960 pontos na Redação com proposta de intervenção de alto impacto social.',
    actionTaken: 'Elogio pedagógico registrado em ficha cadastral e concessão do Certificado de Excelência Áquila Pro.',
    parentAckStatus: 'signed',
    parentSignedAt: '17/10/2026 às 19:22',
    parentSignedBy: 'Marcos Costa (Pai / Resp. Legal)',
    signatureHash: 'ICP-BR-SHA256-SOF960-CONFIRMED',
  },
  {
    id: 'occ-103',
    studentId: 'std-3',
    studentName: 'Gabriel Santos',
    className: '2º Ano B — Ensino Médio',
    date: '16/10/2026',
    time: '07:35',
    category: 'atraso',
    severity: 'leve',
    description: 'Terceiro atraso consecutivo para o primeiro horário letivo (entrada registrada às 07:32 pela portaria biométrica).',
    actionTaken: 'Conversa orientadora com o estudante e reforço das normas regimentais sobre pontualidade.',
    parentAckStatus: 'signed',
    parentSignedAt: '16/10/2026 às 12:40',
    parentSignedBy: 'Fernanda Santos (Mãe / Resp. Legal)',
    signatureHash: 'ICP-BR-SHA256-GAB0735-CONFIRMED',
  },
  {
    id: 'occ-104',
    studentId: '45397',
    studentName: 'DAVI LUCAS SILVA BORGES',
    className: '2º Ano B — Ensino Médio',
    date: '15/10/2026',
    time: '11:20',
    category: 'disciplinar',
    severity: 'grave',
    description: 'Recusa reiterada em guardar aparelho celular durante aplicação de avaliação bimestral de Matemática.',
    actionTaken: 'Termo de advertência formal lavrado; convocação dos responsáveis legais para alinhamento pedagógico presencial.',
    parentAckStatus: 'pending',
  },
];

export const DisciplinaryOccurrences: React.FC = () => {
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>(INITIAL_OCCURRENCES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [formStudent, setFormStudent] = useState(STUDENTS[0]?.name || 'ANA CLARA FERREIRA');
  const [formCategory, setFormCategory] = useState<OccurrenceItem['category']>('pedagogica');
  const [formSeverity, setFormSeverity] = useState<OccurrenceItem['severity']>('leve');
  const [formDesc, setFormDesc] = useState('');
  const [formAction, setFormAction] = useState('');

  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(occ => {
      const matchSearch = occ.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          occ.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = selectedFilter === 'all' ? true : occ.category === selectedFilter || occ.parentAckStatus === selectedFilter;
      return matchSearch && matchFilter;
    });
  }, [occurrences, searchTerm, selectedFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateOccurrence = () => {
    if (!formDesc.trim()) {
      alert('Por favor, informe a descrição dos fatos.');
      return;
    }
    const foundStudent = STUDENTS.find(s => s.name === formStudent);
    const newOcc: OccurrenceItem = {
      id: `occ-${Date.now()}`,
      studentId: foundStudent?.registrationNumber || 'std-new',
      studentName: formStudent,
      className: '2º Ano A — Ensino Médio',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      category: formCategory,
      severity: formSeverity,
      description: formDesc,
      actionTaken: formAction || 'Registrado em diário de ocorrências e comunicado aos responsáveis.',
      parentAckStatus: 'pending',
    };
    setOccurrences(prev => [newOcc, ...prev]);
    setShowAddModal(false);
    setFormDesc('');
    setFormAction('');
    showToast(`Ocorrência registrada e notificação enviada ao Portal dos Pais!`);
  };

  const handleExportCSV = () => {
    const headers = 'ID,Aluno,Turma,Data,Hora,Categoria,Gravidade,Ciência da Família,Assinado Por\n';
    const rows = occurrences.map(o =>
      `"${o.id}","${o.studentName}","${o.className}","${o.date}","${o.time}","${o.category}","${o.severity}","${o.parentAckStatus === 'signed' ? 'Sim' : 'Pendente'}","${o.parentSignedBy || 'N/A'}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ocorrencias_Colegio_Visao_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Dossiê de ocorrências exportado em CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
          <div className="af-toast">
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Command Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="text-indigo-400" /> Registro de Ocorrências & Ciência Familiar (SigaWeb)
          </h2>
          <span className="text-xs text-dim">
            Acompanhamento disciplinar, atrasos, mérito pedagógico e assinatura digital dos responsáveis legais.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="af-btn ghost" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Exportar Dossiê CSV</span>
          </button>
          <button className="af-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={15} />
            <span>Nova Ocorrência</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs de Ocorrências */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-xl">
          <span className="text-xs text-dim font-bold block">TOTAL NO BIMESTRE</span>
          <span className="text-xl font-bold text-slate-100">{occurrences.length} Registros</span>
          <span className="text-xs text-dim block mt-1">Geral da coordenação</span>
        </div>
        <div className="glass p-4 rounded-xl">
          <span className="text-xs text-dim font-bold block">PENDENTES DE CIÊNCIA</span>
          <span className="text-xl font-bold text-yellow-400">
            {occurrences.filter(o => o.parentAckStatus === 'pending').length} Ocorrências
          </span>
          <span className="text-xs text-dim block mt-1">Aguardando assinatura dos pais</span>
        </div>
        <div className="glass p-4 rounded-xl">
          <span className="text-xs text-dim font-bold block">CIÊNCIA CONFIRMADA</span>
          <span className="text-xl font-bold text-emerald-400">
            {occurrences.filter(o => o.parentAckStatus === 'signed').length} Assinadas
          </span>
          <span className="text-xs text-dim block mt-1">Assinatura digital ICP-Brasil</span>
        </div>
        <div className="glass p-4 rounded-xl">
          <span className="text-xs text-dim font-bold block">ELOGIOS DE MÉRITO</span>
          <span className="text-xl font-bold text-purple-400">
            {occurrences.filter(o => o.category === 'merito').length} Concedidos
          </span>
          <span className="text-xs text-dim block mt-1">Reconhecimento positivo</span>
        </div>
      </div>

      {/* Search and Filter Strip */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2">
          <Search size={16} className="text-dim" />
          <input
            className="bg-transparent border-none text-white text-sm outline-none w-full"
            placeholder="Buscar por aluno ou descrição da ocorrência..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: '⚠️ Pendentes de Ciência' },
            { id: 'signed', label: '✓ Assinadas pelos Pais' },
            { id: 'merito', label: '⭐ Elogios de Mérito' },
            { id: 'atraso', label: 'Atrasos' },
          ].map(f => (
            <button
              key={f.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFilter === f.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
              onClick={() => setSelectedFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Ocorrências */}
      <div className="glass rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-left text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs text-dim font-bold">
              <th className="p-3">DATA / HORA</th>
              <th className="p-3">ALUNO / TURMA</th>
              <th className="p-3">CATEGORIA & GRAVIDADE</th>
              <th className="p-3">RELATO DOS FATOS & PROVIDÊNCIAS</th>
              <th className="p-3">CIÊNCIA DA FAMÍLIA</th>
            </tr>
          </thead>
          <tbody>
            {filteredOccurrences.map(occ => (
              <tr key={occ.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3 text-xs text-dim" style={{ width: 100 }}>
                  <span className="block font-mono text-white">{occ.date}</span>
                  <span>{occ.time}</span>
                </td>
                <td className="p-3" style={{ width: 220 }}>
                  <strong className="block text-white">{occ.studentName}</strong>
                  <span className="text-xs text-dim">{occ.className}</span>
                </td>
                <td className="p-3" style={{ width: 170 }}>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold inline-block ${
                      occ.category === 'merito' ? 'bg-purple-500/20 text-purple-400'
                        : occ.category === 'disciplinar' ? 'bg-red-500/20 text-red-400'
                        : occ.category === 'atraso' ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {occ.category.toUpperCase()}
                    </span>
                    <span className="text-xs text-dim">
                      Gravidade: <strong>{occ.severity.toUpperCase()}</strong>
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <p className="text-slate-200 text-xs mb-1 leading-relaxed">{occ.description}</p>
                  <p className="text-dim text-xs">
                    <strong>Ação da Coordenação:</strong> {occ.actionTaken}
                  </p>
                </td>
                <td className="p-3" style={{ width: 210 }}>
                  {occ.parentAckStatus === 'signed' ? (
                    <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-2 rounded-lg">
                      <div className="flex items-center gap-1 font-bold text-emerald-400">
                        <CheckCircle2 size={13} />
                        <span>Ciência Assinada</span>
                      </div>
                      <span className="block text-dim mt-0.5">{occ.parentSignedBy}</span>
                      <span className="block text-dim text-[10px]">{occ.parentSignedAt}</span>
                    </div>
                  ) : (
                    <div className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 p-2 rounded-lg">
                      <div className="flex items-center gap-1 font-bold text-yellow-400">
                        <Clock size={13} />
                        <span>Aguardando Ciência</span>
                      </div>
                      <span className="block text-dim mt-0.5">Notificação enviada ao portal</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE NOVA OCORRÊNCIA */}
      {showAddModal && (
        <div className="af-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="af-modal-card" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <div className="af-modal-title-group">
                <div className="af-modal-icon-badge" style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.35)' }}>
                  <Shield size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Registrar Ocorrência Disciplinar ou Pedagógica</h3>
                  <span className="af-sub" style={{ margin: 0 }}>Notificação e ciência eletrônica enviada aos pais</span>
                </div>
              </div>
              <button className="af-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="af-modal-body">
              <div className="af-form-grid">
                <div className="af-form-field">
                  <label>Estudante</label>
                  <select
                    className="af-select"
                    value={formStudent}
                    onChange={e => setFormStudent(e.target.value)}
                  >
                    {STUDENTS.slice(0, 30).map(s => (
                      <option key={s.registrationNumber || s.name} value={s.name}>
                        {s.name} ({s.classId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="af-form-field">
                  <label>Categoria da Ocorrência</label>
                  <select
                    className="af-select"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                  >
                    <option value="pedagogica">Pedagógica / Tarefas não entregues</option>
                    <option value="atraso">Atraso / Pontualidade</option>
                    <option value="celular">Uso Indevido de Aparelho Eletrônico</option>
                    <option value="uniforme">Uniforme Escolar Incompleto</option>
                    <option value="disciplinar">Comportamental / Disciplinar</option>
                    <option value="merito">Elogio & Reconhecimento de Mérito</option>
                  </select>
                </div>
              </div>

              <div className="af-form-field">
                <label>Nível de Gravidade</label>
                <select
                  className="af-select"
                  value={formSeverity}
                  onChange={e => setFormSeverity(e.target.value as any)}
                >
                  <option value="leve">Leve (Registro Informativo / Sem sanção)</option>
                  <option value="media">Média (Advertência Verbal / Orientação)</option>
                  <option value="grave">Grave (Convocação Presencial da Família)</option>
                  <option value="merito">Mérito (Reconhecimento Positivo / Certificado)</option>
                </select>
              </div>

              <div className="af-form-field">
                <label>Descrição dos Fatos (Relato Circunstanciado)</label>
                <textarea
                  className="af-textarea"
                  rows={3}
                  placeholder="Descreva de forma factual e objetiva o ocorrido em sala ou ambiente escolar..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              <div className="af-form-field">
                <label>Providência Adotada pela Coordenação</label>
                <input
                  className="af-input"
                  placeholder="Ex: Orientação individual, encaminhamento ao Córtex ou plano de recuperação..."
                  value={formAction}
                  onChange={e => setFormAction(e.target.value)}
                />
              </div>
            </div>

            <div className="af-modal-footer">
              <button className="af-btn ghost" onClick={() => setShowAddModal(false)}>
                Cancelar
              </button>
              <button className="af-btn" onClick={handleCreateOccurrence}>
                <Check size={16} />
                <span>Salvar & Notificar Pais</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
