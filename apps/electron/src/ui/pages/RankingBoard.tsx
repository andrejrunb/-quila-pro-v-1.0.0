import React, { useState, useEffect } from 'react';
import { Trophy, AlertTriangle, TrendingDown, Clock, ArrowLeft, Download, Shield, User, Zap } from 'lucide-react';
import './RankingBoard.tsx.css';

interface RankingEntry {
  id: string;
  name: string;
  score: number;
}

interface RiskEntry {
  id: string;
  name: string;
  absences: number;
  riskLevel: number;
  isCritical: boolean;
}

const RiskBar: React.FC<{ risk: number }> = ({ risk }) => {
  const barRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--risk-width', `${risk}%`);
    }
  }, [risk]);

  return (
    <div className="risk-bar-container" title={`${risk}% de risco`}>
      <div ref={barRef} className="risk-bar-fill" />
    </div>
  );
};

export const RankingBoard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [topPresence, setTopPresence] = useState<RankingEntry[]>([]);
  const [topLoitering, setTopLoitering] = useState<RankingEntry[]>([]);
  const [topLate, setTopLate] = useState<RankingEntry[]>([]);
  const [atRisk, setAtRisk] = useState<RiskEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const aquila = (window as any).aquila;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [presence, loitering, late, students] = await Promise.all([
        aquila.invoke('get-student-rankings', 'presence', 5, 'DESC'),
        aquila.invoke('get-student-rankings', 'loitering', 5, 'DESC'),
        aquila.invoke('get-student-rankings', 'punctuality', 5, 'DESC'),
        aquila.invoke('get-students')
      ]);

      setTopPresence(presence || []);
      setTopLoitering(loitering || []);
      setTopLate(late || []);

      // Calcula risco para os mais ausentes (simplificado)
      const riskPromises = (presence || []).map(async (s: any) => {
        const risk = await aquila.invoke('calculate-reprobation-risk', s.id);
        return { ...s, ...risk };
      });
      const riskResults = await Promise.all(riskPromises);
      setAtRisk(riskResults.sort((a, b) => b.riskLevel - a.riskLevel));

    } catch (err) {
      console.error('Erro ao carregar rankings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = () => {
    const lines: string[] = [
      'Ranking Áquila Pro — ' + new Date().toLocaleDateString('pt-BR'),
      '',
      '== ESTRELAS DE ASSIDUIDADE ==',
      'Pos,Nome,Presenças',
      ...topPresence.map((s, i) => `${i + 1},"${s.name}",${s.score}`),
      '',
      '== MONITORAMENTO DE ATRASOS ==',
      'Pos,Nome,Atrasos',
      ...topLate.map((s, i) => `${i + 1},"${s.name}",${s.score}`),
      '',
      '== RISCO DE REPROVAÇÃO ==',
      'Nome,Risco (%),Faltas,Crítico',
      ...atRisk.map(s => `"${s.name}",${s.riskLevel},${s.absences},${s.isCritical ? 'Sim' : 'Não'}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquila_ranking_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="ranking-loading">
        <div className="spinner"></div>
        <p>Gerando Inteligência de Ranking...</p>
      </div>
    );
  }

  return (
    <div className="ranking-container glass-theme">
      <header className="ranking-header">
        <button onClick={onBack} className="back-btn" title="Voltar ao Dashboard">
          <ArrowLeft size={20} />
        </button>
        <div className="header-titles">
          <h1>Ranking & Inteligência Pedagógica</h1>
          <p>Monitoramento de Performance e Mitigação de Risco</p>
        </div>
        <button className="export-btn" title="Exportar Relatório CSV" aria-label="Exportar" onClick={handleExport}>
          <Download size={20} />
        </button>
      </header>

      <div className="ranking-grid">
        {/* COLUNA 1: DESTAQUES POSITIVOS */}
        <section className="ranking-section gold-section">
          <div className="section-title">
            <Trophy className="text-yellow-500" />
            <h2>Estrelas de Assiduidade</h2>
          </div>
          <div className="entry-list">
            {topPresence.map((s, idx) => (
              <div key={s.id} className="entry-card gold-card">
                <span className="rank-num">{idx + 1}º</span>
                <div className="entry-avatar">{(s.name || 'A').charAt(0)}</div>
                <div className="entry-info">
                  <span className="entry-name">{s.name}</span>
                  <span className="entry-stat">{s.score} Presenças</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COLUNA 2: PONTOS DE ATENÇÃO */}
        <section className="ranking-section orange-section">
          <div className="section-title">
            <Clock className="text-orange-500" />
            <h2>Monitoramento de Atrasos</h2>
          </div>
          <div className="entry-list">
            {topLate.map((s, idx) => (
              <div key={s.id} className="entry-card orange-card">
                <span className="rank-num">{idx + 1}º</span>
                <div className="entry-avatar">{(s.name || 'A').charAt(0)}</div>
                <div className="entry-info">
                  <span className="entry-name">{s.name}</span>
                  <span className="entry-stat text-orange-400">{s.score} Atrasos</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COLUNA 3: RISCO DE REPROVAÇÃO */}
        <section className="ranking-section red-section">
          <div className="section-title">
            <TrendingDown className="text-red-500" />
            <h2>Risco de Reprovação</h2>
          </div>
          <div className="entry-list">
            {atRisk.map((s) => (
              <div key={s.id} className={`entry-card red-card ${s.isCritical ? 'critical-glow' : ''}`}>
                <div className="entry-avatar">{(s.name || 'A').charAt(0)}</div>
                <div className="entry-info">
                  <span className="entry-name">{s.name}</span>
                  <RiskBar risk={s.riskLevel} />
                  <span className="entry-stat">{s.riskLevel}% de Limite Consumido</span>
                </div>
                {s.isCritical && <AlertTriangle size={16} className="text-red-500 animate-pulse" />}
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="ranking-footer shadow-glow">
        <div className="footer-insight">
          <Shield size={18} className="text-blue-400" />
          <span>A Inteligência Artificial recomenda intervenção pedagógica preventiva para os 3 primeiros nomes da coluna de Risco.</span>
        </div>
      </footer>
    </div>
  );
};
