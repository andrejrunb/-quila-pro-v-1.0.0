import React, { useState, useEffect } from 'react';
import { Wand2, Pin, PinOff, ShieldCheck, UserCheck, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface StudentSeat {
  studentId: string;
  studentName: string;
  row: number;
  col: number;
  frustrationScore: number;
  observationLevel: number;
  metadata?: any;
  pinnedRule?: string;
  isValidated?: boolean;
  status: 'focus' | 'fatigue' | 'talking';
  avatar?: string;
}

interface Recommendation {
  studentId: string;
  studentName: string;
  currentPosition: { row: number; col: number };
  suggestedPosition: { row: number; col: number };
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const DEFAULT_CLASS_ID = "CLASS-A-2024";


const SeatingChart: React.FC = () => {
  const [seats, setSeats] = useState<StudentSeat[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSeat | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIIntelligence, setShowAIIntelligence] = useState(false);
  const [validationMode, setValidationMode] = useState(false);
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const [meritAwards, setMeritAwards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadLayout();
  }, []);

  const handleValidatePresence = async (student: StudentSeat) => {
    setIsValidating(student.studentId);
    try {
      const result = await (window as any).aquila.seating.validatePresence({
        studentId: student.studentId,
        classId: DEFAULT_CLASS_ID,
        seatId: `SEAT-${student.row}-${student.col}`
      });
      
      if (result.success) {
        setSeats(prev => prev.map(s => 
          s.studentId === student.studentId ? { ...s, isValidated: true } : s
        ));
        
        // Ativar animação de mérito (burst)
        setMeritAwards(prev => ({ ...prev, [student.studentId]: true }));
        
        if (selectedStudent?.studentId === student.studentId) {
          setSelectedStudent(prev => prev ? { ...prev, isValidated: true } : null);
        }

        // Limpar animação após 2 segundos
        setTimeout(() => {
          setMeritAwards(prev => {
            const next = { ...prev };
            delete next[student.studentId];
            return next;
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(null);
    }
  };

  const loadLayout = async () => {
    try {
      const [layout, rules] = await Promise.all([
        (window as any).aquila.seating.getLayout(DEFAULT_CLASS_ID),
        (window as any).aquila.seating.getRules(DEFAULT_CLASS_ID)
      ]);
      
      const layoutData = Array.isArray(layout) ? layout : (layout?.students || []);
      const enrichedLayout = layoutData.map((seat: any) => {
        const rule = rules.find((r: any) => r.studentId === seat.id || r.studentId === seat.studentId);
        return {
          ...seat,
          studentId: seat.id || seat.studentId,
          studentName: seat.name || seat.studentName,
          pinnedRule: rule ? rule.ruleType : null,
          status: ['focus', 'fatigue', 'talking', 'idle'][Math.floor(Math.random() * 4)],
          avatar: (seat.name || seat.studentName)?.endsWith('a') ? '👩‍🎓' : '👨‍🎓'
        };
      });
      
      setSeats(enrichedLayout);
    } catch (error) {
      console.error('Failed to load seating layout:', error);
    }
  };

  const handleTogglePin = async (studentId: string, ruleType: string | null) => {
    try {
      if (ruleType) {
        await (window as any).aquila.seating.saveRule({
          classId: DEFAULT_CLASS_ID,
          rule: { studentId, ruleType }
        });
      } else {
        const rules = await (window as any).aquila.seating.getRules(DEFAULT_CLASS_ID);
        const existing = rules.find((r: any) => r.studentId === studentId);
        if (existing) {
          await (window as any).aquila.seating.deleteRule({
            classId: DEFAULT_CLASS_ID,
            ruleId: existing.id
          });
        }
      }
      loadLayout(); // Refresh
    } catch (error) {
      console.error('Failed to update pin rule:', error);
    }
  };

  const handleRunIntelligence = async () => {
    setIsAnalyzing(true);
    try {
      // Pequeno delay para efeito visual de "pensamento" da IA
      await new Promise(resolve => setTimeout(resolve, 1500));
      const suggestions = await (window as any).aquila.seating.getRecommendations(DEFAULT_CLASS_ID);
      setRecommendations(suggestions);
      setShowAIIntelligence(true);
    } catch (error) {
      console.error('Intelligence analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyRecommendation = async (rec: Recommendation) => {
    try {
      const updatedSeats = seats.map(seat => {
        if (seat.studentId === rec.studentId) {
          return { ...seat, row: rec.suggestedPosition.row, col: rec.suggestedPosition.col };
        }
        return seat;
      });

      await (window as any).aquila.seating.saveLayout(DEFAULT_CLASS_ID, updatedSeats.map(s => ({
        studentId: s.studentId,
        row: s.row,
        col: s.col
      })));

      setSeats(updatedSeats);
      setRecommendations(prev => prev.filter(r => r.studentId !== rec.studentId));
      
      if (recommendations.length <= 1) {
        setShowAIIntelligence(false);
      }
    } catch (error) {
      console.error('Failed to apply seating change:', error);
    }
  };

  return (
    <div className="seating-chart-container">
      <div className="seating-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--focus-text)' }}></div>
          <span>Foco (Deep Work)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--fatigue-text)' }}></div>
          <span>Fadiga (Sono)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--talk-text)' }}></div>
          <span>Interação (Conversa)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot ai-pulse" style={{ background: 'linear-gradient(135deg, #6e45e2, #88d3ce)' }}></div>
          <span>Sugerido pela I.A.</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ffcc00', boxShadow: '0 0 10px #ffcc00' }}></div>
          <span>Fixado (Regra Manual)</span>
        </div>
      </div>

      <div className={`seating-grid ${validationMode ? 'validation-mode-active' : ''}`}>
        {seats.sort((a, b) => (a.row * 10 + a.col) - (b.row * 10 + b.col)).map(seat => {
          const isMeritActive = meritAwards[seat.studentId];
          const hasRecommendation = recommendations.some(r => r.studentId === seat.studentId);
          
          return (
            <div 
              key={seat.studentId} 
              className={`student-seat ${seat.status} ${hasRecommendation ? 'has-ai-suggestion' : ''} ${seat.pinnedRule ? 'pinned' : ''} ${seat.isValidated ? 'validated scientific-pulse' : ''} ${isMeritActive ? 'merit-glow' : ''}`}
              onClick={() => setSelectedStudent(seat)}
            >
              {isMeritActive && (
                <>
                  <div className="merit-burst"></div>
                  <div className="merit-value">✨ +25 XP</div>
                </>
              )}
              {seat.isValidated && (
                <div className="poa-badge">
                  <ShieldCheck size={10} /> PoA Validated
                </div>
              )}
              {seat.pinnedRule && (
                <div className="pin-badge"><Pin size={10} /> {seat.pinnedRule === 'PIN_TO_FRONT' ? 'Frente' : 'Fundo'}</div>
              )}
              {seat.frustrationScore !== undefined && seat.frustrationScore > 50 && (
                <div className="frustration-badge"><AlertTriangle size={10} /> </div>
              )}
              {seat.observationLevel !== undefined && seat.observationLevel > 0 && (
                <div className="observation-badge"><ShieldAlert size={10} /> SOC {seat.observationLevel}</div>
              )}
              
              <div className="student-avatar">{seat.avatar}</div>
              <div className="student-name">{seat.studentName}</div>
              <div className={`student-status status-${seat.status}`}>
                {seat.isValidated ? 'AUDITED' : seat.status.toUpperCase()}
              </div>

              {hasRecommendation && (
                <div className="ai-suggestion-ping">
                  <Wand2 size={12} color="#fff" />
                </div>
              )}
            </div>
          );
        })}
        {/* Assentos Vazios */}
        {[...Array(Math.max(0, 15 - seats.length))].map((_, i) => (
          <div key={`empty-${i}`} className={`student-seat seat-empty ${validationMode ? 'validated-null' : ''}`}>
            <div className="student-avatar">🪑</div>
            <div className="student-name">Vazio</div>
          </div>
        ))}
      </div>

      <div className="seating-actions">
        <button 
          className={`validation-toggle-btn ${validationMode ? 'active' : ''}`}
          onClick={() => setValidationMode(!validationMode)}
        >
          {validationMode ? <UserCheck size={18} /> : <ShieldCheck size={18} />}
          {validationMode ? ' Ocultar Auditoria' : ' Ver Auditoria PoA'}
        </button>
        <button 
          className={`ai-intelligence-btn ${isAnalyzing ? 'analyzing' : ''}`}
          onClick={handleRunIntelligence}
          disabled={isAnalyzing}
        >
          <Wand2 size={18} className={isAnalyzing ? 'spin-animation' : ''} />
          {isAnalyzing ? 'Córtex Processando...' : '✨ Inteligência de Mapeamento'}
        </button>
      </div>

      {showAIIntelligence && recommendations.length > 0 && (
        <div className="recommendations-panel">
          <header className="recommendations-header">
            <h3>🤖 Sugestões do Córtex Central</h3>
            <button className="modal-close" onClick={() => setShowAIIntelligence(false)}>Ocultar</button>
          </header>
          <div className="recommendation-list">
            {recommendations.map(rec => (
              <div key={rec.studentId} className={`recommendation-item priority-${rec.priority}`}>
                <div className="recommendation-info">
                  <span className="recommendation-student">{rec.studentName}</span>
                  <p className="recommendation-reason">{rec.reason}</p>
                </div>
                <button 
                  className="apply-recommendation-btn"
                  onClick={() => applyRecommendation(rec)}
                >
                  Mover para {rec.suggestedPosition.row === 0 ? 'Frente' : `Fila ${rec.suggestedPosition.row + 1}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="student-details-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="student-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <div className="modal-avatar">{selectedStudent.avatar}</div>
              <div className="modal-name">{selectedStudent.studentName}</div>
            </header>
            <div className="modal-body">
              <div className="modal-stat">
                <span>XP Total</span>
                <strong style={{color: 'gold'}}>2,450</strong>
              </div>
              <div className="modal-stat">
                <span>Mérito Hoje</span>
                <strong style={{color: '#ffcc00'}}>+25 (PoA)</strong>
              </div>
              <div className="modal-stat">
                <span>Nível</span>
                <strong>14</strong>
              </div>
              <div className="modal-stat">
                <span>Engajamento</span>
                <strong style={{color: 'cyan'}}>92%</strong>
              </div>
              {selectedStudent.frustrationScore !== undefined && (
                <div className="modal-stat">
                  <span>Frustração (Pedagógica)</span>
                  <strong style={{color: selectedStudent.frustrationScore > 50 ? '#ff2d55' : 'inherit'}}>
                    {selectedStudent.frustrationScore}%
                  </strong>
                </div>
              )}
              {selectedStudent.observationLevel !== undefined && (
                <div className="modal-stat">
                  <span>Nível de Observação (SOC)</span>
                  <strong style={{color: selectedStudent.observationLevel >= 4 ? '#ff9f0a' : 'inherit'}}>
                    Nível {selectedStudent.observationLevel}
                  </strong>
                </div>
              )}

              <div className="modal-rule-selector">
                <h4>Auditoria de Presença (Scientific V.)</h4>
                <div className="rule-options">
                   <button 
                    className={`rule-opt validation-btn ${selectedStudent.isValidated ? 'active' : ''}`}
                    onClick={() => handleValidatePresence(selectedStudent)}
                    disabled={selectedStudent.isValidated || isValidating === selectedStudent.studentId}
                  >
                    {isValidating === selectedStudent.studentId ? 'Validando...' : (selectedStudent.isValidated ? '🛡️ Presença Auditada' : '🛡️ Validar PoA Manual')}
                  </button>
                </div>
              </div>

              <div className="modal-rule-selector">
                <h4>Regras de Posicionamento</h4>
                <div className="rule-options">
                  <button 
                    className={`rule-opt ${selectedStudent.pinnedRule === 'PIN_TO_FRONT' ? 'active' : ''}`}
                    onClick={() => handleTogglePin(selectedStudent.studentId, selectedStudent.pinnedRule === 'PIN_TO_FRONT' ? null : 'PIN_TO_FRONT')}
                  >
                    📍 Fixar na Frente
                  </button>
                  <button 
                    className={`rule-opt ${selectedStudent.pinnedRule === 'PIN_TO_BACK' ? 'active' : ''}`}
                    onClick={() => handleTogglePin(selectedStudent.studentId, selectedStudent.pinnedRule === 'PIN_TO_BACK' ? null : 'PIN_TO_BACK')}
                  >
                    📍 Fixar no Fundo
                  </button>
                </div>
                {selectedStudent.pinnedRule && (
                  <p className="rule-hint">Esta regra impede sugestões automáticas da I.A. para este aluno.</p>
                )}
              </div>
            </div>
            <button className="modal-close" onClick={() => setSelectedStudent(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatingChart;
