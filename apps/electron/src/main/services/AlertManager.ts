import { EventEmitter } from 'events';
import Database from '../../database/Database';

/**
 * Interface para alerta
 */
export interface Alert {
  id: string;
  type: 'absence' | 'late' | 'unknown' | 'crowding' | 'camera_offline' | 'school_exit' | 'unusual_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
}

/**
 * Gerenciador de alertas contextualizados
 */
export class AlertManager extends EventEmitter {
  private db: Database;
  private alerts: Map<string, Alert> = new Map();
  private lateThreshold: number = 15; // minutos
  private absenceThreshold: number = 0.75; // 75%
  private crowdingThreshold: number = 20; // pessoas

  constructor(db: Database) {
    super();
    this.db = db;
  }

  /**
   * Cria alerta de ausência
   */
  async createAbsenceAlert(studentId: string, classId: string, date: Date): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'absence',
      severity: 'high',
      title: 'Aluno Ausente',
      message: `Aluno não foi detectado em sala de aula`,
      data: { studentId, classId, date },
      timestamp: new Date(),
      read: false,
    };

    this.alerts.set(alert.id, alert);
    await this.db.saveAlert(alert);

    this.emit('alert:created', alert);
    console.log(`Alerta de ausência criado: ${studentId}`);

    return alert;
  }

  /**
   * Cria alerta de chegada atrasada
   */
  async createLateAlert(studentId: string, classId: string, delayMinutes: number): Promise<Alert> {
    const severity = delayMinutes > 30 ? 'high' : 'medium';

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'late',
      severity,
      title: 'Aluno Atrasado',
      message: `Aluno chegou ${delayMinutes} minutos atrasado`,
      data: { studentId, classId, delayMinutes },
      timestamp: new Date(),
      read: false,
    };

    this.alerts.set(alert.id, alert);
    await this.db.saveAlert(alert);

    this.emit('alert:created', alert);
    console.log(`Alerta de atraso criado: ${studentId} (${delayMinutes}min)`);

    return alert;
  }

  /**
   * Cria alerta de pessoa não identificada
   */
  async createUnknownPersonAlert(cameraId: string, location: string): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'unknown',
      severity: 'medium',
      title: 'Pessoa Não Identificada',
      message: `Pessoa desconhecida detectada em ${location}`,
      data: { cameraId, location },
      timestamp: new Date(),
      read: false,
    };

    this.alerts.set(alert.id, alert);
    await this.db.saveAlert(alert);

    this.emit('alert:created', alert);
    console.log(`Alerta de pessoa desconhecida criado: ${location}`);

    return alert;
  }

  /**
   * Cria alerta de aglomeração
   */
  async createCrowdingAlert(cameraId: string, location: string, personCount: number): Promise<Alert> {
    const severity = personCount > 50 ? 'critical' : personCount > 30 ? 'high' : 'medium';

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'crowding',
      severity,
      title: 'Aglomeração Detectada',
      message: `${personCount} pessoas detectadas em ${location}`,
      data: { cameraId, location, personCount },
      timestamp: new Date(),
      read: false,
    };

    this.alerts.set(alert.id, alert);
    await this.db.saveAlert(alert);

    this.emit('alert:created', alert);
    console.log(`Alerta de aglomeração criado: ${location} (${personCount} pessoas)`);

    return alert;
  }

  /**
   * Cria alerta de câmera offline
   */
  async createCameraOfflineAlert(cameraId: string, location: string): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'camera_offline',
      severity: 'critical',
      title: 'Câmera Offline',
      message: `Câmera em ${location} está offline`,
      data: { cameraId, location },
      timestamp: new Date(),
      read: false,
    };

    this.alerts.set(alert.id, alert);
    await this.db.saveAlert(alert);

    this.emit('alert:created', alert);
    console.log(`Alerta de câmera offline criado: ${location}`);

    return alert;
  }
  
  /**
   * Alerta de atividade incomum em geofence
   */
  async alertUnusualActivity(geofenceId: string, geofenceName: string, message: string): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'unusual_activity',
      severity: 'high',
      title: 'Atividade Incomum',
      message,
      data: { geofenceId, geofenceName },
      timestamp: new Date(),
      read: false,
    };
    this.alerts.set(alert.id, alert);
    await this.db.saveAlert(alert);
    this.emit('alert:created', alert);
    return alert;
  }
  
  /**
   * Alerta de aluno saiu da escola
   */
  async alertStudentLeftSchool(studentId: string, studentName: string, geofenceName: string): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'school_exit',
      severity: 'critical',
      title: 'Aluno Saiu da Escola',
      message: `${studentName} saiu dos limites da escola: ${geofenceName}`,
      data: { studentId, studentName, geofenceName },
      timestamp: new Date(),
      read: false,
    };
    this.alerts.set(alert.id, alert);
    await this.db.saveAlert(alert);
    this.emit('alert:created', alert);
    return alert;
  }

  /**
   * Marca alerta como lido
   */
  async markAsRead(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.read = true;
      await this.db.updateAlert(alertId, { read: true });
      this.emit('alert:read', { alertId });
    }
  }

  /**
   * Marca todos os alertas como lidos
   */
  async markAllAsRead(): Promise<void> {
    for (const [alertId, alert] of this.alerts) {
      if (!alert.read) {
        alert.read = true;
        await this.db.updateAlert(alertId, { read: true });
      }
    }
    this.emit('alerts:all-read');
  }

  /**
   * Deleta um alerta
   */
  async deleteAlert(alertId: string): Promise<void> {
    this.alerts.delete(alertId);
    await this.db.deleteAlert(alertId);
    this.emit('alert:deleted', { alertId });
  }

  /**
   * Limpa alertas antigos
   */
  async clearOldAlerts(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    for (const [alertId, alert] of this.alerts) {
      if (alert.timestamp < cutoffDate) {
        this.alerts.delete(alertId);
        await this.db.deleteAlert(alertId);
        deletedCount++;
      }
    }

    this.emit('alerts:cleared', { deletedCount, daysOld });
    console.log(`${deletedCount} alertas antigos removidos`);

    return deletedCount;
  }

  /**
   * Obtém alertas não lidos
   */
  getUnreadAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => !a.read);
  }

  /**
   * Obtém alertas por tipo
   */
  getAlertsByType(type: Alert['type']): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.type === type);
  }

  /**
   * Obtém alertas por severidade
   */
  getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.severity === severity);
  }

  /**
   * Obtém todos os alertas
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Obtém contagem de alertas por tipo
   */
  getAlertCounts() {
    const counts = {
      absence: 0,
      late: 0,
      unknown: 0,
      crowding: 0,
      camera_offline: 0,
      unread: 0,
    };

    for (const alert of this.alerts.values()) {
      counts[alert.type]++;
      if (!alert.read) {
        counts.unread++;
      }
    }

    return counts;
  }

  /**
   * Define limiar de atraso
   */
  setLateThreshold(minutes: number): void {
    this.lateThreshold = minutes;
  }

  /**
   * Define limiar de presença
   */
  setAbsenceThreshold(threshold: number): void {
    this.absenceThreshold = threshold;
  }

  /**
   * Define limiar de aglomeração
   */
  setCrowdingThreshold(count: number): void {
    this.crowdingThreshold = count;
  }

  /**
   * Limpa todos os alertas
   */
  clear(): void {
    this.alerts.clear();
    console.log('Todos os alertas foram limpos');
  }
}

export default AlertManager;


