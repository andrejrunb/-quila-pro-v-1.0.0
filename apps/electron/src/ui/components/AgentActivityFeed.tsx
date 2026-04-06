import React, { useState, useEffect } from 'react';
import { 
  Bot, ArrowRight, Zap, 
  CheckCircle2, Loader2, BrainCircuit
} from 'lucide-react';
import { agentOrchestratorService } from '../../services/AgentOrchestratorService';
import { AgentTask } from '../../services/AgentDefinitions';
import './AgentActivityFeed.css';

/**
 * AgentActivityFeed (v1636)
 * Mostra a colaboração em tempo real entre os 9 agentes do sistema.
 */
export const AgentActivityFeed: React.FC = () => {
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [history, setHistory] = useState<AgentTask[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTasks([...agentOrchestratorService.getActiveTasks()]);
      setHistory([...agentOrchestratorService.getRecentActivity()]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="agent-activity-container">
      <header className="feed-header">
         <div className="flex items-center gap-2">
            <BrainCircuit size={20} className="text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-widest">Orquestração Multi-Agente</h3>
         </div>
         <div className="agent-status-badges">
            <span className="badge active">9 AGENTES ON-LINE</span>
         </div>
      </header>

      <div className="feed-content">
         {/* Tarefas Ativas (Pensamento) */}
         {activeTasks.length > 0 && (
            <div className="active-tasks-section mb-6">
               <h4 className="section-label">PROCESSANDO AGORA</h4>
               <div className="space-y-2">
                  {activeTasks.map(task => (
                     <div key={task.id} className="agent-chip active">
                        <div className="agent-route">
                           <span className="role">{task.from}</span>
                           <ArrowRight size={12} />
                           <span className="role">{task.to}</span>
                        </div>
                        <p className="task-desc">{task.description}</p>
                        <Loader2 size={14} className="animate-spin text-blue-500" />
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Histórico Recente (Ações Concluídas) */}
         <div className="history-section">
            <h4 className="section-label">AÇÕES CONCLUÍDAS</h4>
            <div className="space-y-2">
               {history.map(task => (
                  <div key={task.id} className="agent-chip completed">
                     <div className="agent-route">
                        <span className="role">{task.from}</span>
                        <ArrowRight size={12} />
                        <span className="role">{task.to}</span>
                        <CheckCircle2 size={12} className="text-green-500 ml-auto" />
                     </div>
                     <p className="task-desc">{task.description}</p>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
