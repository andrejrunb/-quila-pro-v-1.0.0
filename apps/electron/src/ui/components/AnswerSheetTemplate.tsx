import React from 'react';
import './AnswerSheetTemplate.css';

interface AnswerSheetTemplateProps {
  schoolName?: string;
  assessmentTitle: string;
  questionCount: number;
  classLabel?: string;
  dateLabel?: string;
}

const AnswerSheetTemplate: React.FC<AnswerSheetTemplateProps> = ({
  schoolName = 'NOME DA INSTITUIÇÃO',
  assessmentTitle,
  questionCount = 20,
  classLabel = 'TURMA: __________',
  dateLabel = 'DATA: ___/___/___'
}) => {
  const questions = Array.from({ length: questionCount }, (_, i) => i + 1);
  const options = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="printable-answer-sheet">
      <header className="sheet-header">
        <div className="header-top">
          <div className="school-logo-placeholder">LOGO</div>
          <div className="school-info">
            <h1 className="school-name">{schoolName}</h1>
            <h2 className="assessment-name">{assessmentTitle}</h2>
          </div>
        </div>
        
        <div className="student-info-grid">
          <div className="field-row">
            <span className="field-label">ALUNO(A):</span>
            <div className="field-line flex-grow"></div>
          </div>
          <div className="field-meta">
            <div className="field-row">
              <span className="field-label">{classLabel}</span>
            </div>
            <div className="field-row">
              <span className="field-label">{dateLabel}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="sheet-body">
        <div className="instructions">
          <strong>INSTRUÇÕES:</strong> Use caneta azul ou preta. Preencha completamente o círculo da resposta correta.
        </div>

        <div className="bubbles-container">
          {questions.map((q) => (
            <div key={q} className="question-row">
              <span className="question-number">{q.toString().padStart(2, '0')}.</span>
              <div className="options-row">
                {options.map((opt) => (
                  <div key={opt} className="option-item">
                    <div className="bubble-circle"></div>
                    <span className="option-letter">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="sheet-footer">
        <div className="footer-code">ÁQUILA PRO v1.5 - SOVEREIGN SCANNER ID: [ASSESSMENT_ID_PLACEHOLDER]</div>
      </footer>
    </div>
  );
};

export default AnswerSheetTemplate;
