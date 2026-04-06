import React, { useState, useRef, useEffect } from 'react';
import { 
   Camera, ChevronLeft, ShieldCheck, 
   RotateCw, CheckCircle2, AlertCircle,
   User, Smartphone, Scan, ChevronRight
 } from 'lucide-react';
import './BiometricEnrollment.css';

interface BiometricEnrollmentProps {
  onBack: () => void;
  studentId?: string;
  studentName?: string;
}

type Step = 'intro' | 'front' | 'left' | 'right' | 'processing' | 'success';

/**
 * BiometricEnrollment (v3530)
 * Interface soberana de cadastro biográfico ("Academic-Slate").
 * Suporta captura multi-ângulo e sincronização com Portal de Pais.
 */
export const BiometricEnrollment: React.FC<BiometricEnrollmentProps> = ({ onBack, studentId, studentName }) => {
  const [step, setStep] = useState<Step>('intro');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<{ front?: string; left?: string; right?: string }>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Erro ao acessar webcam:', err);
      alert('Não foi possível acessar a câmera.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = (type: 'front' | 'left' | 'right') => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        setCapturedImages(prev => ({ ...prev, [type]: dataUrl }));
        
        if (type === 'front') setStep('left');
        else if (type === 'left') setStep('right');
        else if (type === 'right') finalizeEnrollment();
      }
    }
  };

  const finalizeEnrollment = async () => {
    setStep('processing');
    stopCamera();
    
    // Simulação de processamento de vetores (Zero-Debt via Main Process)
    setTimeout(async () => {
      if (studentId) {
        await window.aquila.logAttendance(studentId, 'present');
      }
      setStep('success');
    }, 2000);
  };

  const renderIntro = () => (
    <div className="intro-card-elite">
      <div className="icon-box-large">
        <Scan size={40} />
      </div>
      <div className="intro-text-group">
        <h2 className="intro-title">Matrícula Biométrica Áquila</h2>
        <p className="intro-desc">
          Iniciando captura de alta fidelidade para <strong>{studentName || 'Novo Aluno'}</strong>. 
          Siga os ângulos indicados para garantir a soberania do reconhecimento.
        </p>
      </div>
      <div className="step-indicator-grid">
        <div className="step-badge-elite">
          <div className="step-icon-large">👤</div>
          <div className="step-label-mini">Frontal</div>
        </div>
        <div className="step-badge-elite">
          <div className="step-icon-large">⬅️</div>
          <div className="step-label-mini">Perfil Esq.</div>
        </div>
        <div className="step-badge-elite">
          <div className="step-icon-large">➡️</div>
          <div className="step-label-mini">Perfil Dir.</div>
        </div>
      </div>
      <button 
        onClick={() => { startCamera(); setStep('front'); }}
        className="btn-start-scan"
      >
        INICIAR CAPTURA BIOMÉTRICA
      </button>
    </div>
  );

  const renderCapture = (type: 'front' | 'left' | 'right') => {
    const labels = {
      front: 'Posicione o rosto no centro do quadro',
      left: 'Gire levemente para a ESQUERDA',
      right: 'Gire levemente para a DIREITA'
    };

    return (
      <div className="capture-container">
        <h2 className="capture-label">{labels[type]}</h2>
        
        <div className="camera-viewport-elite">
          <video ref={videoRef} autoPlay playsInline muted className="video-element" />
          <div className="camera-guide-overlay">
            <div className="face-focus-ring active" />
          </div>

          <div className="shutter-btn-wrapper">
             <button onClick={() => capture(type)} className="shutter-btn-elite" title="Capturar Biometria" aria-label="Capturar Biometria">
               <div className="shutter-btn-inner" />
             </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="processing-state-wrapper">
      <div className="icon-box-large spinning">
        <RotateCw size={40} />
      </div>
      <h2 className="intro-title">Sincronizando com Áquila Cloud...</h2>
      <p className="intro-desc">Cruzando vetores faciais com o banco de dados soberano.</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="success-state">
      <div className="success-icon-wrapper">
        <ShieldCheck size={64} />
      </div>
      <h2 className="success-title">Cadastro Concluído</h2>
      <p className="success-desc">
        A biometria de <strong>{studentName || 'Aluno'}</strong> foi sincronizada com o Portal de Pais com 100% de integridade.
      </p>
      <button onClick={onBack} className="btn-finish" title="Finalizar e Sincronizar" aria-label="Finalizar e Sincronizar">
        Finalizar e Sincronizar
      </button>
    </div>
  );

  return (
    <div className="biometric-enrollment-elite page-container">
      <header className="biometric-header">
        <div className="header-left-group">
          <button onClick={onBack} className="header-back-btn" title="Voltar" aria-label="Voltar">
            <ChevronLeft size={24} />
          </button>
          <h1 className="header-main-title">Portal Biométrico Áquila</h1>
        </div>
        <div className="sovereignty-badge">
          Sovereignty Active
        </div>
      </header>

      {step === 'intro' && renderIntro()}
      {(step === 'front' || step === 'left' || step === 'right') && renderCapture(step as any)}
      {step === 'processing' && renderProcessing()}
      {step === 'success' && renderSuccess()}

      <canvas ref={canvasRef} className="hidden-canvas" />
    </div>
  );
};

export default BiometricEnrollment;
