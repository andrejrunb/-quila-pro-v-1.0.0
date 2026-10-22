import React, { useState, useEffect } from 'react';
import { Camera, UploadCloud, ScanLine, FileCheck, BrainCircuit, Check, X, RefreshCw, Send } from 'lucide-react';
import './AutoGraderScanner.css';

interface QuestionResult {
  id: number;
  expected: string;
  marked: string;
  correct: boolean;
}

interface GradeResult {
  studentName: string;
  studentId: string;
  score: number;
  total: number;
  questions: QuestionResult[];
}

export const AutoGraderScanner: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [statusText, setStatusText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResult(null);
        startScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = () => {
    setIsScanning(true);
    setStatusText('Alinhando gabarito (Córtex Vision)...');

    setTimeout(() => {
      setStatusText('Lendo OMR (Marcadores)...');
      setTimeout(() => {
         setStatusText('Auditando respostas por NPU...');
         setTimeout(() => {
            setIsScanning(false);
            generateMockResult();
         }, 1500);
      }, 1500);
    }, 1500);
  };

  const generateMockResult = () => {
    // Generate a random result to show UI
    const total = 10;
    const questions: QuestionResult[] = [];
    const options = ['A', 'B', 'C', 'D', 'E'];
    let correctCount = 0;

    for (let i = 1; i <= total; i++) {
      const expected = options[Math.floor(Math.random() * options.length)];
      // 70% chance of being right
      const isCorrect = Math.random() > 0.3;
      const marked = isCorrect ? expected : options.filter(o => o !== expected)[Math.floor(Math.random() * (options.length - 1))];
      
      if (isCorrect) correctCount++;
      
      questions.push({ id: i, expected, marked, correct: isCorrect });
    }

    setResult({
      studentName: 'João Gabriel (Detectado)',
      studentId: 'MAT-2026-88',
      score: correctCount,
      total,
      questions
    });
  };

  const handleSendRecoveryPlan = () => {
    alert("Plano de recuperação gerado pela IA e enviado com sucesso para o Student AI Lab do aluno!");
  };

  const handleSaveToCortex = () => {
    alert("Nota registrada no Córtex Escolar com sucesso!");
    setImage(null);
    setResult(null);
  };

  return (
    <div className="auto-grader-container">
      <div className="ag-header">
        <div className="ag-title-area">
          <h3><BrainCircuit size={20} /> Sovereign AutoGrader OMR</h3>
          <p>Correção instantânea de provas e gabaritos via Córtex Vision NPU.</p>
        </div>
      </div>

      {!image ? (
        <label className="ag-upload-zone">
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          <div className="ag-upload-content">
            <UploadCloud size={48} className="text-purple-500" />
            <span className="text-purple-300">UPLOAD OU TIRAR FOTO DO GABARITO</span>
            <small>Formatos: JPEG, PNG, HEIC</small>
          </div>
        </label>
      ) : (
        <div className="ag-preview-area">
          <img src={image} alt="Gabarito" className="ag-preview-img" />
          
          <button className="ag-btn-eject" onClick={() => { setImage(null); setResult(null); }} title="Cancelar">
             <X size={16} />
          </button>

          {isScanning && (
            <>
              <div className="ag-scan-line"></div>
              <div className="ag-processing-hud">
                <RefreshCw size={14} className="animate-spin" />
                {statusText}
              </div>
            </>
          )}
        </div>
      )}

      {result && !isScanning && (
        <div className="ag-results-panel">
          <div className="ag-grade-header">
            <div>
               <h4 className="text-lg font-bold text-white">{result.studentName}</h4>
               <p className="text-sm text-zinc-400">RA: {result.studentId}</p>
            </div>
            <div className={`ag-grade-score ${result.score >= 7 ? 'score-high' : result.score >= 5 ? 'score-medium' : 'score-low'}`}>
              {result.score}/{result.total}
            </div>
          </div>

          <div className="ag-questions-grid">
            {result.questions.map(q => (
              <div key={q.id} className="ag-question-card">
                <span className="ag-q-num">Questão {q.id}</span>
                <div className="ag-q-ans">
                  <span className={q.correct ? 'ag-ans-correct' : 'ag-ans-wrong'}>
                    Marcou: {q.marked}
                  </span>
                  {q.correct ? (
                    <Check size={18} className="text-emerald-500" />
                  ) : (
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      (Era {q.expected}) <X size={14} className="text-red-500" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="ag-actions">
            <button className="ag-btn ag-btn-save" onClick={handleSaveToCortex}>
               <FileCheck size={18} /> LANÇAR NOTA NO DIÁRIO
            </button>
            {result.score < 7 && (
              <button className="ag-btn ag-btn-recover" onClick={handleSendRecoveryPlan}>
                <Send size={18} /> GERAR PLANO DE ESTUDOS (IA)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
