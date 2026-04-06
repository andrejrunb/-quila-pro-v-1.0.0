import React, { useState } from 'react';
import './SeatingChart.css';

interface Student {
  id: string;
  name: string;
  status: 'focus' | 'fatigue' | 'talking' | 'idle';
  avatar: string;
}

const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Alvaro', status: 'focus', avatar: '👨‍🎓' },
  { id: '2', name: 'Beatriz', status: 'focus', avatar: '👩‍🎓' },
  { id: '3', name: 'Carlos', status: 'talking', avatar: '👨‍🎓' },
  { id: '4', name: 'Diana', status: 'fatigue', avatar: '👩‍🎓' },
  { id: '5', name: 'Eduardo', status: 'focus', avatar: '👨‍🎓' },
  { id: '6', name: 'Fernanda', status: 'idle', avatar: '👩‍🎓' },
  { id: '7', name: 'Gabriel', status: 'talking', avatar: '👨‍🎓' },
  { id: '8', name: 'Helena', status: 'focus', avatar: '👩‍🎓' },
  { id: '9', name: 'Igor', status: 'fatigue', avatar: '👨‍🎓' },
  { id: '10', name: 'Julia', status: 'focus', avatar: '👩‍🎓' },
];

const SeatingChart: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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
      </div>

      <div className="seating-grid">
        {MOCK_STUDENTS.map(student => (
          <div 
            key={student.id} 
            className={`student-seat ${student.status}`}
            onClick={() => setSelectedStudent(student)}
          >
            <div className="student-avatar">{student.avatar}</div>
            <div className="student-name">{student.name}</div>
            <div className={`student-status status-${student.status}`}>
              {student.status.toUpperCase()}
            </div>
          </div>
        ))}
        {/* Assentos Vazios */}
        {[...Array(5)].map((_, i) => (
          <div key={`empty-${i}`} className="student-seat seat-empty">
            <div className="student-avatar">🪑</div>
            <div className="student-name">Vazio</div>
          </div>
        ))}
      </div>

      {selectedStudent && (
        <div className="student-details-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="student-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <div className="modal-avatar">{selectedStudent.avatar}</div>
              <div className="modal-name">{selectedStudent.name}</div>
            </header>
            <div className="modal-body">
              <div className="modal-stat">
                <span>XP Total</span>
                <strong style={{color: 'gold'}}>2,450</strong>
              </div>
              <div className="modal-stat">
                <span>Nível</span>
                <strong>14</strong>
              </div>
              <div className="modal-stat">
                <span>Engajamento</span>
                <strong style={{color: 'cyan'}}>92%</strong>
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
