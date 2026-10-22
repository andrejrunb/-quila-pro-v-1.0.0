import React, { useState, useEffect } from 'react';
import SeatingChart from './SeatingChart';
import ScannerPro from './ScannerPro';
import ClassTimer from './ClassTimer';
import LogoffModal from './LogoffModal';
import EvasionRadarUI from './EvasionRadarUI';
import FinancialGlass from './FinancialGlass';
import PedagogicalLibrary from './PedagogicalLibrary';
import ParentalAdvisorUI from './ParentalAdvisorUI';
import './TeacherDashboard.css';

const TeacherDashboard: React.FC = () => {
  const [showLogoff, setShowLogoff] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [showPedagogical, setShowPedagogical] = useState(false);
  const [showParentBridge, setShowParentBridge] = useState(false);
  const [stats, setStats] = useState({ activeStudents: 0, fatigueAlert: '0%', tasksDone: 0, xpGained: 0 });

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await window.aquila.invoke('get-dashboard-stats');
      if (data) {
        setStats({
          activeStudents: data.activeStudents || 0,
          fatigueAlert: data.fatigueAlert || '0%',
          tasksDone: data.tasksDone || 0,
          xpGained: data.xpGained || 0
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  const handleEndClass = () => {
    setShowLogoff(true);
  };

  return (
    <div className="teacher-dashboard-main">
      <header className="td-header">
        <div className="td-welcome">
          <h1>Sala de Controle: Prof. Marcos</h1>
          <p>Turma 9º Ano A • História das Civilizações • 10:45 - 11:35</p>
        </div>
        <button className="td-action-btn" style={{borderColor: 'var(--timer-urgent)', color: 'var(--timer-urgent)', width: 'auto'}} onClick={handleEndClass}>
          🚪 Encerrar Aula
        </button>
      </header>

      <div className="td-layout">
        {/* Coluna 1: Info & Timer */}
        <div className="td-col">
          <ClassTimer />
          
          <div className="td-card">
            <div className="td-card-title">Resumo da Sala</div>
            <div className="td-stat-grid">
              <div className="td-stat-box">
                <div className="td-stat-val">{stats.activeStudents}</div>
                <div className="td-stat-label">Alunos On</div>
              </div>
              <div className="td-stat-box">
                <div className="td-stat-val">{stats.fatigueAlert}</div>
                <div className="td-stat-label">Alerta Fadiga</div>
              </div>
              <div className="td-stat-box">
                <div className="td-stat-val">{stats.tasksDone}</div>
                <div className="td-stat-label">Tasks Done</div>
              </div>
              <div className="td-stat-box">
                <div className="td-stat-val">+{stats.xpGained}</div>
                <div className="td-stat-label">XP Ganhos</div>
              </div>
            </div>
          </div>

          <div className="td-card">
            <div className="td-card-title">Ações Rápidas</div>
            <div className="td-btn-group">
              <button className="td-action-btn">🔊 Chamada Digital (Bluetooth)</button>
              <button className="td-action-btn" onClick={() => setShowRadar(true)}>📡 Radar de Evasão (AI)</button>
              <button className="td-action-btn" onClick={() => setShowFinance(true)}>💰 Financial Glass (PIX)</button>
              <button className="td-action-btn" onClick={() => setShowPedagogical(true)}>📚 Inteligência Pedagógica (Librarian)</button>
              <button className="td-action-btn" onClick={() => setShowParentBridge(true)}>🌉 Parent Insight Bridge (Advisor)</button>
            </div>
          </div>
        </div>

        {/* Coluna 2: Seating Chart (Nuvens Comportamentais) */}
        <div className="td-col">
          <div className="td-card" style={{height: '100%'}}>
            <div className="td-card-title">Nuvens Comportamentais (Visão Agente 1)</div>
            <SeatingChart />
          </div>
        </div>

        {/* Coluna 3: Scanner Pro & IA */}
        <div className="td-col">
          <div className="td-card">
            <div className="td-card-title">Scanner Pro: Digitalização de Lousa</div>
            <ScannerPro />
          </div>
          
          <div className="td-card">
            <div className="td-card-title">Histórico de Hoje</div>
            <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.4)'}}>
              <p>• 10:50: Scanner de Lousa #1 aprovado.</p>
              <p>• 11:05: Alerta de conversa (Setor B).</p>
            </div>
          </div>
        </div>
      </div>

      {showLogoff && <LogoffModal onClose={() => setShowLogoff(false)} />}
      
      {showRadar && (
        <div className="td-modal-overlay" onClick={() => setShowRadar(false)}>
          <div className="td-modal-content" onClick={e => e.stopPropagation()}>
            <EvasionRadarUI />
            <button className="td-modal-close" onClick={() => setShowRadar(false)}>×</button>
          </div>
        </div>
      )}

      {showFinance && (
        <div className="td-modal-overlay" onClick={() => setShowFinance(false)}>
          <div className="td-modal-content" onClick={e => e.stopPropagation()}>
            <FinancialGlass />
            <button className="td-modal-close" onClick={() => setShowFinance(false)}>×</button>
          </div>
        </div>
      )}

      {showPedagogical && (
        <div className="td-modal-overlay" onClick={() => setShowPedagogical(false)}>
          <div className="td-modal-content" onClick={e => e.stopPropagation()}>
            <PedagogicalLibrary />
            <button className="td-modal-close" onClick={() => setShowPedagogical(false)}>×</button>
          </div>
        </div>
      )}

      {showParentBridge && (
        <div className="td-modal-overlay" onClick={() => setShowParentBridge(false)}>
          <div className="td-modal-content" onClick={e => e.stopPropagation()}>
            <ParentalAdvisorUI />
            <button className="td-modal-close" onClick={() => setShowParentBridge(false)}>×</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherDashboard;
