import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Wind, 
  EyeOff, 
  Settings2, 
  BellRing,
  Activity,
  UserCheck
} from 'lucide-react';
import './SensoryConfigDashboard.css';

const SensoryConfigDashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [testActive, setTestActive] = useState(false);

  const fetchProfile = async () => {
    try {
      const p = await (window as any).aquila.invoke('sensory:get-profile', { studentId: 'STU-123' });
      setProfile(p);
    } catch (err) {
      console.error('Erro ao carregar perfil sensorial:', err);
    }
  };

  const triggerTest = async (pattern: string) => {
    setTestActive(true);
    await (window as any).aquila.invoke('haptic:trigger', { studentId: 'STU-123', pattern });
    setTimeout(() => setTestActive(false), 1000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!profile) return null;

  return (
    <div className="sensory-container">
      <header className="sensory-header">
        <div className="flex items-center gap-4">
          <Wind className="sensory-logo-glow" size={32} />
          <div>
            <h1>Malha Sensorial & Inclusão</h1>
            <p>Configuração de Feedback Háptico e Neurodiversidade — Nível 32</p>
          </div>
        </div>
      </header>

      <div className="sensory-grid">
        {/* Configurações de Perfil (Inclusão) */}
        <section className="sensory-settings glass-panel">
           <h3><Settings2 size={18} /> Perfil Sensorial (Neurodiversidade)</h3>
           <div className="setting-item">
              <div className="s-info">
                 <strong>Sensibilidade Tátil</strong>
                 <p>Ajusta a intensidade dos feedbacks para evitar sobrecarga sensorial.</p>
              </div>
              <select 
                value={profile.tactileSensitivity} 
                onChange={(e) => setProfile({...profile, tactileSensitivity: e.target.value})}
              >
                 <option value="LOW">Baixa (Pulsos Fortes)</option>
                 <option value="NORMAL">Normal</option>
                 <option value="HIGH">Alta (Suavizado)</option>
              </select>
           </div>

           <div className="setting-item">
              <div className="s-info">
                 <strong>Estado da Malha Háptica</strong>
                 <p>Ativar/Desativar feedback físico globalmente para este aluno.</p>
              </div>
              <div className={`toggle ${profile.hapticEnabled ? 'on' : 'off'}`} onClick={() => setProfile({...profile, hapticEnabled: !profile.hapticEnabled})}>
                 <div className="handle"></div>
              </div>
           </div>

           <div className="intensity-slider">
              <span>Intensidade Preferida: {Math.round(profile.preferredIntensity * 100)}%</span>
              <input 
                type="range" min="0.1" max="1.0" step="0.1" 
                value={profile.preferredIntensity} 
                onChange={(e) => setProfile({...profile, preferredIntensity: parseFloat(e.target.value)})}
              />
           </div>
        </section>

        {/* Console de Teste e Monitoramento */}
        <aside className="sensory-test-bench glass-panel">
           <h3><Activity size={18} /> Bancada de Teste Háptico</h3>
           <div className="test-grid">
              <button className="test-btn" onClick={() => triggerTest('SUCCESS')}>
                 <Zap size={14} /> Sucesso
              </button>
              <button className="test-btn" onClick={() => triggerTest('GENTLE_NUDGE')}>
                 <BellRing size={14} /> Nudge Suave
              </button>
              <button className="test-btn" onClick={() => triggerTest('FOCUS_PULSE')}>
                 <Wind size={14} /> Pulso de Foco
              </button>
           </div>

           <div className={`vibration-visualizer ${testActive ? 'vibrating' : ''}`}>
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
           </div>

           <div className="inclusivity-note">
              <EyeOff size={14} className="text-purple-400" />
              <span>O sistema detecta automaticamente dispositivos vestíveis e ajusta a latência.</span>
           </div>
        </aside>
      </div>

      <footer className="sensory-footer">
         <UserCheck size={14} className="text-emerald-500" />
         <span>Protocolo de Acessibilidade Áquila v3.2 Ativo</span>
      </footer>
    </div>
  );
};

export default SensoryConfigDashboard;
