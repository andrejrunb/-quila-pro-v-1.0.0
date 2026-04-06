import React, { useState, useEffect } from 'react';
import { 
  Camera as CameraIcon, Plus, Trash2, Settings, 
  Video, AlertCircle, CheckCircle, ArrowLeft, 
  Shield, Activity, Cpu, Globe, Key, User 
} from 'lucide-react';
import './CameraManager.css';

interface Camera {
  id: string;
  name: string;
  location: string;
  ip: string;
  rtspUrl: string;
  username?: string;
  password?: string;
  status: 'online' | 'offline' | 'error';
  type: 'door' | 'gate' | 'hallWay' | 'perimeter' | 'corridor' | 'classroom' | 'other';
  resolution: string;
  fps: number;
  lastSeen: string;
  lastError?: string;
}

interface CameraManagerProps {
  onBack: () => void;
}

export const CameraManager: React.FC<CameraManagerProps> = ({ onBack }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ip: '',
    username: 'admin',
    password: '',
    type: 'corridor' as Camera['type'],
    resolution: '1920x1080',
    fps: 30,
    port: '554',
    streamPath: 'stream1',
    isWebcam: false
  });

  const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCameras();
    const aquila = (window as any).aquila;
    if (aquila?.onCameraStatusChange) {
      const unbind = aquila.onCameraStatusChange((data: any) => {
        setCameras(prev => prev.map(c => 
          c.id === data.cameraId ? { ...c, status: data.status, lastError: data.error } : c
        ));
      });
      return () => unbind();
    }
  }, []);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const aquila = (window as any).aquila;
      if (aquila?.getCameras) {
        const data = await aquila.getCameras();
        setCameras(data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading cameras:', error);
      setLoading(false);
    }
  };

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const encodedUser = encodeURIComponent(formData.username);
      const encodedPass = encodeURIComponent(formData.password);
      // Construct RTSP URL correctly handling the port and custom path
      const port = formData.port || '554';
      const path = formData.streamPath.startsWith('/') ? formData.streamPath.substring(1) : formData.streamPath;
      const rtspUrl = formData.isWebcam ? '0' : `rtsp://${encodedUser}:${encodedPass}@${formData.ip}:${port}/${path}`;
      
      const newCameraData: any = {
        id: editingId || `cam-${Date.now()}`,
        name: formData.name,
        location: formData.location,
        ip: formData.ip,
        rtspUrl,
        username: formData.username,
        password: formData.password,
        status: 'offline',
        type: formData.type,
        resolution: formData.resolution,
        fps: formData.fps,
        lastSeen: 'Agora',
        enabled: true
      };

      const aquila = (window as any).aquila;
      if (aquila?.addCamera) {
        await aquila.addCamera(newCameraData);
        await loadCameras();
      }
      
      setShowAddForm(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Error adding/updating camera:', error);
    }
  };

  const handleEditCamera = (camera: Camera) => {
    setFormData({
      name: camera.name,
      location: camera.location,
      ip: camera.ip,
      username: camera.username || 'admin',
      password: camera.password || '',
      type: camera.type,
      resolution: camera.resolution,
      fps: camera.fps,
      port: camera.rtspUrl.match(/:(\d+)\//)?.[1] || '554',
      streamPath: camera.rtspUrl.split('/').pop() || 'stream1',
      isWebcam: camera.rtspUrl === '0'
    });
    setEditingId(camera.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      ip: '',
      username: 'admin',
      password: '',
      type: 'corridor' as Camera['type'],
      resolution: '1920x1080',
      fps: 30,
      port: '554',
      streamPath: 'stream1',
      isWebcam: false
    });
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const encodedUser = encodeURIComponent(formData.username);
      const encodedPass = encodeURIComponent(formData.password);
      const port = formData.port || '554';
      const path = formData.streamPath.startsWith('/') ? formData.streamPath.substring(1) : formData.streamPath;
      const rtspUrl = formData.isWebcam ? '0' : `rtsp://${encodedUser}:${encodedPass}@${formData.ip}:${port}/${path}`;
      
      const aquila = (window as any).aquila;
      if (aquila?.testCameraConnection) {
        const result = await aquila.testCameraConnection(rtspUrl);
        setTestResult(result);
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Falha ao iniciar teste de conexão.' });
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteCamera = async (id: string) => {
    if (window.confirm('Confirmar exclusão desta unidade de captura?')) {
      try {
        const aquila = (window as any).aquila;
        if (aquila?.removeCamera) {
          await aquila.removeCamera(id);
          await loadCameras();
        }
      } catch (error) {
        console.error('Error deleting camera:', error);
      }
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

  return (
    <div className="page-container camera-manager-container">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button className="header-btn" onClick={onBack} title="Voltar ao Dashboard">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-gradient">Aquila Eye Manager</h1>
            <p className="text-dim text-xs uppercase font-bold tracking-widest mt-1">Infrastructure Multi-Stream Control</p>
          </div>
        </div>
        <button 
          className={showAddForm ? "btn-icon delete" : "header-btn"} 
          onClick={() => setShowAddForm(!showAddForm)}
          title={showAddForm ? "Cancelar" : "Nova Câmera"}
        >
          {showAddForm ? <X size={20} /> : <Plus size={20} className="text-secondary" />}
        </button>
      </header>

      {showAddForm && (
        <section className="camera-form-overlay animate-slide-up">
          <h2 className="text-sm font-black uppercase text-secondary mb-6 tracking-tighter">Configuração de Protocolo RTSP</h2>
          <form onSubmit={handleAddCamera} className="space-y-6">
            <div className="camera-form-grid">
              <div className="form-group">
                <label>Identificação</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Portaria Principal"
                  required
                />
              </div>
              <div className="form-group">
                <label>Local físico</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Bloco A - Entrada"
                  required
                />
              </div>
              <div className="form-group">
                <label>IPv4 Address</label>
                <input
                  type="text"
                  value={formData.isWebcam ? 'Local (Webcam)' : formData.ip}
                  onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                  placeholder="192.168.1.50"
                  required={!formData.isWebcam}
                  disabled={formData.isWebcam}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/5">
              <input 
                type="checkbox" 
                id="isWebcam"
                checked={formData.isWebcam}
                onChange={(e) => setFormData({ ...formData, isWebcam: e.target.checked })}
                className="w-4 h-4 accent-secondary"
              />
              <label htmlFor="isWebcam" className="text-xs font-bold uppercase tracking-wider cursor-pointer select-none">
                Usar Webcam Local (Captura Eagle Eye via USB/Integrada)
              </label>
            </div>

            <div className="camera-form-grid">
              <div className="form-group">
                <label><User size={10} className="inline mr-1" />Usuário RTSP</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="admin"
                />
              </div>
              <div className="form-group">
                <label><Key size={10} className="inline mr-1" />Senha RTSP</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required={!formData.isWebcam}
                  disabled={formData.isWebcam}
                />
              </div>
              <div className="form-group">
                <label>Porta RTSP</label>
                <input
                  type="text"
                  value={formData.isWebcam ? 'N/A' : formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  placeholder="554"
                  disabled={formData.isWebcam}
                />
              </div>
              <div className="form-group">
                <label htmlFor="streamPath">Stream Path</label>
                <input
                  id="streamPath"
                  type="text"
                  value={formData.isWebcam ? 'N/A' : formData.streamPath}
                  onChange={(e) => setFormData({ ...formData, streamPath: e.target.value })}
                  placeholder="live/ch0"
                  required={!formData.isWebcam}
                  disabled={formData.isWebcam}
                />
              </div>
            </div>

            {testResult && (
              <div className={`test-feedback animate-fade-in ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button 
                type="button" 
                className="btn-test" 
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? <div className="spinner-small"></div> : <Video size={16} />}
                {testing ? 'Testando...' : 'Testar Conexão'}
              </button>
              <button type="submit" className="header-btn px-6 py-3 bg-secondary text-white border-0">
                Ativar Captura Eagle Eye
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="cameras-grid">
        {cameras.length === 0 ? (
          <div className="glass-card p-12 text-center col-span-full">
            <Video size={48} className="mx-auto text-dim mb-4 opacity-20" />
            <p className="text-dim uppercase font-bold text-xs">Nenhuma câmera detectada na rede local.</p>
          </div>
        ) : (
          cameras.map((camera) => (
            <div key={camera.id} className="camera-card animate-fade-in">
              <div className="camera-card-header">
                <div className="flex items-center gap-3">
                  <Video size={18} className="text-secondary" />
                  <h3 className="font-bold text-sm">{camera.name}</h3>
                </div>
                <div className={`camera-status-dot ${camera.status === 'online' ? 'status-online' : 'status-offline'}`} title={camera.status} />
              </div>

              <div className="camera-info-group">
                <div className="info-item">
                  <span className="info-label">Local:</span>
                  <span className="info-value">{camera.location}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Network:</span>
                  <span className="info-value text-secondary">{camera.ip}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Resolução:</span>
                  <span className="info-value">{camera.resolution}</span>
                </div>
                {camera.lastError && (
                  <div className="info-item error-text animate-pulse">
                    <AlertCircle size={10} className="mr-1" />
                    <span className="text-[10px] font-bold uppercase">{camera.lastError}</span>
                  </div>
                )}
              </div>

              <div className="camera-card-actions">
                <button className="btn-icon" onClick={() => handleEditCamera(camera)} title="Editar Configuração">
                  <Settings size={16} />
                </button>
                <button className={camera.status === 'online' ? "btn-icon active" : "btn-icon"} title="Monitorar Stream">
                  <Activity size={16} />
                </button>
                <div className="flex-1" />
                <button className="btn-icon delete" onClick={() => handleDeleteCamera(camera.id)} title="Remover Dispositivo">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="camera-stats-bar mt-auto">
        <div className="stat-item">
          <span className="stat-label">Total Unidades</span>
          <span className="stat-value">{cameras.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Online</span>
          <span className="stat-value text-success">{cameras.filter(c => c.status === 'online').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Offline</span>
          <span className="stat-value text-danger">{cameras.filter(c => c.status !== 'online').length}</span>
        </div>
      </div>
    </div>
  );
};

const X: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default CameraManager;
