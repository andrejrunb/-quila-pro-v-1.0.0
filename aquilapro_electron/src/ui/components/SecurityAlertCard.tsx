import React from 'react';
import { AlertTriangle, Shield, Clock, MapPin, Eye } from 'lucide-react';
import { SecurityEvent, SecurityEventType } from '../../services/AiTypes';
import './SecurityAlertCard.css';

const EVENT_CONFIG: Record<SecurityEventType, { icon: any, color: string, label: string }> = {
  weapon:    { icon: Shield,       color: '#ef4444', label: 'Possível Arma' },
  group:     { icon: Eye,          color: '#f59e0b', label: 'Aglomeração' },
  fall:      { icon: Clock,        color: '#3b82f6', label: 'Queda Detectada' },
  intrusion: { icon: MapPin,       color: '#8b5cf6', label: 'Intrusão Área Restrita' },
  vandalism: { icon: AlertTriangle, color: '#ec4899', label: 'Vandalismo' },
};

interface Props {
  event: SecurityEvent;
  onDismiss?: (id: string) => void;
}

export const SecurityAlertCard: React.FC<Props> = ({ event, onDismiss }) => {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;
  
  // Como 'severity' não existe em SecurityEvent, usamos a confiança para determinar destaque
  const isHighSeverity = event.confidence > 0.8;

  return (
    <div 
      className={`security-alert-card ${isHighSeverity ? 'security-alert-card--high' : 'security-alert-card--medium'}`}
      data-event-type={event.type}
    >
      {event.confidence > 0.9 && (
        <div className="security-alert-card__glint" />
      )}

      <div className="alert-icon-wrapper">
        <Icon size={22} />
      </div>

      <div className="alert-details">
        <div className="alert-header">
          <span className="alert-header__label">
            {config.label}
          </span>
          <span className="alert-header__timestamp">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <h4 className="alert-name">
          {event.cameraName}
        </h4>
        <div className={`alert-type-badge ${isHighSeverity ? 'high' : 'medium'}`}>
          <div className="alert-type-inner-icon">
            <AlertTriangle size={16} />
          </div>
          {event.type.toUpperCase()}
        </div>
        <div className="alert-confidence">
          IA: {Math.round(event.confidence * 100)}% CONF.
        </div>
      </div>
    </div>
  );
};
