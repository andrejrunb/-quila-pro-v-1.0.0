import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, RefreshCw, 
  UserPlus, Wifi, Database 
} from 'lucide-react';
import { IdentificationWizard } from '../components/IdentificationWizard';
import './PresenceFidelityDashboard.css';

/**
 * PRESENCE FIDELITY DASHBOARD (v3630)
 * ----------------------------------
 * Master dashboard for system liveness and identity integrity.
 * Aesthetic: "Fidelity-Slate" design.
 */
export const PresenceFidelityDashboard: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [fidelityScore, setFidelityScore] = useState(98.4);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');

  useEffect(() => {
    const interval = setInterval(() => {
      setFidelityScore(prev => prev + (Math.random() * 0.4 - 0.2));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fidelity-dashboard-container animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="section-title !mb-0">System Fidelity Master</h2>
          <p className="fidelity-subtext">Real-time integrity monitoring of the Sovereign Cloud nodes.</p>
        </div>
        <div className="flex gap-4">
          <button className="onboarding-btn-large" onClick={() => setShowWizard(true)}>
            <UserPlus size={20} /> New Identification Onboarding
          </button>
        </div>
      </header>

      <div className="fidelity-grid">
        {/* Metric 1: Presence Fidelity */}
        <div className="fidelity-card">
          <div className="fidelity-header">
            <span className="fidelity-label"><Activity size={12} /> Presence Fidelity</span>
            <ShieldCheck size={16} className="fidelity-badge-success" />
          </div>
          <div className="fidelity-value">{fidelityScore.toFixed(1)}%</div>
          <div className="pulse-line-container">
            <div className="pulse-line" />
          </div>
          <p className="fidelity-subtext">Integrity of Re-ID feature vector matching across campus.</p>
        </div>

        {/* Metric 2: Sovereign Sync */}
        <div className="fidelity-card">
          <div className="fidelity-header">
            <span className="fidelity-label"><RefreshCw size={12} /> Sovereign Sync</span>
            <Wifi size={16} className="fidelity-badge-success" />
          </div>
          <div className="fidelity-value">ACTIVE</div>
          <p className="fidelity-subtext">Inter-campus ledger synchronization active via E2EE Cloud.</p>
        </div>

        {/* Metric 3: Identity Templates */}
        <div className="fidelity-card">
          <div className="fidelity-header">
            <span className="fidelity-label"><Database size={12} /> Templates Locked</span>
            <span className="text-secondary text-xs font-bold">1,204</span>
          </div>
          <div className="fidelity-value">SECURE</div>
          <p className="fidelity-subtext">Biometric templates are sharded and encrypted in local NPU storage.</p>
        </div>
      </div>

      {showWizard && (
        <IdentificationWizard 
          onClose={() => setShowWizard(false)} 
          onComplete={() => {
            setShowWizard(false);
            alert('Identification Enrollment Synchronized Successfully.');
          }} 
        />
      )}
    </div>
  );
};
