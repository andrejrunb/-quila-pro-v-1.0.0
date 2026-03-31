import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Eye, Lock, FileText, Download, AlertCircle, Trash2 } from 'lucide-react';
import './LgpdCompliance.css';

interface ConsentLog {
  id: string;
  studentId: string;
  type: 'biometric' | 'photo' | 'cloud_sync';
  status: 'granted' | 'revoked' | 'pending';
  timestamp: string;
}

const StatBar: React.FC<{ granted: number, revoked: number, pending: number }> = ({ granted, revoked, pending }) => {
  const grantedRef = useRef<HTMLDivElement>(null);
  const revokedRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = 450;
    if (grantedRef.current) grantedRef.current.style.width = `${(granted / total) * 100}%`;
    if (revokedRef.current) revokedRef.current.style.width = `${(revoked / total) * 100}%`;
    if (pendingRef.current) pendingRef.current.style.width = `${(pending / total) * 100}%`;
  }, [granted, revoked, pending]);

  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
       <div ref={grantedRef} className="h-full bg-green-500" />
       <div ref={revokedRef} className="h-full bg-red-500" />
       <div ref={pendingRef} className="h-full bg-blue-500" />
    </div>
  );
};

export const LgpdCompliance: React.FC = () => {
  const [logs] = useState<ConsentLog[]>([
    { id: 'log_001', studentId: 'std_042', type: 'biometric', status: 'granted', timestamp: '2026-03-20 14:22' },
    { id: 'log_002', studentId: 'std_115', type: 'photo', status: 'revoked', timestamp: '2026-03-21 09:15' },
    { id: 'log_003', studentId: 'std_089', type: 'cloud_sync', status: 'pending', timestamp: '2026-03-22 11:45' },
    { id: 'log_004', studentId: 'std_201', type: 'biometric', status: 'granted', timestamp: '2026-03-22 16:30' },
  ]);

  const stats = [
    { label: 'Biometric Consent', granted: 420, revoked: 12, pending: 18, class: 'biometric' },
    { label: 'Cloud Sync Agreement', granted: 450, revoked: 0, pending: 0, class: 'cloud' },
    { label: 'Photo Attribution', granted: 355, revoked: 45, pending: 50, class: 'photo' },
  ];

  return (
    <div className="lgpd-container">
      <header className="lgpd-header">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600/20 text-blue-400 rounded-3xl">
            <Lock size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Sovereign Privacy Control</h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest font-black mt-1">GDPR / LGPD Compliance Backbone</p>
          </div>
        </div>
        <button className="lgpd-audit-btn"><FileText size={18} /> Generate Audit Report</button>
      </header>

      <div className="lgpd-stats-grid">
        {stats.map(stat => (
          <div key={stat.label} className="lgpd-stat-card">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">{stat.label}</h3>
            <div className="flex items-end justify-between mb-2">
               <div className="text-2xl font-black italic text-white">{stat.granted}</div>
               <div className="text-[10px] text-green-500 font-bold">GRANTED</div>
            </div>
            <StatBar granted={stat.granted} revoked={stat.revoked} pending={stat.pending} />
          </div>
        ))}
      </div>

      <div className="lgpd-log-container mt-12 bg-white/5 border border-white/5 rounded-[32px] p-8">
        <h2 className="text-xl font-black italic uppercase tracking-tighter mb-8">Consent Audit Trail</h2>
        <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className="lgpd-log-item">
               <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 rounded-xl ${
                    log.status === 'granted' ? 'bg-green-500/10 text-green-400' :
                    log.status === 'revoked' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Student {log.studentId.replace('std_', '#')}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">{log.type.replace('_', ' ')}</div>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-xs font-mono text-gray-400">{log.timestamp}</div>
                  <div className={`text-[10px] font-black uppercase mt-1 ${
                    log.status === 'granted' ? 'text-green-500' :
                    log.status === 'revoked' ? 'text-red-500' : 'text-blue-500'
                  }`}>{log.status}</div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
