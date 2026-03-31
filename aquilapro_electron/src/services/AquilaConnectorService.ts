import { academicRecordsService } from './AcademicRecordsService';
import { externalIntegrationService } from './ExternalIntegrationService';

export interface SyncResult {
  source: string;
  type: 'STUDENT' | 'SCHEDULE' | 'GUARDIAN';
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  recordsProcessed: number;
  timestamp: string;
  message?: string;
}

/**
 * AquilaConnectorService (v1635)
 * Orquestrador unificado para sincronização com o ecossistema edtech brasileiro.
 */
class AquilaConnectorService {
  private syncLogs: SyncResult[] = [];

  /**
   * Sincroniza dados de Matrícula (SIS/ERP)
   */
  public async syncEnrollmentData(source: 'SETTI' | 'SIESCOLA' | 'LAPIS360', jsonData: any) {
    console.log(`[AquilaConnector] Starting Enrollment Sync from ${source}...`);
    
    try {
      // Simulação de processamento de dados do SIS
      const students = jsonData.students || [];
      students.forEach((s: any) => {
        academicRecordsService.updateStudentLegacyData(s.id, {
          externalId: s.legacyId,
          source: source,
          lastSync: new Date().toISOString()
        });
      });

      const result: SyncResult = {
        source,
        type: 'STUDENT',
        status: 'SUCCESS',
        recordsProcessed: students.length,
        timestamp: new Date().toISOString(),
        message: 'Sincronização de matrículas concluída com sucesso.'
      };
      
      this.syncLogs.push(result);
      return result;
    } catch (err) {
      return this.logError(source, 'STUDENT', 'Falha crítica no processamento de matrículas.');
    }
  }

  /**
   * Sincroniza Grade Horária (PowerCubus/Urania)
   */
  public async syncTimetable(source: 'POWERCUBUS' | 'URANIA', rawData: string) {
    console.log(`[AquilaConnector] Starting Timetable Sync from ${source}...`);
    
    const parsed = await externalIntegrationService.parseLegacySchedule(rawData);
    
    const result: SyncResult = {
      source,
      type: 'SCHEDULE',
      status: parsed.length > 0 ? 'SUCCESS' : 'WARNING',
      recordsProcessed: parsed.length,
      timestamp: new Date().toISOString(),
      message: `Encontradas ${parsed.length} alocações de aula.`
    };

    this.syncLogs.push(result);
    return result;
  }

  public getSyncLogs() {
    return this.syncLogs.slice(-20).reverse();
  }

  private logError(source: string, type: SyncResult['type'], msg: string): SyncResult {
    const res: SyncResult = { 
        source, type, status: 'ERROR', 
        recordsProcessed: 0, 
        timestamp: new Date().toISOString(), 
        message: msg 
    };
    this.syncLogs.push(res);
    return res;
  }
}

export const aquilaConnectorService = new AquilaConnectorService();
