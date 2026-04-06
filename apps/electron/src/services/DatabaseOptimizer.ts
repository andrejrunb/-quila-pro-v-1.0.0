/**
 * DatabaseOptimizer.ts — Item 25
 * Cria índices SQLite otimizados e roda VACUUM para compactar o banco.
 * Agenda execuções periódicas para manter a performance em milhões de registros.
 */

import Database from '../database/Database';

export class DatabaseOptimizer {
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(private readonly db: Database) {}

  start(): void {
    if (this.intervalHandle) return;
    
    // Habilitar modo WAL para melhor performance de concorrência e resiliência
    this.db.run('PRAGMA journal_mode=WAL').catch(err => console.error('[DatabaseOptimizer] Erro ao ativar WAL:', err));
    this.db.run('PRAGMA synchronous=NORMAL').catch(() => {}); // Performance vs Segurança Balanceada
    this.db.run('PRAGMA journal_size_limit=10485760').catch(() => {}); // 10MB limit
    
    // Rodar VACUUM e análise a cada 6 horas
    this.intervalHandle = setInterval(() => this.optimize(), 6 * 60 * 60 * 1000);
    // Roda uma vez 60s após o boot
    setTimeout(() => this.createIndexes(), 60_000);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async createIndexes(): Promise<void> {
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_attendance_student_ts ON attendance_logs(student_id, logged_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(logged_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_heatmap_zone_ts ON heatmap_events(zone, recorded_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status, created_at ASC)`,
      `CREATE INDEX IF NOT EXISTS idx_faces_student ON faces(student_id)`,
      `CREATE INDEX IF NOT EXISTS idx_students_name ON students(name COLLATE NOCASE)`,
    ];

    for (const idx of indexes) {
      try {
        await this.db.run(idx);
      } catch (err) {
        console.warn('[DatabaseOptimizer] Índice já existente ou erro:', err);
      }
    }

    console.log('[DatabaseOptimizer] Índices criados/verificados com sucesso.');
  }

  async optimize(): Promise<void> {
    try {
      await this.db.run('ANALYZE');
      await this.db.run('PRAGMA optimize');
      console.log('[DatabaseOptimizer] ANALYZE + optimize executados com sucesso.');
    } catch (err) {
      console.error('[DatabaseOptimizer] Erro na otimização:', err);
    }
  }

  async vacuum(): Promise<void> {
    try {
      await this.db.run('VACUUM');
      console.log('[DatabaseOptimizer] VACUUM concluído.');
    } catch (err) {
      console.error('[DatabaseOptimizer] Erro no VACUUM:', err);
    }
  }
}
