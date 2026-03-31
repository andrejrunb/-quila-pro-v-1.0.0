import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Camera, Users, Clock, ChevronLeft, Layout } from 'lucide-react';
import './RoomsManagement.css'; // Vou criar este arquivo

interface Room {
  id: string;
  name: string;
  capacity: number;
  cameras: string[];
  schedules: string[];
  floor: string;
  status: 'active' | 'inactive';
}

interface RoomsManagementProps {
  onBack: () => void;
}

export const RoomsManagement: React.FC<RoomsManagementProps> = ({ onBack }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableCameras, setAvailableCameras] = useState<string[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 30,
    floor: 'Térreo',
    cameras: [] as string[],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const win = window as any;
      const roomsData = await win.electron.invoke('get-rooms');
      const mappedRooms = roomsData.map((r: any) => ({
        ...r,
        cameras: r.cameraId ? r.cameraId.split(',') : [],
        status: r.status || 'active',
        schedules: [],
      }));
      setRooms(mappedRooms);

      const camerasData = await win.electron.invoke('get-cameras');
      setAvailableCameras(camerasData.map((c: any) => c.name));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const floors = ['Térreo', '1º Andar', '2º Andar', '3º Andar'];

  const handleAddRoom = () => {
    setEditingRoom(null);
    setFormData({ name: '', capacity: 30, floor: 'Térreo', cameras: [] });
    setShowForm(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      floor: room.floor,
      cameras: room.cameras,
    });
    setShowForm(true);
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta sala?')) {
      try {
        const win = window as any;
        await win.electron.invoke('delete-room', id);
        setRooms(rooms.filter(r => r.id !== id));
      } catch (error) {
        alert('Erro ao deletar sala');
      }
    }
  };

  const handleSaveRoom = async () => {
    if (!formData.name || formData.capacity <= 0) {
      alert('Preencha todos os campos corretamente');
      return;
    }

    const roomToSave = {
      id: editingRoom ? editingRoom.id : Date.now().toString(),
      ...formData,
      status: editingRoom ? editingRoom.status : 'active',
    };

    try {
      const win = window as any;
      await win.electron.invoke('upsert-room', roomToSave);
      setShowForm(false);
      loadData();
    } catch (error) {
      alert('Erro ao salvar sala');
    }
  };

  const toggleCameraSelection = (camera: string) => {
    setFormData(prev => ({
      ...prev,
      cameras: prev.cameras.includes(camera)
        ? prev.cameras.filter(c => c !== camera)
        : [...prev.cameras, camera],
    }));
  };

  return (
    <div className="page-container rooms-management-elite">
      
      {/* Header (Zero-Debt Standard) */}
      <header className="page-header-elite">
        <div className="header-flex-group">
          <button onClick={onBack} className="btn-icon-back" title="Voltar" aria-label="Voltar">
            <ChevronLeft size={24} />
          </button>
          <div className="title-stack">
            <h1 className="page-title-elite">Gerenciamento de Salas</h1>
            <p className="page-subtitle-dim">{rooms.length} entidades configuradas</p>
          </div>
        </div>
        
        <button
          onClick={handleAddRoom}
          className="btn-primary-elite"
        >
          <Plus size={18} />
          <span>Adicionar Sala</span>
        </button>
      </header>

      {loading && (
        <div className="loading-overlay-elite">
          <div className="spinner-elite" />
        </div>
      )}

      {/* Grid de Salas */}
      <div className="rooms-grid-elite">
        {rooms.map(room => (
          <div key={room.id} className="glass-card room-card-elite">
            <div className="room-card-header">
              <div className="room-info">
                <Layout className="icon-brand" size={20} />
                <div>
                  <h3>{room.name}</h3>
                  <span className="text-label-dim">{room.floor}</span>
                </div>
              </div>
              <span className={`status-dot ${room.status}`} />
            </div>

            <div className="room-card-body">
              <div className="room-stat">
                <Users size={14} className="text-dim" />
                <span>{room.capacity} alunos</span>
              </div>
              
              <div className="room-cameras-list">
                {room.cameras.length > 0 ? (
                  room.cameras.map(cam => (
                    <span key={cam} className="camera-tag">
                      <Camera size={10} />
                      {cam}
                    </span>
                  ))
                ) : (
                  <span className="text-label-dim italic">Sem câmeras vinculadas</span>
                )}
              </div>
            </div>

            <div className="room-card-footer">
              <button 
                onClick={() => handleEditRoom(room)} 
                className="btn-card-action"
                title="Editar Sala"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDeleteRoom(room.id)} 
                className="btn-card-action delete"
                title="Excluir Sala"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="modal-overlay-elite">
          <div className="glass-card modal-content-elite animate-scale-in">
            <h2 className="modal-title-bold">
              {editingRoom ? 'Editar Sala' : 'Nova Sala'}
            </h2>

            <div className="form-grid-elite">
              <div className="form-group-elite">
                <label>Nome da Sala</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome identificador"
                />
              </div>

              <div className="form-group-elite">
                <label>Capacidade</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  min="1"
                  title="Capacidade da sala"
                  aria-label="Capacidade da sala"
                />
              </div>

              <div className="form-group-elite">
                <label>Andar</label>
                <select
                  value={formData.floor}
                  onChange={e => setFormData({ ...formData, floor: e.target.value })}
                  title="Selecione o andar"
                  aria-label="Selecione o andar"
                >
                  {floors.map(floor => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-elite cameras-selection">
                <label>Vincular Câmeras</label>
                <div className="cameras-checklist">
                  {availableCameras.map(camera => (
                    <label key={camera} className="checkbox-item-elite">
                      <input
                        type="checkbox"
                        checked={formData.cameras.includes(camera)}
                        onChange={() => toggleCameraSelection(camera)}
                      />
                      <span>{camera}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer-elite">
              <button onClick={() => setShowForm(false)} className="btn-secondary-elite">
                Cancelar
              </button>
              <button onClick={handleSaveRoom} className="btn-primary-elite">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsManagement;
