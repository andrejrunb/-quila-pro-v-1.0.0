import React, { useState } from 'react';
import { 
  X, Camera, Fingerprint, Mic, 
  CheckCircle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import './IdentificationWizard.css';

interface IdentificationWizardProps {
  onClose: () => void;
  onComplete: (data: any) => void;
}

/**
 * IDENTIFICATION WIZARD (v3630)
 * ----------------------------
 * Multimodal enrollment flow for students and staff.
 * Steps: 1. Face Scan | 2. Palm Vein | 3. Voice Print | 4. Finish
 */
export const IdentificationWizard: React.FC<IdentificationWizardProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState(0);

  const nextStep = () => {
    if (step < 4) {
      setCapturing(false);
      setProgress(0);
      setStep(step + 1);
    } else {
      onComplete({ timestamp: Date.now(), methods: ['face', 'palm', 'voice'] });
    }
  };

  const handleCapture = () => {
    setCapturing(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(nextStep, 800);
      }
    }, 100);
  };

  const renderScanView = () => {
    switch (step) {
      case 1: return <Camera size={64} className="text-teal-400 opacity-50" />;
      case 2: return <Fingerprint size={64} className="text-teal-400 opacity-50" />;
      case 3: return <Mic size={64} className="text-teal-400 opacity-50" />;
      default: return <CheckCircle size={80} className="text-success" />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Face ID Recognition";
      case 2: return "Vascular Palm Mapping";
      case 3: return "Acoustic Voice Print";
      default: return "Enrollment Complete";
    }
  };

  return (
    <div className="id-wizard-overlay animate-fade-in">
      <div className="id-wizard-container">
        <button className="absolute top-8 right-8 text-secondary hover:text-white" onClick={onClose} title="Close Wizard">
          <X size={24} />
        </button>

        <div className="wizard-step-indicator">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`step-dot ${step >= i ? 'active' : ''}`} />
          ))}
        </div>

        <div className="wizard-content">
          <h2 className="wizard-title">{getStepTitle()}</h2>
          <p className="wizard-subtitle">
            {step < 4 
              ? `Step ${step} of 3: Multimodal identity fusion protocol.` 
              : "Identity template encrypted and synchronized to Sovereign Cloud."}
          </p>

          <div className="scan-view-area">
            {step < 4 && <div className="scan-guide-overlay" />}
            {capturing && <div className="scan-laser-line" />}
            {renderScanView()}
          </div>

          <div className="wizard-action-group">
            {step < 4 ? (
              <button 
                className="btn-wizard btn-wizard-primary"
                onClick={handleCapture}
                disabled={capturing}
              >
                {capturing ? `ANALYZING... ${progress}%` : `START ENROLLMENT`}
                {!capturing && <ArrowRight size={18} />}
              </button>
            ) : (
              <button className="btn-wizard btn-wizard-primary" onClick={() => onComplete({})}>
                <ShieldCheck size={20} /> FINALIZE & SYNC
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
