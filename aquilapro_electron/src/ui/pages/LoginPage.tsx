import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import './LoginPage.css';
import logo from '../../assets/logo.png';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
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
      const result = await (window as any).aquila.invoke('login', { username, password });
      if (result.success) {
        onLogin(result.user);
      } else {
        setError(result.message || 'Falha na autenticação');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="login-card glass-premium">
        <div className="login-header">
          <div className="logo-badge">
             <img src={logo} alt="Áquila Pro Logo" className="login-logo-img" />
          </div>
          <h1>Áquila Pro</h1>
          <p>Inteligência & Segurança Predutiva</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Usuário</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                placeholder="Seu nome de usuário" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <label>Senha</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'} 
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

          {error && <div className="login-error animate-shake">{error}</div>}

          <button type="submit" className="login-submit" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <>
                Entrar no Sistema
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 Áquila Pro • Todos os direitos reservados</p>
          <div className="system-status">
            <div className="status-dot"></div>
            Processamento Local Ativo
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
