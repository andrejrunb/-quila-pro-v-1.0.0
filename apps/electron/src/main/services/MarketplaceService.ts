import Database from '../../database/Database';
import { v4 as uuidv4 } from 'uuid';

export interface Ad {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  type: 'OFFER' | 'WANT';
  status: 'ACTIVE' | 'SOLD' | 'MODERATED';
  metadata: string;
  createdAt: string;
}

export class MarketplaceService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async createAd(adData: Partial<Ad>): Promise<string> {
    const id = uuidv4();
    const { ownerId, title, description, price, category, type, metadata } = adData;

    // Moderação automática básica antes de inserir
    const isClean = await this.moderateContent(title || '', description || '');
    const initialStatus = isClean ? 'ACTIVE' : 'MODERATED';

    await this.db.run(
      `INSERT INTO marketplace_ads (id, ownerId, title, description, price, category, type, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        ownerId, 
        title, 
        description, 
        price || 0, 
        category || 'OTHER', 
        type || 'OFFER', 
        initialStatus,
        metadata || '{}'
      ]
    );

    return id;
  }

  async getAds(filters: { category?: string; type?: string; status?: string } = {}): Promise<Ad[]> {
    let query = 'SELECT * FROM marketplace_ads WHERE 1=1';
    const params: any[] = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    
    // Default to ACTIVE if no status provided
    const status = filters.status || 'ACTIVE';
    query += ' AND status = ?';
    params.push(status);

    query += ' ORDER BY createdAt DESC';

    return await this.db.all<Ad>(query, params);
  }

  async updateAdStatus(id: string, status: 'ACTIVE' | 'SOLD' | 'MODERATED'): Promise<void> {
    await this.db.run(
      'UPDATE marketplace_ads SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
  }

  async getMyAds(ownerId: string): Promise<Ad[]> {
    return await this.db.all<Ad>(
      'SELECT * FROM marketplace_ads WHERE ownerId = ? ORDER BY createdAt DESC',
      [ownerId]
    );
  }

  /**
   * Moderação automática simplificada (Cluster 8)
   */
  private async moderateContent(title: string, description: string): Promise<boolean> {
    const forbiddenWords = ['hack', 'crack', 'pílula', 'arma', 'explosivo'];
    const content = `${title} ${description}`.toLowerCase();
    return !forbiddenWords.some(word => content.includes(word));
  }
}
