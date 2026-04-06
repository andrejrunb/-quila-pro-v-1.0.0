import { EventEmitter } from 'events';
import { visionReIdService } from './VisionReIdService';
import { logger } from '../main/logger';

/**
 * RE-ID SERVICE (v3620)
 * --------------------
 * Simulates Person Re-Identification (Re-ID) using clothing and posture features.
 * Maintains student identity across different camera nodes without biometric re-scans.
 */

export interface ReIDSession {
  studentId: string;
  lastSeenNode: string;
  confidence: number;
  featureVector: number[]; // Simulated 128d vector
  timestamp: number;
  clothingRef: string; // e.g., "blue-hoodie-white-sneakers"
}

export class ReIDService extends EventEmitter {
  private static instance: ReIDService;
  private sessions: Map<string, ReIDSession> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): ReIDService {
    if (!ReIDService.instance) {
      ReIDService.instance = new ReIDService();
    }
    return ReIDService.instance;
  }

  /**
   * Inicializa sessões baseadas em alunos reais do banco
   */
  public async initializeFromDatabase(db: any) {
    try {
      const students = await db.all('SELECT id, name FROM students LIMIT 50');
      students.forEach((s: any) => {
        this.registerStudent(s.id, 'reception', 'standard-uniform');
      });
      console.log(`[ReIDService] Inicializado com ${students.length} alunos do banco.`);
    } catch (error) {
       console.error('Erro ao inicializar ReIDService:', error);
    }
  }

  public registerStudent(studentId: string, noderoot: string, clothing: string) {
    const session: ReIDSession = {
      studentId,
      lastSeenNode: noderoot,
      confidence: 0.98,
      featureVector: Array.from({ length: 128 }, () => Math.random()),
      timestamp: Date.now(),
      clothingRef: clothing
    };
    this.sessions.set(studentId, session);
    this.emit('reid-update', session);
  }

  public async trackMovement(studentId: string, newNode: string, featureVector?: number[]) {
    let session = this.sessions.get(studentId);
    
    if (!session) {
        // Se for "Unknown", tentamos Re-ID Global via Embeddings (v3508)
        if (studentId.startsWith('unknown_') && featureVector) {
           const identity = await visionReIdService.identifyFromEnsemble(featureVector);
           if (identity) {
             logger.warn(`[ReID] Aluno de Outro Campus Detectado: ${identity.studentId} de ${identity.sourceUnit}`);
             this.registerStudent(identity.studentId, newNode, 'cross-campus-id');
             return;
           }
        }

        // Se ainda não temos registro, criar sessão detectada localmente
        this.registerStudent(studentId, newNode, 'auto-detected');
        return;
    }
    
    session.lastSeenNode = newNode;
    session.timestamp = Date.now();
    session.confidence = 0.95;
    this.emit('reid-update', session);
  }

  public getSession(studentId: string) {
    return this.sessions.get(studentId);
  }

  public getAllSessions() {
    return Array.from(this.sessions.values());
  }
}

export const reIDService = ReIDService.getInstance();
