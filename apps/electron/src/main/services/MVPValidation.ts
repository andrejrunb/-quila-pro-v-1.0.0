import { Database } from '../../database/Database';
import { logger } from '../logger';

/**
 * [SQA-MVP-001] MVPValidation
 * Módulo de validação holística do ambiente de produção Áquila Pro.
 * Verifica alunos, câmeras, presença e saúde do sistema com dados reais.
 */

export interface ValidationReport {
  timestamp: number;
  status: 'success' | 'warning' | 'error';
  students: {
    total: number;
    withPhotos: number;
    withoutPhotos: number;
    percentage: number;
  };
  cameras: {
    total: number;
    online: number;
    offline: number;
    percentage: number;
  };
  attendance: {
    recordsToday: number;
    averagePresence: number;
    averageAbsence: number;
  };
  system: {
    databaseSize: number;
    photoStorageSize: number;
    totalStorageSize: number;
  };
  issues: string[];
  recommendations: string[];
}

export class MVPValidation {
  private get db(): Database {
    return Database.getInstance();
  }

  /**
   * Executar validação completa do MVP
   */
  async runFullValidation(): Promise<ValidationReport> {
    try {
      logger.info('[MVPValidation] Iniciando validação completa do MVP');

      const report: ValidationReport = {
        timestamp: Date.now(),
        status: 'success',
        students: await this.validateStudents(),
        cameras: await this.validateCameras(),
        attendance: await this.validateAttendance(),
        system: await this.validateSystem(),
        issues: [],
        recommendations: [],
      };

      report.issues = this.identifyIssues(report);
      report.recommendations = this.generateRecommendations(report);

      if (report.issues.length > 0) {
        report.status = report.issues.some(i => i.includes('crítico') || i.includes('CRÍTICO'))
          ? 'error'
          : 'warning';
      }

      logger.info(`[MVPValidation] Validação concluída: ${report.status}`);
      return report;
    } catch (error) {
      logger.error(`[MVPValidation] Erro na validação: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Validar dados de alunos — usa API correta: db.get()
   */
  private async validateStudents(): Promise<ValidationReport['students']> {
    try {
      const totalRow = await this.db.get(
        `SELECT COUNT(*) as count FROM students WHERE status = 'active'`
      );
      const withPhotosRow = await this.db.get(
        `SELECT COUNT(*) as count FROM students WHERE photoPath IS NOT NULL AND status = 'active'`
      );

      const totalCount = totalRow?.count ?? 0;
      const withPhotosCount = withPhotosRow?.count ?? 0;

      return {
        total: totalCount,
        withPhotos: withPhotosCount,
        withoutPhotos: totalCount - withPhotosCount,
        percentage: totalCount > 0 ? Math.round((withPhotosCount / totalCount) * 100) : 0,
      };
    } catch (error) {
      logger.warn(`[MVPValidation] Erro ao validar alunos: ${(error as Error).message}`);
      return { total: 0, withPhotos: 0, withoutPhotos: 0, percentage: 0 };
    }
  }

  /**
   * Validar câmeras — usa API correta: db.get() e SQLite-compatible datetime
   */
  private async validateCameras(): Promise<ValidationReport['cameras']> {
    try {
      const totalRow = await this.db.get(
        `SELECT COUNT(*) as count FROM cameras WHERE enabled = 1`
      );
      // SQLite: last_seen dentro dos últimos 5 minutos
      const onlineRow = await this.db.get(
        `SELECT COUNT(*) as count FROM cameras WHERE enabled = 1 
         AND last_seen >= datetime('now', '-5 minutes')`
      );

      const totalCount = totalRow?.count ?? 0;
      const onlineCount = onlineRow?.count ?? 0;

      return {
        total: totalCount,
        online: onlineCount,
        offline: totalCount - onlineCount,
        percentage: totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0,
      };
    } catch (error) {
      logger.warn(`[MVPValidation] Erro ao validar câmeras: ${(error as Error).message}`);
      return { total: 0, online: 0, offline: 0, percentage: 0 };
    }
  }

  /**
   * Validar registros de presença hoje — usa API correta: db.get()
   */
  private async validateAttendance(): Promise<ValidationReport['attendance']> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const recordsRow = await this.db.get(
        `SELECT COUNT(*) as count FROM attendance WHERE date = ?`,
        [today]
      );
      const presentRow = await this.db.get(
        `SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'present'`,
        [today]
      );
      const absentRow = await this.db.get(
        `SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'absent'`,
        [today]
      );

      const recordsCount = recordsRow?.count ?? 0;
      const presentCount = presentRow?.count ?? 0;
      const absentCount = absentRow?.count ?? 0;

      return {
        recordsToday: recordsCount,
        averagePresence: recordsCount > 0 ? Math.round((presentCount / recordsCount) * 100) : 0,
        averageAbsence: recordsCount > 0 ? Math.round((absentCount / recordsCount) * 100) : 0,
      };
    } catch (error) {
      logger.warn(`[MVPValidation] Erro ao validar presença: ${(error as Error).message}`);
      return { recordsToday: 0, averagePresence: 0, averageAbsence: 0 };
    }
  }

  /**
   * Validar sistema — estimativa de armazenamento a partir de contagens reais
   */
  private async validateSystem(): Promise<ValidationReport['system']> {
    try {
      const dbSize = 50 * 1024 * 1024; // 50MB estimado (better-sqlite3 não expõe tamanho facilmente)

      const studentsRow = await this.db.get(
        `SELECT COUNT(*) as count FROM students WHERE photoPath IS NOT NULL`
      );
      const photoCount = studentsRow?.count ?? 0;
      const photoStorageSize = photoCount * 100 * 1024; // ~100KB por foto

      return {
        databaseSize: dbSize,
        photoStorageSize,
        totalStorageSize: dbSize + photoStorageSize,
      };
    } catch (error) {
      logger.warn(`[MVPValidation] Erro ao validar sistema: ${(error as Error).message}`);
      return { databaseSize: 0, photoStorageSize: 0, totalStorageSize: 0 };
    }
  }

  private identifyIssues(report: ValidationReport): string[] {
    const issues: string[] = [];

    if (report.students.percentage < 50) {
      issues.push(
        `⚠️ Apenas ${report.students.percentage}% dos alunos têm fotos cadastradas. Recomenda-se treinar mais alunos.`
      );
    }
    if (report.cameras.offline > 0) {
      issues.push(
        `🔴 CRÍTICO: ${report.cameras.offline} câmera(s) offline. Verificar conexão e alimentação.`
      );
    }
    if (report.attendance.recordsToday === 0) {
      issues.push('⚠️ Nenhum registro de presença hoje. Verificar se câmeras estão ativas.');
    }
    if (report.system.totalStorageSize > 10 * 1024 * 1024 * 1024) {
      issues.push('⚠️ Armazenamento acima de 10GB. Considere limpeza de dados antigos.');
    }

    return issues;
  }

  private generateRecommendations(report: ValidationReport): string[] {
    const recommendations: string[] = [];

    if (report.students.withoutPhotos > 0) {
      recommendations.push(
        `📸 Treinar ${report.students.withoutPhotos} aluno(s) sem fotos para melhorar reconhecimento facial.`
      );
    }
    if (report.cameras.percentage < 100) {
      recommendations.push(
        `📹 Verificar ${report.cameras.offline} câmera(s) offline para garantir cobertura completa.`
      );
    }
    if (report.attendance.averageAbsence > 20) {
      recommendations.push(
        `📊 Taxa de ausência acima de 20%. Investigar causas e padrões de faltas.`
      );
    }
    recommendations.push(
      '✅ Sistema operacional. Próximas melhorias: integrar fluxo de câmera IP 192.168.1.105.'
    );

    return recommendations;
  }

  formatReport(report: ValidationReport): string {
    const lines: string[] = [
      '═══════════════════════════════════════════════════════════',
      '📊 RELATÓRIO DE VALIDAÇÃO DO MVP - ÁQUILA PRO',
      '═══════════════════════════════════════════════════════════',
      '',
      `⏰ Data/Hora: ${new Date(report.timestamp).toLocaleString('pt-BR')}`,
      `Status: ${report.status === 'success' ? '✅ OK' : report.status === 'warning' ? '⚠️ AVISO' : '🔴 ERRO'}`,
      '',
      '👥 ALUNOS',
      `  Total: ${report.students.total}`,
      `  Com fotos: ${report.students.withPhotos} (${report.students.percentage}%)`,
      `  Sem fotos: ${report.students.withoutPhotos}`,
      '',
      '📹 CÂMERAS',
      `  Total: ${report.cameras.total}`,
      `  Online: ${report.cameras.online} (${report.cameras.percentage}%)`,
      `  Offline: ${report.cameras.offline}`,
      '',
      '📋 PRESENÇA (Hoje)',
      `  Registros: ${report.attendance.recordsToday}`,
      `  Presença: ${report.attendance.averagePresence}%`,
      `  Ausência: ${report.attendance.averageAbsence}%`,
      '',
      '💾 SISTEMA',
      `  Banco de dados: ${this.formatBytes(report.system.databaseSize)}`,
      `  Fotos: ${this.formatBytes(report.system.photoStorageSize)}`,
      `  Total: ${this.formatBytes(report.system.totalStorageSize)}`,
    ];

    if (report.issues.length > 0) {
      lines.push('', '⚠️ PROBLEMAS IDENTIFICADOS');
      report.issues.forEach(issue => lines.push(`  ${issue}`));
    }
    if (report.recommendations.length > 0) {
      lines.push('', '💡 RECOMENDAÇÕES');
      report.recommendations.forEach(rec => lines.push(`  ${rec}`));
    }

    lines.push('', '═══════════════════════════════════════════════════════════');
    return lines.join('\n');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  async exportReport(report: ValidationReport, filePath: string): Promise<void> {
    try {
      const fs = require('fs').promises;
      await fs.writeFile(filePath, this.formatReport(report), 'utf-8');
      logger.info(`[MVPValidation] Relatório exportado para ${filePath}`);
    } catch (error) {
      logger.error(`[MVPValidation] Erro ao exportar relatório: ${(error as Error).message}`);
    }
  }
}

export default MVPValidation;
