import React, { useState, useEffect, useRef } from 'react';
import './GradeScanner.css';
import AnswerSheetTemplate from './AnswerSheetTemplate';

declare global {
  interface Window {
    aquila: any;
  }
}

interface Assessment {
  id: string;
  title: string;
  classId: string;
  maxScore: number;
}

interface ScanResult {
  studentId: string;
  studentName: string;
  confidence: number;
  calculatedScore: number;
  answers: Record<string, string>;
}

interface GradePayload {
  studentId: string;
  classId: string;
  assessmentId: string;
  score: number;
  type: string;
}

const GradeScanner: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  
  const lastScanTime = useRef<number>(0);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [schoolName, setSchoolName] = useState('ÁQUILA PRO SCHOOL');

  useEffect(() => {
    loadAssessments();
    loadSchoolInfo();
  }, []);

  const loadSchoolInfo = async () => {
    try {
      const settings = await window.aquila.invoke('get-school-settings');
      if (settings?.success && settings.name) {
        setSchoolName(settings.name);
      }
    } catch (err) {
      console.error('Erro ao carregar info da escola:', err);
    }
  };

  const loadAssessments = async () => {
    try {
      const data = await window.aquila.grading.getAssessments();
      setAssessments(data);
      if (data && data.length > 0) setSelectedAssessmentId(data[0].id);
    } catch (err) {
      console.error('Erro ao carregar avaliações:', err);
    }
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setScanResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (_err) {
      setFeedback({ message: 'Erro ao acessar a câmera. Verifique as permissões.', type: 'error' });
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isAutoMode && isScanning && !isProcessing) {
      scanIntervalRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastScanTime.current > 3000) { // Scan every 3 seconds in auto mode
          captureAndProcess();
        }
      }, 500);
    } else {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isAutoMode, isScanning, isProcessing]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedAssessmentId) return;

    setIsProcessing(true);
    setFeedback({ message: '🦅 Agente de Visão analisando gabarito...', type: 'info' });

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const imageBase64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      
      try {
        const result = await window.aquila.grading.scanSheet(imageBase64, selectedAssessmentId);
        
        setScanResult(result);
        
        // --- MODO AUTOMÁTICO ---
        if (isAutoMode && result.confidence > 0.9) {
          await handleAutoSave(result);
        } else {
          stopCamera();
        }
      } catch (err: unknown) {
        const errMsg = (err instanceof Error ? err.message : String(err)) || 'Erro desconhecido';
        setFeedback({ message: `Falha na leitura. Verifique a iluminação e o enquadramento do cartão. (Detalhe: ${errMsg})`, type: 'error' });
        console.error('[GradeScanner OCR Error]', { error: errMsg, assessmentId: selectedAssessmentId });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAutoSave = async (result: ScanResult) => {
    try {
      setFeedback({ message: '🚀 Confiança alta! Lançando nota automaticamente...', type: 'success' });
      await saveToDatabase(result);
      setSessionCount(prev => prev + 1);
      
      // Feedback Visual de sucesso (Glow Verde temporário)
      setIsAutoScanning(true);
      setTimeout(() => setIsAutoScanning(false), 800);

      lastScanTime.current = Date.now(); // Bloqueia novos scans por um tempo
      
      setTimeout(() => {
         setScanResult(null);
         setFeedback({ message: 'Aguardando próximo cartão...', type: 'info' });
      }, 1500);
    } catch (err: unknown) {
      setFeedback({ message: 'Erro no auto-lançamento. A nota não foi salva. Tente confirmar manualmente.', type: 'error' });
      console.error('[GradeScanner AutoSave Error]', { error: err instanceof Error ? err.message : String(err), studentId: result.studentId });
    }
  };

  const saveToDatabase = async (result: ScanResult) => {
    const assessment = assessments.find(a => a.id === selectedAssessmentId);
    return window.aquila.grading.saveAutoGrade({
      studentId: result.studentId || 'unknown',
      classId: assessment?.classId || 'T01',
      assessmentId: selectedAssessmentId,
      score: result.calculatedScore || 0,
      type: 'OCR_AUTO'
    });
  };

  const confirmAndSave = async () => {
    if (!scanResult) return;
    try {
      await saveToDatabase(scanResult);
      setFeedback({ message: '✅ Nota lançada com sucesso!', type: 'success' });
      setScanResult(null);
    } catch (err: unknown) {
      setFeedback({ message: `Erro ao salvar a nota no diário: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
      console.error('[GradeScanner Save Error]', { error: err instanceof Error ? err.message : String(err), scanResult });
    }
  };

  const handlePrint = () => {
     window.print();
  };

  if (showTemplate) {
    return (
      <div className="template-preview-overlay">
        <div className="template-actions no-print">
          <button className="btn-secondary" onClick={() => setShowTemplate(false)}>Voltar</button>
          <button className="btn-primary" onClick={handlePrint}>Imprimir Gabaritos</button>
        </div>
        <AnswerSheetTemplate 
          schoolName={schoolName}
          assessmentTitle={assessments.find(a => a.id === selectedAssessmentId)?.title || 'Avaliação'}
          questionCount={20}
        />
      </div>
    );
  }

  return (
    <div className="grade-scanner-pro animate-fade-in">
      <div className="scanner-header">
        <div className="header-titles">
          <h2 className="scanner-title">🦅 Corretor Automático Pro</h2>
          <p className="scanner-subtitle">Correção soberana v1.5 via Visão Gemini</p>
        </div>
        <button 
          className="btn-help-icon" 
          title="Central de Ajuda"
          onClick={() => (window as any).showToast?.('Suporte Pedagógico: Verifique se o cartão está alinhado e bem iluminado.', 'info', 6000)}
        >
          ❓ Ajuda
        </button>
      </div>

      <div className="scanner-toolbar">
        <div className="controls-group">
          <select 
            className="assessment-select" 
            value={selectedAssessmentId} 
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            disabled={isScanning || isProcessing}
            title="Selecione a avaliação para correção"
            aria-label="Selecione a avaliação para correção"
          >
            <option value="">Selecione a Avaliação...</option>
            {assessments.map(a => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>

          <button className="btn-outline" onClick={() => setShowTemplate(true)}>
            📝 Gerar Folhas
          </button>
        </div>

        <div className="mode-toggle">
          <label className="switch" title="Ativar modo automático de correção">
            <input 
              type="checkbox" 
              checked={isAutoMode} 
              onChange={(e) => setIsAutoMode(e.target.checked)}
              aria-label="Modo Automático de Correção"
              title="Modo Automático"
            />
            <span className="slider round"></span>
          </label>
          <span className="mode-label">Modo Automático</span>
        </div>
      </div>

      {feedback && (
        <div className={`scan-feedback ${feedback.type} animate-slide-up`}>
          {feedback.message}
        </div>
      )}

      <div className="viewport-container shadow-premium">
        {!isScanning && !scanResult && (
          <div className="camera-placeholder" onClick={startCamera}>
            <div className="placeholder-icon">📸</div>
            <p>Clique para iniciar a correção</p>
          </div>
        )}

        {isScanning && (
          <div className="video-wrapper">
            <video ref={videoRef} autoPlay playsInline className="scan-video" />
            <div className={`scan-overlay ${isAutoScanning ? 'success-flash' : ''}`}>
              <div className="scan-guide"></div>
              {(isProcessing || isAutoScanning) && <div className="scanning-bar"></div>}
              {isAutoMode && (
                <div className="batch-counter">
                  <div className="batch-label">Lote Atual</div>
                  <div className="batch-value">{sessionCount}</div>
                </div>
              )}
            </div>
            <div className="video-actions">
               <button className="btn-capture" onClick={captureAndProcess} disabled={isProcessing}>
                {isProcessing ? 'Analisando...' : 'Scanear Agora'}
              </button>
              <button className="btn-cancel-circle" onClick={stopCamera}>✕</button>
            </div>
          </div>
        )}

        {scanResult && !isScanning && (
          <div className="result-card">
            <div className="result-header">
              <div className="student-profile">
                <div className="student-avatar">👤</div>
                <div>
                  <h3>{scanResult.studentName || 'Aluno Desconhecido'}</h3>
                  <span className="id-badge">ID: {scanResult.studentId || 'N/A'}</span>
                </div>
              </div>
              <div className="confidence-meter">
                <div className="meter-fill" style={{ width: `${scanResult.confidence * 100}%` }}></div>
                <span>{(scanResult.confidence * 100).toFixed(0)}% de precisão</span>
              </div>
            </div>
            
            <div className="answers-review">
              <div className="answers-grid">
                {Object.keys(scanResult.answers).map(q => (
                  <div key={q} className={`answer-item ${scanResult.answers[q] ? 'filled' : 'empty'}`}>
                    <span className="q-num">{q}</span>
                    <span className="q-ans">{scanResult.answers[q] || '-'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="result-actions">
              <button className="btn-discard" onClick={() => setScanResult(null)}>Descartar</button>
              <button className="btn-confirm" onClick={confirmAndSave}>Confirmar e Lançar Nota</button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden-canvas" />
    </div>
  );
};

export default GradeScanner;
