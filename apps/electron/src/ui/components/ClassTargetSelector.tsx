import React, { useState, useEffect } from 'react';
import './ClassTargetSelector.css';

interface Banca {
  id: string;
  name: string;
  year?: number;
}

interface ClassTargetSelectorProps {
  classId: string;
  onTargetChange?: (bancaId: string) => void;
}

export const ClassTargetSelector: React.FC<ClassTargetSelectorProps> = ({ classId, onTargetChange }) => {
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [currentTarget, setCurrentTarget] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadBancas();
    loadCurrentTarget();
  }, [classId]);

  const loadBancas = async () => {
    try {
      const availableBancas = await (window as any).aquila.pedagogy.getBancas();
      setBancas(availableBancas);
    } catch (error) {
      console.error('Failed to load bancas', error);
    }
  };

  const loadCurrentTarget = async () => {
    setIsLoading(true);
    try {
      const target = await (window as any).aquila.pedagogy.getClassTarget(classId);
      if (target) {
        setCurrentTarget(target.banca_id);
      }
    } catch (error) {
      console.error('Failed to load current target', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (bancaId: string) => {
    try {
      await (window as any).aquila.pedagogy.setTarget(classId, bancaId, 2024);
      setCurrentTarget(bancaId);
      setShowDropdown(false);
      if (onTargetChange) onTargetChange(bancaId);
    } catch (error) {
      console.error('Failed to set target', error);
    }
  };

  const selectedBanca = bancas.find(b => b.id === currentTarget);

  return (
    <div className="class-target-selector">
      <div className="selector-label">ALVO PEDAGÓGICO</div>
      <div 
        className={`selector-trigger ${showDropdown ? 'active' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="target-info">
          <span className="target-name">
            {isLoading ? 'CARREGANDO...' : (selectedBanca?.name || 'DEFINIR FOCO')}
          </span>
          <div className="target-glow"></div>
        </div>
        <div className="selector-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {showDropdown && (
        <div className="selector-dropdown">
          {bancas.map((banca) => (
            <div 
              key={banca.id} 
              className={`dropdown-item ${currentTarget === banca.id ? 'selected' : ''}`}
              onClick={() => handleSelect(banca.id)}
            >
              <span className="item-dot"></span>
              {banca.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
