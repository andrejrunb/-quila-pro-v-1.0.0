import React, { useState, useEffect } from 'react';
import { 
  Bell, Filter, Search, Calendar, User, 
  SlidersHorizontal, Trash2, CheckCircle, 
  AlertTriangle, Info, ArrowLeft, Clock, Eye, X
} from 'lucide-react';
import './AlertsPage.css';

interface Alert {
  id: string;
  type: 'UNAUTHORIZED_EXIT' | 'ENTRY_CONFIRMATION' | 'ABSENCE_NOTICE';
  student_name: string;
  student_id: string;
  zone: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'failed';
  parentPhone?: string;
  proofPath?: string;
}

interface AlertsPageProps {
  onBack: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onBack }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNAUTHORIZED_EXIT' | 'ENTRY_CONFIRMATION'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const aquila = (window as any).aquila;
      const data = await aquila.invoke('get-alerts');
      setAlerts(data || []);
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'ALL' || alert.type === filter;
    const matchesSearch = alert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          alert.student_id.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container alerts-page-container">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button className="header-btn" onClick={onBack} title="Voltar ao Dashboard">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-gradient">Central de Alertas</h1>
            <p className="text-dim text-xs uppercase font-bold tracking-widest mt-1">Eagle Monitoring Outbox</p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <Search size={16} className="text-dim" />
              <input 
                type="text" 
                placeholder="Filtrar Aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white w-32"
              />
           </div>
        </div>
      </header>

      <div className="alerts-filter-bar">
        <button 
          onClick={() => setFilter('ALL')}
          className={`px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-secondary text-white' : 'bg-white/5 text-dim border border-white/5'}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilter('UNAUTHORIZED_EXIT')}
          className={`px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${filter === 'UNAUTHORIZED_EXIT' ? 'bg-danger text-white' : 'bg-white/5 text-dim border border-white/5'}`}
        >
          Saídas Críticas
        </button>
        <button 
          onClick={() => setFilter('ENTRY_CONFIRMATION')}
          className={`px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${filter === 'ENTRY_CONFIRMATION' ? 'bg-success text-white' : 'bg-white/5 text-dim border border-white/5'}`}
        >
          Presença Confirmada
        </button>
      </div>

      <div className="alert-card-grid">
        {isLoading ? (
          <div className="text-center py-20 uppercase text-[10px] font-bold text-dim tracking-widest">Sincronizando Alertas...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="glass-card p-20 text-center">
            <Bell size={48} className="mx-auto opacity-10 mb-4" />
            <p className="text-dim uppercase font-bold text-xs">Nenhum registro de notificação encontrado.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div key={alert.id} className="alert-entry animate-fade-in">
              <span className={`alert-type-badge ${
                alert.type === 'UNAUTHORIZED_EXIT' ? 'type-exit' : 
                alert.type === 'ENTRY_CONFIRMATION' ? 'type-entry' : 'type-default'
              }`}>
                {alert.type === 'UNAUTHORIZED_EXIT' ? 'Saída' : alert.type === 'ENTRY_CONFIRMATION' ? 'Entrada' : 'Aviso'}
              </span>
              
              <div className="alert-student-info">
                <span className="alert-student-name">{alert.student_name}</span>
                <span className="alert-student-id">RA: {alert.student_id}</span>
              </div>

              <div className="alert-timestamp">
                <Clock size={12} className="text-dim" />
                {new Date(alert.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>

              <div className="alert-whatsapp-status">
                <div className={`status-indicator ${
                  alert.status === 'sent' ? 'status-sent' : 
                  alert.status === 'failed' ? 'status-failed' : 'status-pending'
                }`} />
                <span className="font-bold text-[10px] uppercase">{alert.status}</span>
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  className="btn-icon" 
                  onClick={() => setSelectedAlert(alert)}
                  title="Ver Evidência"
                >
                  <Eye size={16} />
                </button>
                <button className="btn-icon delete" title="Remover Log">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedAlert && (
        <div className="evidence-modal animate-fade-in">
          <div className="evidence-content">
            <div className="evidence-header">
              <h3 className="font-black uppercase text-xs tracking-widest">Evidência de IA: {selectedAlert.student_name}</h3>
              <button onClick={() => setSelectedAlert(null)} className="btn-icon" title="Fechar Mídia"><X size={18} /></button>
            </div>
            <div className="evidence-body">
              {selectedAlert.proofPath ? (
                <img src={`file://${selectedAlert.proofPath}`} alt="Monitoramento" className="evidence-image" />
              ) : (
                <div className="py-20 text-dim italic text-sm">Nenhuma evidência visual capturada pelo Eagle Eye.</div>
              )}
              <div className="w-full bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-dim font-bold uppercase">Zona de Captura</p>
                  <p className="text-sm font-bold text-secondary">{selectedAlert.zone || 'Pátio Central'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-dim font-bold uppercase">Status de Envio</p>
                  <p className="text-sm font-bold text-success capitalize">{selectedAlert.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
