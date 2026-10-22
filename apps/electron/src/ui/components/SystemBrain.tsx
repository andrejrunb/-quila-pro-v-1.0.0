import React, { useState } from 'react';
import { Brain, Sparkles, AlertTriangle, Terminal, Zap } from 'lucide-react';

/**
 * SystemBrain - Painel de Meta-Evolução do Córtex
 * Onde o sistema analisa sua própria arquitetura e sugere otimizações "Goose-style".
 */
export const SystemBrain: React.FC = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [auditResult, setAuditResult] = useState<{ suggestions: string[], alerts: string[] } | null>(null);

    const triggerMetaEvolve = async () => {
        setAnalyzing(true);
        // Simulação de chamada ao CortexEvolutionService.metaEvolveSystem()
        // Em produção, isso passaria via IPC
        setTimeout(() => {
            setAuditResult({
                suggestions: [
                    'Refatorar MeshGateway para suporte ONVIF Nativo (Rust)',
                    'Otimizar NPU Buffer para reconstrução 3D Lyra',
                    'Implementar Vector Cache para Reconhecimento Facial'
                ],
                alerts: [
                    'NPU Load crítico (92%) no nó local',
                    'Latência de IPC detectada entre Main e Renderer'
                ]
            });
            setAnalyzing(false);
        }, 2000);
    };

    return (
        <div className="system-brain-card" style={{ 
            background: 'rgba(15, 23, 42, 0.8)', 
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2rem',
            color: 'white'
        }}>
            <div className="brain-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Brain className="text-blue-400" size={32} />
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Córtex Evolver</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Sovereign AI Meta-Intelligence</p>
                    </div>
                </div>
                <button 
                    onClick={triggerMetaEvolve}
                    disabled={analyzing}
                    style={{ 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                    }}
                >
                    {analyzing ? <Zap className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {analyzing ? 'Analisando Arquitetura...' : 'Iniciar Meta-Auditoria'}
                </button>
            </div>

            {auditResult && (
                <div className="audit-results" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', animation: 'fadeIn 0.5s ease' }}>
                    <div className="suggestions-panel" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', marginBottom: '1rem' }}>
                            <Terminal size={18} /> Otimizações Sugeridas
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {auditResult.suggestions.map((s, i) => (
                                <li key={i} style={{ padding: '8px 0', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                                    • {s}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="alerts-panel" style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', marginBottom: '1rem' }}>
                            <AlertTriangle size={18} /> Alertas de Performance
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {auditResult.alerts.map((a, i) => (
                                <li key={i} style={{ padding: '8px 0', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fca5a5' }}>
                                    ⚠️ {a}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
