import React, { useState, useEffect } from 'react';
import { 
  FileText, Filter, Download, User, Calendar, 
  AlertTriangle, TrendingUp, Smartphone, Clock, 
  ChevronDown, Search, Layout, ArrowLeft, Send, X, BarChart3, PieChart
} from 'lucide-react';
import AcademicReportCard from '../components/AcademicReportCard';
import type { ReportCardStudent } from '../components/AcademicReportCard';
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
  const [showBoletimModal, setShowBoletimModal] = useState<ReportCardStudent | null>(null);

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
      
      // Fetch real student metrics from database
      const metrics = await aquila.getBehavioralMetrics();
      setStudents(metrics || []);
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
                      onClick={() => setShowBoletimModal({
                        id: student.id,
                        name: student.name,
                        className: student.className,
                        period: periods.find(p => p.id === selectedPeriod)?.name,
                      })}
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
        <AcademicReportCard
          student={showBoletimModal}
          onClose={() => setShowBoletimModal(null)}
        />
      )}
    </div>
  );
};

export default ReportingHub;
