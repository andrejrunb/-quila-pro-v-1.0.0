import React, { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  onBack?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, onBack }) => {
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await (window as any).aquila.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div className="loading-container">Verificando permissões...</div>;
  }

  const isAllowed = user && allowedRoles.includes(user.role);

  if (!isAllowed) {
    return (
      <div className="access-denied-container glass">
        <h2>Acesso Negado</h2>
        <p>Você não tem permissão para aceder a esta funcionalidade.</p>
        <p>Perfil necessário: <strong>{allowedRoles.join(' ou ')}</strong></p>
        {onBack && (
          <button className="btn-premium" onClick={onBack}>
            Voltar
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
