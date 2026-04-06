import React, { useState } from 'react';
import { 
  Check, ChevronRight, ChevronLeft, Shield, Globe, 
  Camera, Smartphone, Zap, Sparkles, Building2, 
  MessageCircle, Key, Users, CheckCircle, ArrowRight
} from 'lucide-react';
import './SetupWizard.css';

export interface SetupData {
  schoolName: string;
  cnpj: string;
  adminEmail: string;
  adminPassword: string;
  rtspUrl: string;
  whatsappNumber: string;
}

interface SetupWizardProps {
  onComplete: () => void;
}

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Áquila Pro',
    desc: 'Configure your campus in less than 3 minutes with total security.',
    icon: <Shield size={48} />,
    color: '#3b82f6',
  },
  {
    id: 'school',
    title: 'Campus Identity',
    desc: 'Provide institutional data to personalize the system.',
    icon: <Globe size={48} />,
    color: '#8b5cf6',
  },
  {
    id: 'admin',
    title: 'Administrator Account',
    desc: 'Create access credentials for the primary manager.',
    icon: <Smartphone size={48} />,
    color: '#06b6d4',
  },
  {
    id: 'camera',
    title: 'Primary Node (Camera)',
    desc: 'Connect your IP camera (Tapo, Hikvision, etc.) or skip this step.',
    icon: <Camera size={48} />,
    color: '#f97316',
  },
  {
    id: 'whatsapp',
    title: 'Alert Gateway',
    desc: 'Enter the number that will send sovereign notifications.',
    icon: <Smartphone size={48} />,
    color: '#22c55e',
  },
  {
    id: 'optimization',
    title: 'Hardware Acceleration',
    desc: 'Optimizing local AI engine for your hardware NPU/GPU.',
    icon: <Zap size={48} />,
    color: '#f59e0b',
  },
  {
    id: 'success',
    title: 'Deployment Ready',
    desc: 'Your School OS is now finalized and fully sovereign.',
    icon: <CheckCircle size={48} />,
    color: '#10b981',
  }
];

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<SetupData>({
    schoolName: '',
    cnpj: '',
    adminEmail: '',
    adminPassword: '',
    rtspUrl: '',
    whatsappNumber: '',
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const set = (field: keyof SetupData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(d => ({ ...d, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!data.schoolName.trim()) errs.schoolName = 'Required';
    }
    if (step === 2) {
      if (!data.adminEmail.trim()) errs.adminEmail = 'Email required';
      if (data.adminPassword.length < 8) errs.adminPassword = 'Minimum 8 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    if (isLast) {
      await finalizeSetup();
    } else {
      if (current.id === 'optimization') {
        await runOptimization();
      } else {
        setStep(s => s + 1);
      }
    }
  };

  const [optStatus, setOptStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [optData, setOptData] = useState<any>(null);

  const runOptimization = async () => {
    setOptStatus('running');
    try {
      const api = (window as any).aquila;
      const result = await api.invoke('npu:apply-turboquant');
      if (result.success) {
        setOptData(result.data);
        setOptStatus('done');
        setTimeout(() => setStep(s => s + 1), 2000);
      }
    } catch (err) {
      console.error('Optimization error:', err);
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => setStep(s => s + 1);

  const finalizeSetup = async () => {
    try {
      setIsSaving(true);
      const api = (window as any).aquila;

      if (api?.invoke) {
        await api.invoke('save-settings', {
          schoolName: data.schoolName,
          cnpj: data.cnpj,
          whatsappNumber: data.whatsappNumber,
          adminEmail: data.adminEmail,
        });

        if (data.adminEmail && data.adminPassword) {
          await api.invoke('create-admin-user', {
            email: data.adminEmail,
            password: data.adminPassword,
            role: 'admin',
          }).catch(() => {});
        }

        if (data.rtspUrl) {
          await api.invoke('add-camera', {
            id: 'cam-initial',
            name: 'Primary Camera',
            location: 'Main Entrance',
            rtspUrl: data.rtspUrl,
            status: 'offline',
            type: 'entrance',
            resolution: '1920x1080',
            fps: 25,
            enabled: true,
          }).catch(() => {});
        }
      }

      onComplete();
    } catch (err) {
      console.error('Setup error:', err);
      setErrors({ global: 'Error saving. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const canSkip = current.id === 'camera' || current.id === 'whatsapp';

  return (
    <div className="setup-wizard-overlay" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <div className="setup-wizard-card">
        <div className="setup-progress-bar" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          <div
            className="setup-progress-fill"
            style={{ '--progress-width': `${progress}%`, '--step-color': current.color } as React.CSSProperties}
          />
        </div>

        <div className="setup-step-count">
          Step {step + 1} of {STEPS.length}
        </div>

        <div className="setup-wizard-content">
          <div className="setup-icon-container" style={{ '--icon-color': current.color } as React.CSSProperties}>
            {current.icon}
          </div>

          <h1 id="setup-title" className="setup-title">{current.title}</h1>
          <p className="setup-description">{current.desc}</p>

          {current.id === 'school' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="schoolName">Institution Name *</label>
                <input
                  id="schoolName"
                  type="text"
                  value={data.schoolName}
                  onChange={set('schoolName')}
                  placeholder="Ex: Aquila Academy"
                  className={`setup-text-input ${errors.schoolName ? 'input-error' : ''}`}
                  autoFocus
                />
                {errors.schoolName && <span className="setup-error">{errors.schoolName}</span>}
              </div>
              <div className="setup-input-group">
                <label htmlFor="cnpj">Institutional ID (Optional)</label>
                <input
                  id="cnpj"
                  type="text"
                  value={data.cnpj}
                  onChange={set('cnpj')}
                  placeholder="00.000.000/0001-00"
                  className="setup-text-input"
                  maxLength={18}
                />
              </div>
            </div>
          )}

          {current.id === 'admin' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="adminEmail">Administrator Email *</label>
                <input
                  id="adminEmail"
                  type="email"
                  value={data.adminEmail}
                  onChange={set('adminEmail')}
                  className="setup-text-input"
                  placeholder="admin@school.com"
                />
              </div>
              <div className="setup-input-group">
                <label htmlFor="adminPassword">Administrator Password *</label>
                <input
                  id="adminPassword"
                  type="password"
                  value={data.adminPassword}
                  onChange={set('adminPassword')}
                  className="setup-text-input"
                  placeholder="********"
                />
              </div>
            </div>
          )}

          {current.id === 'camera' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="rtspUrl">RTSP Camera URL (Optional)</label>
                <input
                  id="rtspUrl"
                  type="text"
                  value={data.rtspUrl}
                  onChange={set('rtspUrl')}
                  className="setup-text-input"
                  placeholder="rtsp://admin:pass@192.168.1.100:554/live"
                />
              </div>
            </div>
          )}

          {current.id === 'whatsapp' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="whatsapp">WhatsApp Alert Number</label>
                <input
                  id="whatsapp"
                  type="text"
                  value={data.whatsappNumber}
                  onChange={set('whatsappNumber')}
                  className="setup-text-input"
                  placeholder="5561999999999"
                />
              </div>
            </div>
          )}

          {current.id === 'optimization' && (
            <div className="setup-optimization-panel">
              {optStatus === 'running' && (
                <div className="opt-running">
                  <Zap className="animate-pulse text-amber-500" size={32} />
                  <p>Analyzing hardware profile...</p>
                </div>
              )}
              {optStatus === 'done' && (
                <div className="opt-done animate-fade-in">
                  <Check className="text-green-500" size={32} />
                  <p>Optimization Complete: {optData?.quantization || 'INT8'} applied.</p>
                </div>
              )}
            </div>
          )}

          <div className="setup-actions">
            {step > 0 && step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="setup-back-btn"
              >
                <ChevronLeft size={18} className="mr-2" /> Back
              </button>
            )}

            {canSkip && (
              <button type="button" onClick={handleSkip} className="setup-skip-btn">
                Skip
              </button>
            )}

            {isSaving ? (
              <button type="button" className="setup-next-btn" disabled>
                Saving...
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="setup-next-btn"
              >
                {isLast ? 'Enter System' : 'Next'}
                <ChevronRight size={18} className="ml-2" />
              </button>
            )}
          </div>

          <div className="setup-dots">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`setup-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                style={{ '--dot-bg': i === step ? current.color : undefined } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        <div className="setup-bg-icon">
          <Zap size={200} />
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
