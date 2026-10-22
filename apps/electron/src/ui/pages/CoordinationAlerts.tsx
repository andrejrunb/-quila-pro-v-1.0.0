import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Search, Crosshair, Users, BrainCircuit } from 'lucide-react';
import './CoordinationAlerts.css'; // Será criado em breve ou vamos injetar inline para simplificar? Usarei inline minimalista padrão React.

interface RiskAlert {
  id: string;
  studentId: string;
  name: string;
  riskScore: number;
  factors: Array<{ factor: string, impact: number }>;
  actionProtocol: string;
  status: string;
}

export const CoordinationAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulação do fetch via IPC do DropoutRiskEngine
    // Na real: window.aquila.invoke('predictive:get-analytics') ou similar
    const loadAlerts = async () => {
      // Mock de dados para a UI
      setTimeout(() => {
        setAlerts([
          {
            id: 'risk_1',
            studentId: 'stu_1092',
            name: 'Lucas Almeida',
            riskScore: 82.5,
            factors: [
              { factor: 'attendance_drop', impact: 40 },
              { factor: 'grades_decline', impact: 20 },
              { factor: 'low_engagement', impact: 22.5 }
            ],
            actionProtocol: 'ALERTA_BUSCA_ATIVA',
            status: 'PENDING'
          },
          {
            id: 'risk_2',
            studentId: 'stu_441',
            name: 'Sofia Martins',
            riskScore: 76.0,
            factors: [
              { factor: 'tardiness_streak', impact: 15 },
              { factor: 'mood_deterioration', impact: 10 },
              { factor: 'attendance_drop', impact: 51 }
            ],
            actionProtocol: 'ALERTA_BUSCA_ATIVA',
            status: 'INTERVENTION_ONGOING'
          }
        ]);
        setIsLoading(false);
      }, 800);
    };
    loadAlerts();
  }, []);

  const handleAction = (alertId: string) => {
    alert(`Acionando Busca Ativa e plano pedagógico para alerta ${alertId}`);
    // Integração: window.aquila.invoke('eagle:send-push', ...) (Passo 209)
  };

  return (
    <div style={{ padding: '2rem', background: '#030712', minHeight: '100vh', color: '#f3f4f6' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #1f2937', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.8rem', margin: 0 }}>
            <Crosshair className="text-red-500" />
            Radar Anti-Evasão
          </h1>
          <p style={{ color: '#9ca3af', margin: '4px 0 0 0' }}>Sovereign Predictor • Nível de Risco >= 75%</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: '#111827', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #374151' }}>
            <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Casos Críticos</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{alerts.filter(a => a.riskScore >= 75).length}</div>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
          <BrainCircuit size={48} style={{ margin: '0 auto', animation: 'pulse 2s infinite' }} />
          <p style={{ marginTop: '1rem' }}>Processando malhas probabilísticas...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{ 
              background: '#111827', 
              border: `1px solid ${alert.riskScore >= 80 ? '#ef4444' : '#f59e0b'}`, 
              borderRadius: '12px', 
              padding: '1.5rem',
              boxShadow: alert.riskScore >= 80 ? '0 0 15px rgba(239, 68, 68, 0.1)' : 'none'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{alert.name}</h3>
                  <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>RA: {alert.studentId}</span>
                </div>
                <div style={{ 
                  background: alert.riskScore >= 80 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: alert.riskScore >= 80 ? '#ef4444' : '#f59e0b',
                  padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.2rem'
                }}>
                  {alert.riskScore.toFixed(1)}%
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', borderBottom: '1px solid #1f2937', paddingBottom: '4px', marginBottom: '8px' }}>Fatores de Evasão (NPU)</h4>
                {alert.factors.map(f => (
                  <div key={f.factor} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span>{f.factor.replace('_', ' ').toUpperCase()}</span>
                    <span style={{ color: '#ef4444' }}>+{f.impact.toFixed(1)} pts</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleAction(alert.id)}
                  style={{ 
                    flex: 1, padding: '0.75rem', background: '#3b82f6', color: 'white', 
                    border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                  }}>
                  <AlertTriangle size={16} /> Intervir Agora
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoordinationAlerts;
