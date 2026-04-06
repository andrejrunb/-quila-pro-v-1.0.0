import Database from "../database/Database";

export interface StudentEconomy {
  student_id: string;
  balance: number;
  level: number;
  xp: number;
  unlocked_items?: string[];
  current_skin?: string;
}

export class NexusEconomyService {
  constructor(private db: Database) {}

  /**
   * Recompensa um aluno por tarefa concluída.
   */
  async rewardStudent(studentId: string, amount: number, reason: string): Promise<void> {
    console.log(`[Economy] Rewarding ${studentId}: +${amount} (${reason})`);
    
    // Atualiza saldo e XP (XP = amount * 10 para exemplo)
    const sql = `INSERT INTO student_economy (student_id, balance, xp) 
                 VALUES (?, ?, ?) 
                 ON CONFLICT(student_id) DO UPDATE SET 
                 balance = balance + excluded.balance,
                 xp = xp + excluded.xp,
                 updated_at = CURRENT_TIMESTAMP`;
    
    await this.db.run(sql, [studentId, amount, amount * 10]);
    
    // Check for level up (every 1000 XP)
    await this.checkLevelUp(studentId);
  }

  /**
   * Retorna os dados econômicos completos, incluindo inventário.
   */
  async getEconomy(studentId: string): Promise<StudentEconomy | null> {
    const eco = await this.db.get('SELECT * FROM student_economy WHERE student_id = ?', [studentId]);
    if (!eco) return null;

    const inventory = await this.db.all(
      'SELECT item_id, item_type, is_equipped FROM student_inventory WHERE student_id = ?', 
      [studentId]
    );

    return {
      ...eco,
      unlocked_items: inventory.map(i => i.item_id),
      current_skin: inventory.find(i => i.item_type === 'skin' && i.is_equipped)?.item_id || 'default'
    } as StudentEconomy;
  }

  /**
   * Realiza a compra de um item.
   */
  async purchaseItem(studentId: string, itemId: string, price: number): Promise<{ success: boolean; error?: string }> {
    const eco = await this.getEconomy(studentId);
    if (!eco || eco.balance < price) {
      return { success: false, error: 'Saldo insuficiente.' };
    }

    // Deduz saldo e insere no inventário
    await this.db.run('UPDATE student_economy SET balance = balance - ? WHERE student_id = ?', [price, studentId]);
    
    // Tenta determinar o tipo baseado no ID (mock simples)
    const type = itemId.startsWith('skn-') ? 'skin' : 'effect';
    
    await this.db.run('INSERT INTO student_inventory (student_id, item_id, item_type) VALUES (?, ?, ?)', [studentId, itemId, type]);
    
    return { success: true };
  }

  /**
   * Equipa um item de um tipo específico.
   */
  async equipItem(studentId: string, type: string, itemId: string): Promise<void> {
    // Desequipa outros do mesmo tipo
    await this.db.run('UPDATE student_inventory SET is_equipped = 0 WHERE student_id = ? AND item_type = ?', [studentId, type]);
    // Equipa o novo
    await this.db.run('UPDATE student_inventory SET is_equipped = 1 WHERE student_id = ? AND item_id = ?', [studentId, itemId]);
  }

  private async checkLevelUp(studentId: string): Promise<void> {
    const eco = await this.getEconomy(studentId);
    if (!eco) return;

    const newLevel = Math.floor(eco.xp / 1000) + 1;
    if (newLevel > eco.level) {
      await this.db.run('UPDATE student_economy SET level = ? WHERE student_id = ?', [newLevel, studentId]);
      console.log(`[Economy] Student ${studentId} reached Level ${newLevel}!`);
    }
  }
}
