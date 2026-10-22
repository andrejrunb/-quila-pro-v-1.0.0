import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Check, RefreshCw, AlertCircle } from 'lucide-react';
import './IntelligencePulse.css';

interface Insight {
  id: string;
  category: string;
  content: string;
  relevance: number;
  legal_basis?: string;
  created_at: string;
}

export const IntelligencePulse: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchInsights = async () => {
    const win = window as any;
    if (win.aquila) {
      setLoading(true);
      try {
        const result = await win.aquila.invoke('intelligence:get-pending');
        setInsights(result || []);
      } catch (err) {
        console.error('Error fetching insights:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleRunSynthesis = async () => {
    const win = window as any;
    if (win.aquila && !syncing) {
      setSyncing(true);
      try {
        await win.aquila.invoke('intelligence:run-synthesis');
        await fetchInsights();
      } catch (err) {
        console.error('Error running synthesis:', err);
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleApprove = async (id: string) => {
    const win = window as any;
    if (win.aquila) {
      try {
        await win.aquila.invoke('intelligence:approve', id);
        setInsights(prev => prev.filter(i => i.id !== id));
      } catch (err) {
        console.error('Error approving insight:', err);
      }
    }
  };

  if (loading && insights.length === 0) {
    return (
      <div className="intelligence-pulse loading">
        <div className="pulse-header">
          <div className="pulse-title">
            <div className="pulse-icon-wrapper">
              <Brain size={20} color="#fff" />
            </div>
            <span>Soberania Cognitiva</span>
          </div>
        </div>
        <div className="empty-pulse">Sintonizando frequências operacionais...</div>
      </div>
    );
  }

  return (
    <div className="intelligence-pulse">
      <div className="pulse-header">
        <div className="pulse-title">
          <div className="pulse-icon-wrapper">
            <Brain size={20} color="#fff" />
          </div>
          <span>Soberania Cognitiva</span>
          <Sparkles size={16} color="#fbbf24" className="pulse-sparkle" />
        </div>
        <div className="pulse-actions">
          <button 
            className="btn-pulse-trigger" 
            onClick={handleRunSynthesis}
            disabled={syncing}
          >
            <RefreshCw size={14} className={syncing ? 'spinning' : ''} />
            {syncing ? 'Sintetizando...' : 'Novo Ciclo'}
          </button>
        </div>
      </div>

      <div className="pulse-body">
        {insights.length > 0 ? (
          insights.map(insight => (
            <div key={insight.id} className="insight-card">
              <div className="insight-category">{insight.category}</div>
              <div className="insight-content">{insight.content}</div>
              
              {insight.legal_basis && (
                <div className="insight-legal-basis">
                  <div className="legal-header">
                    <Shield size={10} />
                    Amparo Legal (Sovereign Vault)
                  </div>
                  <div className="legal-item">
                    {insight.legal_basis}
                  </div>
                </div>
              )}

              <div className="insight-meta">
                <span className="insight-date">
                  {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                </span>
                <button 
                  className="btn-approve"
                  onClick={() => handleApprove(insight.id)}
                >
                  <Check size={14} style={{ marginRight: '6px' }} />
                  Aprovar e Integrar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-pulse">
            <div style={{ marginBottom: '12px', opacity: 0.5 }}>
              <AlertCircle size={32} style={{ margin: '0 auto' }} />
            </div>
            Nenhum insight pendente. O sistema está em equilíbrio.
          </div>
        )}
      </div>
    </div>
  );
};
