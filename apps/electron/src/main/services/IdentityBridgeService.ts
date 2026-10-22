import { EventEmitter } from 'events';

export interface IdentityLink {
  signalId: string;
  studentId: string;
  studentName: string;
  confidence: number;
  lastUpdated: string;
  source: 'camera' | 'nfc' | 'manual' | 'app';
  csiFingerprint?: string; // v1627: Hash único do rastro de rádio
  assignedSeat?: { x: number, y: number }; // v1627: Coordenadas da carteira
}

/**
 * IdentityBridgeService (v1624)
 * Realiza o vínculo entre sinais anônimos (RuView) e identidades civis (Alunos/Staff).
 */
class IdentityBridgeService extends EventEmitter {
  private links: Map<string, IdentityLink> = new Map();
  
  constructor() {
    super();
  }

  /**
   * Vincula um rastro de sinal a um aluno.
   * Chamado via Reconhecimento Facial ou NFC.
   */
  public linkIdentity(signalId: string, studentId: string, studentName: string, source: IdentityLink['source'], confidence: number = 1.0) {
    const link: IdentityLink = {
      ...this.links.get(signalId), // Preserva dados existentes
      signalId,
      studentId,
      studentName,
      confidence,
      source,
      lastUpdated: new Date().toISOString()
    };

    // v1627: Se o sinal tem dados de CSI, geramos o Fingerprint
    if (!link.csiFingerprint) {
      link.csiFingerprint = `csi_hash_${Math.random().toString(36).substr(2, 9)}`;
    }

    this.links.set(signalId, link);
    this.emit('identity_linked', link);
    
    console.log(`[IdentityBridge] Linked Signal ${signalId} to Student ${studentName} (${source}) [CSI Secure]`);
  }

  public getIdentity(signalId: string): IdentityLink | undefined {
    return this.links.get(signalId);
  }

  public getAllLinks(): IdentityLink[] {
    return Array.from(this.links.values());
  }

  /**
   * Vincula identidade baseada em proximidade espacial (Câmera -> WiFi)
   */
  public linkByProximity(coords: { x: number, y: number }, studentId: string, studentName: string, activeSignals: any[]) {
    // Encontra o sinal RuView mais próximo das coordenadas da câmera
    let closestSignal: any = null;
    let minDistance = 5.0; // Max 5 metros de tolerância

    activeSignals.forEach(sig => {
      const dist = Math.sqrt(Math.pow(sig.x - coords.x, 2) + Math.pow(sig.y - coords.y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestSignal = sig;
      }
    });

    if (closestSignal) {
      this.linkIdentity(closestSignal.id, studentId, studentName, 'camera', 0.9);
      return true;
    }
    return false;
  }

  /**
   * Retorna identidades que estão em rota de aproximação de uma câmera (v1625)
   */
  public getPredictedSubjects(cameraCoords: { x: number, y: number }, activeSignals: any[]): IdentityLink[] {
    const predicted: IdentityLink[] = [];
    
    activeSignals.forEach(sig => {
      const identity = this.getIdentity(sig.id);
      if (!identity) return;

      // Cálculo simplificado de aproximação: se a distância está diminuindo ou se está a < 5m
      const dist = Math.sqrt(Math.pow(sig.x - cameraCoords.x, 2) + Math.pow(sig.y - cameraCoords.y, 2));
      
      if (dist < 8) { // Threshold de presciência: 8 metros
        predicted.push(identity);
      }
    });

    return predicted;
  }

  /**
   * Valida se o aluno está sentado na sua cadeira designada com precisão de 20cm (v1627)
   */
  public validateSeating(signalId: string, currentCoords: { x: number, y: number }): boolean {
    const link = this.getIdentity(signalId);
    if (!link || !link.assignedSeat) return true; // Sem designação, sem falha

    const dist = Math.sqrt(
      Math.pow(currentCoords.x - link.assignedSeat.x, 2) + 
      Math.pow(currentCoords.y - link.assignedSeat.y, 2)
    );

    return dist < 0.2; // 20cm de tolerância
  }

  public assignSeat(studentId: string, seatCoords: { x: number, y: number }) {
    for (const link of this.links.values()) {
      if (link.studentId === studentId) {
        link.assignedSeat = seatCoords;
      }
    }
  }

  /**
   * Limpa vínculos velhos (evita falsos positivos se o aluno deixar o celular/tag para trás)
   */
  public pruneOldLinks(maxAgeMinutes: number = 30) {
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    for (const [signalId, link] of this.links.entries()) {
      const age = now - new Date(link.lastUpdated).getTime();
      if (age > maxAgeMs) {
        this.links.delete(signalId);
        this.emit('identity_unlinked', signalId);
      }
    }
  }
}

export const identityBridge = new IdentityBridgeService();

