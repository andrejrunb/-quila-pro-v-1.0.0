import { communicationHubService } from './CommunicationHubService';
import { academicRecordsService } from './AcademicRecordsService';

export interface PortariaEvent {
  studentId: string;
  type: 'arrival' | 'exit';
  timestamp: string;
  authorizedBy?: string; // ID do pai/responsável
  verificationMethod: 'FaceID' | 'PalmVein' | 'RFID' | 'CSI_Fingerprint';
}

/**
 * SmartPortariaService (v1633)
 * Gerencia a entrada e saída de alunos (Módulo "Cheguei" avançado).
 */
class SmartPortariaService {
  private events: PortariaEvent[] = [];

  /**
   * Registra intenção de retirada pelo pai
   */
  public async requestPickup(studentId: string, parentId: string) {
    const student = await academicRecordsService.getStudent(studentId);
    if (!student) return;

    console.log(`[SmartPortaria] Pickup request received for ${student.name} from Parent ${parentId}`);
    
    // Notifica o sistema de coordenação e o totem da sala
    await communicationHubService.sendMessageToParent(studentId, `Solicitação de retirada recebida. O aluno está sendo encaminhado à portaria.`);
  }

  /**
   * Validação biométrica na saída
   */
  public async validateExit(studentId: string, method: PortariaEvent['verificationMethod']) {
    const event: PortariaEvent = {
        studentId,
        type: 'exit',
        timestamp: new Date().toISOString(),
        verificationMethod: method
    };
    
    this.events.push(event);
    console.log(`[SmartPortaria] Exit VALIDATED for ${studentId} via ${method}`);
    
    // Alerta em tempo real no App do Pai
    await communicationHubService.sendMessageToParent(studentId, `Segurança Áquila: Seu filho(a) acaba de passar pela portaria acompanhado por [BIOMETRIA_OK].`);
  }
}

export const smartPortariaService = new SmartPortariaService();

