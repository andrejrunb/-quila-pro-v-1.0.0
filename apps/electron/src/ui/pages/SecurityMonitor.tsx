import React, { useState, useEffect } from 'react';
import { Shield, Radio, History, PlayCircle, AlertCircle, Map as MapIcon, Video, Box, Activity, Search } from 'lucide-react';
import { SecurityEvent } from '../../services/AiTypes';
import { SecurityAlertCard } from '../components/SecurityAlertCard';
import { FloorPlanMapper, Zone } from '../components/FloorPlanMapper';
import { VirtualTour } from '../components/VirtualTour';
import { VirtualExperienceVR } from '../components/VirtualExperienceVR';
import { EagleBalance } from '../components/EagleBalance';
import { eliteAnimate } from '../hooks/useAnime';
import './SecurityMonitor.css';

export const SecurityMonitor: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [activeTab, setActiveTab] = useState<'video' | 'map' | '3d'>('video');
  const [viewMode3D, setViewMode3D] = useState<'technical' | 'immersive'>('technical');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSemanticSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      console.log(`[Semantic Search] Executing query: ${searchQuery}`);
      const res = await window.aquila.semanticSearch(searchQuery, 'cam_01', 'Corredor Central');
      setIsSearching(false);
      
      if (res.success) {
        const newEvent: SecurityEvent = {
          id: Math.random().toString(),
          type: 'OBJECT_FOUND',
          cameraId: res.camera_id || 'cam_01',
          severity: 'medium',
          description: `Busca CLIP (${Math.round((res.similarity || 0.88) * 100)}%): "${res.query}" localizada na zona "${res.zone}".`,
          timestamp: res.timestamp || new Date().toISOString(),
          imageUrl: ''
        };
        setEvents(prev => [newEvent, ...prev]);
        alert(`Correspondência encontrada na zona "${res.zone}" com similaridade de ${Math.round((res.similarity || 0.88) * 100)}%! Bounding Box mapeada.`);
      } else {
        alert(res.error || 'Nenhum evento visual significativo correspondente a esta busca.');
      }
    } catch (e: any) {
      setIsSearching(false);
      alert(`Erro de comunicação com o CLIP: ${e.message}`);
    }
  };

  useEffect(() => {
    if (events.length > 0) {
      setTimeout(() => {
        eliteAnimate.springIn('.security-alert-card-wrapper');
      }, 100);
    }
  }, [events]);
  const [zones, setZones] = useState<Zone[]>([
    { id: 'hall', name: 'Entrada Principal', points: [], color: 'rgba(0, 150, 255, 0.3)', active: false },
    { id: 'lib', name: 'Biblioteca', points: [], color: 'rgba(0, 150, 255, 0.3)', active: false }
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.aquila) {
          const initialEvents = await window.aquila.getAiEvents();
          setEvents(initialEvents || []);
          
          const rawCameras = await window.aquila.invoke('security:get-cameras').catch(() => []);
          setCameras(Array.isArray(rawCameras) ? rawCameras : []);
        }
      } catch (e) {
        console.error('Failed to load initial security data', e);
      }
    };
    loadData();

    // Listener para novos eventos via IPC bridge
    const handleNewEvent = (event: SecurityEvent) => {
      setEvents(prev => [event, ...prev].slice(0, 50));
      
      // Ativa zona no mapa se o evento for em uma zona mapeada
      if (event.cameraId) {
         setZones(prev => prev.map(z => z.id === event.cameraId ? { ...z, active: true } : z));
         setTimeout(() => {
            setZones(prev => prev.map(z => z.id === event.cameraId ? { ...z, active: false } : z));
         }, 5000);
      }
    };

    if (window.aquila?.onAiEvent) {
      window.aquila.onAiEvent(handleNewEvent);
    }

    return () => {
    };
  }, []);

  return (
    <div className="page-root max-container">
      <header className="page-header">
        <div>
          <div className="monitor-header-left">
            <div className="monitor-icon-wrapper">
              <Shield size={24} />
            </div>
            <h1 className="monitor-title">Advanced Vision</h1>
          </div>
          <p className="monitor-subtitle">Monitoramento proativo de eventos críticos</p>
        </div>

        <div className="monitor-header-right">
          <EagleBalance userId="operator-01" />
          <div className="monitor-controls">
          <div className="tab-switcher">
            <button 
              className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              <Video size={18} />
              Câmeras
            </button>
            <button 
              className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <MapIcon size={18} />
              Mapa
            </button>
            <button 
              className={`tab-btn ${activeTab === '3d' ? 'active' : ''}`}
              onClick={() => setActiveTab('3d')}
            >
              <Box size={18} />
              Digital Twin
            </button>
            <button 
              className={`tab-btn`}
              onClick={() => onNavigate && onNavigate('network-traffic')}
            >
              <Activity size={18} />
              Tráfego de Rede
            </button>
          </div>

          <div className={`monitor-status-badge ${isLive ? 'live' : 'offline'}`}>
            <Radio size={16} className={isLive ? 'pulse-icon' : ''} />
            {isLive ? 'LIVE ANALYSIS' : 'PAUSED'}
          </div>
          </div>
        </div>
      </header>

      <div className="security-monitor-layout">
        <main className="stream-grid">
          {activeTab === 'video' ? (
            cameras.length > 0 ? (
              cameras.map(cam => (
                <div key={cam.id} className={`camera-stream-window ${events[0]?.cameraId === cam.id ? 'alerting' : ''}`}>
                  <div className="camera-label">
                    <PlayCircle size={14} />
                    {cam.name || 'CAM'}
                  </div>
                  <div className="monitor-placeholder-center">
                    <Radio size={48} opacity={0.3} />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-slate-500 h-full border border-dashed border-slate-700/50 rounded-xl">
                 <Shield size={48} className="mb-4 opacity-50" />
                 <p>Nenhuma câmera descoberta ou atrelada ao Edge Hub.</p>
                 <span className="text-xs opacity-50 block mt-2">Aguardando ONVIF Discovery...</span>
              </div>
            )
          ) : activeTab === 'map' ? (
            <div className="operational-map-container">
              <FloorPlanMapper 
                imageUrl="/school_map.png"
                zones={zones}
                onZonesChange={setZones}
                mode="edit"
              />
            </div>
          ) : (
            <div className="operational-map-container" style={{ position: 'relative' }}>
              <div className="view-mode-switcher">
                <button 
                  className={`mode-btn ${viewMode3D === 'technical' ? 'active' : ''}`}
                  onClick={() => setViewMode3D('technical')}
                >
                  Technical Twin
                </button>
                <button 
                  className={`mode-btn ${viewMode3D === 'immersive' ? 'active' : ''}`}
                  onClick={() => setViewMode3D('immersive')}
                >
                  Immersive VR
                </button>
              </div>
              {viewMode3D === 'technical' ? <VirtualTour /> : <VirtualExperienceVR />}
            </div>
          )}
        </main>

        <aside className="alert-sidebar">
          <h2>
            <AlertCircle size={20} color="#ef4444" />
            Alertas em Tempo Real
          </h2>

          {/* NVIDIA Locate Anything — Busca Semântica em Vídeo */}
          <div className="semantic-search-container" style={{ margin: '1rem 0', padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '1rem', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Search size={14} className="text-blue-400" />
              <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>Busca Semântica (Locate Anything)</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Ex: mochila vermelha esquecida..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
                style={{ flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.75rem', color: '#fff', outline: 'none' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSemanticSearch();
                }}
              />
              <button 
                onClick={handleSemanticSearch}
                disabled={isSearching}
                style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', opacity: isSearching ? 0.6 : 1 }}
              >
                {isSearching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          <div className="alert-list-scroll">
            {events.length === 0 ? (
              <div className="empty-alerts">
                <History size={48} />
                <p>Nenhuma atividade suspeita detectada</p>
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="security-alert-card-wrapper" style={{ opacity: 0 }}>
                  <SecurityAlertCard event={event} />
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SecurityMonitor;
