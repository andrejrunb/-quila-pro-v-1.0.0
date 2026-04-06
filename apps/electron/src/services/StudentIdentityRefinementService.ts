import { EventEmitter } from 'events';

export interface StudentPhoto {
  id: string;
  studentId: string;
  timestamp: string;
  source: 'registration' | 'camera_capture';
  confidence: number;
  isObsolete: boolean;
}

/**
 * Phase 401: Student Identity Refinement Service
 * Lida com a atualização contínua das imagens dos alunos para lidar com mudanças físicas.
 */
class StudentIdentityRefinementService extends EventEmitter {
  private studentVault: Record<string, StudentPhoto[]> = {};

  constructor() {
    super();
    this.seedInitialData();
  }

  private seedInitialData() {
    this.studentVault['stu-101'] = [
      { id: 'img-001', studentId: 'stu-101', timestamp: '2026-01-01', source: 'registration', confidence: 1.0, isObsolete: false }
    ];
  }

  /**
   * Captura uma nova imagem via câmera e avalia se deve substituir antigas.
   */
  public processNewCapture(studentId: string, confidence: number) {
    const photos = this.studentVault[studentId] || [];
    
    // Nova captura de alta confiança
    const newPhoto: StudentPhoto = {
      id: `img-${Math.random().toString(36).substr(2, 5)}`,
      studentId,
      timestamp: new Date().toISOString(),
      source: 'camera_capture',
      confidence,
      isObsolete: false
    };

    photos.push(newPhoto);

    // Lógica de purga (Fase 401): se tiver mais de 5 fotos, marca a mais antiga de captura como obsoleta
    if (photos.length > 5) {
      const capturePhotos = photos.filter(p => p.source === 'camera_capture');
      if (capturePhotos.length > 3) {
        capturePhotos[0].isObsolete = true;
      }
    }

    this.studentVault[studentId] = photos.filter(p => !p.isObsolete);
    this.emit('identity-refined', { studentId, totalPhotos: this.studentVault[studentId].length });
    
    console.log(`[IDENTITY] Refined photos for ${studentId}. Current count: ${this.studentVault[studentId].length}`);
  }

  public getPhotos(studentId: string) {
    return this.studentVault[studentId] || [];
  }
}

export const studentIdentityRefinementService = new StudentIdentityRefinementService();
