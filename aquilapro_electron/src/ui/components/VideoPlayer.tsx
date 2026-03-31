import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Clock, Camera, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface ClipEntry {
  id: string;
  cameraId: string;
  zone: string;
  startTs: string;
  filePath: string;
  thumbnailPath?: string;
  eventType: string;
}

interface Props {
  clip?: ClipEntry;
  clips?: ClipEntry[];
}

export const VideoPlayer: React.FC<Props> = ({ clip, clips = [] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentClipIdx, setCurrentClipIdx] = useState(0);
  const [currentClip, setCurrentClip] = useState<ClipEntry | undefined>(clip || clips[0]);

  useEffect(() => {
    if (!currentClip || !videoRef.current) return;
    videoRef.current.src = `file://${currentClip.filePath}`;
    videoRef.current.load();
    setIsPlaying(false);
    setProgress(0);
  }, [currentClip]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    videoRef.current.currentTime = pct * duration;
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const goToPrev = () => {
    const idx = Math.max(0, currentClipIdx - 1);
    setCurrentClipIdx(idx);
    setCurrentClip(clips[idx]);
  };

  const goToNext = () => {
    const idx = Math.min(clips.length - 1, currentClipIdx + 1);
    setCurrentClipIdx(idx);
    setCurrentClip(clips[idx]);
  };

  return (
    <div className="bg-slate-950 text-white flex flex-col gap-0 rounded-[32px] overflow-hidden border border-white/5 shadow-3xl">
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between bg-slate-900/80 border-b border-white/5 backdrop-blur-md">
        <div className="flex gap-4 items-center">
          <Camera className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-black text-slate-200 uppercase tracking-widest">{currentClip?.zone || 'Clipe de Segurança'}</span>
          {currentClip && (
            <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-red-500/10 text-red-400 tracking-widest">
              {currentClip.eventType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
          <Clock className="w-3 h-3" />
          {currentClip ? new Date(currentClip.startTs).toLocaleString('pt-BR') : '---'}
        </div>
      </div>

      {/* Video Area */}
      <div className="relative bg-black aspect-video w-full group">
        {currentClip?.filePath ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700">
            <Camera className="w-20 h-20 opacity-20" />
            <p className="mt-4 text-sm font-bold text-slate-600">Nenhum clipe selecionado</p>
          </div>
        )}

        {/* Overlay Controls (Appear on hover) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform border border-white/10 shadow-2xl"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 pl-1" />}
          </button>
        </div>
      </div>

      {/* Scrubber + Controls */}
      <div className="px-8 py-5 bg-slate-900 border-t border-white/5">
        {/* Progress Bar */}
        <div
          className="h-1.5 bg-slate-800 rounded-full mb-5 cursor-pointer group/bar relative"
          onClick={seek}
        >
          <div 
            className="video-progress-fill" 
            style={{ '--video-progress': `${progress}%` } as React.CSSProperties}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
            </button>
            <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <span className="text-xs font-mono text-slate-400">
              {videoRef.current ? formatTime(videoRef.current.currentTime) : '00:00'} / {formatTime(duration)}
            </span>
          </div>

          {clips.length > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={goToPrev} disabled={currentClipIdx === 0} title="Clipe Anterior" className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs text-slate-500 font-bold">{currentClipIdx + 1} / {clips.length}</span>
              <button onClick={goToNext} disabled={currentClipIdx === clips.length - 1} title="Próximo Clipe" className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
