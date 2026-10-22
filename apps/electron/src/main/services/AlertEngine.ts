import { EventEmitter } from 'events';
import { WebSocketServerManager } from './WebSocketServer';
import { notificationQueue } from './NotificationQueueService';
import { Database } from '../../database/Database';
import { FaceDetectedPayload } from '../../services/AiTypes';
import { behavioralEngine } from './BehavioralEngine';
import { personReid } from './PersonReidService';
import { pushNotificationService } from './PushNotificationService';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { livenessDetector } from './LivenessDetectorService';
import { MobileCompanionService } from './MobileCompanionService';

/**
 * AlertEngine.ts — AG-011 + AG-024 + AG-026 + AG-027
 * Monitora detecções e dispara alertas baseados em vínculos, auto-aprendizado e briefings.
 */
export class AlertEngine extends EventEmitter {
  private lastAlerts = new Map<string, number>();

  constructor(
    private readonly db: Database,
    private readonly mobileCompanion?: MobileCompanionService,
    private readonly wsServer?: WebSocketServerManager
  ) {
    super();

    behavioralEngine.on('behavioral-alert', async (event: any) => {
      await this._triggerBehavioralAlert(event);
    });

    // Garantir pastas de mídia
    const userData = app.getPath('userData');
    ['proofs', 'augmentations', 'verification'].forEach(dir => {
      const p = path.join(userData, dir);
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });
  }

  async processDetection(data: FaceDetectedPayload, zone: string, cameraId?: string): Promise<void> {
    const { student_id } = data;
    const now = Date.now();

    const lastAlertTime = this.lastAlerts.get(student_id) || 0;
    if (now - lastAlertTime < 5 * 60 * 1000) return;

    // 0. Anti-Spoofing Check (Step 07)
    const { isLive, score } = livenessDetector.verify(data);
    if (!isLive) {
      console.warn(`[ATTENTION] Spoofing attack detected for student ${student_id} (Score: ${score})`);
      const alert = { type: 'SPOOFING_ATTACK', studentId: student_id, zone, confidence: score };
      this.emit('security-alert', alert);
      this.wsServer?.notifyAlert(alert);
      return; 
    }

    try {
      const student = await this.db.getStudent(student_id);
      if (!student) return;

      // 1. Presença Vinculada (AG-024)
      await this._logAttendance(student_id, zone, cameraId || data.camera_id);

      // 2. Motores Secundários
      const ts = typeof data.ts === 'string' ? Date.parse(data.ts) : data.ts;
      behavioralEngine.processRecognition({ studentId: student_id, zoneId: zone, ts });
      personReid.recordMovement(student_id, zone);

      // 3. Regras de Segurança
      if (data.occlusion_score && data.occlusion_score > 0.7) {
        this.emit('security-alert', { type: 'OCCLUSION', studentId: student_id, zone });
      }

      if (zone === 'saida_principal') {
        const exitAlert = await this._triggerExitAlert(student);
        this.wsServer?.notifyAlert(exitAlert);
      }

      if (data.behavior === 'running') {
        await this.db.createNotification({
            type: 'BEHAVIORAL', title: 'Movimentação Suspeita',
            message: `Aluno ${student.name} detectado correndo em ${zone}.`,
            priority: 'medium', studentId: student_id, read: 0
        });
        this.emit('security-alert', { type: 'RUNNING', studentId: student_id, zone });
      }

      if (data.behavior === 'falling') {
        await this.db.createNotification({
            type: 'BEHAVIORAL', title: 'Alerta de Queda',
            message: `POSSÍVEL QUEDA: Aluno ${student.name} detectado em queda na zona ${zone}.`,
            priority: 'high', studentId: student_id, read: 0
        });
        this.emit('security-alert', { type: 'FALL', studentId: student_id, zone });
      }

      if (data.behavior === 'loitering') {
        const proofPath = await this._captureEvidenceProof(`loitering_${student_id}_${now}`);
        await this.db.createNotification({
            type: 'LOITERING', title: 'Alerta de Permanência',
            message: `O aluno ${student.name} permanece na zona ${zone} por tempo prolongado.`,
            priority: 'medium', studentId: student_id, read: 0,
            proofPath
        });
        this.emit('security-alert', { type: 'LOITERING', studentId: student_id, zone, proofPath });
      }

      if (data.behavior === 'cellphone') {
        const proofPath = await this._captureProof(cameraId || data.camera_id || 'unknown', student_id, 'CELLPHONE', data.zone);
        await this.db.createNotification({
            type: 'CELLPHONE_USAGE', title: 'Uso de Celular',
            message: `Aluno ${student.name} detectado utilizando celular em ${zone}.`,
            priority: 'medium', studentId: student_id, read: 0,
            proofPath
        });
        this.emit('security-alert', { type: 'CELLPHONE_USAGE', studentId: student_id, zone, proofPath });
      }

      // 4. Auto-Aprimoramento (AG-026)
      if (data.confidence > 0.9) {
        await this._collectAugmentation(data, zone);
      } else if (data.confidence < 0.6) {
        await this._queueForVerification(data, cameraId || data.camera_id || 'unknown');
      }

      // AG-059: Mock Uniform Detection
      await this._checkUniformDetection(student_id, student.name, zone);

      // 5. Briefing Inteligente (AG-027)
      await this._checkBriefingAlert(student_id, student.name);

      // 6. Mobile Push (Step 31)
      if (this.mobileCompanion) {
        this.mobileCompanion.broadcast('SECURITY_ALERT', {
            type: 'DETECTION',
            studentName: student.name,
            zone,
            timestamp: now
        });
      }

      // 7. WebSocket Live Update (Phase v3430)
      this.wsServer?.notifyFaceRecognition({
        studentId: student_id,
        studentName: student.name,
        zone,
        confidence: data.confidence,
        timestamp: now
      });

      // 8. COOL.ME.IA: Social/Behavioral Analysis (v4001)
      if (data.behavior_metadata) {
        await this.analyzeSocialBehavior(
          student_id, 
          data.behavior_metadata.duration_in_zone || 0, 
          data.behavior_metadata.nearby_count || 0
        );
      }
 
      this.lastAlerts.set(student_id, now);
    } catch (error) {
      console.error('[AlertEngine] Erro:', error);
    }
  }


  private async _logAttendance(studentId: string, zone: string, cameraId?: string): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
    const currentDay = now.getDay();

    const student = await this.db.getStudent(studentId);
    if (!student) return;

    // 1. Carregar Configurações
    const settings = await this.db.getSettings();
    const startTime = settings.school_start_time || '07:00';
    const endTime = settings.school_end_time || '13:00';
    const academicDays = settings.academic_days ? JSON.parse(settings.academic_days) : [1, 2, 3, 4, 5];
    const holidays = settings.holidays ? JSON.parse(settings.holidays) : [];

    const isAcademicDay = academicDays.includes(currentDay);
    const isHoliday = holidays.includes(today);
    const isWithinHours = currentTime >= startTime && currentTime <= endTime;

    // 2. Registrar Presença apenas se for dia letivo e dentro do horário
    if (isAcademicDay && !isHoliday && isWithinHours) {
      await this.db.recordAttendance({
        id: `att-${studentId}-${today}`,
        studentId, date: today, status: 'present', percentage: 100,
        classId: student.classId || 'default', scheduleId: 'detect-auto',
        timeInClass: 0, totalDuration: 0
      });
    }

    // 3. Gerar Notificação de Movimentação (Sempre gera, para segurança/log)
    let type = 'ENTRY_CONFIRMATION';
    let title = 'Entrada na Escola';
    let priority: 'low' | 'medium' | 'high' = 'low';

    if (cameraId) {
      const room = await this.db.getRoomByCameraId(cameraId);
      if (room) {
        type = 'CLASSROOM_ENTRY';
        title = 'Entrada em Sala';
        zone = room.name;
        if (room.environment) zone += ` (${room.environment})`;

        // Verifica atraso se for entrada em sala
        if (isWithinHours && currentTime > startTime) {
           // Lógica de atraso pode ser mais refinada por aula, 
           // mas aqui usamos o início da escola como base simplificada
        }

        // VERIFICAÇÃO DE VÍNCULO DINÂMICA (Baseada na Grade Horária - AG-034)
        const currentSchedule = await this.db.getCurrentScheduleForRoom(room.id, currentDay, currentTime);
        
        if (currentSchedule) {
          if (currentSchedule.classId !== student.classId) {
            const msg = `⚠️ SALA ERRADA: Aluno ${student.name} (${student.classId}) detectado na ${room.name} durante aula de ${currentSchedule.subject} (Turma ${currentSchedule.classId}).`;
            await this.db.createNotification({
              type: 'BEHAVIORAL', title: 'Erro de Alocação',
              message: msg, priority: 'high', studentId, read: 0
            });
            this.emit('security-alert', { type: 'WRONG_ROOM', studentId, zone: room.name });
            return;
          }
        } else if (room.type === 'CLASSROOM') {
          // Se for uma sala de aula e não houver aula agendada, mas o aluno está lá
          const msg = `⚠️ PRESENÇA NÃO AGENDADA: Aluno ${student.name} detectado na ${room.name} sem aula prevista no horário.`;
          await this.db.createNotification({
            type: 'BEHAVIORAL', title: 'Uso Indevido de Sala',
            message: msg, priority: 'medium', studentId, read: 0
          });
        }
      }
    } else if (zone.toLowerCase().includes('sala')) {
      type = 'CLASSROOM_ENTRY';
      title = 'Entrada em Sala';
    }

    const suffix = (!isAcademicDay || isHoliday || !isWithinHours) ? ' (Fora de Período Acadêmico)' : '';

    await this.db.createNotification({
      type, title,
      message: `Aluno ${student.name} identificado em ${zone}${suffix}.`,
      priority, studentId, read: 0
    });

    // VERIFICAÇÃO DE ALERTA DE FALTAS (Passo 27)
    const anomalies = await this.db.calculateAttendanceAnomalies(studentId);
    if (anomalies && anomalies.percAbsence >= 20) {
       await this.db.createNotification({
         type: 'ATTENDANCE_RISK',
         title: 'Risco de Evasão / Reprovação',
         message: `CRÍTICO: Aluno ${student.name} atingiu ${anomalies.percAbsence.toFixed(1)}% de faltas.`,
         priority: 'high',
         studentId,
         read: 0
       });
    }
  }

  private async _triggerExitAlert(student: any): Promise<any> {
    const msg = `O aluno ${student.name} passou pela saída em ${new Date().toLocaleTimeString('pt-BR')}.`;
    const alert = {
      type: 'UNAUTHORIZED_EXIT', title: 'Alerta de Saída',
      message: msg, priority: 'high', studentId: student.id, read: 0
    };
    await this.db.createNotification(alert);

    if (student.parentPhone) {
      notificationQueue.addToQueue(
        student.parentPhone, 
        `Eagle AI: ${msg}`
      );
    }
    return alert;
  }

  private async _triggerBehavioralAlert(event: any): Promise<void> {
    const student = await this.db.getStudent(event.studentId);
    if (!student) return;
    pushNotificationService.notifyParent(student.name, `Alerta de ${event.type} em ${event.zoneId}.`, student.id);
  }

  private async _captureProof(cameraId: string, studentId: string, type: string, zone?: string): Promise<string | undefined> {
    const fileName = `proof_${type}_${studentId}_${Date.now()}.jpg`;
    const dest = path.join(app.getPath('userData'), 'proofs', fileName);
    return dest;
  }

  private async _collectAugmentation(data: FaceDetectedPayload, zone: string): Promise<void> {
    const id = `aug-${data.student_id}-${Date.now()}`;
    const userData = app.getPath('userData');
    const imagePath = path.join(userData, 'augmentations', `${id}_face.jpg`);
    const fullBodyPath = path.join(userData, 'augmentations', `${id}_body.jpg`);

    const augmentation = {
        id,
        studentId: data.student_id,
        imagePath,
        fullBodyImagePath: fullBodyPath,
        perspective: zone.includes('entrada') ? 'front' : 'side',
        confidence: data.confidence,
        height: 1.70 + (Math.random() * 0.1),
        socialContext: JSON.stringify(['friend1', 'friend2']),
        displacementPattern: JSON.stringify({ route: [zone], time: new Date().getHours() }),
        predictedNextCamera: 'cam_corredor_central'
    };

    await this.db.upsertAugmentation(augmentation);
  }

  private async _queueForVerification(data: FaceDetectedPayload, cameraId: string): Promise<void> {
    const id = `ver-${Date.now()}`;
    const imagePath = path.join(app.getPath('userData'), 'verification', `${id}.jpg`);

    await this.db.upsertVerificationQueue({
        id,
        studentId: data.student_id,
        cameraId,
        imagePath,
        status: 'pending'
    });
  }

  private async _checkBriefingAlert(studentId: string, studentName: string): Promise<void> {
    try {
        const anomalies = await this.db.calculateAttendanceAnomalies(studentId);
        
        if (anomalies && (anomalies.isAtRisk || anomalies.recurringPattern)) {
            let title = 'Briefing de Acompanhamento';
            let message = `RECAP: O aluno ${studentName}`;
            let priority: 'medium' | 'high' = 'medium';

            if (anomalies.isAtRisk) {
                message += ` atingiu ${anomalies.percAbsence.toFixed(1)}% de faltas (Crítico: 25%).`;
                priority = 'high';
            }

            if (anomalies.recurringPattern) {
                message += ` possui um padrão de ausência recorrente: ${anomalies.recurringPattern}.`;
            }

            message += ` Necessário contato com a família para evitar perda de bimestre.`;

            // Evitar spam (1 por semana)
            const lastBriefing = await this.db.all(`SELECT createdAt FROM notifications WHERE studentId = ? AND type = 'BRIEFING' ORDER BY createdAt DESC LIMIT 1`, [studentId]);
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            
            if (lastBriefing.length === 0 || (Date.now() - new Date(lastBriefing[0].createdAt).getTime() > oneWeek)) {
                await this.db.createNotification({
                    type: 'BRIEFING', title, message, priority, studentId, read: 0
                });

                // Enviar para WhatsApp (Simulada)
                if (studentId) {
                    const student = await this.db.getStudent(studentId);
                    if (student?.parentPhone) {
                        await notificationQueue.addToQueue(
                           student.parentPhone,
                           `[Áquila Pro] Briefing de Acompanhamento: ${message}`
                        );
                    }
                }
            }
        }
    } catch (e) {
        console.error('[AlertEngine] Erro no briefing:', e);
    }
  }

  /**
   * _captureEvidenceProof — Passo 41.
   * Simula a captura de um frame da câmera como prova do alerta.
   */
  private async _captureEvidenceProof(alertId: string): Promise<string> {
    const proofsDir = path.join(app.getPath('userData'), 'proofs');
    if (!fs.existsSync(proofsDir)) fs.mkdirSync(proofsDir, { recursive: true });
    
    const fileName = `${alertId}.jpg`;
    const dest = path.join(proofsDir, fileName);
    
    // Mock: Na vida real, pegamos o frame atual do worker de vídeo
    fs.writeFileSync(dest, 'MOCKED_IMAGE_DATA'); 
    return dest;
  }

  /**
   * processCrowdDetection — Passo 47.
   * Analisa a densidade de pessoas em um frame.
   */
  public async processCrowdDetection(zoneId: string, peopleCount: number): Promise<void> {
    if (peopleCount >= 5) {
       await this.db.createNotification({
         type: 'CROWD_ALERT',
         title: 'Aglomeração Detectada',
         message: `Atenção: ${peopleCount} pessoas identificadas simultaneamente em ${zoneId}.`,
         priority: 'medium',
         read: 0
       });
       
       if (this.mobileCompanion) {
         this.mobileCompanion.broadcast('CROWD_ALERT', { zoneId, count: peopleCount });
       }
    }
  }

  /**
   * processFaceDetection - Processa um evento de detecção facial.
   * @param detection Dados da detecção facial.
   * @param cameraId ID da câmera onde a detecção ocorreu.
   */
  public async processFaceDetection(detection: FaceDetectedPayload, cameraId: string): Promise<void> {
    // AG-055: Mock Gate Control
    if (detection.confidence > 0.9) {
      this._triggerGateOpen(detection.student_id || 'unknown');
    }
    // ... (restante da lógica de processamento de detecção facial)
  }

  /**
   * getUsers - Retorna uma lista de usuários.
   * @returns Promise<any[]> Lista de usuários.
   */
  public async getUsers(): Promise<any[]> {
    return this.db.all('SELECT id, name, email FROM users');
  }

  private async _checkUniformDetection(studentId: string, studentName: string, zone: string): Promise<void> {
    const hasUniform = Math.random() > 0.3; // 70% chance (mock)
    if (!hasUniform) {
       await this.db.createNotification({
         type: 'UNIFORM_VIOLATION',
         title: 'Ausência de Uniforme',
         message: `Aluno ${studentName} detectado em ${zone} sem o uniforme padrão.`,
         priority: 'low',
         studentId,
         read: 0
       });
       this.emit('security-alert', { type: 'NO_UNIFORM', studentId, zone });
    }
  }

  /**
   * [SQA-ALE-1330] Analisa telemetria comportamental para identificar isolamento ou aglomerações.
   * Parte do Córtex da Áquila Pro v4001.
   */
  public async analyzeSocialBehavior(studentId: string, durationInZone: number, nearbyCount: number): Promise<void> {
    const ISOLATION_THRESHOLD = 40 * 60; // 40 minutos sozinhos em zona de pátio

    if (nearbyCount === 0 && durationInZone > ISOLATION_THRESHOLD) {
      await this.db.createNotification({
        id: `social-${studentId}-${Date.now()}`,
        type: 'SOCIAL_ISOLATION',
        title: 'Isolamento Social Detectado',
        message: `Atenção: Aluno identificado sozinho em zona externa por tempo prolongado (>40min).`,
        priority: 'medium',
        studentId,
        read: 0
      });
      this.emit('security-alert', { type: 'SOCIAL_ISOLATION', studentId });
    }
  }

  private _triggerGateOpen(studentId: string): void {
    console.log(`[GATE-CONTROL] Abrindo catraca para aluno: ${studentId}`);
    // Mock de pulso elétrico via GPIO ou API de controladora (ex: Control iD)
    this.emit('gate-event', {
      type: 'open',
      studentId,
      timestamp: new Date().toISOString()
    });
  }
}

