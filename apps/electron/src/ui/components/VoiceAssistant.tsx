import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Search, Loader } from 'lucide-react';
import './VoiceAssistant.css';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

const VoiceAssistant: React.FC<Props> = ({ onResult, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    initRecognition();
    startWaves();
    return () => {
      stopRecognition();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const initRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalResult = event.results[i][0].transcript;
          setTranscript(prev => prev + ' ' + finalResult);
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (err: any) => console.error('Voice Error:', err);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSubmit = () => {
    const final = (transcript + ' ' + interimTranscript).trim();
    if (final) onResult(final);
    onClose();
  };

  const startWaves = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const drawWave = (color: string, amplitude: number, frequency: number, phase: number, width: number) => {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + Math.sin(x * frequency + phase) * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      // Camadas tecnológicas de onda (Cyberpunk/Sophisticated)
      drawWave('rgba(0, 255, 204, 0.2)', 25, 0.03, offset * 0.5, 1);
      drawWave('rgba(0, 255, 204, 0.4)', 15, 0.05, offset, 2);
      drawWave('#00ffcc', 10, 0.08, offset * 1.5, 3);
      drawWave('rgba(255, 255, 255, 0.5)', 5, 0.1, -offset * 2, 1);

      offset += 0.05;
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  return (
    <div className="voice-assistant-overlay" onClick={onClose}>
      <div className="voice-card" onClick={e => e.stopPropagation()}>
        <div className="voice-waves">
          <canvas ref={canvasRef} width={300} height={100} />
          <div className="mic-pulse">
            {isListening ? <Mic size={40} color="#00ffcc" /> : <MicOff size={40} color="#ff4444" />}
          </div>
        </div>
        
        <div className="voice-display">
          <p className="voice-hint">{isListening ? 'Ouvindo Áquila Pro...' : 'Voz processada'}</p>
          <div className="transcript-box">
             <span className="final-text">{transcript}</span>
             <span className="interim-text">{interimTranscript}</span>
          </div>
        </div>

        <div className="voice-actions">
          <button className="voice-submit-btn" onClick={handleSubmit}>
            <Search size={20} /> PESQUISAR COMANDO
          </button>
          <button className="voice-cancel-btn" onClick={onClose}>CANCELAR</button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
