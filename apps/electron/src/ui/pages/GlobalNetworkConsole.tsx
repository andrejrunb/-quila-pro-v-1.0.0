import React, { useState, useEffect } from 'react';
import { Globe, Shield, Building2, Activity, Users, Signal, PlusCircle, XCircle } from 'lucide-react';
import { ProcurementKitBuilder } from '../components/ProcurementKitBuilder';
import { unitService, SchoolUnit } from '../../services/UnitService';
import './GlobalNetworkConsole.css';

/**
 * GlobalNetworkConsole (v1612-18)
 * Visão agregada de toda a rede de ensino.
 */
export const GlobalNetworkConsole: React.FC = () => {
  const [showKitBuilder, setShowKitBuilder] = useState(false);
  const [units, setUnits] = useState<SchoolUnit[]>(unitService.getUnits());
  const [globalAverage, setGlobalAverage] = useState(unitService.getGlobalAverage());

  useEffect(() => {
    const onUpdate = (newUnits: SchoolUnit[]) => {
      setUnits(newUnits);
      setGlobalAverage(unitService.getGlobalAverage());
    };

    unitService.on('units-update', onUpdate);
    return () => {
      unitService.off('units-update', onUpdate);
    };
  }, []);

  return (
    <div className="global-network-container">
      {/* Header */}
      <header className="network-header">
        <div>
          <div className="version-badge">
            <Globe size={24} />
            <span className="version-text">NETWORK COMMAND // V1612-18</span>
          </div>
          <h1 className="network-title">Global <span className="highlight-blue">Network</span> Console</h1>
          <button
            onClick={() => setShowKitBuilder(true)}
            className="btn-new-project"
          >
            <PlusCircle size={18} /> Novo Projeto de Implantação
          </button>
        </div>

        <div className="stats-group">
           <div className="stat-box">
              <span className="stat-label">Média Rede</span>
              <span className="stat-value">{globalAverage}%</span>
           </div>
           <div className="stat-box stat-box--blue">
              <span className="stat-label">Unidades</span>
              <span className="stat-value">{units.length}</span>
           </div>
        </div>
      </header>

      <main>
        {/* Grid de Unidades */}
        <div className="units-grid">
          {units.map(school => (
            <div
              key={school.id}
              className="unit-card"
            >
              <div className="card-top">
                <div className={`unit-icon-wrapper icon--${school.status}`}>
                  <Building2 size={24} />
                </div>
                <div className={`status-badge status--${school.status}`}>
                  {school.status}
                </div>
              </div>

              <h3 className="unit-name">
                {school.name}
              </h3>

              <div className="metrics-container">
                <div className="metric-row">
                   <div className="metric-label-group">
                      <Shield size={12} />
                      <span>Safety Score</span>
                   </div>
                   <span className={`stat-value-mini ${school.safetyScore > 90 ? 'metric-value--high' : 'metric-value--med'}`}>
                     {school.safetyScore}%
                   </span>
                </div>
                <div className="metric-row">
                   <div className="metric-label-group">
                      <Activity size={12} />
                      <span>Incidents</span>
                   </div>
                   <span className={`stat-value-mini ${school.activeIncidents > 0 ? 'metric-value--low' : 'metric-value--normal'}`}>
                     {school.activeIncidents}
                   </span>
                </div>
                <div className="metric-row">
                   <div className="metric-label-group">
                      <Users size={12} />
                      <span>Students</span>
                   </div>
                   <span className="stat-value-mini metric-value--normal">{school.studentCount}</span>
                </div>
              </div>

              <button className="btn-control">
                 Entrar no Controle <Signal size={14} />
              </button>
            </div>
          ))}

          {/* Add school placeholder */}
          <section className="card-add-unit">
             <span className="add-unit-text">Adicionar Nova Unidade</span>
          </section>
        </div>

        {showKitBuilder && (
          <div className="modal-overlay">
             <div className="modal-content">
                <ProcurementKitBuilder />
                <button
                  onClick={() => setShowKitBuilder(false)}
                  className="btn-close-modal"
                  title="Fechar Planejador"
                >
                  <XCircle size={32} />
                </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};
