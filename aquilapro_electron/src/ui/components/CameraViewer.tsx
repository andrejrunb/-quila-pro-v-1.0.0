import React, { useState, useEffect, useRef } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import './CameraViewer.css';

interface CameraViewerProps {
  cameraId: string;
  cameraUrl: string;
  location: string;
}

/**
 * Componente para visualizar stream de câmera em tempo real
 */
export const CameraViewer: React.FC<CameraViewerProps> = ({
  cameraId,
  cameraUrl,
  location,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected: wsConnected, lastMessage } = useWebSocket();

  // Conectar ao stream de câmera
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Simular conexão ao stream MJPEG
    // Em produção, usar HLS ou RTMP
    const connectToStream = async () => {
      try {
        // Tentar conectar ao stream
        video.src = `${cameraUrl}?timestamp=${Date.now()}`;
        video.onloadedmetadata = () => {
          setIsConnected(true);
          setError(null);
          console.log(`Câmera ${cameraId} conectada`);
        };
        video.onerror = () => {
          setIsConnected(false);
          setError('Falha ao conectar à câmera');
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao conectar');
      }
    };

    connectToStream();

    return () => {
      video.src = '';
    };
  }, [cameraId, cameraUrl]);

  // Processar detecções do WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'detection' && lastMessage.data.cameraId === cameraId) {
      setDetections(lastMessage.data.detections || []);
      drawDetections();
    }
  }, [lastMessage, cameraId]);

  // Desenhar bounding boxes de detecções
  const drawDetections = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar detecções
    for (const detection of detections) {
      // Bounding box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);

      // Label
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px Arial';
      const label = `${detection.id} (${(detection.confidence * 100).toFixed(0)}%)`;
      ctx.fillText(label, detection.x, detection.y - 5);
    }
  };

  return (
    <div className="camera-viewer">
      <div className="camera-header">
        <h3>{location}</h3>
        <div className="camera-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{isConnected ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div className="camera-container">
        <video
          ref={videoRef}
          className="camera-stream"
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="detection-overlay"
          width={1920}
          height={1080}
        />
      </div>

      {error && <div className="camera-error">{error}</div>}

      <div className="camera-info">
        <div className="info-item">
          <span className="label">ID:</span>
          <span className="value">{cameraId}</span>
        </div>
        <div className="info-item">
          <span className="label">Detecções:</span>
          <span className="value">{detections.length}</span>
        </div>
        <div className="info-item">
          <span className="label">WebSocket:</span>
          <span className={`value ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CameraViewer;

