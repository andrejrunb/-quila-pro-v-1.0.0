import React, { useState, useMemo } from 'react';
import {
  Flame,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Printer,
  Sparkles,
  BookOpen,
  Filter,
  Users,
  TrendingUp,
  X,
  Target,
  ArrowRight
} from 'lucide-react';
import { BNCC_SKILLS_DATA, BNCCSkillNode } from './BNCCSkillTree';
import { STUDENTS } from '../../database/studentsData';
import './BNCCProficiencyHeatmap.css';

interface BNCCProficiencyHeatmapProps {
  initialClassId?: string;
  onNavigateToMastery?: (studentId: string, skillCode: string) => void;
}

const DEFAULT_CLASSES = [
  { id: 'F-EF26A', name: '6º Ano A — Fundamental II' },
  { id: 'F-EF26B', name: '6º Ano B — Fundamental II' },
  { id: 'F-EF27A', name: '7º Ano A — Fundamental II' },
  { id: 'F-EF27B', name: '7º Ano B — Fundamental II' },
  { id: 'F-EF28A', name: '8º Ano A — Fundamental II' },
  { id: 'F-EF29A', name: '9º Ano A — Fundamental II' },
  { id: 'F-EM1A',  name: '1ª Série A — Ensino Médio' },
  { id: 'F-EM1B',  name: '1ª Série B — Ensino Médio' },
  { id: 'F-EM2A',  name: '2ª Série A — Ensino Médio' },
  { id: 'F-EM3A',  name: '3ª Série A — Ensino Médio (ENEM)' }
];

export const BNCCProficiencyHeatmap: React.FC<BNCCProficiencyHeatmapProps> = ({
  initialClassId = 'F-EM3A',
  onNavigateToMastery
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedArea, setSelectedArea] = useState<string>('todas');
  const [activeSkillDetail, setActiveSkillDetail] = useState<BNCCSkillNode | null>(null);

  // Filtrar alunos da turma
  const classStudents = useMemo(() => {
    const list = STUDENTS.filter(s => s.classId === selectedClassId);
    if (list.length > 0) return list;
    // Fallback: alunos da primeira turma disponível
    return STUDENTS.slice(0, 20);
  }, [selectedClassId]);

  // Filtrar habilidades por macroárea
  const filteredSkills = useMemo(() => {
    if (selectedArea === 'todas') return BNCC_SKILLS_DATA;
    return BNCC_SKILLS_DATA.filter(s => s.area === selectedArea);
  }, [selectedArea]);

  // Gerar matriz de notas determinística/persistida para cada aluno x habilidade
  const matrixData = useMemo(() => {
    return classStudents.map((st, sIdx) => {
      // Semente pseudo-aleatória determinística baseada no RA do aluno
      const raNum = parseInt(st.registrationNumber, 10) || (sIdx * 1000 + 42);
      
      const skillScores: Record<string, number> = {};
      let sum = 0;

      filteredSkills.forEach((sk, kIdx) => {
        // Base de proficiência entre 40 e 95
        const hash = Math.sin(raNum * 0.13 + kIdx * 1.7) * 10000;
        const rand = hash - Math.floor(hash);

        // Habilidades com theta maior (mais difíceis) têm média menor
        const difficultyOffset = sk.triTheta * 6; // -12 a +15 pts
        let score = Math.round(72 + (rand * 32 - 16) - difficultyOffset);
        score = Math.max(25, Math.min(98, score));

        skillScores[sk.code] = score;
        sum += score;
      });

      const avg = filteredSkills.length > 0 ? Math.round(sum / filteredSkills.length) : 0;

      return {
        student: st,
        skillScores,
        avgScore: avg
      };
    });
  }, [classStudents, filteredSkills]);

  // Médias de cada habilidade para o rodapé da tabela
  const skillAverages = useMemo(() => {
    const avgs: Record<string, number> = {};
    filteredSkills.forEach(sk => {
      let sum = 0;
      matrixData.forEach(row => {
        sum += row.skillScores[sk.code] || 0;
      });
      avgs[sk.code] = matrixData.length > 0 ? Math.round(sum / matrixData.length) : 0;
    });
    return avgs;
  }, [filteredSkills, matrixData]);

  // KPIs Resumo da Turma
  const summaryKpis = useMemo(() => {
    if (matrixData.length === 0 || filteredSkills.length === 0) {
      return { classAvg: 0, topSkill: null, weakSkill: null, criticalStudentsCount: 0 };
    }

    const totalSum = matrixData.reduce((acc, row) => acc + row.avgScore, 0);
    const classAvg = Math.round(totalSum / matrixData.length);

    let maxAvg = -1;
    let minAvg = 999;
    let topSkillCode = filteredSkills[0].code;
    let weakSkillCode = filteredSkills[0].code;

    filteredSkills.forEach(sk => {
      const avg = skillAverages[sk.code] || 0;
      if (avg > maxAvg) {
        maxAvg = avg;
        topSkillCode = sk.code;
      }
      if (avg < minAvg) {
        minAvg = avg;
        weakSkillCode = sk.code;
      }
    });

    const topSkill = filteredSkills.find(s => s.code === topSkillCode) || null;
    const weakSkill = filteredSkills.find(s => s.code === weakSkillCode) || null;
    const criticalStudentsCount = matrixData.filter(r => r.avgScore < 60).length;

    return { classAvg, topSkill, weakSkill, criticalStudentsCount };
  }, [matrixData, filteredSkills, skillAverages]);

  // Alunos em déficit na habilidade selecionada no detalhe
  const studentsInDeficitForActiveSkill = useMemo(() => {
    if (!activeSkillDetail) return [];
    return matrixData
      .filter(row => (row.skillScores[activeSkillDetail.code] || 0) < 60)
      .map(row => ({
        name: row.student.name,
        ra: row.student.registrationNumber,
        score: row.skillScores[activeSkillDetail.code]
      }));
  }, [activeSkillDetail, matrixData]);

  const handleDispatchLeveling = () => {
    if (!activeSkillDetail) return;
    (window as any).showToast?.(
      `Disparado plano de nivelamento socrático na Câmara de Maestria para ${studentsInDeficitForActiveSkill.length} alunos em déficit na habilidade ${activeSkillDetail.code}!`,
      'success'
    );
  };

  const getHeatClass = (score: number) => {
    if (score >= 75) return 'mastered';
    if (score >= 55) return 'developing';
    return 'critical';
  };

  return (
    <div className="bncc-heatmap-shell animate-fade-in">
      {/* ── Toolbar Superior ── */}
      <header className="heatmap-header-bar">
        <div className="heatmap-title-group">
          <h2>
            <Flame size={22} className="text-amber-400" />
            Mapa de Calor de Proficiência Curricular BNCC
          </h2>
          <p>
            Diagnóstico coletivo e distribuição de domínio por habilidade e parâmetros TRI para Conselho Pedagógico
          </p>
        </div>

        <div className="heatmap-actions-row">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="heatmap-select"
            aria-label="Turma Selecionada"
          >
            {DEFAULT_CLASSES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button className="btn-heatmap-action" onClick={() => window.print()}>
            <Printer size={15} /> Imprimir Relatório (PDF)
          </button>
        </div>
      </header>

      {/* ── Filtros de Macroárea ── */}
      <nav className="heatmap-area-tabs" aria-label="Macroáreas da BNCC">
        <button
          className={`area-tab-btn ${selectedArea === 'todas' ? 'active' : ''}`}
          onClick={() => setSelectedArea('todas')}
        >
          <BookOpen size={14} /> Todas ({BNCC_SKILLS_DATA.length})
        </button>
        <button
          className={`area-tab-btn ${selectedArea === 'matematica' ? 'active' : ''}`}
          onClick={() => setSelectedArea('matematica')}
        >
          <span>📐 Matemática</span>
        </button>
        <button
          className={`area-tab-btn ${selectedArea === 'natureza' ? 'active' : ''}`}
          onClick={() => setSelectedArea('natureza')}
        >
          <span>🔬 Ciências da Natureza</span>
        </button>
        <button
          className={`area-tab-btn ${selectedArea === 'linguagens' ? 'active' : ''}`}
          onClick={() => setSelectedArea('linguagens')}
        >
          <span>✍️ Linguagens & Redação</span>
        </button>
        <button
          className={`area-tab-btn ${selectedArea === 'humanas' ? 'active' : ''}`}
          onClick={() => setSelectedArea('humanas')}
        >
          <span>🏛️ Ciências Humanas</span>
        </button>
      </nav>

      {/* ── KPI Cards de Resumo da Turma ── */}
      <div className="heatmap-kpi-grid">
        <div className="heatmap-kpi-card">
          <span className="heatmap-kpi-label">MÉDIA GLOBAL DA TURMA</span>
          <span className="heatmap-kpi-value" style={{ color: '#00F0FF' }}>
            {summaryKpis.classAvg}%
          </span>
          <span className="heatmap-kpi-sub">{classStudents.length} alunos avaliados</span>
        </div>

        <div className="heatmap-kpi-card">
          <span className="heatmap-kpi-label">HABILIDADE EM DESTAQUE</span>
          <span className="heatmap-kpi-value" style={{ color: '#10B981' }}>
            {summaryKpis.topSkill?.code || '—'}
          </span>
          <span className="heatmap-kpi-sub">
            {summaryKpis.topSkill?.title || 'Consistência plena'} ({skillAverages[summaryKpis.topSkill?.code || ''] || 0}%)
          </span>
        </div>

        <div className="heatmap-kpi-card alert">
          <span className="heatmap-kpi-label">PONTO CRÍTICO DE ATENÇÃO</span>
          <span className="heatmap-kpi-value" style={{ color: '#EF4444' }}>
            {summaryKpis.weakSkill?.code || '—'}
          </span>
          <span className="heatmap-kpi-sub">
            {summaryKpis.weakSkill?.title || 'Sem déficits'} ({skillAverages[summaryKpis.weakSkill?.code || ''] || 0}%)
          </span>
        </div>

        <div className="heatmap-kpi-card">
          <span className="heatmap-kpi-label">ALUNOS EM NIVELAMENTO</span>
          <span className="heatmap-kpi-value" style={{ color: summaryKpis.criticalStudentsCount > 0 ? '#F59E0B' : '#10B981' }}>
            {summaryKpis.criticalStudentsCount}
          </span>
          <span className="heatmap-kpi-sub">
            {summaryKpis.criticalStudentsCount > 0 ? 'Requerem intervenção socrática' : 'Nenhum aluno em risco'}
          </span>
        </div>
      </div>

      {/* ── Barra de Legenda ── */}
      <div className="heatmap-legend-bar">
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-chip green" />
            <span>Domínio Consolidado (≥ 75%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-chip yellow" />
            <span>Em Desenvolvimento (55% – 74%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-chip red" />
            <span>Alerta de Nivelamento (&lt; 55%)</span>
          </div>
        </div>
        <span style={{ color: '#94a3b8' }}>
          * Dica: Clique no código da habilidade no cabeçalho para ver o dossiê pedagógico e alunos em déficit.
        </span>
      </div>

      {/* ── Gaveta de Detalhe da Habilidade Selecionada ── */}
      {activeSkillDetail && (
        <div className="skill-detail-drawer">
          <div className="drawer-header">
            <div>
              <h3>{activeSkillDetail.code} — {activeSkillDetail.title}</h3>
              <div className="drawer-badge-row">
                <span className="drawer-pill">Área: {activeSkillDetail.discipline}</span>
                <span className="drawer-pill">Dificuldade TRI (θ): {activeSkillDetail.triTheta}</span>
                <span className="drawer-pill">Média da Turma: {skillAverages[activeSkillDetail.code]}%</span>
              </div>
            </div>
            <button className="drawer-close-btn" onClick={() => setActiveSkillDetail(null)}>
              <X size={18} />
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>
            {activeSkillDetail.description}
          </p>

          <div className="drawer-mentor-card">
            <div style={{ fontSize: '1.4rem' }}>{activeSkillDetail.mentor.badgeIcon}</div>
            <div>
              <h4>{activeSkillDetail.mentor.name} ({activeSkillDetail.mentor.role})</h4>
              <p>"{activeSkillDetail.mentor.quote}"</p>
            </div>
          </div>

          {studentsInDeficitForActiveSkill.length > 0 ? (
            <div className="drawer-intervention-list">
              <h4>⚠️ Alunos em Déficit nesta Competência ({studentsInDeficitForActiveSkill.length}):</h4>
              <div className="students-tag-cloud">
                {studentsInDeficitForActiveSkill.map(s => (
                  <span key={s.ra} className="student-tag-item">
                    {s.name} ({s.score}%)
                  </span>
                ))}
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <button className="btn-heatmap-action" onClick={handleDispatchLeveling}>
                  <Sparkles size={14} /> Disparar Micro-Passos de Nivelamento na Câmara de Maestria
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#10B981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} /> Todos os alunos da turma atingiram proficiência consolidada nesta habilidade!
            </div>
          )}
        </div>
      )}

      {/* ── A Matriz de Calor 2D (Tabela Interativa) ── */}
      <div className="heatmap-table-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th className="col-student">ESTUDANTE / RA</th>
              {filteredSkills.map(sk => (
                <th key={sk.code}>
                  <div
                    className="skill-col-header"
                    onClick={() => setActiveSkillDetail(sk)}
                    title={`Clique para inspecionar: ${sk.title}`}
                  >
                    <span className="skill-header-code">{sk.code}</span>
                    <span className="skill-header-theta">θ: {sk.triTheta}</span>
                  </div>
                </th>
              ))}
              <th className="col-avg">MÉDIA</th>
            </tr>
          </thead>

          <tbody>
            {matrixData.map(row => (
              <tr key={row.student.registrationNumber}>
                <td className="cell-student">
                  <div className="student-info-row">
                    <span className="student-info-name">{row.student.name}</span>
                    <span className="student-info-ra">RA: {row.student.registrationNumber}</span>
                  </div>
                </td>

                {filteredSkills.map(sk => {
                  const score = row.skillScores[sk.code] || 0;
                  return (
                    <td key={sk.code} className="cell-heat" onClick={() => setActiveSkillDetail(sk)}>
                      <span className={`heat-badge ${getHeatClass(score)}`}>
                        {score}
                      </span>
                    </td>
                  );
                })}

                <td className="cell-student-avg" style={{ color: row.avgScore >= 70 ? '#10B981' : row.avgScore >= 55 ? '#F59E0B' : '#EF4444' }}>
                  {row.avgScore}%
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td className="tfoot-student-label">MÉDIA GERAL DA TURMA</td>
              {filteredSkills.map(sk => {
                const avg = skillAverages[sk.code] || 0;
                return (
                  <td key={sk.code}>
                    <span className={`heat-badge ${getHeatClass(avg)}`} style={{ fontWeight: 900 }}>
                      {avg}%
                    </span>
                  </td>
                );
              })}
              <td style={{ color: '#00F0FF', fontWeight: 900 }}>
                {summaryKpis.classAvg}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BNCCProficiencyHeatmap;
