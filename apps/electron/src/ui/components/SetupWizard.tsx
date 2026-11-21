import React, { useState, useEffect } from 'react';
import { 
  Check, ChevronLeft, Shield, Globe, 
  Camera, Smartphone, Zap, Sparkles, Building2, 
  Users, CheckCircle, ArrowRight, Monitor,
  GraduationCap, Briefcase, FileText, Power, Image
} from 'lucide-react';
import './SetupWizard.css';

export type WorkstationUsageType =
  | 'classroom'
  | 'teachers_room'
  | 'coordination'
  | 'direction'
  | 'secretariat'
  | 'portaria';

export const WORKSTATION_USAGE_OPTIONS: Array<{
  id: WorkstationUsageType;
  label: string;
  subtitle: string;
  route: string;
}> = [
  {
    id: 'classroom',
    label: 'Sala de Aula',
    subtitle: 'Painel da turma, energia automática (-10m/+10m) e fundo do Desktop',
    route: 'classroom-dashboard',
  },
  {
    id: 'teachers_room',
    label: 'Sala dos Professores',
    subtitle: 'Planilha de notas, diário docente e Estúdio IA',
    route: 'teacher-dashboard',
  },
  {
    id: 'coordination',
    label: 'Coordenação',
    subtitle: 'Grade horária, retenção e aprovações pedagógicas',
    route: 'coordination',
  },
  {
    id: 'direction',
    label: 'Direção',
    subtitle: 'BI financeiro, governança institucional e portais',
    route: 'executive-cockpit-portal',
  },
  {
    id: 'secretariat',
    label: 'Secretaria',
    subtitle: 'Matrículas, prontuários e gestão de turmas',
    route: 'secretaria-portal',
  },
  {
    id: 'portaria',
    label: 'Portaria / Segurança',
    subtitle: 'Catracas, câmeras e controle de acesso ao campus',
    route: 'security-monitor',
  },
];

export const DEFAULT_WORKSTATION_CLASSES = [
  { id: '1-ano-a', name: '1º Ano A — Ensino Fundamental', grade: '1º Ano EF' },
  { id: '2-ano-a', name: '2º Ano A — Ensino Fundamental', grade: '2º Ano EF' },
  { id: '6-ano-a', name: '6º Ano A — Ensino Fundamental II', grade: '6º Ano' },
  { id: '7-ano-a', name: '7º Ano A — Ensino Fundamental II', grade: '7º Ano' },
  { id: '8-ano-a', name: '8º Ano A — Ensino Fundamental II', grade: '8º Ano' },
  { id: '9-ano-a', name: '9º Ano A — Ensino Fundamental II', grade: '9º Ano' },
  { id: '1-serie-a', name: '1ª Série A — Ensino Médio', grade: '1ª Série EM' },
  { id: '1-serie-b', name: '1 SERIE B (1ª Série EM)', grade: '1ª Série EM' },
  { id: '2-serie-a', name: '2ª Série A — Ensino Médio', grade: '2ª Série EM' },
  { id: '3-serie-a', name: '3ª Série A — Ensino Médio', grade: '3ª Série EM' },
];

export interface SetupData {
  schoolName: string;
  cnpj: string;
  adminEmail: string;
  adminPassword: string;
  rtspUrl: string;
  whatsappNumber: string;
  usageType: WorkstationUsageType;
  classroomClassId: string;
  autoStartOs: boolean;
  projectWallpaper: boolean;
  autoPowerSchedule: boolean;
}

interface SetupWizardProps {
  onComplete: (createdUser?: any) => void;
}

const STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Áquila Pro',
    desc: 'Configure seu campus e este terminal em menos de 3 minutos com total segurança soberana.',
    icon: <Shield size={42} />,
    color: '#3b82f6',
  },
  {
    id: 'workstation',
    title: 'Tipo de Uso deste Computador',
    desc: 'Informe onde este equipamento está instalado para automatizar inicialização, energia e tela.',
    icon: <Monitor size={42} />,
    color: '#10b981',
  },
  {
    id: 'school',
    title: 'Identidade do Campus',
    desc: 'Forneça os dados institucionais para personalizar o sistema.',
    icon: <Globe size={42} />,
    color: '#8b5cf6',
  },
  {
    id: 'admin',
    title: 'Conta do Administrador',
    desc: 'Crie as credenciais de acesso para o gestor principal do sistema.',
    icon: <Smartphone size={42} />,
    color: '#06b6d4',
  },
  {
    id: 'camera',
    title: 'Nó Primário (Câmera)',
    desc: 'Conecte sua câmera IP (Tapo, Hikvision etc.) ou pule esta etapa.',
    icon: <Camera size={42} />,
    color: '#f97316',
  },
  {
    id: 'whatsapp',
    title: 'Gateway de Alertas',
    desc: 'Informe o número que enviará notificações soberanas via WhatsApp.',
    icon: <Smartphone size={42} />,
    color: '#22c55e',
  },
  {
    id: 'optimization',
    title: 'Aceleração de Hardware',
    desc: 'Otimizando o motor de IA local para o seu hardware NPU/GPU.',
    icon: <Zap size={42} />,
    color: '#f59e0b',
  },
  {
    id: 'success',
    title: 'Pronto para Deploy',
    desc: 'Seu School OS foi finalizado e está totalmente soberano.',
    icon: <CheckCircle size={42} />,
    color: '#10b981',
  }
];

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableClasses, setAvailableClasses] = useState(DEFAULT_WORKSTATION_CLASSES);
  const [data, setData] = useState<SetupData>({
    schoolName: '',
    cnpj: '',
    adminEmail: '',
    adminPassword: '',
    rtspUrl: '',
    whatsappNumber: '',
    usageType: 'classroom',
    classroomClassId: '1-serie-b',
    autoStartOs: true,
    projectWallpaper: true,
    autoPowerSchedule: true,
  });

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await (window as any).aquila?.invoke?.('get-classes', '');
        if (Array.isArray(res) && res.length > 0) {
          setAvailableClasses(res);
          setData(d => ({ ...d, classroomClassId: res[0].id }));
        }
      } catch {}
    };
    loadClasses();
  }, []);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const set = (field: 'schoolName' | 'cnpj' | 'adminEmail' | 'adminPassword' | 'rtspUrl' | 'whatsappNumber') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setData(d => ({ ...d, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (current.id === 'workstation' && data.usageType === 'classroom' && !data.classroomClassId) {
      errs.classroomClassId = 'Selecione a turma desta sala de aula';
    }
    if (current.id === 'school') {
      if (!data.schoolName.trim()) errs.schoolName = 'Nome da instituição é obrigatório';
    }
    if (current.id === 'admin') {
      if (!data.adminEmail.trim()) errs.adminEmail = 'Usuário ou e-mail é obrigatório';
      if (data.adminPassword.length < 8) errs.adminPassword = 'Mínimo de 8 caracteres';
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
      } else {
        setStep(s => s + 1);
      }
    } catch (err) {
      console.error('Optimization error:', err);
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => setStep(s => s + 1);

  const finalizeSetup = async () => {
    try {
      setErrors({});
      setIsSaving(true);
      const api = (window as any).aquila;
      const selectedClassObj = availableClasses.find(c => c.id === data.classroomClassId);
      const workstationConfig = {
        usageType: data.usageType,
        classId: data.usageType === 'classroom' ? data.classroomClassId : '',
        className: data.usageType === 'classroom' ? (selectedClassObj?.name || '1 SERIE B') : '',
        autoStartOs: data.autoStartOs,
        projectWallpaper: data.usageType === 'classroom' ? data.projectWallpaper : false,
        wakeOffsetMinutes: data.autoPowerSchedule ? 10 : 0,
        shutdownOffsetMinutes: data.autoPowerSchedule ? 10 : 0,
        shutdownConfirmSeconds: 60,
      };

      localStorage.setItem('aquila_terminal_profile', data.usageType);
      if (data.usageType === 'classroom' && data.classroomClassId) {
        localStorage.setItem('classroom_class_id', data.classroomClassId);
      }
      localStorage.setItem('aquila_workstation_config', JSON.stringify(workstationConfig));

      let createdUser: any = null;

      if (api?.invoke) {
        await api.invoke('workstation:configure', workstationConfig).catch(() => {});

        await api.invoke('save-settings', {
          schoolName: data.schoolName,
          cnpj: data.cnpj,
          whatsappNumber: data.whatsappNumber,
          adminEmail: data.adminEmail,
          terminalUsageType: data.usageType,
          classroomClassId: workstationConfig.classId,
          setupCompleted: true,
        });

        if (data.adminEmail && data.adminPassword) {
          const adminResult = await api.invoke('create-admin-user', {
            email: data.adminEmail,
            password: data.adminPassword,
            role: 'admin',
            schoolName: data.schoolName,
            cnpj: data.cnpj,
          });
          if (adminResult?.success) {
            createdUser = adminResult.user || null;
          } else if (adminResult?.code !== 'ADMIN_ALREADY_EXISTS') {
            throw new Error(adminResult?.error || 'Falha ao criar administrador');
          }
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

      onComplete(createdUser);
    } catch (err: any) {
      console.error('Setup error:', err);
      setErrors({ global: err?.message || 'Erro ao salvar. Por favor, tente novamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const canSkip = current.id === 'camera' || current.id === 'whatsapp';

  return (
    <div className="setup-wizard-overlay" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <div className={`setup-wizard-card ${current.id === 'workstation' ? 'setup-card-wide' : ''}`}>
        <div className="setup-progress-bar" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          <div
            className="setup-progress-fill"
            style={{ '--progress-width': `${progress}%`, '--step-color': current.color } as React.CSSProperties}
          />
        </div>

        <div className="setup-step-count">
          Passo {step + 1} de {STEPS.length}
        </div>

        <div className="setup-wizard-content">
          <div className="setup-icon-container" style={{ '--icon-color': current.color } as React.CSSProperties}>
            {current.icon}
          </div>

          <h1 id="setup-title" className="setup-title">{current.title}</h1>
          <p className="setup-description">{current.desc}</p>

          {current.id === 'workstation' && (
            <div className="setup-form-group workstation-setup-panel">
              <div className="workstation-usage-grid">
                {WORKSTATION_USAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setData(d => ({ ...d, usageType: opt.id }))}
                    className={`workstation-usage-card ${data.usageType === opt.id ? 'selected' : ''}`}
                  >
                    <div className="usage-card-top">
                      <span className="usage-card-title">{opt.label}</span>
                      {data.usageType === opt.id && <Check size={14} className="text-emerald-400" />}
                    </div>
                    <span className="usage-card-sub">{opt.subtitle}</span>
                  </button>
                ))}
              </div>

              {data.usageType === 'classroom' && (
                <div className="workstation-classroom-box">
                  <div className="setup-input-group">
                    <label htmlFor="classroomClassId">Turma Vinculada a esta Sala de Aula *</label>
                    <select
                      id="classroomClassId"
                      value={data.classroomClassId}
                      onChange={(e) => setData(d => ({ ...d, classroomClassId: e.target.value }))}
                      className="setup-text-input setup-select-input"
                    >
                      {availableClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                      ))}
                    </select>
                    {errors.classroomClassId && <span className="setup-error">{errors.classroomClassId}</span>}
                  </div>

                  <div className="workstation-auto-features">
                    <label className="ws-check-row">
                      <input
                        type="checkbox"
                        checked={data.autoStartOs}
                        onChange={(e) => setData(d => ({ ...d, autoStartOs: e.target.checked }))}
                      />
                      <span>Inicializar automaticamente com o Sistema Operacional (Windows)</span>
                    </label>
                    <label className="ws-check-row">
                      <input
                        type="checkbox"
                        checked={data.autoPowerSchedule}
                        onChange={(e) => setData(d => ({ ...d, autoPowerSchedule: e.target.checked }))}
                      />
                      <span>Ligar 10 min antes da 1ª aula e desligar 10 min após a última aula (timer 60s)</span>
                    </label>
                    <label className="ws-check-row">
                      <input
                        type="checkbox"
                        checked={data.projectWallpaper}
                        onChange={(e) => setData(d => ({ ...d, projectWallpaper: e.target.checked }))}
                      />
                      <span>Projetar tela atualizada da sala no Plano de Fundo do Desktop</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {current.id === 'school' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="schoolName">Nome da Instituição *</label>
                <input
                  id="schoolName"
                  type="text"
                  value={data.schoolName}
                  onChange={set('schoolName')}
                  placeholder="Ex: Colégio Aquila"
                  className={`setup-text-input ${errors.schoolName ? 'input-error' : ''}`}
                  autoFocus
                />
                {errors.schoolName && <span className="setup-error">{errors.schoolName}</span>}
              </div>
              <div className="setup-input-group">
                <label htmlFor="cnpj">CNPJ da Instituição (Opcional)</label>
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
                <label htmlFor="adminEmail">Usuário ou E-mail do Administrador *</label>
                <input
                  id="adminEmail"
                  type="text"
                  value={data.adminEmail}
                  onChange={set('adminEmail')}
                  className="setup-text-input"
                  placeholder="admin ou admin@escola.com"
                  autoFocus
                />
                {errors.adminEmail && <span className="setup-error">{errors.adminEmail}</span>}
              </div>
              <div className="setup-input-group">
                <label htmlFor="adminPassword">Senha do Administrador *</label>
                <input
                  id="adminPassword"
                  type="password"
                  value={data.adminPassword}
                  onChange={set('adminPassword')}
                  className="setup-text-input"
                  placeholder="Mínimo 8 caracteres"
                />
                {errors.adminPassword && <span className="setup-error">{errors.adminPassword}</span>}
              </div>
            </div>
          )}

          {current.id === 'camera' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="rtspUrl">URL da Câmera RTSP (Opcional)</label>
                <input
                  id="rtspUrl"
                  type="text"
                  value={data.rtspUrl}
                  onChange={set('rtspUrl')}
                  className="setup-text-input"
                  placeholder="rtsp://admin:senha@192.168.1.100:554/live"
                />
              </div>
            </div>
          )}

          {current.id === 'whatsapp' && (
            <div className="setup-form-group">
              <div className="setup-input-group">
                <label htmlFor="whatsapp">Número WhatsApp para Alertas</label>
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
                  <p>Analisando perfil de hardware...</p>
                </div>
              )}
              {optStatus === 'done' && (
                <div className="opt-done animate-fade-in">
                  <Check className="text-green-500" size={32} />
                  <p>Otimização Concluída: {optData?.quantization || 'INT8'} aplicado.</p>
                </div>
              )}
            </div>
          )}

          {errors.global && (
            <div className="setup-error" role="alert" style={{ marginBottom: 12, textAlign: 'center' }}>
              {errors.global}
            </div>
          )}

          <div className="setup-actions">
            <div className="flex gap-3">
              {step > 0 && step < STEPS.length - 1 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="setup-back-btn"
                  title="Passo Anterior"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {canSkip && (
                <button 
                  type="button" 
                  onClick={handleSkip} 
                  className="setup-skip-btn"
                >
                  Pular
                </button>
              )}
            </div>

            {isSaving ? (
              <button type="button" className="setup-next-btn" disabled>
                <Sparkles className="animate-spin mr-2" size={18} />
                Salvando...
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="setup-next-btn"
              >
                {isLast ? 'Entrar no Sistema' : 'Próxima Etapa'}
                <ArrowRight size={18} className="ml-2" />
              </button>
            )}
          </div>

          <div className="setup-dots">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`setup-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                style={{ '--dot-bg': s.color } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        <div className="setup-bg-icon">
          <Shield size={320} strokeWidth={0.5} />
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
