import { Database } from '../../database/Database';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority?: string;
  studentId?: string;
  userId?: string;
  read: boolean;
  timestamp: string;
}

export class CommunityNotificationService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Envia uma notificação para um usuário específico ou vinculada a um aluno.
   */
  async send(data: {
    userId?: string;
    studentId?: string;
    title: string;
    message: string;
    type: string;
    priority?: string;
  }): Promise<string> {
    const id = uuidv4();
    const { userId, studentId, title, message, type, priority } = data;

    await this.db.run(
      `INSERT INTO notifications (id, userId, studentId, title, message, type, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId || null, studentId || null, title, message, type, priority || 'MEDIUM']
    );

    return id;
  }

  async getForUser(userId: string): Promise<Notification[]> {
    const rows = await this.db.all<any>(
      'SELECT * FROM notifications WHERE userId = ? OR studentId IN (SELECT id FROM students WHERE parentPhone = (SELECT phone FROM users WHERE id = ?)) ORDER BY timestamp DESC',
      [userId, userId]
    );

    return rows.map(r => ({
      ...r,
      read: !!r.read
    }));
  }

  async markAsRead(id: string): Promise<void> {
    await this.db.run('UPDATE notifications SET read = 1, treatedAt = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  /**
   * [Cluster 8] Notificação de Intervenção Pedagógica
   */
  async notifyPedagogicalIntervention(studentId: string, message: string): Promise<void> {
    await this.send({
      studentId,
      title: '🛡️ Alerta de Intervenção Pedagógica',
      message: `Uma nova intervenção foi registrada para seu filho: ${message}`,
      type: 'PEDAGOGICAL',
      priority: 'HIGH'
    });
  }

  /**
   * [Cluster 8] Notificação de Novo Item no Marketplace
   */
  async notifyMarketplaceInterest(adId: string, interestedUserId: string, ownerId: string): Promise<void> {
    await this.send({
      userId: ownerId,
      title: '🤝 Interesse no seu Anúncio',
      message: `Um usuário demonstrou interesse no seu item. Verifique o Marketplace para detalhes.`,
      type: 'MARKETPLACE',
      priority: 'MEDIUM'
    });
  }
}
