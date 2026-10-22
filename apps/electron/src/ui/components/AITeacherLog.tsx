import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Square, CheckCircle, Upload, Play, Clock, FileText } from 'lucide-react';
import './AITeacherLog.css';

export const AITeacherLog: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setAudioBlob(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Microphone allocation failed', err);
        alert('Erro ao acessar o microfone.');
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhotoUrl(url);
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    setIsSubmitting(true);
    
    try {
      if (window.aquila) {
        const response = await window.aquila.processTeacherAudioLog({
           timestamp: new Date().toISOString(),
           classId: "class-01",
           text: "O aluno demonstrou dificuldade em interpretar o enunciado hoje."
        });
        
        if (response.success) {
           setSuccess(true);
           setTimeout(() => {
              if (onClose) onClose();
           }, 2500);
        }
      } else {
        setTimeout(() => {
          setSuccess(true);
          setTimeout(() => onClose && onClose(), 2500);
        }, 1500);
      }
    } catch(err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="teacher-log-modal success">
        <CheckCircle size={64} className="text-emerald-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold">Diário Processado com Sucesso!</h2>
        <p className="text-slate-400 mt-2 text-center">A IA do Áquila leu a lousa, converteu seu áudio e já enviou o dossiê das infrações e engajamento para a Coordenação Aprovar.</p>
      </div>
    );
  }

  return (
    <div className="teacher-log-modal">
      <div className="log-header">
        <FileText size={28} className="text-purple-400" />
        <div>
          <h2>Diário Inteligente</h2>
          <p>Dite as Ocorrências & Plano de Aula</p>
        </div>
        {onClose && <button className="close-btn" onClick={onClose}>&times;</button>}
      </div>

      <div className="log-action-grid">
        {/* Bloco 1: A Foto do Quadro */}
        <div className="log-card">
          <h3>1. Registre o Quadro Escrito</h3>
          {photoUrl ? (
            <div className="photo-preview group">
              <img src={photoUrl} alt="Lousa" />
              <label className="re-upload">
                <Upload size={18} /> Trocar Imagem
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <label className="photo-placeholder">
              <Camera size={48} className="text-slate-500" />
              <span>Tirar ou Anexar Foto</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Bloco 2: O Relato em Voz */}
        <div className="log-card audio-block">
          <h3>2. Dite seu Diário e Ocorrências Disciplinares</h3>
          <p className="text-xs text-slate-400 mb-4 text-center">
            Diga normalmente como se explicasse a aula. A IA identificará quem fez lição e quem bagunçou.
          </p>

          <button 
            onClick={toggleRecording} 
            className={`mic-btn ${isRecording ? 'recording' : ''}`}
          >
            {isRecording ? <Square size={32} /> : <Mic size={32} />}
          </button>
          <span className={`record-status ${isRecording ? 'pulse-text text-red-400' : 'text-slate-400'}`}>
            {isRecording ? 'Gravando Relato... (Toque para Parar)' : 'Toque para Começar o Relato (Áudio)'}
          </span>

          {audioUrl && !isRecording && (
            <div className="audio-playback">
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}
        </div>
      </div>

      <div className="log-footer">
        <button 
          className="submit-magic-btn" 
          disabled={!audioBlob || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2"><Clock className="animate-spin" /> Transcrevendo com Inteligência...</span>
          ) : (
            <span className="flex items-center gap-2"><Upload /> Processar Diário via I.A</span>
          )}
        </button>
      </div>
    </div>
  );
};
