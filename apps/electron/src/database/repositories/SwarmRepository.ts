import { randomUUID } from 'crypto';
import Database from '../Database';

export interface SwarmReport {
  id: string;
  agent_id: string;
  timestamp: string;
  status: 'active' | 'idle' | 'warning' | 'error';
  message: string;
  metadata?: any;
}

export class SwarmRepository {
  constructor(private readonly db: Database) {}

  /**
   * Persiste um relatório de agente no banco de dados.
   */
  async saveReport(report: Omit<SwarmReport, 'id' | 'timestamp'>): Promise<void> {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    
    await this.db.run(
      `INSERT INTO swarm_reports (id, agent_id, timestamp, status, message, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        report.agent_id,
        timestamp,
        report.status,
        report.message,
        report.metadata ? JSON.stringify(report.metadata) : null
      ]
    );
  }

  /**
   * Recupera o histórico de relatórios de um agente específico.
   */
  async getAgentHistory(agentId: string, limit: number = 20): Promise<SwarmReport[]> {
    const rows = await this.db.all(
      `SELECT * FROM swarm_reports 
       WHERE agent_id = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [agentId, limit]
    );

    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  /**
   * Recupera o histórico global do enxame (Cycle 9).
   */
  async getHistory(limit: number = 50): Promise<SwarmReport[]> {
    const rows = await this.db.all(
      `SELECT * FROM swarm_reports 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [limit]
    );

    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  /**
   * Recupera os últimos relatórios de todos os agentes.
   */
  async getLatestReports(): Promise<SwarmReport[]> {
    const rows = await this.db.all(
      `SELECT r.* FROM swarm_reports r
       INNER JOIN (
         SELECT agent_id, MAX(timestamp) as max_ts
         FROM swarm_reports
         GROUP BY agent_id
       ) latest ON r.agent_id = latest.agent_id AND r.timestamp = latest.max_ts`
    );

    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  /**
   * Remove relatórios antigos para manter o banco de dados leve.
   * Mantém apenas os últimos 7 dias por padrão.
   */
  async purgeOldReports(days: number = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const result = await this.db.run(
      `DELETE FROM swarm_reports WHERE timestamp < ?`,
      [cutoff.toISOString()]
    );
    return result.changes || 0;
  }
}

export const swarmRepository = (db: Database) => new SwarmRepository(db);
