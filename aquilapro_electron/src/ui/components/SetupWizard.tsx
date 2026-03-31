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
    title: 'Welcome to quila Pro',
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
    id: 'done',
    title: 'Everything Ready! 🚀',
    desc: 'quila Pro configured and ready to empower your campus.',
    icon: <Check size={48} />,
    color: '#eab308',
  },
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
        {/* Progress Bar */}
        <div className="setup-progress-bar" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          <div
            className="setup-progress-fill"
            data-progress={progress}
            data-color={current.color}
          />
        </div>

        {/* Step Counter */}
        <div className="setup-step-count">
          Step {step + 1} of {STEPS.length}
        </div>

        <div className="setup-wizard-content">
          {/* Icon */}
          <div className="setup-icon-container" data-color={current.color}>
            {current.icon}
          </div>

          <h1 id="setup-title" className="setup-title">{current.title}</h1>
          <p className="setup-description">{current.desc}</p>

          {/* Step 1: School Data */}
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

          {/* Step 2: Admin */}
          {current.id === 'admin' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="adminEmail">Administrator Email *</label>
                <input
                  id="adminEmail"
                  type="email"
                  value={data.adminEmail}
                  onChange={set('adminEmail')}
                  placeholder="director@school.com"
                  className={`setup-text-input ${errors.adminEmail ? 'input-error' : ''}`}
                  autoFocus
                />
                {errors.adminEmail && <span className="setup-error">{errors.adminEmail}</span>}
              </div>
              <div className="setup-input-group">
                <label htmlFor="adminPassword">Password *</label>
                <input
                  id="adminPassword"
                  type="password"
                  value={data.adminPassword}
                  onChange={set('adminPassword')}
                  placeholder="Minimum 8 characters"
                  className={`setup-text-input ${errors.adminPassword ? 'input-error' : ''}`}
                />
                {errors.adminPassword && <span className="setup-error">{errors.adminPassword}</span>}
              </div>
            </div>
          )}

          {/* Step 3: Camera */}
          {current.id === 'camera' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="rtspUrl">Camera RTSP URL</label>
                <input
                  id="rtspUrl"
                  type="text"
                  value={data.rtspUrl}
                  onChange={set('rtspUrl')}
                  placeholder="rtsp://admin:pass@192.168.1.x:554/stream1"
                  className="setup-text-input setup-monospace"
                />
              </div>
              <div className="setup-tip-box">
                <span className="tip-header">🔌 Supported Brands:</span>
                <span className="tip-text">Tapo • Hikvision • Intelbras • Dahua • ONVIF</span>
              </div>
            </div>
          )}

          {/* Step 4: WhatsApp */}
          {current.id === 'whatsapp' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="whatsappNumber">Campus WhatsApp Number</label>
                <input
                  id="whatsappNumber"
                  type="tel"
                  value={data.whatsappNumber}
                  onChange={set('whatsappNumber')}
                  placeholder="+1 555 000-0000"
                  className="setup-text-input"
                />
              </div>
              <div className="setup-tip-box">
                <span className="tip-header">💡 Tip:</span>
                <span className="tip-text">Use a dedicated number or your campus Business WhatsApp.</span>
              </div>
            </div>
          )}

          {/* Step 0: Welcome */}
          {current.id === 'welcome' && (
            <div className="setup-welcome-info">
              <div className="setup-feature-list">
                <div className="setup-feature-item">🎯 Facial Recognition in &lt;2s</div>
                <div className="setup-feature-item">📱 Real-time Sovereign Alerts</div>
                <div className="setup-feature-item">🛡️ 100% Privacy Compliant</div>
                <div className="setup-feature-item">🔒 Local Biometric Processing</div>
              </div>
            </div>
          )}

          {/* Final Step: Done */}
          {current.id === 'done' && (
            <div className="setup-welcome-info">
              <div className="setup-feature-list">
                {data.schoolName && <div className="setup-feature-item">🏫 Campus: <strong>{data.schoolName}</strong></div>}
                {data.rtspUrl && <div className="setup-feature-item">📹 Camera Node Configured</div>}
                {data.whatsappNumber && <div className="setup-feature-item">💬 Gateway: <strong>{data.whatsappNumber}</strong></div>}
                <div className="setup-feature-item">✅ Active Admin: <strong>{data.adminEmail || 'admin'}</strong></div>
              </div>
            </div>
          )}

          {errors.global && (
            <div className="setup-error-global">{errors.global}</div>
          )}

          {/* Actions */}
          <div className="setup-actions">
            {step > 0 && !isLast && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="setup-back-btn"
                aria-label="Back to previous step"
              >
                <ChevronLeft size={18} className="mr-2" aria-hidden="true" /> Back
              </button>
            )}

            {canSkip && (
              <button type="button" onClick={handleSkip} className="setup-skip-btn">
                Skip
              </button>
            )}

            {isSaving ? (
              <button
                type="button"
                className="setup-next-btn"
                aria-busy="true"
                disabled
                title="Saving configuration..."
              >
                Saving...
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="setup-next-btn"
                aria-busy="false"
                title={isLast ? 'Finalize configuration and enter' : 'Go to next step'}
              >
                {isLast ? 'Enter System' : 'Next'}
                <ChevronRight size={18} className="ml-2" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Progress Dots */}
          <div className="setup-dots" role="tablist" aria-label="Setup progress">
            {STEPS.map((s, i) => (
              i === step ? (
                <div
                  key={s.id}
                  role="tab"
                  aria-selected="true"
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  className="setup-step-dot active"
                  data-color={current.color}
                />
              ) : (
                <div
                  key={s.id}
                  role="tab"
                  aria-selected="false"
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  className={`setup-step-dot ${i < step ? 'done' : ''}`}
                />
              )
            ))}
          </div>
        </div>

        <div className="setup-bg-icon" aria-hidden="true">
          <Zap size={200} />
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
