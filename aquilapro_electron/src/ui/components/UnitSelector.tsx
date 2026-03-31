import React, { useState } from 'react';
import { Globe, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import './UnitSelector.css';

interface Unit {
  id: string;
  name: string;
  status: 'online' | 'warning';
}

/**
 * UnitSelector
 * Allows switching between school units in the SOC Dashboard.
 */
export const UnitSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit>({ id: 'u1', name: 'Central Campus', status: 'online' });

  const units: Unit[] = [
    { id: 'u1', name: 'Central Campus', status: 'online' },
    { id: 'u2', name: 'North Unit', status: 'warning' },
    { id: 'u3', name: 'South Unit', status: 'online' },
    { id: 'all', name: 'Global HQ View', status: 'online' }
  ];

  return (
    <div className="unit-selector-wrapper">
      <button 
        type="button"
        className={`unit-selector-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        {...(isOpen ? { 'aria-expanded': 'true' } : { 'aria-expanded': 'false' })}
        title="Switch Campus Unit"
        aria-label="Campus Unit Selector"
      >
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-blue-400" />
          <span className="font-semibold text-sm">{selectedUnit.name}</span>
          {selectedUnit.status === 'online' ? (
            <CheckCircle2 size={12} className="text-emerald-400" />
          ) : (
            <AlertTriangle size={12} className="text-amber-400" />
          )}
        </div>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="unit-dropdown" role="listbox" aria-label="List of available units">
          {units.map(unit => (
            <button
              key={unit.id}
              type="button"
              className={`unit-option ${selectedUnit.id === unit.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedUnit(unit);
                setIsOpen(false);
              }}
              role="option"
              {...(selectedUnit.id === unit.id ? { 'aria-selected': 'true' } : { 'aria-selected': 'false' })}
              title={`Select ${unit.name}`}
            >
              <span>{unit.name}</span>
              {unit.status === 'warning' && <AlertTriangle size={12} className="text-amber-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
