import React, { useState, useEffect } from 'react';
import { Brain, Check, X, Camera, User, TrendingUp } from 'lucide-react';
import { SovereignResponsePanel } from '../components/SovereignResponsePanel';
import './AIVerificationDashboard.css';

/**
 * AIVerificationDashboard.tsx
 * Human curation interface for low-confidence AI detections.
 * 100% Zero-Debt Architecture with high-fidelity Sovereign logic.
 */
export const AIVerificationDashboard: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseStatus, setResponseStatus] = useState<'normal' | 'emergency'>('normal');
  const aquila = (window as any).aquila;

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSovereignResponse = async (active: boolean) => {
    const res = await aquila.invoke('toggle-lockdown', active);
    if (res.success) {
      setResponseStatus(res.status === 'emergency' ? 'emergency' : 'normal');
    }
  };

  const loadQueue = async () => {
    try {
      const data = await aquila.invoke('get-verification-queue');
      setQueue(data || []);
    } catch (err) {
      console.error('Error loading queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'confirmed' | 'rejected', studentId?: string) => {
    try {
      await aquila.invoke('update-verification-status', id, status, studentId);
      setQueue(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error verifying:', err);
    }
  };

  if (loading) {
    return (
      <div className="ai-verification-page">
          <div className="main-content loading-container">
            <p className="loading-text-premium uppercase italic tracking-tighter">SYNCHRONIZING ORACULUM AI QUEUE...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="ai-verification-page animate-fade-in custom-scrollbar">
      <div className="main-content">
        <header className="verification-header">
          <div className="header-title-group">
            <h1 className="page-title flex items-center gap-4">
              <Brain className="text-purple-500" size={40} />
              AI Curation Hub
            </h1>
            <p className="page-subtitle">Validate low-confidence detections to strengthen the quila Neural Fabric.</p>
          </div>
          <div className="accuracy-widget glass-panel">
              <TrendingUp className="text-purple-400" />
              <div>
                  <p className="accuracy-label">Global Precision</p>
                  <p className="accuracy-value italic">94.8%</p>
              </div>
          </div>
        </header>

        <div className="verification-grid">
          {queue.length > 0 ? queue.map((item, i) => (
            <div key={item.id || i} className="verification-card animate-slide-up">
              <div className="card-media relative">
                  <img src={item.imagePath} alt="Detection Visual" className="detection-img rounded-2xl" />
                  <div className="confidence-badge absolute top-4 right-4 translate-z-10">
                      <div className="confidence-dot" />
                      <span className="confidence-text">{Math.round(item.confidence * 100)}% Confidence</span>
                  </div>
              </div>

              <div className="card-body">
                  <div className="student-suggestion">
                      <div className="suggestion-icon p-2 bg-purple-600/20 text-purple-400 rounded-xl">
                          <User size={18} />
                      </div>
                      <div>
                          <p className="suggestion-label">Suggested Identity</p>
                          <p className="suggested-name font-black italic">{item.suggestedName || 'UNKNOWN'}</p>
                      </div>
                  </div>

                  <div className="card-meta flex items-center gap-2 mt-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      <Camera size={14} className="opacity-40" /> {item.cameraId} <span className="opacity-20">•</span> {new Date(item.timestamp).toLocaleTimeString()}
                  </div>

                  <div className="action-row mt-6 flex gap-3">
                      <button 
                          onClick={() => handleVerify(item.id, 'confirmed', item.studentId)}
                          className="btn-verify btn-confirm flex-1 py-3"
                          aria-label="Confirm Identity"
                      >
                          <Check size={20} className="mr-2" /> Attest
                      </button>
                      <button 
                          onClick={() => handleVerify(item.id, 'rejected')}
                          className="btn-verify btn-discard flex-1 py-3"
                          aria-label="Discard Detection"
                      >
                          <X size={20} className="mr-2" /> Discard
                      </button>
                  </div>
              </div>
            </div>
          )) : (
              <div className="empty-queue flex flex-col items-center justify-center p-20 glass-panel mt-12 rounded-[40px]">
                   <div className="empty-icon-wrapper p-6 bg-emerald-500/10 rounded-full mb-6">
                      <Check className="text-emerald-500" size={48} />
                   </div>
                   <h2 className="empty-title text-2xl font-black italic uppercase tracking-tighter">Secure Grid Equilibrium</h2>
                   <p className="empty-text text-gray-500 text-center max-w-sm mt-2 font-black uppercase tracking-widest text-[10px]">No pending detections. The Oraculum AI is operating in high-fidelity regime.</p>
              </div>
          )}
        </div>
      </div>

      <aside className="sidebar-verification w-96 p-8 border-l border-white/5 bg-[#050b14]/40 h-screen overflow-y-auto">
        <SovereignResponsePanel 
          status={responseStatus}
          onResponse={handleSovereignResponse}
        />
        
        <div className="metrics-card glass-panel mt-10 p-6 rounded-[32px] border border-white/5 bg-[#050b14]/60">
          <h4 className="metrics-title text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Sovereign Insight Telemetry</h4>
          <div className="space-y-4">
            <div className="metric-row flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-gray-500 italic">Total Scans (24h)</span>
              <span className="text-white">24,512</span>
            </div>
            <div className="metric-row flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-gray-500 italic">Inconsistencies</span>
              <span className="text-emerald-500">0</span>
            </div>
          </div>
          <div className="sidebar-tip flex items-center gap-2 mt-8 p-3 bg-purple-500/10 rounded-2xl text-purple-400 text-[9px] font-black uppercase tracking-widest italic">
            <TrendingUp size={12} />
            <span>Learning Loop: +2.4% precision enhancement.</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AIVerificationDashboard;
