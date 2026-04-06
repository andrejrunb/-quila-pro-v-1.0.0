import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Play, Square, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import './CameraConfiguration.css';

interface Camera {
  id: string;
  name: string;
  rtspUrl: string;
  room: string;
  status: 'online' | 'offline' | 'testing';
  fps: number;
  resolution: string;
  lastSeen: string | Date;
}

export const CameraConfiguration: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rtspUrl: '',
    room: '',
  });
  const [testingCamera, setTestingCamera] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const aquila = (window as any).aquila;

  const [isScanning, setIsScanning] = useState(false);
  const [discoveredCameras, setDiscoveredCameras] = useState<any[]>([]);

  const loadCameras = async () => {
    setIsLoading(true);
    try {
      const data = await aquila.invoke('get-cameras');
      setCameras(data || []);
    } catch (err) {
      console.error('Erro ao carregar câmeras:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const handleAutoScan = async () => {
    setIsScanning(true);
    setDiscoveredCameras([]);
    try {
      const results = await aquila.invoke('discover-cameras');
      setDiscoveredCameras(results || []);
    } catch (err) {
      console.error('Erro no scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddDiscovered = (cam: any) => {
    setFormData({
      name: cam.name || `Câmera ${cam.ip}`,
      rtspUrl: cam.rtspUrl,
      room: '',
    });
    setDiscoveredCameras([]);
    setShowForm(true);
  };

  const rooms = ['Sala 101', 'Sala 102', 'Sala 103', 'Sala 104', 'Sala 105', 'Corredor Principal', 'Entrada Principal', 'Pátio'];

  useEffect(() => {
    if (!formData.rtspUrl || formData.room || editingCamera) return;

    if (formData.rtspUrl.includes('192.168.1.')) {
        setFormData(prev => ({ ...prev, room: 'Corredor Principal' }));
    } else if (formData.rtspUrl.includes('192.168.2.')) {
        setFormData(prev => ({ ...prev, room: 'Entrada Principal' }));
    } else if (formData.rtspUrl.toLowerCase().includes('patio')) {
        setFormData(prev => ({ ...prev, room: 'Pátio' }));
    }
  }, [formData.rtspUrl, formData.room, editingCamera]);

  const handleAddCamera = () => {
    setEditingCamera(null);
    setFormData({ name: '', rtspUrl: '', room: '' });
    setShowForm(true);
  };

  const handleEditCamera = (camera: Camera) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      rtspUrl: camera.rtspUrl,
      room: camera.room,
    });
    setShowForm(true);
  };

  const handleDeleteCamera = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta câmera?')) {
      try {
        await aquila.invoke('remove-camera', id);
        await loadCameras();
      } catch (err) {
        alert('Erro ao deletar câmera');
      }
    }
  };

  const handleSaveCamera = async () => {
    if (!formData.name || !formData.rtspUrl || !formData.room) {
      alert('Todos os campos são obrigatórios');
      return;
    }

    try {
      if (editingCamera) {
        await aquila.invoke('update-camera', { ...editingCamera, ...formData });
      } else {
        await aquila.invoke('add-camera', {
          id: `cam-${Date.now()}`,
          ...formData,
          status: 'offline',
          fps: 1,
          resolution: '1280x720',
          lastSeen: new Date().toISOString(),
        });
      }
      setShowForm(false);
      await loadCameras();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    }
  };

  const handleTestCamera = async (cameraId: string, rtspUrl: string) => {
    setTestingCamera(cameraId);
    setTestResult(null);

    try {
      const result = await aquila.invoke('test-camera', rtspUrl);
      setTestResult(result);
      if (result.success) {
        await loadCameras();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingCamera(null);
    }
  };

  return (
    <div className="camera-config-container animate-fade-in">
      <header className="camera-config-header">
        <div className="flex items-center gap-4">
            <div className="header-icon-box">📹</div>
            <div>
                <h1>Configuração de Câmeras</h1>
                <p>Ecosystem Security & Vision Hub v1.3.0</p>
            </div>
        </div>
        <div className="header-stats">
            <span className="stat-pill">{cameras.length} Câmeras</span>
            <span className="stat-pill online">{cameras.filter(c => c.status === 'online').length} On</span>
        </div>
      </header>

      <section className="controls-bar">
        <div className="flex gap-2">
            <button
                onClick={handleAddCamera}
                className="btn-primary"
                title="Adicionar Manualmente"
            >
                <Plus className="w-5 h-5" />
                Nova Câmera
            </button>
            <button
                onClick={handleAutoScan}
                disabled={isScanning}
                className="btn-discover"
                title="Buscar câmeras na rede local"
            >
                {isScanning ? (
                    <div className="loader-mini" />
                ) : (
                    <Play className="w-5 h-5" />
                )}
                Buscar na Rede
            </button>
        </div>
      </section>

      {isScanning && (
          <div className="scanning-overlay">
              <div className="scanning-content">
                  <div className="radar-pulse" />
                  <h3>Escaneando Rede...</h3>
                  <p>Buscando dispositivos ONVIF e fluxos RTSP ativos</p>
              </div>
          </div>
      )}

      {discoveredCameras.length > 0 && (
          <div className="modal-overlay">
              <div className="modal-content discovered-modal animate-zoom-in">
                  <h2>Câmeras Encontradas ({discoveredCameras.length})</h2>
                  <div className="discovered-list">
                      {discoveredCameras.map((cam, i) => (
                          <div key={i} className="discovered-item">
                              <div className="discovered-info">
                                  <strong>{cam.name || 'Câmera IP'}</strong>
                                  <span>{cam.ip}</span>
                                  <code>{cam.rtspUrl}</code>
                              </div>
                              <button onClick={() => handleAddDiscovered(cam)} className="btn-add-discovered">
                                  Configurar
                              </button>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setDiscoveredCameras([])} className="btn-close-modal">Fechar</button>
              </div>
          </div>
      )}

      <div className="camera-grid">
        {cameras.map(camera => (
          <div key={camera.id} className="camera-card">
            <div className="camera-preview-box">
              <div className="preview-placeholder">
                <div className="preview-emoji">📹</div>
                <p className="text-sm">{camera.name}</p>
              </div>
              <div className={`status-badge ${camera.status === 'online' ? 'status-online' : 'status-offline'}`}>
                {camera.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {camera.status === 'online' ? 'Online' : 'Offline'}
              </div>
            </div>

            <div className="camera-card-content">
              <h3>{camera.name}</h3>

              <div className="camera-info-list">
                <p><span className="info-label">Sala:</span> {camera.room}</p>
                <p><span className="info-label">URL:</span> <code className="code-url" title={camera.rtspUrl}>{camera.rtspUrl.substring(0, 30)}...</code></p>
                <p><span className="info-label">Resolução:</span> {camera.resolution}</p>
                <p><span className="info-label">FPS:</span> {camera.fps}</p>
                <p><span className="info-label">Visto:</span> {new Date(camera.lastSeen).toLocaleTimeString('pt-BR')}</p>
              </div>

              {testResult && testingCamera === camera.id && (
                <div className={`test-result-alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{testResult.message}</p>
                </div>
              )}

              <div className="card-actions">
                <button
                  onClick={() => handleTestCamera(camera.id, camera.rtspUrl)}
                  disabled={testingCamera === camera.id}
                  className="btn-test"
                  title="Testar Conexão da Câmera"
                >
                  {testingCamera === camera.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-300 rounded-full animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Testar
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleEditCamera(camera)}
                  title="Editar Câmera"
                  className="action-icon-only btn-icon-blue"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteCamera(camera.id)}
                  title="Excluir Câmera"
                  className="action-icon-only btn-icon-red"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content animate-zoom-in">
            <h2>{editingCamera ? 'Editar Câmera' : 'Adicionar Câmera'}</h2>

            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Nome da Câmera</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Câmera Sala 101"
                  className="form-input"
                  title="Nome da Câmera"
                  aria-label="Nome da Câmera"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL RTSP</label>
                <input
                  type="text"
                  value={formData.rtspUrl}
                  onChange={e => setFormData({ ...formData, rtspUrl: e.target.value })}
                  placeholder="rtsp://192.168.1.100:554/stream"
                  className="form-input"
                  title="URL RTSP"
                  aria-label="URL RTSP"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sala</label>
                <select
                  aria-label="Selecionar Sala"
                  title="Selecionar Sala"
                  value={formData.room}
                  onChange={e => setFormData({ ...formData, room: e.target.value })}
                  className="form-select"
                >
                  <option value="">Selecione uma sala</option>
                  {rooms.map(room => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowForm(false)}
                className="btn-cancel"
                title="Cancelar Alterações"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCamera}
                className="btn-save"
                title="Salvar Configurações"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraConfiguration;
