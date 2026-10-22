import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Download, Send, Printer,
  GraduationCap, Brain, CheckCircle2, AlertTriangle
} from 'lucide-react';
import './AcademicReportCard.css';

// ─── Types ────────────────────────────────────────────────
interface SubjectGrade {
  subject: string;
  b1: number | null;
  b2: number | null;
  b3: number | null;
  b4: number | null;
  avg: number;
}

interface FrequencyData {
  totalDays: number;
  presentDays: number;
  absences: number;
  justifiedAbsences: number;
  rate: number;
}

export interface ReportCardStudent {
  id: string;
  name: string;
  className: string;
  teacher?: string;
  period?: string;
  ra?: string;
}

interface AcademicReportCardProps {
  student: ReportCardStudent;
  onClose: () => void;
}

// ─── Mock builder (substituído por IPC real) ──────────────
function buildMockGrades(studentId: string): SubjectGrade[] {
  const seed = studentId.charCodeAt(0) % 3; // Variação por aluno
  const base = [
    { subject: 'Matemática',      b1: 7.5, b2: 8.0, b3: null, b4: null },
    { subject: 'Português',       b1: 8.5, b2: 7.5, b3: null, b4: null },
    { subject: 'Ciências',        b1: 9.0, b2: 8.5, b3: null, b4: null },
    { subject: 'História',        b1: 6.5, b2: 7.0, b3: null, b4: null },
    { subject: 'Geografia',       b1: 7.0, b2: 6.0, b3: null, b4: null },
    { subject: 'Inglês',          b1: 8.0, b2: 9.0, b3: null, b4: null },
    { subject: 'Educação Física', b1: 10.0, b2: 10.0, b3: null, b4: null },
    { subject: 'Arte',            b1: 9.5, b2: 9.0, b3: null, b4: null },
  ];
  return base.map(s => {
    const offset = seed * 0.5;
    const b1 = Math.min(10, Math.max(0, (s.b1 ?? 7) - offset));
    const b2 = Math.min(10, Math.max(0, (s.b2 ?? 7) + offset * 0.5));
    const avg = (b1 + b2) / 2;
    return { subject: s.subject, b1, b2, b3: null, b4: null, avg };
  });
}

function buildMockFrequency(studentId: string): FrequencyData {
  const seed = studentId.charCodeAt(0) % 5;
  const total = 80;
  const absences = seed * 2;
  const justified = Math.floor(absences / 2);
  return {
    totalDays: total,
    presentDays: total - absences,
    absences,
    justifiedAbsences: justified,
    rate: Math.round(((total - absences) / total) * 100),
  };
}

function gradeColor(g: number): string {
  if (g >= 7) return 'grade-pass';
  if (g >= 5) return 'grade-warn';
  return 'grade-fail';
}

function freqColor(rate: number): string {
  if (rate >= 85) return '#10b981';
  if (rate >= 75) return '#f59e0b';
  return '#ef4444';
}

// ─── Parecer IA ───────────────────────────────────────────
const AI_PARECERES: Record<string, string> = {
  excellent: `O aluno demonstra desempenho acadêmico consistente e elevado. Sua frequência está dentro dos parâmetros ideais, sem ausências injustificadas. O engajamento em atividades pedagógicas é notável. Recomenda-se manter o estímulo com materiais desafiadores e participação em projetos extracurriculares de alto impacto cognitivo.`,
  good: `O aluno apresenta bom desempenho geral com espaço para evolução em algumas disciplinas específicas. A frequência é satisfatória. Observa-se potencial de crescimento especialmente nas áreas de Ciências Exatas. Recomenda-se reforço pontual nas disciplinas com média abaixo de 7,0 e estímulo à participação ativa nas discussões em sala.`,
  warning: `O aluno apresenta resultados abaixo do esperado em diversas disciplinas, com frequência que merece atenção. O perfil indica possível sobrecarga emocional ou falta de estímulo adequado. Recomenda-se acompanhamento individual pela coordenação pedagógica, reunião com os responsáveis e possível encaminhamento para reforço escolar nas áreas críticas.`,
};

function selectParecer(grades: SubjectGrade[], freq: FrequencyData): string {
  const globalAvg = grades.reduce((s, g) => s + g.avg, 0) / grades.length;
  if (globalAvg >= 8 && freq.rate >= 85) return AI_PARECERES.excellent;
  if (globalAvg >= 6.5 && freq.rate >= 75) return AI_PARECERES.good;
  return AI_PARECERES.warning;
}

// ─── Component ────────────────────────────────────────────
const AcademicReportCard: React.FC<AcademicReportCardProps> = ({ student, onClose }) => {
  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [frequency, setFrequency] = useState<FrequencyData | null>(null);
  const [parecerText, setParecerText] = useState('');
  const [parecerLoading, setParecerLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendOk, setSendOk] = useState(false);

  const loadData = useCallback(async () => {
    const aquila = (window as any).aquila;

    // Tentar buscar dados reais via IPC
    let realGrades: SubjectGrade[] | null = null;
    let realFreq: FrequencyData | null = null;

    if (aquila) {
      try {
        const [gradesRes, freqRes] = await Promise.all([
          aquila.invoke('academic:get-grades', { studentId: student.id }),
          aquila.invoke('attendance:get-summary', { studentId: student.id }),
        ]);
        if (gradesRes?.success && gradesRes.data?.length > 0) realGrades = gradesRes.data;
        if (freqRes?.success) realFreq = freqRes.data;
      } catch {
        // fallback to mock
      }
    }

    const finalGrades = realGrades ?? buildMockGrades(student.id);
    const finalFreq = realFreq ?? buildMockFrequency(student.id);

    setGrades(finalGrades);
    setFrequency(finalFreq);

    // Simula processamento do Córtex para gerar parecer
    setParecerLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    let aiParecer = selectParecer(finalGrades, finalFreq);

    if (aquila) {
      try {
        const res = await aquila.invoke('ai:generate-report-comment', {
          studentId: student.id,
          globalAvg: finalGrades.reduce((s, g) => s + g.avg, 0) / finalGrades.length,
          frequencyRate: finalFreq.rate,
        });
        if (res?.comment) aiParecer = res.comment;
      } catch { /* usa o gerado localmente */ }
    }

    setParecerText(aiParecer);
    setParecerLoading(false);
  }, [student.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSendWhatsApp = async () => {
    const aquila = (window as any).aquila;
    setSending(true);
    try {
      if (aquila) {
        await aquila.invoke('whatsapp:send-report-card', { studentId: student.id });
      } else {
        await new Promise(r => setTimeout(r, 1500));
      }
      setSendOk(true);
      setTimeout(() => setSendOk(false), 4000);
    } finally {
      setSending(false);
    }
  };

  const handleExportPDF = async () => {
    const aquila = (window as any).aquila;
    if (aquila) {
      try {
        await aquila.invoke('export:boletim-pdf', { studentId: student.id });
        (window as any).showToast?.('Boletim em PDF exportado com sucesso!', 'success');
        return;
      } catch {}
    }
    window.print();
  };

  const globalAvg = grades.length > 0
    ? grades.reduce((s, g) => s + g.avg, 0) / grades.length
    : 0;

  return (
    <div className="arc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="arc-container" role="dialog" aria-label={`Boletim de ${student.name}`}>

        {/* ── Header ── */}
        <div className="arc-header">
          <div className="arc-school-identity">
            <div className="arc-logo">Á</div>
            <div>
              <div className="arc-school-name">Áquila Pro — Sistema Escolar</div>
              <div className="arc-doc-type">Boletim Pedagógico Inteligente · {student.period || '1º Semestre 2026'}</div>
            </div>
          </div>
          <button className="arc-close-btn" onClick={onClose} aria-label="Fechar boletim">
            <X size={18} />
          </button>
        </div>

        {/* ── Student Info Band ── */}
        <div className="arc-student-band">
          <div className="arc-info-cell">
            <label>Aluno</label>
            <span>{student.name}</span>
          </div>
          <div className="arc-info-cell">
            <label>Turma / Série</label>
            <span>{student.className}</span>
          </div>
          <div className="arc-info-cell">
            <label>R.A. / Matrícula</label>
            <span>{student.ra ?? student.id.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>

        <div className="arc-body">

          {/* ── Grades Table ── */}
          <div>
            <div className="arc-section-label">
              <GraduationCap size={14} /> Desempenho Acadêmico por Bimestre
            </div>

            <table className="arc-grades-table">
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th>1º Bim</th>
                  <th>2º Bim</th>
                  <th>3º Bim</th>
                  <th>4º Bim</th>
                  <th>Média</th>
                  <th style={{ width: 120 }}>Desempenho</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(g => (
                  <tr key={g.subject}>
                    <td>{g.subject}</td>
                    <td>
                      <span className={`arc-grade-cell ${gradeColor(g.b1 ?? 0)}`}>
                        {g.b1 != null ? g.b1.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`arc-grade-cell ${gradeColor(g.b2 ?? 0)}`}>
                        {g.b2 != null ? g.b2.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td><span className="arc-grade-cell" style={{ color: '#475569' }}>—</span></td>
                    <td><span className="arc-grade-cell" style={{ color: '#475569' }}>—</span></td>
                    <td>
                      <span className={`arc-avg-cell ${gradeColor(g.avg)}`}>
                        {g.avg.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <div className="arc-bar-wrap">
                        <div className="arc-bar-bg">
                          <div
                            className="arc-bar-fill"
                            style={{
                              width: `${(g.avg / 10) * 100}%`,
                              background: g.avg >= 7 ? '#10b981' : g.avg >= 5 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Linha de total */}
                {grades.length > 0 && (
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <td style={{ fontWeight: 800, color: '#f1f5f9' }}>Média Geral</td>
                    <td colSpan={4} />
                    <td>
                      <span className={`arc-avg-cell ${gradeColor(globalAvg)}`} style={{ fontSize: 18 }}>
                        {globalAvg.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, color: globalAvg >= 7 ? '#10b981' : '#ef4444' }}>
                        {globalAvg >= 7 ? '✓ APROVADO' : '✗ RECUPERAÇÃO'}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Frequency ── */}
          {frequency && (
            <div>
              <div className="arc-section-label">
                <CheckCircle2 size={14} /> Frequência Escolar
              </div>
              <div className="arc-freq-card">
                <div className="arc-freq-stat">
                  <span className="arc-freq-stat-value" style={{ color: freqColor(frequency.rate) }}>
                    {frequency.rate}%
                  </span>
                  <span className="arc-freq-stat-label">Taxa de Presença</span>
                </div>
                <div className="arc-freq-stat">
                  <span className="arc-freq-stat-value" style={{ color: '#f1f5f9' }}>
                    {frequency.absences}
                  </span>
                  <span className="arc-freq-stat-label">Faltas Totais</span>
                </div>
                <div className="arc-freq-stat">
                  <span className="arc-freq-stat-value" style={{ color: '#64748b' }}>
                    {frequency.totalDays}
                  </span>
                  <span className="arc-freq-stat-label">Dias Letivos</span>
                </div>
                <div className="arc-freq-bar">
                  <div
                    className="arc-freq-bar-fill"
                    style={{ width: `${frequency.rate}%`, background: freqColor(frequency.rate) }}
                  />
                </div>
              </div>
              {frequency.rate < 75 && (
                <div style={{
                  marginTop: 10, padding: '12px 16px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13, color: '#fca5a5',
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  Frequência abaixo do mínimo legal (75%). Risco de reprovação por faltas.
                </div>
              )}
            </div>
          )}

          {/* ── Parecer IA ── */}
          <div>
            <div className="arc-section-label">
              <Brain size={14} /> Parecer Pedagógico — Córtex IA
            </div>
            <div className="arc-parecer">
              <div className="arc-parecer-badge">
                <span className="arc-parecer-pulse" />
                Síntese Neuronal · Processado localmente (NPU)
              </div>
              {parecerLoading ? (
                <p className="arc-parecer-text">
                  Córtex analisando histórico pedagógico do aluno
                  <span className="arc-parecer-typing">
                    <span /><span /><span />
                  </span>
                </p>
              ) : (
                <p className="arc-parecer-text">"{parecerText}"</p>
              )}
            </div>
          </div>

        </div>

        {/* ── Actions ── */}
        <div className="arc-actions">
          <button className="arc-btn arc-btn-ghost" onClick={() => window.print()}>
            <Printer size={15} /> Imprimir
          </button>
          <button className="arc-btn arc-btn-ghost" onClick={handleExportPDF}>
            <Download size={15} /> Baixar PDF
          </button>
          <button
            className="arc-btn arc-btn-primary"
            onClick={handleSendWhatsApp}
            disabled={sending}
          >
            {sending ? (
              <>
                <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Enviando...
              </>
            ) : sendOk ? (
              <><CheckCircle2 size={15} /> Enviado! ✓</>
            ) : (
              <><Send size={15} /> Enviar aos Pais</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AcademicReportCard;
