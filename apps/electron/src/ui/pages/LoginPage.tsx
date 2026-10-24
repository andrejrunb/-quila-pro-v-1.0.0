import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, School, ScanFace, Activity, Cpu, ShieldCheck, Database, AlertCircle } from 'lucide-react';
import './LoginPage.css';
import logo from '../../assets/logo.png';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [institution, setInstitution] = useState(() => {
    return localStorage.getItem('selected_institution') || '';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      localStorage.setItem('selected_institution', institution);
      const result = await (window as any).aquila.invoke('login', { username, password, institution });
      if (result && result.success) {
        onLogin(result.user);
      } else {
        setError(result.message || 'Falha na autenticação');
      }
    } catch (err: any) {
      const techMsg = err?.message || String(err) || 'Erro desconhecido';
      console.error('[LOGIN] Exceção no IPC login:', techMsg);
      setError(`Falha no IPC: ${techMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Animated Glows */}
      <div className="glow-circle glow-blue"></div>
      <div className="glow-circle glow-cyan"></div>

      <div className="eagle-login-card">
        {/* Left Panel: Hero & Decorative */}
        <div className="eagle-hero-panel">
          <div className="hero-content">
            <div className="logo-container">
              <img src={logo} alt="Áquila Pro Logo" className="hero-logo" />
              <h1 className="hero-title">Áquila Pro</h1>
            </div>
            <p className="hero-tagline">Gestão Escolar com IA Soberana</p>

            <div className="floating-cards-container">
              <div className="floating-card delay-1">
                <School size={20} className="float-icon blue" />
                <span>500+ Escolas</span>
              </div>
              <div className="floating-card delay-2">
                <Activity size={20} className="float-icon cyan" />
                <span>99.9% Uptime</span>
              </div>
              <div className="floating-card delay-3">
                <ShieldCheck size={20} className="float-icon blue" />
                <span>100% LGPD</span>
              </div>
            </div>
          </div>

          <div className="hero-biometric-mesh">
            <ScanFace className="haven-icon animate-pulse" size={24} />
            <div className="scanner-container">
              <svg viewBox="0 0 100 100" className="face-mesh-svg">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Outer boundary */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="0.5" strokeDasharray="3 3" />
                
                {/* Face Outline */}
                <path 
                  d="M50,15 C65,15 75,25 75,45 C75,65 65,85 50,85 C35,85 25,65 25,45 C25,25 35,15 50,15 Z" 
                  fill="none" 
                  stroke="rgba(6, 182, 212, 0.25)" 
                  strokeWidth="1.5" 
                />
                
                {/* Eye nodes */}
                <circle cx="40" cy="42" r="1.5" fill="#06b6d4" className="mesh-node animate-ping" />
                <circle cx="40" cy="42" r="1" fill="#06b6d4" />
                <circle cx="60" cy="42" r="1.5" fill="#06b6d4" className="mesh-node animate-ping" />
                <circle cx="60" cy="42" r="1" fill="#06b6d4" />
                
                {/* Nose node */}
                <circle cx="50" cy="54" r="1" fill="#06b6d4" />
                
                {/* Mouth nodes */}
                <circle cx="42" cy="67" r="1" fill="#06b6d4" />
                <circle cx="50" cy="69" r="1" fill="#06b6d4" />
                <circle cx="58" cy="67" r="1" fill="#06b6d4" />

                {/* Connections (biometric mesh layout) */}
                <path 
                  d="M50,15 L40,42 L50,54 L60,42 L50,15 M25,45 L40,42 L42,67 L25,45 M75,45 L60,42 L58,67 L75,45 M50,54 L42,67 L50,85 L58,67 L50,54 M40,42 L50,42 L60,42 M42,67 L50,69 L58,67" 
                  fill="none" 
                  stroke="rgba(59, 130, 246, 0.2)" 
                  strokeWidth="0.8" 
                />

                {/* Glowing outer scanning corners */}
                <path d="M15,25 L15,15 L25,15" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" />
                <path d="M75,15 L85,15 L85,25" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" />
                <path d="M15,75 L15,85 L25,85" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" />
                <path d="M75,85 L85,85 L85,75" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" />
                
                {/* Moving scanning bar */}
                <line x1="8" y1="0" x2="92" y2="0" stroke="#06b6d4" strokeWidth="1.5" className="scanning-line" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Panel: Clean Login Form */}
        <div className="eagle-form-panel">
          <div className="form-header">
            <h2>Bem-vindo de volta</h2>
            <p>Insira suas credenciais para acessar o sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="eagle-form">
            <div className="input-group">
              <label>Instituição</label>
              <div className="input-wrapper">
                <School size={18} className="input-icon" />
                <select 
                  className="eagle-input eagle-select"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecione sua instituição</option>
                  <option value="COLEGIOVISAO">Colégio Áquila Modelo</option>
                  <option value="ESCOLAFUTURO">Escola do Futuro</option>
                  <option value="AQUILA_DEMO">Áquila Demo</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Usuário</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="eagle-input"
                  placeholder="Seu nome de usuário" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Senha</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="eagle-input"
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error animate-shake">
                <AlertCircle size={18} className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="eagle-btn-primary" disabled={isLoading}>
              {isLoading ? (
                <div className="eagle-spinner"></div>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="form-footer">
            <a href="#" className="forgot-password">Esqueceu a senha?</a>
            <p className="version-text">v1.0.0 (Elite Edition)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
