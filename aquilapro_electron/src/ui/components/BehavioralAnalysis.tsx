import React, { useState, useEffect } from 'react';
import { UserCheck, Activity, Coffee, Target, AlertCircle, MapIcon, TrendingUp, ChevronRight } from 'lucide-react';
import './BehavioralAnalysis.css';

/**
 * Phase 241 — BehavioralAnalysis
 * Interface soberana para acompanhamento de métricas emocionais e risco de evasão.
 * Removido Tailwind. Estilização via BehavioralAnalysis.css + CSS Variables.
 */

interface BehavioralAnalysisProps {
  studentId?: string;
}

const BehavioralAnalysis: React.FC<BehavioralAnalysisProps> = ({ studentId }) => {
  const [analysis, setAnalysis] = useState<any>({
    riskScore: 0,
    emotions: { stress: 0, fatigue: 0, engagement: 0.8, anxiety: 0, aggression: 0 }
  });
  const [poseEvents, setPoseEvents] = useState<any[]>([]);
  const [highRiskStudents, setHighRiskStudents] = useState<any[]>([]);

  useEffect(() => {
    // 1. Live Telemetry Loop
    const telemetryInterval = setInterval(async () => {
      const data = await (window as any).api.invoke('behavioral:get-live');
      if (data) setAnalysis(data);
    }, 5000);

    // 2. Load High Risk Profiles
    const loadProfiles = async () => {
      const profiles = await (window as any).api.invoke('behavioral:get-evasion-profiles');
      if (profiles) setHighRiskStudents(profiles);
    };

    loadProfiles();
    return () => clearInterval(telemetryInterval);
  }, []);

  return (
    <div className="behavioral-sovereignty-v3540">
      <div className="telemetry-grid-v3540">
        
        {/* Facial Expression Analytics */}
        <div className="cobalt-analytics-card">
          <div className="card-header-minimal">
            <UserCheck size={14} className="icon-telemetry teal" />
            <h3>EMOTIONAL TELEMETRY</h3>
          </div>
          
          <div className="risk-score-display">
            <div className={`risk-hex ${analysis.riskScore > 75 ? 'danger' : ''}`}>
              <span className="risk-value-text">{analysis.riskScore}</span>
              <span className="risk-unit">%</span>
            </div>
            <p className="risk-description">Current Behavioral Risk Index</p>
          </div>

          <div className="emotions-telemetry-list">
            <EmotionMetric 
              label="Stress" 
              value={analysis.emotions.stress} 
              icon={<Activity size={12} />} 
              color="stress"
            />
            <EmotionMetric 
              label="Fatigue" 
              value={analysis.emotions.fatigue} 
              icon={<Coffee size={12} />} 
              color="fatigue"
            />
            <EmotionMetric 
              label="Engagement" 
              value={analysis.emotions.engagement} 
              icon={<Target size={12} />} 
              color="engagement"
            />
          </div>
        </div>

        {/* Pose & Physical Activity */}
        <div className="cobalt-analytics-card">
          <div className="card-header-minimal">
            <Activity size={14} className="icon-telemetry blue" />
            <h3>POSTURE TELEMETRY</h3>
          </div>
          <div className="pose-stream-v3540 custom-scrollbar">
            {poseEvents.length === 0 && (
              <div className="empty-state-telemetry">
                Awaiting physical signal...
              </div>
            )}
            {poseEvents.map(event => (
              <div key={event.id} className={`telemetry-item-row ${event.confidence > 0.9 ? 'alert' : ''}`}>
                <div className="item-meta">
                  <span className="item-type">{event.type.replace('_', ' ')}</span>
                  <span className="item-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="intensity-bar">
                  <div 
                    className="intensity-fill" 
                    style={{ '--int-width': `${event.intensity * 100}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive Evasion Risk */}
        <div className="cobalt-analytics-card highlighted-card">
          <div className="card-header-minimal">
            <AlertCircle size={14} className="icon-telemetry amber" />
            <h3>PREDICTIVE EVASION RISK</h3>
          </div>
          <div className="risk-profile-stack">
            {highRiskStudents.map(student => (
              <div key={student.studentId} className="risk-profile-item">
                <div className="profile-identity">
                  <span className="profile-name">{student.name}</span>
                  <span className="profile-reason">{student.factors ? JSON.parse(student.factors)[0] : 'Historical pattern'}</span>
                </div>
                <div className="profile-data">
                  <span className="profile-percent">{student.riskProbability.toFixed(0)}%</span>
                  <span className={`profile-trend ${student.trend}`}>{student.trend?.toUpperCase()}</span>
                </div>
              </div>
            ))}
            {highRiskStudents.length === 0 && (
              <div className="empty-state-telemetry">No high-risk students identified.</div>
            )}
          </div>
        </div>

        {/* Engagement Heatmap Shortcut */}
        <div className="cobalt-analytics-card heatmap-card">
          <div className="card-header-minimal">
            <MapIcon size={14} className="icon-telemetry indigo" />
            <h3>ENGAGEMENT MAP</h3>
          </div>
          <div className="heatmap-visualization-v3540">
             <div className="heatmap-overlay-glow" />
             <TrendingUp size={24} className="trend-icon-overlay" />
             <span className="view-link">OPEN GLOBAL HEATMAP</span>
          </div>
        </div>

      </div>
    </div>
  );
};

const EmotionMetric: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => {
  return (
    <div className="metric-row-v3540">
      <div className="metric-info-v3540">
        <div className={`metric-icon-small ${color}`}>{icon}</div>
        <span className="metric-label-v3540">{label}</span>
      </div>
      <div className="metric-track-v3540">
        <div 
          className={`metric-fill-v3540 ${color}`} 
          style={{ '--metric-width': `${value * 100}%` } as React.CSSProperties}
        />
      </div>
      <span className="metric-value-v3540">{(value * 100).toFixed(0)}%</span>
    </div>
  );
};

export default BehavioralAnalysis;
