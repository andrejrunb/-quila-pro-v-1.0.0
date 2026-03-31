import React, { useState, useEffect } from 'react';
import { Camera, Video, VideoOff, Users, AlertCircle, RefreshCw, Clock, MapPin, CheckCircle } from 'lucide-react';
import './CameraLiveView.css';

interface LocalCamera {
  id: string;
  name: string;
  rtspUrl: string;
  room: string;
  status: 'online' | 'offline' | 'error';
  fps: number;
  lastSeen: string | Date;
}

interface Detection {
  id: string;
  student_id: string;
  student_name?: string;
  confidence: number;
  timestamp: string;
  zone?: string;
}

export const CameraLiveView: React.FC = () => {
  const [cameras, setCameras] = useState<LocalCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isRecognitionRunning, setIsRecognitionRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const aquila = (window as any).aquila;

  useEffect(() => {
    loadCameras();
    checkRecognitionStatus();

    if (aquila?.onFaceDetected) {
      const cleanup = aquila.onFaceDetected((data: any) => {
        setDetections(prev => [
          {
            id: `det-${Date.now()}`,
            student_id: data.student_id,
            student_name: data.student_name,
            confidence: data.confidence,
            timestamp: new Date().toISOString(),
            zone: data.zone || 'Geral'
          },
          ...prev
        ].slice(0, 50));
      });
      return () => cleanup();
    }
  }, []);

  const checkRecognitionStatus = async () => {
    try {
      const status = await aquila.invoke('get-recognition-status');
      setIsRecognitionRunning(status.isRunning);
    } catch (err) {
      console.error('Erro ao pegar status:', err);
    }
  };

  const loadCameras = async () => {
    try {
      setIsLoading(true);
      const data = await aquila.invoke('get-cameras');
      setCameras(data || []);
      if (data && data.length > 0 && !selectedCameraId) {
        setSelectedCameraId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar câmeras:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRecognition = async () => {
    try {
      if (isRecognitionRunning) {
        await aquila.invoke('stop-recognition');
        setIsRecognitionRunning(false);
      } else {
        const streamConfigs = cameras.map(c => ({
          cameraId: c.id,
          rtspUrl: c.rtspUrl,
          zone: c.room,
          fps: 1
        }));
        await aquila.invoke('start-recognition', streamConfigs);
        setIsRecognitionRunning(true);
      }
    } catch (err: any) {
      alert(`Erro no motor de IA: ${err.message}`);
    }
  };

  const selectedCamera = cameras.find(c => c.id === selectedCameraId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header Estilizado */}
      <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Monitoramento Eagle AI
          </h1>
          <p className="text-slate-400 flex items-center gap-2 mt-1">
            <Users className="w-4 h-4" /> 
            {detections.length} Reconhecimentos nesta sessão
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={loadCameras}
            title="Recarregar Câmeras"
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            onClick={handleToggleRecognition}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
              isRecognitionRunning 
                ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            {isRecognitionRunning ? (
              <>
                <VideoOff className="w-5 h-5" />
                Parar Motor IA
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Iniciar Vigilância
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Lado Esquerdo: Stream + Stats */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="relative bg-black rounded-3xl overflow-hidden aspect-video border-4 border-slate-900 shadow-2xl group">
            {selectedCamera ? (
              <>
                {/* Mock do Stream (o real viria de um elemento de video ou canvas via ffmpeg) */}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <Camera className="w-20 h-20 text-slate-800 animate-pulse" />
                  <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                      <h2 className="text-xl font-bold">{selectedCamera.name}</h2>
                      <p className="text-sm text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {selectedCamera.room}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="px-3 py-1 bg-green-500 text-black text-xs font-black rounded-full uppercase tracking-widest">
                         Live • {selectedCamera.fps} FPS
                       </span>
                    </div>
                  </div>
                </div>
                
                {/* Overlay de Reconhecimento em Tempo Real (Simulado para o Hero) */}
                {detections.length > 0 && isRecognitionRunning && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-cyan-400/50 rounded-2xl animate-pulse">
                     <div className="absolute -top-10 left-0 bg-cyan-500 text-black px-3 py-1 rounded-lg text-xs font-bold">
                        IDENTIFICADO: {detections[0].student_name}
                     </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <AlertCircle className="w-16 h-16 mb-4" />
                <p>Selecione uma câmera para iniciar</p>
              </div>
            )}
          </div>

          {/* Grid de Câmeras Secundárias */}
          <div className="grid grid-cols-4 gap-4">
            {cameras.map(cam => (
              <button 
                key={cam.id}
                onClick={() => setSelectedCameraId(cam.id)}
                className={`p-4 rounded-2xl border transition-all text-left ${
                  selectedCameraId === cam.id 
                    ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/20' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                   <div className={`w-3 h-3 rounded-full ${cam.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Cam #{cam.id.slice(-3)}</span>
                </div>
                <p className="font-bold text-sm truncate">{cam.name}</p>
                <p className="text-[10px] text-slate-400">{cam.room}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Lado Direito: Timeline de Reconhecimento */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-[750px] bg-slate-900/40 rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-slate-900/80">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Atividade Recente
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {detections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                 <Users className="w-12 h-12 mb-2" />
                 <p>Aguardando detecção...</p>
              </div>
            ) : (
              detections.map(det => (
                <div 
                  key={det.id} 
                  className="group relative bg-slate-800/50 hover:bg-slate-800 p-4 rounded-2xl border border-white/5 transition-all animate-in fade-in slide-in-from-right-4"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-100 truncate">
                        {det.student_name || 'Visitante'}
                      </p>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {(det.confidence * 100).toFixed(0)}% Match
                        </span>
                        <span className="text-slate-500">
                          {new Date(det.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-400">Ver Perfil</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraLiveView;
