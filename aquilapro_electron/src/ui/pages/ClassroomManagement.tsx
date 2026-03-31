import React, { useState, useEffect } from 'react';
import { 
  DoorOpen, Users, Clock, Camera, 
  Plus, Trash2, ArrowLeft 
} from 'lucide-react';
import { ScheduleGrid } from '../components/ScheduleGrid';
import './ClassroomManagement.css';

interface Room {
  id: string;
  name: string;
  cameraId: string;
  location: string;
  environment?: string;
}

interface ClassObj {
  id: string;
  name: string;
  grade: string;
}

interface Schedule {
  id: string;
  classId: string;
  roomId: string;
  subject: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
}

export const ClassroomManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'classes' | 'schedules'>('rooms');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const aquila = (window as any).aquila;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [r, c, s, cams] = await Promise.all([
        aquila.invoke('get-rooms'),
        aquila.invoke('get-classes'),
        aquila.invoke('get-schedules'),
        aquila.invoke('get-cameras')
      ]);
      setRooms(r || []);
      setClasses(c || []);
      setSchedules(s || []);
      setCameras(cams || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoom = async (room: Room) => {
    await aquila.invoke('upsert-room', room);
    loadData();
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm('Deseja excluir esta sala?')) {
      await aquila.invoke('delete-room', id);
      loadData();
    }
  };

  const handleSaveSchedule = async (s: Schedule) => {
    await aquila.invoke('upsert-schedule', s);
    loadData();
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm('Excluir este horário?')) {
      await aquila.invoke('delete-schedule', id);
      loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="classroom-page">
         <div className="max-container text-center py-20 animate-pulse">
           <p className="filter-label">Carregando Infraestrutura Escolar...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="classroom-page animate-fade-in">
      <div className="max-container">
        <header className="page-header">
          <div className="header-title-group">
            <button onClick={onBack} className="btn-nav-back" aria-label="Voltar para a dashboard">
              <ArrowLeft size={18} /> <span>Voltar</span>
            </button>
            <h1>
              <DoorOpen className="text-blue-500" size={32} /> Gestão Escolar V3.5
            </h1>
            <p>Infraestrutura Centralizada e Grade Horária Inteligentes.</p>
          </div>
        </header>

        <nav className="tabs-container">
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            aria-label="Gerenciar Salas"
          >
            <Camera size={18} /> Salas
          </button>
          <button 
            onClick={() => setActiveTab('classes')}
            className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
            aria-label="Gerenciar Turmas"
          >
            <Users size={18} /> Turmas
          </button>
          <button 
            onClick={() => setActiveTab('schedules')}
            className={`tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
            aria-label="Gerenciar Grade Horária"
          >
            <Clock size={18} /> Grade Horária
          </button>
        </nav>

        <div className="management-card">
          {activeTab === 'rooms' && (
            <RoomManager rooms={rooms} cameras={cameras} onSave={handleSaveRoom} onDelete={handleDeleteRoom} />
          )}
          {activeTab === 'classes' && (
            <ClassManager 
              classes={classes} 
              onSave={async (c: any) => { await aquila.invoke('upsert-class', c); loadData(); }} 
              onDelete={async (id: string) => { if(confirm('Excluir turma?')){ await aquila.invoke('delete-class', id); loadData(); }}} 
            />
          )}
          {activeTab === 'schedules' && (
            <div className="animate-fade-in">
              <div className="schedule-filter-bar">
                <span className="filter-label">Turma Ativa:</span>
                <select 
                  className="select-premium"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  title="Selecionar Turma"
                  aria-label="Selecione uma turma para visualizar a grade"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.grade}</option>
                  ))}
                </select>
              </div>
              <ScheduleGrid 
                classId={selectedClassId}
                rooms={rooms}
                schedules={schedules}
                onSave={handleSaveSchedule}
                onDelete={handleDeleteSchedule}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RoomManager: React.FC<any> = ({ rooms, cameras, onSave, onDelete }) => {
  const [localRooms, setLocalRooms] = React.useState<any[]>(rooms);

  React.useEffect(() => {
    setLocalRooms(rooms);
  }, [rooms]);

  const handleLocalChange = (id: string, field: string, value: string) => {
    setLocalRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleBlurSave = (room: any) => {
    onSave(room);
  };

  const handleSelectChange = (room: any, field: string, value: string) => {
    const updated = { ...room, [field]: value };
    setLocalRooms(prev => prev.map(r => r.id === room.id ? updated : r));
    onSave(updated);
  };

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <h2 className="section-title">Salas do Bloco</h2>
        <button
          className="btn-add-primary"
          onClick={() => onSave({id: `room-${Date.now()}`, name: 'Nova Sala', cameraId: '', location: '', environment: ''})}
          title="Adicionar Nova Sala"
          aria-label="Adicionar Nova Sala"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="manager-grid">
        {localRooms.map((r: any) => (
          <div key={r.id} className="manager-row">
            <div className="row-identity">
              <input
                className="input-borderless"
                value={r.name}
                title="Nome da Sala"
                aria-label="Nome da Sala"
                onChange={(e) => handleLocalChange(r.id, 'name', e.target.value)}
                onBlur={() => handleBlurSave(r)}
              />
              <span className="input-sub">IDENTIFICAÇÃO DA SALA</span>
            </div>
            <div className="row-location">
              <input
                className="input-borderless input-sub"
                value={r.environment || ''}
                placeholder="Ambiente (ex: Piso 2)"
                title="Ambiente/Localização"
                aria-label="Ambiente/Localização"
                onChange={(e) => handleLocalChange(r.id, 'environment', e.target.value)}
                onBlur={() => handleBlurSave(r)}
              />
              <span className="input-sub">SETOR/ALOCAÇÃO</span>
            </div>
            <select
              className="select-premium"
              value={r.cameraId}
              title="Vincular Câmera de IA"
              aria-label="Vincular Câmera de IA"
              onChange={(e) => handleSelectChange(r, 'cameraId', e.target.value)}
            >
              <option value="">Câmera de IA...</option>
              {cameras.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              className="btn-delete-row"
              onClick={() => onDelete(r.id)}
              title="Excluir Sala"
              aria-label="Excluir Sala"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {localRooms.length === 0 && <p className="text-dim text-center py-10 italic">Nenhuma sala cadastrada no sistema.</p>}
      </div>
    </div>
  );
};

const ClassManager: React.FC<any> = ({ classes, onSave, onDelete }) => {
  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <h2 className="section-title">Turmas Ativas</h2>
        <button 
          className="btn-add-primary" 
          onClick={() => onSave({id: `class-${Date.now()}`, name: 'Turma X', grade: '1º Ano'})} 
          title="Adicionar Nova Turma" 
          aria-label="Adicionar Nova Turma"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="manager-grid classes-grid">
        {classes.map((c: any) => (
          <div key={c.id} className="manager-row row-spaced">
            <div className="row-identity">
               <input 
                 className="input-borderless w-full" 
                 value={c.name} 
                 onChange={(e) => onSave({ ...c, name: e.target.value })} 
                 title="Nome da Turma" 
                 aria-label="Nome da Turma" 
               />
               <input 
                 className="input-borderless input-sub w-full mt-1" 
                 value={c.grade} 
                 onChange={(e) => onSave({ ...c, grade: e.target.value })} 
                 placeholder="Série/Ano" 
                 title="Série/Ano" 
                 aria-label="Série/Ano" 
               />
            </div>
             <button 
                className="btn-delete-row" 
                onClick={() => onDelete(c.id)}
                title="Excluir Turma"
                aria-label="Excluir Turma"
             >
                <Trash2 size={18} />
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassroomManagement;
