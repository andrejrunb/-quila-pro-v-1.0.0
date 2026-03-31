import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import HRPortalComponent from '../components/HRPortal';
import { FileUploader } from '../components/FileUploader';
import { ShieldCheck } from 'lucide-react';
import './HRPortal.css';

interface HRPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const HRPortal: React.FC<HRPortalProps> = ({ currentPage, onNavigate }) => {
  const renderHRPage = () => {
    return (
      <div className="hr-portal-wrapper">
        <HRPortalComponent />
        
        {/* Gestão de Documentos Auditáveis (Zero-Debt Standard) */}
        <section className="hr-doc-management-section">
          <div className="hr-section-header">
            <div className="hr-icon-box">
              <ShieldCheck className="hr-icon-pink" size={24} />
            </div>
            <div className="hr-title-group">
              <h2>Documentação de Funcionários</h2>
              <p>Repositório Criptografado de Contratos e Holerites</p>
            </div>
          </div>
          
          <FileUploader 
            label="Arraste documentos (Contratos, Exames, Holerites) aqui"
            onFilesSelected={(files) => console.log('HR Files:', files)}
            accept=".pdf,.doc,.docx"
          />
        </section>
      </div>
    );
  };

  return (
    <PortalLayout portalName="Gestão de Talentos & RH" themeColor="#ec4899">
      {renderHRPage()}
    </PortalLayout>
  );
};

export default HRPortal;
