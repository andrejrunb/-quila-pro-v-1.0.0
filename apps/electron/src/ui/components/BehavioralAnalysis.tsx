import React, { useState, useEffect, useRef } from 'react';
import { UserCheck, Activity, Coffee, Target, AlertCircle, MapIcon, TrendingUp } from 'lucide-react';
import './BehavioralAnalysis.css';

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
    const telemetryInterval = setInterval(async () => {
      try {
        const data = await window.aquila.behavioral.getLive(studentId);
        if (data) setAnalysis(data);
        
        const events = await window.aquila.behavioral.getPoseEvents(studentId);
        if (events) setPoseEvents(events);
      } catch (err) {
        console.error('[Behavioral] Live telemetry failed:', err);
      }
    }, 5000);

    const loadProfiles = async () => {
      try {
        const profiles = await window.aquila.behavioral.getEvasionProfiles();
        if (profiles) setHighRiskStudents(profiles);
      } catch (err) {
        console.error('[Behavioral] Profile loading failed:', err);
      }
    };

    loadProfiles();
    return () => clearInterval(telemetryInterval);
  }, []);

  return (
    <div className="behavioral-sovereignty-v3540">
      <div className="telemetry-grid-v3540">
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
            <EmotionMetric label="Stress" value={analysis.emotions.stress} icon={<Activity size={12} />} color="stress" />
            <EmotionMetric label="Fatigue" value={analysis.emotions.fatigue} icon={<Coffee size={12} />} color="fatigue" />
            <EmotionMetric label="Engagement" value={analysis.emotions.engagement} icon={<Target size={12} />} color="engagement" />
          </div>
        </div>

        <div className="cobalt-analytics-card">
          <div className="card-header-minimal">
            <Activity size={14} className="icon-telemetry blue" />
            <h3>POSTURE TELEMETRY</h3>
          </div>
          <div className="pose-stream-v3540 custom-scrollbar">
            {poseEvents.length === 0 && <div className="empty-state-telemetry">Awaiting physical signal...</div>}
            {poseEvents.map(event => (
              <div key={event.id} className={`telemetry-item-row ${event.confidence > 0.9 ? 'alert' : ''}`}>
                <div className="item-meta">
                  <span className="item-type">{event.type ? event.type.replace('_', ' ') : 'Alerta'}</span>
                  <span className="item-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="intensity-bar">
                  <IntensityBar value={event.intensity} />
                </div>
              </div>
            ))}
          </div>
        </div>

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
            {highRiskStudents.length === 0 && <div className="empty-state-telemetry">No high-risk students identified.</div>}
          </div>
        </div>

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

const IntensityBar: React.FC<{ value: number }> = ({ value }) => {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (barRef.current) barRef.current.style.width = `${value * 100}%`;
  }, [value]);
  return <div ref={barRef} className="intensity-fill" />;
};

const EmotionMetric: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => {
  const fillRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = `${value * 100}%`;
  }, [value]);
  return (
    <div className="metric-row-v3540">
      <div className="metric-info-v3540">
        <div className={`metric-icon-small ${color}`}>{icon}</div>
        <span className="metric-label-v3540">{label}</span>
      </div>
      <div className="metric-track-v3540">
        <div ref={fillRef} className={`metric-fill-v3540 ${color}`} />
      </div>
      <span className="metric-value-v3540">{(value * 100).toFixed(0)}%</span>
    </div>
  );
};

export default BehavioralAnalysis;
