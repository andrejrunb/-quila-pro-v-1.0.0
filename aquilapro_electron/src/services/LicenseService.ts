import Database from '../database/Database';
import { LicenseManager } from './LicenseManager';
import { app } from 'electron';
import { HardwareFingerprint } from './HardwareFingerprint';

export interface LicenseInfo {
  tier: string;
  expires_at: string;
  school_name: string;
  active: boolean;
  maxStudents: number;
  maxCameras: number;
}

export class LicenseService {
  private manager: LicenseManager | null = null;
  private db: Database | null = null;

  /**
   * Inicialização tardia para injetar o DB
   */
  init(database: Database) {
    this.db = database;
    const userDataPath = app.getPath('userData');
    this.manager = LicenseManager.getInstance(userDataPath);
    this.manager.load();
  }

  getHardwareId(): string {
    return HardwareFingerprint.getFingerprint();
  }

  async getActiveLicense(): Promise<LicenseInfo> {
    if (!this.manager) throw new Error('LicenseService not initialized');
    const info = this.manager.getLicenseInfo();
    const limits = this.manager.getLimits();
    
    return {
      tier: info.tier,
      expires_at: info.expires_at,
      school_name: info.school_name,
      active: info.active,
      maxStudents: limits.maxStudentFaces,
      maxCameras: limits.maxCameraStreams
    };
  }

  async checkLimit(type: 'student' | 'camera'): Promise<{ allowed: boolean; current: number; max: number }> {
    if (!this.manager || !this.db) throw new Error('LicenseService not initialized');
    const limits = this.manager.getLimits();
    let currentCount = 0;
    let maxLimit = 0;

    if (type === 'student') {
      const result = await this.db.get('SELECT COUNT(*) as count FROM students');
      currentCount = result.count;
      maxLimit = limits.maxStudentFaces;
    } else {
      const result = await this.db.get('SELECT COUNT(*) as count FROM cameras');
      currentCount = result.count;
      maxLimit = limits.maxCameraStreams;
    }

    return {
      allowed: currentCount < maxLimit,
      current: currentCount,
      max: maxLimit
    };
  }

  async activateLicense(licenseJson: string): Promise<boolean> {
    if (!this.manager || !this.db) throw new Error('LicenseService not initialized');
    const success = this.manager.activate(licenseJson);
    if (success) {
      const info = this.manager.getLicenseInfo();
      const limits = this.manager.getLimits();
      
      await this.db.run("UPDATE licenses SET status = 'revoked' WHERE status = 'active'");
      await this.db.run(
        `INSERT INTO licenses (id, key, type, maxStudents, maxCameras, expiresAt, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`lic-${Date.now()}`, 'ENCRYPTED-KEY', info.tier, limits.maxStudentFaces, limits.maxCameraStreams, info.expires_at, 'active']
      );
    }
    return success;
  }

  async assertStudentLimit(): Promise<void> {
    if (!this.manager || !this.db) throw new Error('LicenseService not initialized');
    const result = await this.db.get('SELECT COUNT(*) as count FROM students');
    this.manager.assertFaceLimit(result.count);
  }

  async assertCameraLimit(): Promise<void> {
    if (!this.manager || !this.db) throw new Error('LicenseService not initialized');
    const result = await this.db.get('SELECT COUNT(*) as count FROM cameras');
    this.manager.assertCameraLimit(result.count);
  }
}

export const licenseService = new LicenseService();
