import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  MapPin, 
  Wind, 
  Volume2, 
  AlertCircle, 
  TrendingUp, 
  Users,
  Flame,
  Droplets,
  Sun
} from 'lucide-react';
import './ClimateReportPanel.css';

interface HeatmapData {
  zoneName: string;
  hour: number;
  eventCount: number;
}

interface Props {
  attendanceDensity: number;
  co2Levels: number;
  noiseLevels: number;
  heatmap: HeatmapData[];
}

const IntensityBar: React.FC<{ intensity: number }> = ({ intensity }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--bar-width', `${Math.min(intensity * 10, 100)}%`);
    }
  }, [intensity]);

  return <div ref={ref} className="intensity-bar" />;
};

const HeatmapItem: React.FC<{ item: HeatmapData }> = ({ item }) => {
  return (
    <div className="heatmap-item">
      <div className="zone-info">
        <MapPin size={14} />
        <span>{item.zoneName} ({item.hour}h)</span>
      </div>
      <div className="intensity-bar-container">
        <IntensityBar intensity={item.eventCount} />
      </div>
      <span className="count">{item.eventCount} eventos</span>
    </div>
  );
};

export const ClimateReportPanel: React.FC<Props> = ({ 
  attendanceDensity, 
  co2Levels, 
  noiseLevels, 
  heatmap 
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'environmental' | 'noise'>('attendance');

  return (
    <div className="climate-report-container">
      <header className="report-header">
         <div className="header-icon"><BarChart3 size={24} /></div>
         <div className="header-text">
            <h2>Relatório de Clima & Bem-Estar</h2>
            <p>Monitoramento em tempo real de habitabilidade e engajamento escolar.</p>
         </div>
      </header>

      <nav className="report-tabs">
        <button 
          className={activeTab === 'attendance' ? 'active' : ''} 
          onClick={() => setActiveTab('attendance')}
        >
          <MapPin size={18} /> Densidade
        </button>
        <button 
          className={activeTab === 'environmental' ? 'active' : ''} 
          onClick={() => setActiveTab('environmental')}
        >
          <Wind size={18} /> CO₂ & Ar
        </button>
        <button 
          className={activeTab === 'noise' ? 'active' : ''} 
          onClick={() => setActiveTab('noise')}
        >
          <Volume2 size={18} /> Acústica
        </button>
      </nav>

      <main className="report-content">
        {activeTab === 'attendance' && (
          <section className="report-section animate-fade-in">
            <div className="section-header">
              <h3><MapPin size={20} className="icon-map" /> Mapa de Aglomerações</h3>
            </div>
            <div className="heatmap-list">
              {heatmap.length > 0 ? heatmap.map((item, index) => (
                <HeatmapItem key={index} item={item} />
              )) : <p className="empty-state">Nenhuma aglomerao crtica detectada.</p>}
            </div>
          </section>
        )}

        {activeTab === 'environmental' && (
          <section className="report-section animate-fade-in">
             <div className="environmental-grid">
               <div className="env-card">
                  <div className="card-label"><Sun size={14} /> Qualidade do Ar</div>
                  <div className="card-value">{co2Levels} <span className="unit">ppm</span></div>
                  <div className="card-status status-good">Excelente</div>
               </div>
               <div className="env-card">
                  <div className="card-label"><Droplets size={14} /> Umidade</div>
                  <div className="card-value">48 <span className="unit">%</span></div>
                  <div className="card-status status-good">Ideal</div>
               </div>
             </div>
             <div className="alert-box box-info">
                <AlertCircle size={16} />
                <p>Níveis de CO₂ ideais para funções cognitivas complexas.</p>
             </div>
          </section>
        )}

        {activeTab === 'noise' && (
          <section className="report-section animate-fade-in">
             <div className="noise-meter">
                <div className="meter-label">Pressão Sonora Média</div>
                <div className="meter-value">{noiseLevels} <span className="unit">dB</span></div>
                <div className="meter-visual">
                   <div className="visual-bar active"></div>
                   <div className="visual-bar active"></div>
                   <div className="visual-bar active"></div>
                   <div className="visual-bar"></div>
                   <div className="visual-bar"></div>
                </div>
             </div>
             <p className="description">O ambiente está propício para concentração profunda e atividades pedagógicas.</p>
          </section>
        )}
      </main>

      <footer className="report-footer">
         <div className="footer-stat">
            <TrendingUp size={14} />
            <span>Engajamento: +5.2% esta semana</span>
         </div>
         <div className="footer-stat">
            <Users size={14} />
            <span>Presença: {attendanceDensity}%</span>
         </div>
      </footer>
    </div>
  );
};
