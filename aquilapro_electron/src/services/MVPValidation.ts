import Database from '../database/Database';
import Logger from './Logger';

/**
 * Passo 1: Validar MVP com Dados Reais
 * Módulo para validação e carregamento de dados reais na aplicação
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
  private db: Database;
  private logger: Logger;

  constructor() {
    this.db = new Database();
    this.logger = new Logger('MVPValidation');
  }

  /**
   * Executar validação completa do MVP
   */
  async runFullValidation(): Promise<ValidationReport> {
    try {
      this.logger.info('Iniciando validação completa do MVP');

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

      // Analisar problemas
      report.issues = this.identifyIssues(report);
      report.recommendations = this.generateRecommendations(report);

      // Determinar status geral
      if (report.issues.length > 0) {
        report.status = report.issues.some(i => i.includes('crítico')) ? 'error' : 'warning';
      }

      this.logger.info(`Validação concluída: ${report.status}`);
      return report;
    } catch (error) {
      this.logger.error(`Erro na validação: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Validar dados de alunos
   */
  private async validateStudents(): Promise<ValidationReport['students']> {
    try {
      const total = await this.db.query(
        'SELECT COUNT(*) as count FROM students WHERE is_active = 1'
      );

      const withPhotos = await this.db.query(
        'SELECT COUNT(*) as count FROM students WHERE photo_count > 0 AND is_active = 1'
      );

      const totalCount = total && total[0] ? total[0].count : 0;
      const withPhotosCount = withPhotos && withPhotos[0] ? withPhotos[0].count : 0;

      return {
        total: totalCount,
        withPhotos: withPhotosCount,
        withoutPhotos: totalCount - withPhotosCount,
        percentage: totalCount > 0 ? Math.round((withPhotosCount / totalCount) * 100) : 0,
      };
    } catch (error) {
      this.logger.error(`Erro ao validar alunos: ${(error as Error).message}`);
      return { total: 0, withPhotos: 0, withoutPhotos: 0, percentage: 0 };
    }
  }

  /**
   * Validar câmeras
   */
  private async validateCameras(): Promise<ValidationReport['cameras']> {
    try {
      const total = await this.db.query(
        'SELECT COUNT(*) as count FROM cameras WHERE is_active = 1'
      );

      const online = await this.db.query(
        'SELECT COUNT(*) as count FROM cameras WHERE is_active = 1 AND last_heartbeat > DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
      );

      const totalCount = total && total[0] ? total[0].count : 0;
      const onlineCount = online && online[0] ? online[0].count : 0;

      return {
        total: totalCount,
        online: onlineCount,
        offline: totalCount - onlineCount,
        percentage: totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0,
      };
    } catch (error) {
      this.logger.error(`Erro ao validar câmeras: ${(error as Error).message}`);
      return { total: 0, online: 0, offline: 0, percentage: 0 };
    }
  }

  /**
   * Validar registros de presença
   */
  private async validateAttendance(): Promise<ValidationReport['attendance']> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const records = await this.db.query(
        'SELECT COUNT(*) as count FROM attendance WHERE DATE(timestamp) = ?',
        [today]
      );

      const present = await this.db.query(
        'SELECT COUNT(*) as count FROM attendance WHERE DATE(timestamp) = ? AND status = "present"',
        [today]
      );

      const absent = await this.db.query(
        'SELECT COUNT(*) as count FROM attendance WHERE DATE(timestamp) = ? AND status = "absent"',
        [today]
      );

      const recordsCount = records && records[0] ? records[0].count : 0;
      const presentCount = present && present[0] ? present[0].count : 0;
      const absentCount = absent && absent[0] ? absent[0].count : 0;

      return {
        recordsToday: recordsCount,
        averagePresence: recordsCount > 0 ? Math.round((presentCount / recordsCount) * 100) : 0,
        averageAbsence: recordsCount > 0 ? Math.round((absentCount / recordsCount) * 100) : 0,
      };
    } catch (error) {
      this.logger.error(`Erro ao validar presença: ${(error as Error).message}`);
      return { recordsToday: 0, averagePresence: 0, averageAbsence: 0 };
    }
  }

  /**
   * Validar sistema (armazenamento, performance)
   */
  private async validateSystem(): Promise<ValidationReport['system']> {
    try {
      // Simular tamanho do banco de dados
      const dbSize = 50 * 1024 * 1024; // 50MB (simulado)

      // Simular tamanho de fotos (100KB por foto em média)
      const students = await this.db.query('SELECT SUM(photo_count) as total FROM students');
      const photoCount = students && students[0] ? students[0].total : 0;
      const photoStorageSize = (photoCount || 0) * 100 * 1024; // 100KB por foto

      return {
        databaseSize: dbSize,
        photoStorageSize: photoStorageSize,
        totalStorageSize: dbSize + photoStorageSize,
      };
    } catch (error) {
      this.logger.error(`Erro ao validar sistema: ${(error as Error).message}`);
      return { databaseSize: 0, photoStorageSize: 0, totalStorageSize: 0 };
    }
  }

  /**
   * Identificar problemas
   */
  private identifyIssues(report: ValidationReport): string[] {
    const issues: string[] = [];

    // Verificar alunos sem fotos
    if (report.students.percentage < 50) {
      issues.push(
        `⚠️ Apenas ${report.students.percentage}% dos alunos têm fotos cadastradas. Recomenda-se treinar mais alunos.`
      );
    }

    // Verificar câmeras offline
    if (report.cameras.offline > 0) {
      issues.push(
        `🔴 CRÍTICO: ${report.cameras.offline} câmera(s) offline. Verificar conexão e alimentação.`
      );
    }

    // Verificar presença
    if (report.attendance.recordsToday === 0) {
      issues.push('⚠️ Nenhum registro de presença hoje. Verificar se câmeras estão ativas.');
    }

    // Verificar armazenamento
    if (report.system.totalStorageSize > 10 * 1024 * 1024 * 1024) {
      // 10GB
      issues.push('⚠️ Armazenamento acima de 10GB. Considere limpeza de dados antigos.');
    }

    return issues;
  }

  /**
   * Gerar recomendações
   */
  private generateRecommendations(report: ValidationReport): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas em alunos
    if (report.students.withoutPhotos > 0) {
      recommendations.push(
        `📸 Treinar ${report.students.withoutPhotos} aluno(s) sem fotos para melhorar reconhecimento facial.`
      );
    }

    // Recomendações baseadas em câmeras
    if (report.cameras.percentage < 100) {
      recommendations.push(
        `📹 Verificar ${report.cameras.offline} câmera(s) offline para garantir cobertura completa.`
      );
    }

    // Recomendações baseadas em presença
    if (report.attendance.averageAbsence > 20) {
      recommendations.push(
        `📊 Taxa de ausência acima de 20%. Investigar causas e padrões de faltas.`
      );
    }

    // Recomendações gerais
    recommendations.push(
      '✅ Sistema operacional. Próximas melhorias: integrar OpenWeatherMap, Google Maps e Brasil API.'
    );

    return recommendations;
  }

  /**
   * Gerar relatório formatado
   */
  formatReport(report: ValidationReport): string {
    const lines: string[] = [
      '═══════════════════════════════════════════════════════════',
      '📊 RELATÓRIO DE VALIDAÇÃO DO MVP - ÁQUILA PRO',
      '═══════════════════════════════════════════════════════════',
      '',
      `⏰ Data/Hora: ${new Date(report.timestamp).toLocaleString()}`,
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

    lines.push(
      '',
      '═══════════════════════════════════════════════════════════'
    );

    return lines.join('\
');
  }

  /**
   * Formatar bytes para formato legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Exportar relatório para arquivo
   */
  async exportReport(report: ValidationReport, filePath: string): Promise<void> {
    try {
      const fs = require('fs').promises;
      const formatted = this.formatReport(report);
      await fs.writeFile(filePath, formatted, 'utf-8');
      this.logger.info(`Relatório exportado para ${filePath}`);
    } catch (error) {
      this.logger.error(`Erro ao exportar relatório: ${(error as Error).message}`);
    }
  }
}

export default MVPValidation;

