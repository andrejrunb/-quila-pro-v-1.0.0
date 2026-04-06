import React, { useState } from 'react';
import './ScannerPro.css';

interface AIResult {
  text: string;
  flashcards: string[];
}

const ScannerPro: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleUpload = async () => {
    // Simulação de fluxo de upload e processamento de I.A
    setIsProcessing(true);
    setPreviewUrl('https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=500&auto=format&fit=crop&q=60');
    
    await new Promise(r => setTimeout(r, 2500)); // Tempo da I.A "pensar"

    setResult({
      text: 'Revolução Industrial: 1. Inovações tecnológicas (Máquina a vapor). 2. Impacto social (Urbanização). 3. Novas classes (Proletariado vs Burguesia).',
      flashcards: ['Qual a principal inovação da 1ª Rev?', 'O que marcou o êxodo rural?']
    });
    setIsProcessing(false);
  };

  const handleApprove = () => {
    alert('✅ Aula processada! 5 Flashcards e 1 Resumo adicionados ao Hub de Estudos da turma.');
    setResult(null);
    setPreviewUrl(null);
  };

  return (
    <div className="scanner-container">
      {!previewUrl && (
        <div className="scanner-dropzone" onClick={handleUpload}>
          <div className="scanner-drop-icon">📸</div>
            <div className="scanner-drop-text">
              <div className="scanner-drop-title">Escaneie a Lousa</div>
              <div className="scanner-drop-sub">Clique para subir foto ou arraste</div>
            </div>
        </div>
      )}

      {previewUrl && (
        <div className="scanner-preview">
          <img className="preview-image" src={previewUrl} alt="Lousa" />
          <div className="preview-content">
            <div className="preview-title">✦ Extração por I.A local</div>
            {isProcessing ? (
              <div className="scanner-processing">
                <div className="spinner"></div>
                <span>Agente 2 está lendo a lousa...</span>
              </div>
            ) : (
              <div className="preview-text">
                {result?.text}
              </div>
            )}
            
            {!isProcessing && result?.flashcards && (
              <div className="flashcards-preview-section">
                <div className="preview-title title-gold">Flashcards Gerados</div>
                <ul className="flashcards-list">
                  {result.flashcards.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {previewUrl && !isProcessing && (
        <div className="scanner-actions">
          <button className="scanner-btn btn-secondary" onClick={() => { setPreviewUrl(null); setResult(null); }}>
            Descartar
          </button>
          <button className="scanner-btn btn-primary" onClick={handleApprove}>
            Aprovar e Exportar
          </button>
        </div>
      )}
    </div>
  );
};

export default ScannerPro;
