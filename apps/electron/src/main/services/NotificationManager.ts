import * as schedule from 'node-schedule';
import Database from '../../database/Database';
import { Notification } from 'electron';

export class NotificationManager {
  private monitoringInterval: NodeJS.Timeout | null = null;

  private static instance: NotificationManager;

  public static getInstance(db: Database): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(db);
    }
    return NotificationManager.instance;
  }

  constructor(private db: Database) {}

  /**
   * Inicia monitoramento de eventos para gerar notificações
   */
  startMonitoring() {
    // Verificar eventos a cada 2 minutos para evitar sobrecarga (Step 21)
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkForNotifications();
      } catch (error) {
        console.error('[NotificationManager] Erro ao verificar notificações:', error);
      }
    }, 120000); // 120 segundos
  }

  /**
   * Para o monitoramento
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Verifica eventos e cria notificações
   */
  private async checkForNotifications() {
    try {
      const now = new Date();

      // 1. Verificar atrasos
      const lateStudents = await this.db.getLateStudents(now);
      for (const student of lateStudents) {
        await this.createNotification({
          type: 'LATE_ARRIVAL',
          title: 'Aluno Atrasado',
          message: `${student.name} chegou atrasado às ${student.arrivalTime}`,
          priority: 'MEDIUM',
          studentId: student.id,
          icon: '⏰',
        });
      }

      // 2. Verificar saídas não autorizadas
      const unauthorizedExits = await this.db.getUnauthorizedExits(now);
      for (const exit of unauthorizedExits) {
        await this.createNotification({
          type: 'UNAUTHORIZED_EXIT',
          title: 'Saída Não Autorizada',
          message: `${exit.studentName} saiu da sala sem autorização`,
          priority: 'HIGH',
          studentId: exit.studentId,
          icon: '🚪',
        });
      }

      // 3. Verificar saídas da escola
      const schoolExits = await this.db.getSchoolExits(now);
      for (const exit of schoolExits) {
        await this.createNotification({
          type: 'SCHOOL_EXIT',
          title: 'Aluno Saiu da Escola',
          message: `${exit.studentName} saiu da escola`,
          priority: 'HIGH',
          studentId: exit.studentId,
          icon: '🚪',
        });
      }

      // 4. Verificar violência detectada
      const violenceDetections = await this.db.getViolenceDetections(now);
      for (const detection of violenceDetections) {
        await this.createNotification({
          type: 'VIOLENCE_DETECTED',
          title: '⚠️ VIOLÊNCIA DETECTADA',
          message: `Violência detectada em ${detection.location}`,
          priority: 'CRITICAL',
          icon: '🚨',
        });
      }

      // 5. Verificar pessoas desconhecidas
      const unknownPersons = await this.db.getUnknownPersons(now);
      for (const person of unknownPersons) {
        await this.createNotification({
          type: 'UNKNOWN_PERSON',
          title: '⚠️ PESSOA DESCONHECIDA',
          message: `Pessoa desconhecida detectada em ${person.location}`,
          priority: 'CRITICAL',
          icon: '👤',
        });
      }

      // 6. Verificar aglomerações
      const crowding = await this.db.getCrowdingAlerts(now);
      for (const alert of crowding) {
        await this.createNotification({
          type: 'CROWDING',
          title: 'Aglomeração Detectada',
          message: `Aglomeração em ${alert.location}`,
          priority: 'MEDIUM',
          icon: '👥',
        });
      }

      // 7. Verificar Trocas de Sala (Step 7)
      await this.checkForRoomChanges();
    } catch (error) {
      console.error('[NotificationManager] Erro ao verificar notificações:', error);
    }
  }

  /**
   * Verifica se houve mudanças repentinas na grade horária (Ex: Remanejamento)
   */
  private async checkForRoomChanges() {
    // Em uma implementação real, compararíamos o schedule atual com um cache
    // Para o Step 7, vamos criar um evento simulado de remanejamento se houver um flag no banco
    const remanejamento = await this.db.getSettings();
    if (remanejamento.pending_room_change) {
      const { teacherId, oldRoom, newRoom, subject } = JSON.parse(remanejamento.pending_room_change);
      
      await this.createNotification({
        type: 'ROOM_CHANGE',
        title: 'Troca de Sala Detectada',
        message: `Atenção: Sua aula de ${subject} foi movida de ${oldRoom} para ${newRoom}.`,
        priority: 'HIGH',
        icon: '🔄',
      });

      // Limpar flag
      await this.db.saveSettings({ pending_room_change: null });
    }
  }

  /**
   * Alias para createNotification para suportar chamadas simplificadas (Cluster 9)
   */
  public async create(data: {
    type: string;
    title: string;
    message: string;
    priority: string;
    studentId?: string;
    icon?: string;
  }) {
    // Normalizar prioridade para uppercase
    const priority = (data.priority || 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    return await this.createNotification({ ...data, priority });
  }

  /**
   * Cria uma notificação
   */
  public async createNotification(data: {
    type: string;
    title: string;
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    studentId?: string;
    icon?: string;
  }) {
    try {
      // 1. Salvar no banco de dados
      const notification = await this.db.createNotification({
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority,
        studentId: data.studentId,
        read: false,
        timestamp: new Date(),
      });

      // 2. Mostrar notificação do sistema
      this.showSystemNotification(data.title, data.message, data.priority);

      // 3. Enviar para app de notificações (via IPC)
      // Será feito no main.ts

      return notification;
    } catch (error) {
      console.error('[NotificationManager] Erro ao criar notificação:', error);
    }
  }

  /**
   * Mostra notificação do sistema (Windows)
   */
  private showSystemNotification(title: string, message: string, priority: string) {
    try {
      // Configurar som baseado em prioridade
      let sound = false;
      if (priority === 'HIGH' || priority === 'CRITICAL') {
        sound = true;
      }

      const notification = new Notification({
        title,
        body: message,
        silent: !sound,
        urgency: priority === 'CRITICAL' ? 'critical' : 'normal',
      });

      notification.show();
    } catch (error) {
      console.error('[NotificationManager] Erro ao mostrar notificação do sistema:', error);
    }
  }

  /**
   * Obtém notificações não lidas
   */
  async getUnreadNotifications(): Promise<any[]> {
    return await this.db.getUnreadNotifications();
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string) {
    return await this.db.markNotificationRead(notificationId);
  }

  /**
   * Obtém histórico de notificações (últimas 24h)
   */
  async getNotificationHistory(): Promise<any[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await this.db.getNotificationsSince(twentyFourHoursAgo);
  }

  /**
   * Obtém alertas de segurança recentes
   */
  async getSecurityAlerts(limit: number = 10): Promise<any[]> {
    return await this.db.getRecentSecurityAlerts(limit);
  }

  /**
   * Limpa notificações antigas (>7 dias)
   */
  async cleanOldNotifications() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return await this.db.deleteNotificationsBefore(sevenDaysAgo);
  }
}

