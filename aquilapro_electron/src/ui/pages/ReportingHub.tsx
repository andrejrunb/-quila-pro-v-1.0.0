import React, { useState, useEffect } from 'react';
import { 
  FileText, Filter, Download, User, Calendar, 
  AlertTriangle, TrendingUp, Smartphone, Clock, 
  ChevronDown, Search, Layout, ArrowLeft, Send, X, BarChart3, PieChart
} from 'lucide-react';
import './ReportingHub.css';

interface Period {
  id: string;
  name: string;
  type: string;
  active: number;
}

interface StudentReportRow {
  id: string;
  name: string;
  classId: string;
  className: string;
  frequency: number;
  lates: number;
  loiteringEvents: number;
  cellphoneEvents: number;
  behaviorScore: number;
}

interface ReportingHubProps {
  onBack: () => void;
  userRole: string;
  userCoordinationId: string | null;
}

const UsageBar: React.FC<{ value: number }> = ({ value }) => {
  const barRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--usage-width', `${Math.min(value * 5, 100)}%`);
    }
  }, [value]);

  return (
    <div className="usage-bar">
      <div ref={barRef} className="usage-fill bg-warning" />
    </div>
  );
};

export const ReportingHub: React.FC<ReportingHubProps> = ({ onBack, userRole, userCoordinationId }) => {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [coordinations, setCoordinations] = useState<any[]>([]);
  const [selectedCoord, setSelectedCoord] = useState<string>(userCoordinationId || '');
  const [students, setStudents] = useState<StudentReportRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showBoletimModal, setShowBoletimModal] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const aquila = (window as any).aquila;
      const [pRes, cRes] = await Promise.all([
        aquila.getAcademicPeriods(),
        aquila.getCoordinations()
      ]);
      setPeriods(pRes || []);
      setCoordinations(cRes || []);
      if (pRes && pRes.length > 0) {
        const active = pRes.find((p: Period) => p.active === 1) || pRes[0];
        setSelectedPeriod(active.id);
      }
      
      // Mock data for integrated behavior tracking
      setStudents([
        { id: '1', name: 'Lucas Bertuzzi', classId: 'A', className: '1º Ano A', frequency: 98, lates: 2, loiteringEvents: 1, cellphoneEvents: 0, behaviorScore: 95 },
        { id: '2', name: 'Ana Oliveira', classId: 'A', className: '1º Ano A', frequency: 85, lates: 5, loiteringEvents: 12, cellphoneEvents: 3, behaviorScore: 72 },
        { id: '3', name: 'Rafael Souza', classId: 'B', className: '2º Ano B', frequency: 99, lates: 0, loiteringEvents: 0, cellphoneEvents: 1, behaviorScore: 98 },
        { id: '4', name: 'Juliana Lima', classId: 'B', className: '2º Ano B', frequency: 70, lates: 15, loiteringEvents: 25, cellphoneEvents: 8, behaviorScore: 45 },
      ]);
    } catch (error) {
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container reporting-hub-container">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button className="header-btn" onClick={onBack} title="Voltar ao Painel">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-gradient">Hub de Boletins IA</h1>
            <p className="text-dim text-xs uppercase font-bold tracking-widest mt-1">Sintetização Comportamental Biometrizada</p>
          </div>
        </div>
        <div className="flex gap-4">
           <button 
              className="btn-icon" 
              title="Exportar Excel Corporativo"
              onClick={() => (window as any).aquila.generateAttendanceReport(selectedPeriod, 'all', 'excel')}
           >
              <Download size={18} />
           </button>
           <button 
              className="header-btn bg-secondary text-white border-none"
              onClick={() => (window as any).aquila.generateAttendanceReport(selectedPeriod, 'all', 'pdf')}
           >
              Gerar Lote PDF
           </button>
        </div>
      </header>

      <section className="report-controls">
        <div className="form-group">
          <label htmlFor="academic-period">Período Acadêmico</label>
          <select id="academic-period" title="Período Acadêmico" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        
        {userRole === 'director' && (
          <div className="form-group">
            <label htmlFor="coordination">Coordenação</label>
            <select id="coordination" title="Coordenação" value={selectedCoord} onChange={e => setSelectedCoord(e.target.value)}>
              <option value="">Todas as Unidades</option>
              {coordinations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div className="form-group col-span-2">
          <label>Busca Rápida de Aluno</label>
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <Search size={14} className="text-dim" />
            <input 
              type="text"
              placeholder="Nome do Aluno..."
              className="bg-transparent border-none outline-none text-xs text-white w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Widgets de BI Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-blue-400" size={20} />
            <h3 className="font-bold text-sm">Frequência Global</h3>
          </div>
          <div className="text-3xl font-black text-white">92.4%</div>
          <div className="text-[10px] text-blue-400 font-bold mt-1">↑ 2.1% em relação ao mês anterior</div>
        </div>
        
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="text-purple-400" size={20} />
            <h3 className="font-bold text-sm">Alertas Comportamentais</h3>
          </div>
          <div className="text-3xl font-black text-white">12</div>
          <div className="text-[10px] text-purple-400 font-bold mt-1">Incidentes detectados via Visão IA</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-green-400" size={20} />
            <h3 className="font-bold text-sm">Evolução Acadêmica</h3>
          </div>
          <div className="text-3xl font-black text-white">+8.5</div>
          <div className="text-[10px] text-green-400 font-bold mt-1">Média de pontos de engajamento</div>
        </div>
      </div>

      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>Aluno / Turma</th>
              <th className="text-center">Frequência</th>
              <th className="text-center">Loitering</th>
              <th className="text-center">📵 Celular</th>
              <th className="text-center">Behavior Index</th>
              <th className="text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id} className="report-row">
                <td>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                      <User size={18} className="text-secondary" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{student.name}</div>
                      <div className="text-[10px] text-dim uppercase font-black">{student.className}</div>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                   <span className={`score-indicator ${student.frequency >= 90 ? 'score-high' : 'score-mid'}`}>
                    {student.frequency}%
                   </span>
                </td>
                <td className="text-center">
                  <div className="flex flex-col items-center">
                      <span className="font-black text-xs text-white">{student.loiteringEvents}x</span>
                      <UsageBar value={student.loiteringEvents} />
                  </div>
                </td>
                <td className="text-center">
                   <div className="flex flex-col items-center">
                      <Smartphone size={14} className={student.cellphoneEvents > 0 ? 'text-danger' : 'text-dim'} />
                      <span className="text-[10px] font-bold mt-1">{student.cellphoneEvents}</span>
                   </div>
                </td>
                <td className="text-center">
                  <div className="inline-flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/5 gap-3">
                      <TrendingUp size={14} className={student.behaviorScore > 80 ? 'text-success' : 'text-danger'} />
                      <span className="font-black text-sm">{student.behaviorScore}</span>
                  </div>
                </td>
                <td className="text-right">
                  <button 
                      onClick={() => setShowBoletimModal(student.id)}
                      className="header-btn px-4 py-1.5 text-[10px]"
                  >
                    BOLETIM AI
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBoletimModal && (
          <div className="boletim-modal animate-fade-in">
              <div className="boletim-content">
                  <div className="evidence-header bg-secondary">
                      <h3 className="font-black uppercase text-xs tracking-widest text-white">Consolidado Comportamental Áquila AI</h3>
                      <button onClick={() => setShowBoletimModal(null)} title="Fechar Boletim" className="btn-icon bg-black/20"><X size={18} /></button>
                  </div>

                  <div className="p-10">
                      <div className="flex items-start gap-6 mb-8">
                           <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                              <User size={32} className="text-secondary" />
                           </div>
                           <div>
                              <h3 className="text-2xl font-black italic text-white tracking-tighter">BOLETIM PERIÓDICO</h3>
                              <p className="text-dim font-bold uppercase tracking-widest text-[10px] mt-1">Estudante: {students.find(s => s.id === showBoletimModal)?.name}</p>
                              <p className="text-[10px] text-secondary font-mono mt-1">Processamento Neural: {periods.find(p => p.id === selectedPeriod)?.name}</p>
                           </div>
                      </div>

                      <div className="boletim-grid-stats">
                          <div className="boletim-stat-card">
                              <Clock size={16} className="text-secondary mx-auto mb-2" />
                              <div className="text-[9px] uppercase text-dim font-black">Freq.</div>
                              <div className="text-lg font-black text-white">98.5%</div>
                          </div>
                          <div className="boletim-stat-card">
                              <AlertTriangle size={16} className="text-danger mx-auto mb-2" />
                              <div className="text-[9px] uppercase text-dim font-black">Atrasos</div>
                              <div className="text-lg font-black text-white">02</div>
                          </div>
                           <div className="boletim-stat-card">
                              <Smartphone size={16} className="text-secondary mx-auto mb-2" />
                              <div className="text-[9px] uppercase text-dim font-black">Cel.</div>
                              <div className="text-lg font-black text-white">Nulo</div>
                          </div>
                           <div className="boletim-stat-card">
                              <TrendingUp size={16} className="text-success mx-auto mb-2" />
                              <div className="text-[9px] uppercase text-dim font-black">Index</div>
                              <div className="text-lg font-black text-white">ALTO</div>
                          </div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                           <div className="text-[9px] font-black text-secondary uppercase tracking-widest mb-3 italic">Síntese de Inteligência Áquila</div>
                           <p className="text-dim leading-relaxed italic text-xs">
                              "O aluno demonstra excelente assiduidade. Não houve detecção de uso de dispositivos móveis em sala via visão computacional. Observou-se um leve aumento de tempo em zonas de transição (corredores) nas terças-feiras. Recomendamos reforço positivo."
                           </p>
                      </div>

                      <div className="flex gap-4 mt-8">
                           <button className="header-btn flex-1 p-3">
                              <Download size={16} /> Baixar PDF
                           </button>
                           <button className="header-btn flex-1 bg-secondary text-white border-0 p-3">
                              <Send size={16} /> Enviar aos Pais (WhatsApp)
                           </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ReportingHub;
