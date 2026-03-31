import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { securityService } from '../services/SecurityService';
import { ImmutableAuditLog } from '../services/ImmutableAuditLog';

export default class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  public auditLog: ImmutableAuditLog | null = null;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbPath = customPath;
    } else {
      const appDataPath = process.env.APPDATA || '';
      const aquilaPath = path.join(appDataPath, 'AquilaPro');

      if (!fs.existsSync(aquilaPath)) {
        fs.mkdirSync(aquilaPath, { recursive: true });
      }

      this.dbPath = path.join(aquilaPath, 'aquila.db');
    }
  }

  /**
   * Inicializa o banco de dados
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          // Ativar Modo WAL e Busy Timeout para concorrência (Essential Mês 1)
          this.run('PRAGMA journal_mode = WAL;')
            .then(() => this.run('PRAGMA busy_timeout = 5000;'))
            .then(() => this.createTables())
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  /**
   * Cria as tabelas necessárias
   */
  private async createTables(): Promise<void> {
    const tables = [
      // Tabela de Escolas
      `CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Turmas
      `CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        name TEXT NOT NULL,
        grade TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schoolId) REFERENCES schools(id)
      )`,

      // Tabela de Alunos
      `CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        classId TEXT NOT NULL,
        name TEXT NOT NULL,
        photoPath TEXT,
        photoHash TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (classId) REFERENCES classes(id)
      )`,

      // Tabela de Consentimento LGPD
      `CREATE TABLE IF NOT EXISTS user_consent (
        userId TEXT PRIMARY KEY,
        consentedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        termVersion TEXT NOT NULL,
        clientIp TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      )`,

      // Tabela de Configurações de Retenção de Dados
      `CREATE TABLE IF NOT EXISTS data_retention_settings (
        id TEXT PRIMARY KEY,
        daysCount INTEGER NOT NULL,
        dataType TEXT NOT NULL, -- 'events', 'logs', 'images'
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Licenciamento (Phase 3)
      `CREATE TABLE IF NOT EXISTS licenses (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        type TEXT NOT NULL, -- 'standard', 'premium', 'enterprise'
        maxStudents INTEGER DEFAULT 50,
        maxCameras INTEGER DEFAULT 4,
        expiresAt DATETIME,
        activatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active'
      )`,

      // Tabela de Salas
      `CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        name TEXT NOT NULL,
        location TEXT,
        cameraId TEXT,
        capacity INTEGER DEFAULT 30,
        floor TEXT,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schoolId) REFERENCES schools(id)
      )`,

      // Tabela de Grade Horária
      `CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        classId TEXT NOT NULL,
        roomId TEXT NOT NULL,
        teacherId TEXT, -- FK para users.id
        subject TEXT NOT NULL,
        teacher TEXT, -- Nome legível (legacy)
        dayOfWeek INTEGER,
        startTime TEXT,
        endTime TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (classId) REFERENCES classes(id),
        FOREIGN KEY (roomId) REFERENCES rooms(id),
        FOREIGN KEY (teacherId) REFERENCES users(id)
      )`,

      // Tabela de Relatórios de Aula (Whiteboard Capture)
      `CREATE TABLE IF NOT EXISTS lesson_reports (
        id TEXT PRIMARY KEY,
        scheduleId TEXT NOT NULL,
        date DATE NOT NULL,
        whiteboardPhotoPath TEXT, -- Legacy (First photo)
        photoPaths TEXT, -- JSON array of all photos
        aiSummary TEXT,
        teacherNotes TEXT,
        generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scheduleId) REFERENCES schedules(id)
      )`,

      // Tabela de Eventos
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        classId TEXT NOT NULL,
        roomId TEXT NOT NULL,
        eventType TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id),
        FOREIGN KEY (classId) REFERENCES classes(id),
        FOREIGN KEY (roomId) REFERENCES rooms(id)
      )`,

      // Tabela de Presença
      `CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        classId TEXT NOT NULL,
        scheduleId TEXT NOT NULL,
        date DATE NOT NULL,
        status TEXT,
        percentage REAL,
        timeInClass INTEGER,
        totalDuration INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id),
        FOREIGN KEY (classId) REFERENCES classes(id),
        FOREIGN KEY (scheduleId) REFERENCES schedules(id)
      )`,

      // Tabela de Notificações / Incidentes (Refatorada v1605)
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        priority TEXT,
        studentId TEXT,
        read INTEGER DEFAULT 0,
        treatedAt DATETIME,
        treatedBy TEXT,
        treatmentNotes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id)
      )`,

      // Tabela de Funcionários (RH v3.0)
      `CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        biometricId TEXT UNIQUE,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Detalhes de Contrato e RH
      `CREATE TABLE IF NOT EXISTS staff_details (
        staffId TEXT PRIMARY KEY,
        baseSalary REAL NOT NULL,
        contractType TEXT NOT NULL, -- 'CLT', 'PJ', 'MEI'
        admissionDate DATE,
        taxHoldingIRRF REAL DEFAULT 0,
        performanceScore INTEGER DEFAULT 100,
        onboardingStep INTEGER DEFAULT 0,
        FOREIGN KEY (staffId) REFERENCES staff(id)
      )`,

      // Registro de Ponto Biométrico
      `CREATE TABLE IF NOT EXISTS staff_ponto (
        id TEXT PRIMARY KEY,
        staffId TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        type TEXT NOT NULL, -- 'IN', 'OUT'
        FOREIGN KEY (staffId) REFERENCES staff(id)
      )`,

      // Documentação de Alunos (Secretaria v3.0)
      `CREATE TABLE IF NOT EXISTS student_documents (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        docType TEXT NOT NULL, -- 'RG', 'CPF', 'RESIDENCE', 'VACCINE'
        status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
        filePath TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id)
      )`,

      // Tabela de Backup
      `CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        fileName TEXT NOT NULL,
        size INTEGER,
        status TEXT,
        error TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Configurações
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Outbox (fila de sincronização LGPD — só dados agregados)
      `CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        sync_result TEXT
      )`,

      // Tabela de Logs de Auditoria
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        userId TEXT,
        studentId TEXT,
        action TEXT,
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Contexto Social
      `CREATE TABLE IF NOT EXISTS social_context (
        id TEXT PRIMARY KEY,
        studentId TEXT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Coordenações
      `CREATE TABLE IF NOT EXISTS coordinations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        schoolId TEXT
      )`,

      // Tabela de Períodos Acadêmicos
      `CREATE TABLE IF NOT EXISTS academic_periods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        startDate DATE,
        endDate DATE,
        schoolId TEXT
      )`,

      // Tabela de Relatórios de Alunos
      `CREATE TABLE IF NOT EXISTS student_reports (
        studentId TEXT,
        periodId TEXT,
        data TEXT,
        PRIMARY KEY (studentId, periodId)
      )`,

      // Tabela de Leads
      `CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        message TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Usuários (AG-010)
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        coordinationId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Logs de Presença (Detalhada)
      `CREATE TABLE IF NOT EXISTS attendance_logs (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        classId TEXT,
        cameraId TEXT,
        type TEXT, -- 'ENTRY', 'EXIT'
        isManual INTEGER DEFAULT 0, -- 1 if manually corrected
        originalType TEXT, -- Original AI detection before correction
        duration INTEGER,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )`,

      // Tabela de Câmeras (AG-051)
      `CREATE TABLE IF NOT EXISTS cameras (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        ip TEXT,
        rtspUrl TEXT,
        username TEXT,
        password TEXT,
        status TEXT,
        type TEXT,
        resolution TEXT,
        fps INTEGER,
        lastSeen TEXT,
        lastError TEXT,
        enabled INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Fila WhatsApp (AG-052)
      `CREATE TABLE IF NOT EXISTS whatsapp_queue (
        id TEXT PRIMARY KEY,
        "to" TEXT NOT NULL,
        body TEXT NOT NULL,
        studentId TEXT,
        eventType TEXT,
        attempts INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        queuedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de Embeddings de Face (V3 - Front 3)
      `CREATE TABLE IF NOT EXISTS face_embeddings (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        embedding TEXT NOT NULL,
        angle TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id)
      )`,
      // Tabela de Financeiro (V3)
      `CREATE TABLE IF NOT EXISTS billing (
        id TEXT PRIMARY KEY,
        studentHash TEXT NOT NULL,
        amount REAL NOT NULL,
        dueDate DATE NOT NULL,
        status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
        pixCode TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // Tabela de Logs Comportamentais (Phase 241)
      `CREATE TABLE IF NOT EXISTS behavioral_logs (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        stress REAL DEFAULT 0,
        anxiety REAL DEFAULT 0,
        aggression REAL DEFAULT 0,
        fatigue REAL DEFAULT 0,
        engagement REAL DEFAULT 1,
        riskScore INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id)
      )`,
      // Tabela de Perfis de Evasão (Phase 250)
      `CREATE TABLE IF NOT EXISTS evasion_profiles (
        studentId TEXT PRIMARY KEY,
        riskProbability REAL NOT NULL,
        factors TEXT, -- JSON string
        trend TEXT, -- 'up', 'down', 'stable'
        lastAudit DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id)
      )`,
    ];

    for (const table of tables) {
      await this.run(table);
    }
  }

  /**
   * Executa uma query SQL (Sinônimo para run ou all dependendo do contexto)
   */
  public async query(sql: string, params: any[] = []): Promise<any> {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return this.all(sql, params);
    }
    return this.run(sql, params);
  }

  /**
   * Executa uma query que não retorna dados (INSERT, UPDATE, DELETE)
   * Com retry para SQLITE_BUSY (Robustness Phase)
   */
  async run(sql: string, params: any[] = []): Promise<void> {
    const maxRetries = 3;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await new Promise((resolve, reject) => {
          this.db?.run(sql, params, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (err: any) {
        lastError = err;
        if (err.code === 'SQLITE_BUSY' && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 100; // 100ms, 200ms, 400ms
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /**
   * Executa uma query que retorna uma única linha
   */
  async get(sql: string, params: any[] = []): Promise<any> {
    const maxRetries = 3;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await new Promise((resolve, reject) => {
          this.db?.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      } catch (err: any) {
        lastError = err;
        if (err.code === 'SQLITE_BUSY' && i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, Math.pow(2, i) * 100));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /**
   * Executa uma query que retorna múltiplas linhas
   */
  async all(sql: string, params: any[] = []): Promise<any[]> {
    const maxRetries = 3;
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await new Promise((resolve, reject) => {
          this.db?.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });
      } catch (err: any) {
        lastError = err;
        if (err.code === 'SQLITE_BUSY' && i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, Math.pow(2, i) * 100));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  // ===== MÉTODOS DE ALUNOS =====

  async getStudentsByClass(classId: string): Promise<any[]> {
    const students = classId === 'all' 
      ? await this.all('SELECT * FROM students')
      : await this.all('SELECT * FROM students WHERE classId = ?', [classId]);
    
    return students.map(s => {
      if (s.name && s.name.includes(':')) {
        s.name = securityService.decrypt(s.name);
      }
      return s;
    });
  }

  async getStudents(): Promise<any[]> {
    return this.getStudentsByClass('all');
  }

  async getStudent(studentId: string): Promise<any> {
    const student = await this.get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (student && student.name && student.name.includes(':')) {
      student.name = securityService.decrypt(student.name);
    }
    return student;
  }

  async updateStudent(studentId: string, data: any): Promise<void> {
    const keys = Object.keys(data).filter(k => k !== 'id');
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const values = [...keys.map(k => {
      if (k === 'name' && data[k]) return securityService.encrypt(data[k]);
      return data[k];
    }), studentId];
    return this.run(`UPDATE students SET ${sets} WHERE id = ?`, values);
  }

  async createStudent(student: any): Promise<void> {
    const sql = `INSERT INTO students (id, classId, name, photoPath, photoHash) 
                 VALUES (?, ?, ?, ?, ?)`;
    return this.run(sql, [
      student.id,
      student.classId,
      securityService.encrypt(student.name),
      student.photoPath,
      student.photoHash,
    ]);
  }

  // ===== MÉTODOS DE EVENTOS =====

  async recordEvent(event: any): Promise<void> {
    const sql = `INSERT INTO events (id, studentId, classId, roomId, eventType, timestamp) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      event.id,
      event.studentId,
      event.classId,
      event.roomId,
      event.eventType,
      event.timestamp,
    ]);
  }

  async getStudentEvents(studentId: string, classId: string, date: Date): Promise<any[]> {
    const dateStr = date.toISOString().split('T')[0];
    const sql = `SELECT * FROM events 
                 WHERE studentId = ? AND classId = ? AND DATE(timestamp) = ?
                 ORDER BY timestamp ASC`;
    return this.all(sql, [studentId, classId, dateStr]);
  }

  // ===== MÉTODOS DE PRESENÇA =====

  async recordAttendance(attendance: any): Promise<void> {
    const sql = `INSERT INTO attendance 
                 (id, studentId, classId, scheduleId, date, status, percentage, timeInClass, totalDuration) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      attendance.id,
      attendance.studentId,
      attendance.classId,
      attendance.scheduleId,
      attendance.date,
      attendance.status,
      attendance.percentage,
      attendance.timeInClass,
      attendance.totalDuration,
    ]);
  }

  async getAttendanceReport(classId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const sql = `SELECT s.name, a.status, a.percentage, a.date
                 FROM attendance a
                 JOIN students s ON a.studentId = s.id
                 WHERE a.classId = ? AND a.date BETWEEN ? AND ?
                 ORDER BY a.date DESC`;
    return this.all(sql, [
      classId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
    ]);
  }

  async recordPresenceEntry(data: any): Promise<void> {
    const sql = `INSERT INTO attendance_logs (id, student_id, classId, cameraId, type, logged_at) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      `log-${Date.now()}`,
      data.studentId,
      data.classId,
      data.cameraId,
      'ENTRY',
      data.entryTime instanceof Date ? data.entryTime.toISOString() : data.entryTime
    ]);
  }

  async recordPresenceExit(data: any): Promise<void> {
    const sql = `INSERT INTO attendance_logs (id, student_id, classId, type, duration, logged_at) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      `log-${Date.now()}`,
      data.studentId,
      data.classId,
      'EXIT',
      data.duration,
      data.exitTime instanceof Date ? data.exitTime.toISOString() : data.exitTime
    ]);
  }

  async getPresenceRecord(studentId: string, classId: string, date: Date): Promise<any> {
    const dateStr = date.toISOString().split('T')[0];
    const sql = `SELECT * FROM attendance_logs 
                 WHERE student_id = ? AND classId = ? AND DATE(logged_at) = ?
                 ORDER BY logged_at DESC LIMIT 1`;
    return this.get(sql, [studentId, classId, dateStr]);
  }

  async syncManualPresence(studentId: string, classId: string, type: string): Promise<void> {
    const id = `man-${Date.now()}-${studentId}`;
    const sql = `INSERT INTO attendance_logs (id, student_id, classId, type, isManual, logged_at) 
                 VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`;
    
    await this.run(sql, [id, studentId, classId, type]);

    if (this.auditLog) {
      await this.auditLog.record('MANUAL_PRESENCE_UPDATE', {
        id,
        studentId,
        classId,
        newType: type
      });
    }
  }

  // ===== MÉTODOS DE NOTIFICAÇÕES =====



  async getUnreadNotifications(): Promise<any[]> {
    return this.all('SELECT * FROM notifications WHERE read = 0 ORDER BY timestamp DESC');
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    return this.run('UPDATE notifications SET read = 1 WHERE id = ?', [notificationId]);
  }

  async getNotificationsSince(date: Date): Promise<any[]> {
    return this.all('SELECT * FROM notifications WHERE timestamp >= ? ORDER BY timestamp DESC', [
      date.toISOString(),
    ]);
  }

  async deleteNotificationsBefore(date: Date): Promise<void> {
    return this.run('DELETE FROM notifications WHERE timestamp < ?', [date.toISOString()]);
  }

  // ===== MÉTODOS DE ALERTAS (Sinônimo para Notifications) =====

  async saveAlert(alert: any): Promise<void> {
    const sql = `INSERT INTO notifications 
                 (id, type, title, message, priority, studentId, read, timestamp) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      alert.id,
      alert.type,
      alert.title,
      alert.message,
      alert.severity || alert.priority,
      alert.data?.studentId || alert.studentId,
      alert.read ? 1 : 0,
      alert.timestamp instanceof Date ? alert.timestamp.toISOString() : alert.timestamp
    ]);
  }

  async updateAlert(id: string, data: any): Promise<void> {
    const keys = Object.keys(data);
    const sets = keys.map(k => `${k === 'read' ? 'read' : k} = ?`).join(', ');
    const values = keys.map(k => k === 'read' ? (data[k] ? 1 : 0) : data[k]);
    return this.run(`UPDATE notifications SET ${sets} WHERE id = ?`, [...values, id]);
  }

  async deleteAlert(id: string): Promise<void> {
    return this.run('DELETE FROM notifications WHERE id = ?', [id]);
  }

  // ===== MÉTODOS DE GOVERNANÇA (v1605) =====

  async treatAlert(id: string, userId: string, notes: string): Promise<void> {
    const sql = `UPDATE notifications 
                 SET treatedAt = CURRENT_TIMESTAMP, treatedBy = ?, treatmentNotes = ?, read = 1 
                 WHERE id = ?`;
    await this.run(sql, [userId, notes, id]);
    
    await this.logAudit(userId, 'TREAT_INCIDENT', `Incidente ${id} tratado: ${notes.substring(0, 50)}...`);
  }

  async logAudit(userId: string, action: string, reason: string, payload?: any): Promise<void> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sql = `INSERT INTO audit_logs (id, userId, action, reason, timestamp) 
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    return this.run(sql, [id, userId, action, reason]);
  }

  async getIncidentHistory(limit = 50): Promise<any[]> {
    return this.all('SELECT * FROM notifications WHERE treatedAt IS NOT NULL ORDER BY treatedAt DESC LIMIT ?', [limit]);
  }

  // ===== MÉTODOS DE CONFIGURAÇÕES =====

  async getSettings(): Promise<any> {
    const sensitiveKeys = ['awsAccessKey', 'awsSecretKey', 'awsRegion', 'awsBucket'];
    const settings = await this.all('SELECT * FROM settings');
    const result: any = {};
    for (const setting of settings) {
      if (sensitiveKeys.includes(setting.key) && setting.value && setting.value.includes(':')) {
        result[setting.key] = securityService.decrypt(setting.value);
      } else {
        result[setting.key] = setting.value;
      }
    }
    return result;
  }

  async saveSettings(settings: any): Promise<void> {
    const sensitiveKeys = ['awsAccessKey', 'awsSecretKey', 'awsRegion', 'awsBucket'];
    for (const [key, value] of Object.entries(settings)) {
      let finalValue = value as string;
      if (sensitiveKeys.includes(key) && value) {
        finalValue = securityService.encrypt(value as string);
      }
      const sql = `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`;
      await this.run(sql, [key, finalValue]);
    }
  }
 
  async logSystemUsage(duration: number, detections: number, alerts: number): Promise<void> {
    return this.run(
      'INSERT INTO audit_logs (id, action, payload, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [`usage-${Date.now()}`, 'HEARTBEAT', JSON.stringify({ duration, detections, alerts })]
    );
  }
 
  async getRecentUsage(limit = 10): Promise<any[]> {
    return this.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
  }
 
  // ===== MÉTODOS DE BACKUP =====

  async logBackup(backup: any): Promise<void> {
    const sql = `INSERT INTO backups (id, fileName, size, status, error, timestamp) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      `backup-${Date.now()}`,
      backup.fileName,
      backup.size,
      backup.status,
      backup.error,
      backup.timestamp,
    ]);
  }

  async exportDatabase(): Promise<string> {
    // Implementar exportação do banco de dados
    return this.dbPath;
  }

  async restoreDatabase(data: Buffer): Promise<void> {
    // Implementar restauração do banco de dados
    fs.writeFileSync(this.dbPath, data);
  }

  // ===== MÉTODOS DE GRADE HORÁRIA =====

  async getClassSchedule(classId: string, date: Date): Promise<any> {
    const dayOfWeek = date.getDay();
    return this.get(
      'SELECT * FROM schedules WHERE classId = ? AND dayOfWeek = ? LIMIT 1',
      [classId, dayOfWeek]
    );
  }

  async getClassSchedulesByPeriod(classId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.all(
      'SELECT * FROM schedules WHERE classId = ? ORDER BY dayOfWeek, startTime',
      [classId]
    );
  }
 
  async getStudentsScheduledNow(timeStr: string, dayOfWeek: number): Promise<any[]> {
    return this.all(`
      SELECT s.id as studentId, s.name as studentName, sc.roomId, sc.subject, r.name as roomName, r.cameraId
      FROM students s
      JOIN classes c ON s.classId = c.id
      JOIN schedules sc ON c.id = sc.classId
      JOIN rooms r ON sc.roomId = r.id
      WHERE sc.dayOfWeek = ? AND ? BETWEEN sc.startTime AND sc.endTime
    `, [dayOfWeek, timeStr]);
  }

  // ===== MÉTODOS DE PROFESSOR (PHASE 900) =====

  async getTeacherSchedules(teacherId: string): Promise<any[]> {
    return this.all(`
      SELECT sc.*, c.name as className, r.name as roomName
      FROM schedules sc
      JOIN classes c ON sc.classId = c.id
      JOIN rooms r ON sc.roomId = r.id
      WHERE sc.teacherId = ?
      ORDER BY sc.dayOfWeek, sc.startTime
    `, [teacherId]);
  }

  async saveLessonReport(report: any): Promise<void> {
    const sql = `INSERT INTO lesson_reports 
                 (id, scheduleId, date, whiteboardPhotoPath, photoPaths, aiSummary, teacherNotes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      report.id || `rep-${Date.now()}`,
      report.scheduleId,
      report.date,
      report.whiteboardPhotoPath || (report.photoPaths?.[0]),
      JSON.stringify(report.photoPaths || []),
      report.aiSummary,
      report.teacherNotes
    ]);
  }

  async getLessonReports(scheduleId: string, limit = 10): Promise<any[]> {
    return this.all(
      'SELECT * FROM lesson_reports WHERE scheduleId = ? ORDER BY date DESC LIMIT ?',
      [scheduleId, limit]
    );
  }
 
  // ===== MÉTODOS DE ALERTAS =====

   /**
   * Obtém alunos que chegaram atrasados hoje (Step 19)
   * Agora com lógica real de comparação de horário e prevenção de spam.
   */
  async getLateStudents(date: Date = new Date()) {
    const today = date.toISOString().split('T')[0];
    
    // Buscar alunos que entraram hoje após o horário esperado na grade
    // E que ainda não foram notificados (verificando a tabela de notificações)
    const sql = `
      SELECT 
        s.id, 
        s.name, 
        p.arrivalTime, 
        sch.startTime as expectedTime
      FROM students s
      JOIN presence p ON s.id = p.studentId
      JOIN schedules sch ON s.classId = sch.classId
      WHERE p.date = ? 
        AND p.arrivalTime > sch.startTime
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.studentId = s.id 
            AND n.type = 'LATE_ARRIVAL' 
            AND n.timestamp >= ?
        )
      GROUP BY s.id
    `;
    
    try {
      const results = await this.all(sql, [today, today]);
      return results;
    } catch (err) {
      console.error('Erro ao buscar alunos atrasados:', err);
      return [];
    }
  }

  /**
   * Cria uma notificação no banco (Step 25)
   */
  async createNotification(data: any) {
    const sql = `
      INSERT INTO notifications (type, title, message, priority, studentId, read, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    return this.run(sql, [
      data.type,
      data.title,
      data.message,
      data.priority,
      data.studentId || null,
      data.read ? 1 : 0,
      data.timestamp.toISOString()
    ]);
  }

  async getUnauthorizedExits(now: Date): Promise<any[]> {
    return this.all('SELECT * FROM events WHERE eventType = "UNAUTHORIZED_EXIT" LIMIT 10');
  }

  async getSchoolExits(now: Date): Promise<any[]> {
    return this.all('SELECT * FROM events WHERE eventType = "SCHOOL_EXIT" LIMIT 10');
  }

  async getViolenceDetections(now: Date): Promise<any[]> {
    return this.all('SELECT * FROM events WHERE eventType = "VIOLENCE" LIMIT 10');
  }

  async getUnknownPersons(now: Date): Promise<any[]> {
    return this.all('SELECT * FROM events WHERE eventType = "UNKNOWN_PERSON" LIMIT 10');
  }

  async getCrowdingAlerts(now: Date): Promise<any[]> {
    return this.all('SELECT * FROM events WHERE eventType = "CROWDING" LIMIT 10');
  }

  // ===== MÉTODOS DE OUTBOX (Sync LGPD) =====

  async addOutboxItem(eventType: string, payload: Record<string, any>): Promise<void> {
    const sql = `INSERT INTO outbox (id, event_type, payload) VALUES (?, ?, ?)`;
    return this.run(sql, [`outbox-${Date.now()}`, eventType, JSON.stringify(payload)]);
  }

  async getOutboxItems(limit = 50): Promise<any[]> {
    return this.all(
      `SELECT * FROM outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
      [limit]
    );
  }

  async markOutboxSynced(id: string, result: string): Promise<void> {
    return this.run(
      `UPDATE outbox SET status = ?, synced_at = CURRENT_TIMESTAMP, sync_result = ? WHERE id = ?`,
      [result === 'ok' ? 'synced' : result, result, id]
    );
  }

  async deleteStudent(studentId: string): Promise<void> {
    return this.run('DELETE FROM students WHERE id = ?', [studentId]);
  }

  async getAuditLogs(studentId?: string): Promise<any[]> {
    if (studentId) {
      return this.all('SELECT * FROM audit_logs WHERE studentId = ? ORDER BY timestamp DESC', [studentId]);
    }
    return this.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
  }

  async createAuditEntry(entry: any): Promise<void> {
    const sql = `INSERT INTO audit_logs (id, userId, studentId, action, reason, timestamp) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      `audit-${Date.now()}`,
      entry.userId,
      entry.studentId,
      entry.action,
      entry.reason,
      entry.timestamp || new Date().toISOString()
    ]);
  }

  async getTodayPresenceCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(DISTINCT student_id) as count FROM attendance_logs WHERE date(timestamp) = date("now")');
    return result?.count || 0;
  }

  async getTotalEnrolledCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM students');
    return result?.count || 0;
  }

  async getDashboardStats(): Promise<any> {
    const totalStudents = await this.getTotalEnrolledCount();
    const todayPresence = await this.getTodayPresenceCount();
    const classes = await this.get('SELECT COUNT(*) as count FROM classes');
    const alerts = await this.get('SELECT COUNT(*) as count FROM notifications WHERE read = 0');
    
    const presenceRate = totalStudents > 0 ? (todayPresence / totalStudents) * 100 : 0;

    return {
      totalStudents,
      totalClasses: classes.count,
      activeAlerts: alerts.count,
      presenceRate: Number(presenceRate.toFixed(1))
    };
  }

  async getSocialContextForStudent(studentId: string): Promise<any[]> {
    return this.all('SELECT * FROM social_context WHERE studentId = ?', [studentId]);
  }

  async getRecentSecurityAlerts(limit = 50): Promise<any[]> {
    return this.all('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT ?', [limit]);
  }

  async getAttendanceBimestral(studentId: string, year: number): Promise<any[]> {
    return this.all('SELECT * FROM attendance WHERE studentId = ? AND strftime("%Y", date) = ?', [studentId, year.toString()]);
  }

  // ===== GESTÃO DE SALAS E TURMAS =====

  async getRooms(): Promise<any[]> {
    return this.all('SELECT * FROM rooms ORDER BY name ASC');
  }

  async upsertRoom(room: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO rooms (id, schoolId, name, location, cameraId, capacity, floor, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      room.id, 
      room.schoolId || 'default', 
      room.name, 
      room.location || '', 
      room.cameraId || (Array.isArray(room.cameras) ? room.cameras.join(',') : ''), 
      room.capacity || 30,
      room.floor || room.location,
      room.status || 'active'
    ]);
  }

  async deleteRoom(id: string): Promise<void> {
    return this.run('DELETE FROM rooms WHERE id = ?', [id]);
  }
 
  async getRoomByCameraId(cameraId: string): Promise<any> {
    return this.get('SELECT * FROM rooms WHERE cameraId LIKE ?', [`%${cameraId}%`]);
  }

  async getCurrentScheduleForRoom(roomId: string, dayOfWeek: number, timeStr: string): Promise<any> {
    return this.get(
      `SELECT * FROM schedules WHERE roomId = ? AND dayOfWeek = ? AND ? BETWEEN startTime AND endTime LIMIT 1`,
      [roomId, dayOfWeek, timeStr]
    );
  }

  // ===== GESTÃO DE RH (v3.0) =====

  async getStaff(): Promise<any[]> {
    return this.all(`
      SELECT s.*, sd.baseSalary, sd.contractType, sd.performanceScore, sd.onboardingStep 
      FROM staff s 
      LEFT JOIN staff_details sd ON s.id = sd.staffId
    `);
  }

  async getStaffDetails(staffId: string): Promise<any> {
    return this.get('SELECT * FROM staff_details WHERE staffId = ?', [staffId]);
  }

  async upsertStaff(staff: any, details: any): Promise<void> {
    await this.run(`INSERT OR REPLACE INTO staff (id, name, role, email, phone, biometricId, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [staff.id, staff.name, staff.role, staff.email, staff.phone, staff.biometricId, staff.status || 'active']);
    
    await this.run(`INSERT OR REPLACE INTO staff_details (staffId, baseSalary, contractType, admissionDate, taxHoldingIRRF, performanceScore, onboardingStep) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [staff.id, details.baseSalary, details.contractType, details.admissionDate, details.taxHoldingIRRF || 0, details.performanceScore || 100, details.onboardingStep || 0]);
  }

  async recordStaffPonto(staffId: string, type: 'IN' | 'OUT'): Promise<void> {
    const id = Date.now().toString();
    return this.run('INSERT INTO staff_ponto (id, staffId, type) VALUES (?, ?, ?)', [id, staffId, type]);
  }

  async getStaffPontoHistory(staffId: string, limit = 50): Promise<any[]> {
    return this.all('SELECT * FROM staff_ponto WHERE staffId = ? ORDER BY timestamp DESC LIMIT ?', [staffId, limit]);
  }

  // ===== GESTÃO DE DOCUMENTOS (Secretaria v3.0) =====

  async getStudentDocuments(studentId: string): Promise<any[]> {
    return this.all('SELECT * FROM student_documents WHERE studentId = ?', [studentId]);
  }

  async upsertStudentDocument(doc: any): Promise<void> {
    const id = doc.id || Date.now().toString();
    return this.run(`INSERT OR REPLACE INTO student_documents (id, studentId, docType, status, filePath) VALUES (?, ?, ?, ?, ?)`,
      [id, doc.studentId, doc.docType, doc.status || 'pending', doc.filePath || '']);
  }

  async getClasses(): Promise<any[]> {
    return this.all('SELECT * FROM classes ORDER BY name ASC');
  }

  async upsertClass(c: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO classes (id, schoolId, name, grade) VALUES (?, ?, ?, ?)`;
    return this.run(sql, [c.id, c.schoolId || 'default', c.name, c.grade]);
  }

  async deleteClass(id: string): Promise<void> {
    return this.run('DELETE FROM classes WHERE id = ?', [id]);
  }

  async getSchedules(): Promise<any[]> {
    return this.all('SELECT * FROM schedules ORDER BY dayOfWeek, startTime');
  }

  async upsertSchedule(s: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO schedules (id, classId, roomId, subject, teacher, dayOfWeek, startTime, endTime) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [s.id, s.classId, s.roomId, s.subject, s.teacher, s.dayOfWeek, s.startTime, s.endTime]);
  }

  async deleteSchedule(id: string): Promise<void> {
    return this.run('DELETE FROM schedules WHERE id = ?', [id]);
  }

  // ===== COORDENAÇÃO E PERÍODOS =====

  async getCoordinations(): Promise<any[]> {
    return this.all('SELECT * FROM coordinations');
  }

  async upsertCoordination(c: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO coordinations (id, name, schoolId) VALUES (?, ?, ?)`;
    return this.run(sql, [c.id, c.name, c.schoolId || 'default']);
  }

  async deleteCoordination(id: string): Promise<void> {
    return this.run('DELETE FROM coordinations WHERE id = ?', [id]);
  }

  async getAcademicPeriods(): Promise<any[]> {
    return this.all('SELECT * FROM academic_periods ORDER BY startDate DESC');
  }

  async upsertAcademicPeriod(p: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO academic_periods (id, name, startDate, endDate, schoolId) VALUES (?, ?, ?, ?, ?)`;
    return this.run(sql, [p.id, p.name, p.startDate, p.endDate, p.schoolId || 'default']);
  }

  async deleteAcademicPeriod(id: string): Promise<void> {
    return this.run('DELETE FROM academic_periods WHERE id = ?', [id]);
  }



  async getBehavioralStats(): Promise<any> {
    return { good: 85, focus: 90 };
  }

  async getSocialContextSummary(): Promise<any> {
    return { interactions: 120, isolated: 2 };
  }

  async getStudentReport(sId: string, pId: string): Promise<any> {
    return this.get('SELECT * FROM student_reports WHERE studentId = ? AND periodId = ?', [sId, pId]);
  }

  async upsertStudentReport(r: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO student_reports (studentId, periodId, data) VALUES (?, ?, ?)`;
    return this.run(sql, [r.studentId, r.periodId, JSON.stringify(r.data)]);
  }

  async updateUserRole(userId: string, role: string, coordinationId: string | null): Promise<void> {
    return this.run('UPDATE users SET role = ?, coordinationId = ? WHERE id = ?', [role, coordinationId, userId]);
  }

  async getVerificationQueue(): Promise<any[]> {
    return this.all('SELECT * FROM events WHERE eventType = "VERIFICATION_PENDING" ORDER BY timestamp DESC');
  }

  async updateVerificationStatus(id: string, status: string, confirmedStudentId?: string, coordinatorId?: string): Promise<void> {
    const sql = `UPDATE events SET status = ?, studentId = ?, coordinatorId = ? WHERE id = ?`;
    return this.run(sql, [status, confirmedStudentId || null, coordinatorId || null, id]);
  }
 
  async upsertVerificationQueue(v: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO events (id, studentId, roomId, eventType, timestamp, payload) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      v.id, v.studentId, v.cameraId || 'unknown', 'VERIFICATION_PENDING', 
      new Date().toISOString(), JSON.stringify({ imagePath: v.imagePath, status: v.status })
    ]);
  }
 
  async upsertAugmentation(a: any): Promise<void> {
    // Aumentos de dados (Phase 3 - Meta-aprendizado)
    // Armazenamos no social_context ou em uma nova tabela de meta-data se necessário
    // Por agora, usamos social_context como storage genérico de features
    const sql = `INSERT OR REPLACE INTO social_context (id, studentId, data, timestamp) VALUES (?, ?, ?, ?)`;
    return this.run(sql, [a.id, a.studentId, JSON.stringify(a), new Date().toISOString()]);
  }

  async getUsers(): Promise<any[]> {
    return this.all('SELECT id, username, email, role FROM users'); // Reduzido por segurança
  }

  async createLead(leadData: any): Promise<void> {
    const sql = `INSERT INTO leads (id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)`;
    return this.run(sql, [`lead-${Date.now()}`, leadData.name, leadData.email, leadData.phone, leadData.message]);
  }

  async getFaceEmbeddings(): Promise<any[]> {
    const rows = await this.all('SELECT * FROM face_embeddings');
    if (rows.length === 0) {
      // Fallback para legado (coluna photoHash na tabela students)
      const students = await this.all('SELECT id as studentId, photoHash as vector FROM students WHERE photoHash IS NOT NULL');
      return students.map(s => {
        let vector = s.vector;
        try {
          if (!vector.startsWith('[')) {
            vector = securityService.decrypt(vector);
          }
        } catch (e) {}
        return {
          faceId: s.studentId,
          studentId: s.studentId,
          embedding: JSON.parse(vector),
          timestamp: new Date()
        };
      });
    }
    return rows.map(r => ({
      faceId: r.id,
      studentId: r.studentId,
      embedding: JSON.parse(securityService.decrypt(r.embedding)),
      timestamp: new Date(r.createdAt)
    }));
  }

  async saveFaceEmbedding(studentId: string, vector: number[], faceId?: string): Promise<void> {
    const encrypted = securityService.encrypt(JSON.stringify(vector));
    const id = faceId || studentId;
    
    // Salvar na nova tabela
    await this.run(
      'INSERT OR REPLACE INTO face_embeddings (id, studentId, embedding) VALUES (?, ?, ?)',
      [id, studentId, encrypted]
    );

    // Manter sincronizado com legado para compatibilidade visual na UI de Alunos
    if (!faceId || faceId === studentId || faceId.includes('front')) {
      return this.run('UPDATE students SET photoHash = ? WHERE id = ?', [encrypted, studentId]);
    }
  }

  async deleteFaceEmbedding(faceId: string): Promise<void> {
    await this.run('DELETE FROM face_embeddings WHERE id = ?', [faceId]);
    // Se for o ID principal do aluno ou o ângulo frontal, limpa também na tabela students
    if (!faceId.includes('_') || faceId.includes('_front')) {
      return this.run('UPDATE students SET photoHash = NULL WHERE id = ?', [faceId.split('_')[0]]);
    }
  }

  async calculateAttendanceAnomalies(studentId: string): Promise<any> {
    return this.calculateReprobationRisk(studentId);
  }

  // ===== MÉTODOS DE CÂMERAS =====

  async getCameras(): Promise<any[]> {
    const cameras = await this.all('SELECT * FROM cameras ORDER BY createdAt DESC');
    return cameras.map(c => ({
      ...c,
      password: c.password && c.password.includes(':') ? securityService.decrypt(c.password) : c.password
    }));
  }

  async addCamera(camera: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO cameras 
                 (id, name, location, ip, rtspUrl, username, password, status, type, resolution, fps, enabled) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const encryptedPassword = camera.password ? securityService.encrypt(camera.password) : null;
    return this.run(sql, [
      camera.id,
      camera.name,
      camera.location,
      camera.ip,
      camera.rtspUrl,
      camera.username,
      encryptedPassword,
      camera.status || 'offline',
      camera.type || 'rtsp',
      camera.resolution,
      camera.fps,
      camera.enabled !== undefined ? (camera.enabled ? 1 : 0) : 1
    ]);
  }

  async updateCameraStatus(cameraId: string, status: string, error?: string): Promise<void> {
    return this.run('UPDATE cameras SET status = ?, lastError = ?, lastSeen = CURRENT_TIMESTAMP WHERE id = ?', 
                    [status, error || null, cameraId]);
  }

  async updateCamera(id: string, camera: any): Promise<void> {
    const sql = `UPDATE cameras SET 
                 name = ?, location = ?, ip = ?, rtspUrl = ?, 
                 username = ?, password = ?, type = ?, 
                 resolution = ?, fps = ?, enabled = ?
                 WHERE id = ?`;
    const encryptedPassword = camera.password ? securityService.encrypt(camera.password) : null;
    return this.run(sql, [
      camera.name,
      camera.location || camera.room,
      camera.ip,
      camera.rtspUrl,
      camera.username,
      encryptedPassword,
      camera.type,
      camera.resolution,
      camera.fps,
      camera.enabled !== undefined ? (camera.enabled ? 1 : 0) : 1,
      id
    ]);
  }

  async deleteCamera(cameraId: string): Promise<void> {
    return this.run('DELETE FROM cameras WHERE id = ?', [cameraId]);
  }

  // ===== MÉTODOS DE WHATSAPP QUEUE =====

  async addWhatsAppMessage(msg: any): Promise<void> {
    const sql = `INSERT INTO whatsapp_queue (id, "to", body, studentId, eventType, attempts, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      msg.id,
      msg.to,
      msg.body,
      msg.studentId,
      msg.eventType,
      msg.attempts || 0,
      msg.status || 'pending'
    ]);
  }

  async getPendingWhatsAppMessages(): Promise<any[]> {
    return this.all("SELECT * FROM whatsapp_queue WHERE status = 'pending' ORDER BY queuedAt ASC");
  }

  async updateWhatsAppMessageStatus(id: string, status: string, attempts: number): Promise<void> {
    return this.run('UPDATE whatsapp_queue SET status = ?, attempts = ? WHERE id = ?', [status, attempts, id]);
  }

  async deleteWhatsAppMessage(id: string): Promise<void> {
    return this.run('DELETE FROM whatsapp_queue WHERE id = ?', [id]);
  }

  // ===== MÉTODOS DE RANKING & ANÁLISE PEDAGÓGICA =====

  async getStudentRankings(metric: string, limit = 5, order: 'ASC' | 'DESC' = 'DESC'): Promise<any[]> {
    const dir = order === 'ASC' ? 'ASC' : 'DESC';
    
    if (metric === 'presence') {
      // Ranking por total de eventos de entrada registrados
      return this.all(`
        SELECT s.id, s.name,
          COUNT(DISTINCT date(al.logged_at)) AS score
        FROM students s
        LEFT JOIN attendance_logs al ON al.student_id = s.id AND al.type = 'ENTRY'
        GROUP BY s.id
        ORDER BY score ${dir}
        LIMIT ?
      `, [limit]);
    }
    
    if (metric === 'punctuality') {
      // Ranking por atrasos: alunos cujo primeiro ENTRY do dia foi após as 07:30
      return this.all(`
        SELECT s.id, s.name,
          COUNT(*) AS score
        FROM students s
        JOIN (
          SELECT student_id, date(logged_at) as day, MIN(logged_at) as first_entry
          FROM attendance_logs WHERE type = 'ENTRY'
          GROUP BY student_id, day
        ) fe ON fe.student_id = s.id
        WHERE time(fe.first_entry) > '07:30:00'
        GROUP BY s.id
        ORDER BY score ${dir}
        LIMIT ?
      `, [limit]);
    }

    if (metric === 'loitering') {
      // Ranking por alertas de comportamento suspeito/circulação excessiva
      return this.all(`
        SELECT s.id, s.name, COUNT(*) AS score
        FROM students s
        JOIN events e ON e.studentId = s.id
        WHERE e.eventType IN ('loitering', 'restricted_zone', 'running')
        GROUP BY s.id
        ORDER BY score ${dir}
        LIMIT ?
      `, [limit]);
    }

    return [];
  }

  async calculateReprobationRisk(studentId: string): Promise<{
    riskLevel: number;
    absences: number;
    isCritical: boolean;
    totalDays: number;
  }> {
    // Contar total de dias letivos no período atual (últimos 90 dias)
    const totalDaysRow = await this.get(`
      SELECT COUNT(DISTINCT date(logged_at)) as totalDays
      FROM attendance_logs
      WHERE logged_at >= date('now', '-90 days')
    `) as any;

    const totalDays = totalDaysRow?.totalDays || 1;

    // Contar dias com presença do aluno
    const presentRow = await this.get(`
      SELECT COUNT(DISTINCT date(logged_at)) as presentDays
      FROM attendance_logs
      WHERE student_id = ? AND type = 'ENTRY' AND logged_at >= date('now', '-90 days')
    `, [studentId]) as any;

    const presentDays = presentRow?.presentDays || 0;
    const absences = Math.max(0, totalDays - presentDays);
    // LGPD pedagogica: 25% de faltas = reprovação no Brasil
    const riskLevel = Math.min(100, Math.round((absences / totalDays) * 100 * 4));
    const isCritical = riskLevel >= 75;

    return { riskLevel, absences, isCritical, totalDays };
  }

  async getStudentTrajectory(studentId: string, days = 30): Promise<any[]> {
    return this.all(`
      SELECT 
        date(logged_at) as date,
        COUNT(DISTINCT type) as events,
        MIN(CASE WHEN type = 'ENTRY' THEN time(logged_at) END) as entryTime,
        MAX(CASE WHEN type = 'EXIT' THEN time(logged_at) END) as exitTime
      FROM attendance_logs
      WHERE student_id = ? AND logged_at >= date('now', ?)
      GROUP BY date(logged_at)
      ORDER BY date ASC
    `, [studentId, `-${days} days`]);
  }

  // ===== MÉTODOS FINANCEIROS (V3) =====

  async getStudentBilling(studentHash: string): Promise<any[]> {
    return this.all('SELECT * FROM billing WHERE studentHash = ? ORDER BY dueDate DESC', [studentHash]);
  }

  async getStudentOverdueCount(studentId: string): Promise<number> {
    const student = await this.getStudent(studentId);
    if (!student) return 0;
    
    // Tentamos buscar pelo ID ou pelo photoHash (conforme lógica do handlers.ts)
    const sql = `SELECT COUNT(*) as count FROM billing 
                 WHERE (studentHash = ? OR studentHash = ?) 
                 AND status = 'overdue'`;
    const result = await this.get(sql, [studentId, student.photoHash]);
    return result?.count || 0;
  }

  async getAllBilling(): Promise<any[]> {
    return this.all('SELECT * FROM billing ORDER BY dueDate DESC');
  }

  async upsertBilling(b: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO billing (id, studentHash, amount, dueDate, status, pixCode, updatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    return this.run(sql, [b.id, b.studentHash, b.amount, b.dueDate, b.status, b.pixCode]);
  }

  async getFinancialStats(): Promise<any> {
    const paid = await this.get("SELECT SUM(amount) as total FROM billing WHERE status = 'paid'");
    const pending = await this.get("SELECT SUM(amount) as total FROM billing WHERE status = 'pending'");
    const overdue = await this.get("SELECT SUM(amount) as total FROM billing WHERE status = 'overdue'");
    
    return {
      totalPaid: paid?.total || 0,
      totalPending: pending?.total || 0,
      totalOverdue: overdue?.total || 0,
      inadimplencyRate: overdue?.total ? (overdue.total / ((paid?.total || 0) + (pending?.total || 0) + overdue.total) * 100) : 0
    };
  }

  // ===== MÉTODOS DE INTELIGÊNCIA COMPORTAMENTAL (Phase 241) =====

  async recordBehavioralLog(log: any): Promise<void> {
    const sql = `INSERT INTO behavioral_logs 
                 (id, studentId, stress, anxiety, aggression, fatigue, engagement, riskScore, timestamp) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return this.run(sql, [
      `beh-${Date.now()}`,
      log.studentId,
      log.emotions.stress,
      log.emotions.anxiety,
      log.emotions.aggression,
      log.emotions.fatigue,
      log.emotions.engagement,
      log.riskScore,
      new Date(log.timestamp).toISOString()
    ]);
  }

  async getBehavioralHistory(studentId: string, limit = 20): Promise<any[]> {
    return this.all(`SELECT * FROM behavioral_logs WHERE studentId = ? ORDER BY timestamp DESC LIMIT ?`, [studentId, limit]);
  }

  async updateEvasionProfile(profile: any): Promise<void> {
    const sql = `INSERT OR REPLACE INTO evasion_profiles (studentId, riskProbability, factors, trend, lastAudit) 
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    return this.run(sql, [
      profile.studentId,
      profile.riskProbability,
      JSON.stringify(profile.factors),
      profile.trend
    ]);
  }

  async getHighRiskEvasionProfiles(limit = 10): Promise<any[]> {
    return this.all(`SELECT ep.*, s.name 
                     FROM evasion_profiles ep
                     JOIN students s ON ep.studentId = s.id
                     WHERE ep.riskProbability > 60
                     ORDER BY ep.riskProbability DESC LIMIT ?`, [limit]);
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
