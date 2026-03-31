import React from 'react';
import { hrSovereigntyService, StaffRecord } from '../../services/HRSovereigntyService';
import './HRPortal.css';

/**
 * HRPortal (v3241)
 * Interface for staff management and autonomous payroll transparency.
 */
const HRPortal: React.FC = () => {
  const [staff, setStaff] = React.useState<StaffRecord[]>([]);
  const [payrolls, setPayrolls] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadStaff = async () => {
      try {
        const staffData = await (window as any).aquila.invoke('hr:get-staff');
        setStaff(staffData);
        
        const payrollMap: Record<string, any> = {};
        for (const member of staffData) {
          payrollMap[member.id] = await (window as any).aquila.invoke('hr:calculate-payroll', member.id);
        }
        setPayrolls(payrollMap);
      } catch (err) {
        console.error('Failed to load HR data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, []);

  if (loading) return <div className="loading-state">Criptografando Dados de RH...</div>;

  return (
    <div className="hr-portal-container">
      <div className="hr-portal-header">
        <h1 className="hr-portal-title">
          HR SOVEREIGNTY HUB
        </h1>
        <p className="hr-portal-subtitle">Autonomous Human Capital Management</p>
      </div>

      <div className="staff-grid">
        {staff.map(member => {
          const payroll = payrolls[member.id] || { net: 0 };
          return (
            <div key={member.id} className="staff-card">
              <div className="contract-type-badge">
                {member.contractType}
              </div>

              <div className="member-identity">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-role">{member.role}</p>
              </div>

              <div className="payroll-summary">
                <div className="payroll-label-row">
                  <span className="payroll-label">SALÁRIO LÍQUIDO</span>
                  <span className="payroll-value">R$ {payroll.net?.toLocaleString()}</span>
                </div>
                <div className="performance-track">
                  <div 
                    className="performance-fill" 
                    style={{ '--performance-width': `${member.performanceScore}%` } as React.CSSProperties}
                  />
                </div>
              </div>

              <div className="status-footer">
                <div className={`status-indicator ${member.status === 'active' ? 'active' : 'inactive'}`}></div>
                <span className="status-text">
                  PONTO BIOMÉTRICO: {member.performanceScore}% CONSISTÊNCIA
                </span>
              </div>

              <button 
                onClick={async () => {
                  const result = await (window as any).aquila.invoke('secretary:generate-transcript', { studentId: member.id, type: 'HOLERITE' });
                  if (result.success) alert(`Holerite gerado em: ${result.path}`);
                }}
                className="btn-generate-slip"
              >
                Gerar Holerite (PDF)
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HRPortal;
