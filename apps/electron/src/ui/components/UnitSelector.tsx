import React, { useState } from 'react';
import { Globe, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { UnitStatus } from '../../services/CrossUnitMessengerService';
import './UnitSelector.css';

interface UnitSelectorProps {
  selectedUnit: string;
  onSelect: (unitId: string) => void;
}

/**
 * UnitSelector (v3341-v3441)
 * Permite alternar entre unidades escolares no Dashboard SOC.
 */
export const UnitSelector: React.FC<UnitSelectorProps> = ({ selectedUnit, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const units: UnitStatus[] = [
    { unitId: 'unit-hq', name: 'Áquila HQ (Vila Mariana)', healthScore: 0.98, activeAgents: 12, occupancyCount: 450 },
    { unitId: 'unit-south', name: 'Áquila Sul (Interlagos)', healthScore: 0.92, activeAgents: 8, occupancyCount: 210 },
    { unitId: 'unit-global', name: 'Consolidado Rede', healthScore: 0.95, activeAgents: 20, occupancyCount: 660 }
  ];

  const currentUnit = units.find(u => u.unitId === selectedUnit) || units[0];

  return (
    <div className="unit-selector-wrapper">
      <button 
        type="button"
        className={`unit-selector-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        {...(isOpen ? { 'aria-expanded': 'true' } : { 'aria-expanded': 'false' })}
        title="Trocar Unidade Escolar"
        aria-label="Seletor de Unidade"
      >
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-blue-400" />
          <span className="font-semibold text-sm">{currentUnit.name}</span>
          {currentUnit.healthScore > 0.9 ? (
            <CheckCircle2 size={12} className="text-emerald-400" />
          ) : (
            <AlertTriangle size={12} className="text-amber-400" />
          )}
        </div>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="unit-dropdown" role="listbox" aria-label="Lista de unidades disponíveis">
          {units.map(unit => (
            <button
              key={unit.unitId}
              type="button"
              className={`unit-option ${selectedUnit === unit.unitId ? 'selected' : ''}`}
              onClick={() => {
                onSelect(unit.unitId);
                setIsOpen(false);
              }}
              role="option"
              {...(selectedUnit === unit.unitId ? { 'aria-selected': 'true' } : { 'aria-selected': 'false' })}
              title={`Selecionar ${unit.name}`}
            >
              <div className="unit-option-content">
                 <span className="unit-name">{unit.name}</span>
                 <span className="unit-meta">{unit.activeAgents} Agentes Ativos</span>
              </div>
              {unit.healthScore < 0.9 && <AlertTriangle size={12} className="text-amber-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
