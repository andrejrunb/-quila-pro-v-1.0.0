import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { Dashboard } from '../Dashboard'; // Placeholder por enquanto

interface ParentPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ currentPage, onNavigate }) => {
  return (
    <PortalLayout portalName="Canal Família & Conexão" themeColor="#0ea5e9">
      <div className="parent-portal-welcome glass">
        <h2>Bem-vindo ao Portal dos Pais</h2>
        <p>Acompanhe o desenvolvimento do seu filho em tempo real.</p>
        {/* Adicionar componentes de notas e frequência aqui */}
        <Dashboard onNavigate={onNavigate} onLogout={() => {}} />
      </div>
    </PortalLayout>
  );
};

export default ParentPortal;
