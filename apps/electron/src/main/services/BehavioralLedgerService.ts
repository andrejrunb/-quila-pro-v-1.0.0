import Database from '../../database/Database';
import { logger } from '../logger';

export type BehavioralStatus = 'IDEAL' | 'DISTRACTED' | 'SLEEPING' | 'ATYPICAL';

export interface Occurrence {
  id: string;
  studentIds: string[];
  teacherId: string;
  classId: string;
  type: BehavioralStatus;
  description: string;
  timestamp: string;
}

/**
 * BehavioralLedgerService (v3452)
 * Arquitetado para detecção de padrões de comportamento e sincronização de clima.
 */
export class BehavioralLedgerService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Registra uma nova ocorrência (Voz/Texto do Professor).
   */
  public async logOccurrence(occ: Omit<Occurrence, 'id' | 'timestamp'>) {
    const id = `occ-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    logger.info(`[Behavioral] Registrando ocorrência: ${occ.type} para alunos ${occ.studentIds.join(', ')}`);
    
    const query = `
      INSERT INTO behavioral_occurrences (id, classId, teacherId, type, description, studentIds, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.run(query, [
      id, 
      occ.classId, 
      occ.teacherId, 
      occ.type, 
      occ.description, 
      JSON.stringify(occ.studentIds), 
      timestamp
    ]);
    
    return { id, timestamp };
  }

  /**
   * Calcula as "Nuvens de Status" para o Mapa de Sala.
   * Agrega ocorrências recentes de todos os professores.
   */
  public async getMapClimate(classId: string): Promise<Record<string, { color: string, reason: string }>> {
    // Buscar ocorrências das últimas 4 horas (clima atual do dia)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const query = `SELECT studentIds, type, description FROM behavioral_occurrences WHERE classId = ? AND timestamp >= ?`;
    const occurrences = await this.db.all(query, [classId, fourHoursAgo]);

    const climate: Record<string, { color: string, reason: string }> = {};

    occurrences.forEach((occ: any) => {
      const studentIds = JSON.parse(occ.studentIds);
      studentIds.forEach((sid: string) => {
        let color = '#10b981'; // Green (default)
        if (occ.type === 'DISTRACTED') color = '#ef4444'; // Red
        if (occ.type === 'SLEEPING') color = '#a855f7'; // Purple
        if (occ.type === 'ATYPICAL') color = '#f59e0b'; // Orange
        
        climate[sid] = { color, reason: occ.description };
      });
    });

    return climate;
  }

  /**
   * Identifica duplas "Quentes" (conversando muito) para sugerir mudanças de mapeamento.
   */
  public async detectRedZonePairs(classId: string): Promise<string[][]> {
    const query = `SELECT studentIds FROM behavioral_occurrences WHERE classId = ? AND type = 'DISTRACTED'`;
    const rows = await this.db.all(query, [classId]);
    
    const pairCounter: Record<string, number> = {};
    const disruptivePairs: string[][] = [];

    rows.forEach((row: any) => {
      const studentIds = JSON.parse(row.studentIds).sort();
      if (studentIds.length >= 2) {
        // Analisa combinações de 2 a 2
        for (let i = 0; i < studentIds.length; i++) {
          for (let j = i + 1; j < studentIds.length; j++) {
            const pairKey = `${studentIds[i]}|${studentIds[j]}`;
            pairCounter[pairKey] = (pairCounter[pairKey] || 0) + 1;
            
            // Se a dupla apareceu em mais de 2 incidentes, marca como Red Zone
            if (pairCounter[pairKey] >= 2) {
              disruptivePairs.push([studentIds[i], studentIds[j]]);
            }
          }
        }
      }
    });

    return Array.from(new Set(disruptivePairs.map(p => p.join('|')))).map(s => s.split('|'));
  }
}


