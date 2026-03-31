import React, { useState, useEffect } from 'react';
import { Camera, AlertTriangle, Monitor } from 'lucide-react';

interface CameraFeedProps {
  cameraId: string;
  zone: string;
  status: 'online' | 'offline' | 'unstable';
}

const CameraFeed: React.FC<CameraFeedProps> = ({ cameraId, zone, status }) => {
  return (
    <div className={`camera-feed-box ${status}`}>
      <div className="feed-header">
        <span className="camera-name">{zone}</span>
        <div className={`status-led ${status}`}></div>
      </div>
      
      <div className="feed-placeholder">
        {status === 'offline' ? (
          <div className="offline-msg">
            <AlertTriangle size={36} />
            <span>Fluxo Interrompido</span>
          </div>
        ) : (
          <div className="active-feed-msg">
            <Camera size={36} />
            <span>FEED ATIVO</span>
          </div>
        )}
      </div>

      <style>{`
        .camera-feed-box {
          aspect-ratio: 16/9; background: #000; border-radius: 8px;
          overflow: hidden; position: relative; border: 2px solid transparent;
          transition: border 0.3s;
        }
        .camera-feed-box.online { border-color: rgba(0, 255, 0, 0.2); }
        .camera-feed-box.offline { border-color: var(--danger); }
        
        .feed-header {
          position: absolute; top: 0; left: 0; right: 0;
          padding: 8px 12px; background: rgba(0,0,0,0.6);
          display: flex; justify-content: space-between; align-items: center;
          z-index: 10;
        }
        .camera-name { color: #fff; font-size: 0.8rem; font-weight: bold; }
        .status-led { width: 8px; height: 8px; border-radius: 50%; }
        .status-led.online { background: #4ade80; box-shadow: 0 0 8px #4ade80; }
        .status-led.offline { background: #f87171; }

        .feed-placeholder {
          height: 100%; display: flex; align-items: center;
          justify-content: center; color: #444; flex-direction: column;
        }
        .offline-msg { color: #f87171; display: flex; flex-direction: column; align-items: center; gap: 8px; }
      `}</style>
    </div>
  );
};

export const MultiStreamGrid: React.FC = () => {
  const [cameras, setCameras] = useState<CameraFeedProps[]>([]);
  const [layout, setLayout] = useState<4 | 9 | 16>(4);

  useEffect(() => {
    // Simular carregamento inicial das câmeras ativas
    setCameras([
      { cameraId: 'cam1', zone: 'Entrada Principal', status: 'online' },
      { cameraId: 'cam2', zone: 'Corredor A', status: 'online' },
      { cameraId: 'cam3', zone: 'Pátio', status: 'online' },
      { cameraId: 'cam4', zone: 'Saída Estacionamento', status: 'offline' },
    ]);
  }, []);

  return (
    <div className="multistream-container">
      <div className="grid-controls glass">
        <div className="control-left">
          <Monitor size={18} />
          <h3>Monitoramento de Alta Densidade</h3>
        </div>
        <div className="layout-switcher">
          <button className={layout === 4 ? 'active' : ''} onClick={() => setLayout(4)}>2x2</button>
          <button className={layout === 9 ? 'active' : ''} onClick={() => setLayout(9)}>3x3</button>
          <button className={layout === 16 ? 'active' : ''} onClick={() => setLayout(16)}>4x4</button>
        </div>
      </div>

      <div className={`video-grid layout-${layout}`}>
        {cameras.map(cam => (
          <CameraFeed key={cam.cameraId} {...cam} />
        ))}
      </div>

      <style>{`
        .multistream-container { display: flex; flex-direction: column; gap: 16px; padding: 16px; height: 100%; }
        .grid-controls {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 20px; border-radius: 12px;
        }
        .control-left { display: flex; align-items: center; gap: 12px; color: var(--info); }
        .layout-switcher { display: flex; gap: 8px; }
        .layout-switcher button {
          padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border);
          background: transparent; color: var(--text-muted); cursor: pointer;
        }
        .layout-switcher button.active { background: var(--info); color: #fff; border-color: var(--info); }

        .video-grid { display: grid; gap: 12px; width: 100%; }
        .video-grid.layout-4 { grid-template-columns: repeat(2, 1fr); }
        .video-grid.layout-9 { grid-template-columns: repeat(3, 1fr); }
        .video-grid.layout-16 { grid-template-columns: repeat(4, 1fr); }
      `}</style>
    </div>
  );
};

export default MultiStreamGrid;
