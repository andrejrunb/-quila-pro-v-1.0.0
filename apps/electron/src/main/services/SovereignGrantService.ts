import { logger } from '../logger';
import { sovereignGraphService } from './SovereignGraphService';
import { sovereignLedger } from './SovereignLedger';

export interface GrantRule {
  id: string;
  name: string;
  conditionType: 'attendance' | 'merit';
  threshold: number;
  discountBonus: number; // Percentual (ex: 0.05 = 5%)
}

/**
 * SovereignGrantService — Phase 2300: Smart Grants
 * Motor de regras para automação de bolsas baseadas em comportamento soberano.
 */
export class SovereignGrantService {
  private static instance: SovereignGrantService;

  private rules: GrantRule[] = [
    {
      id: 'rule-platinum-attendance',
      name: 'Platinum Attendance (100% PoA)',
      conditionType: 'attendance',
      threshold: 30, // 30 dias de presença validada
      discountBonus: 0.05
    },
    {
      id: 'rule-academic-merit',
      name: 'Elite Merit Reward',
      conditionType: 'merit',
      threshold: 5000, // 5000 XP
      discountBonus: 0.10
    }
  ];

  private constructor() {}

  public static getInstance(): SovereignGrantService {
    if (!SovereignGrantService.instance) {
      SovereignGrantService.instance = new SovereignGrantService();
    }
    return SovereignGrantService.instance;
  }

  /**
   * Calcula o desconto adicional de Smart Grant para um aluno específico.
   */
  public async calculateEffectiveDiscount(studentId: string): Promise<number> {
    let extraDiscount = 0;

    // Simulação de consulta ao SKG para verificar elegibilidade
    // Em produção, consultaria o histórico de ATTENDANCE_EVENT e MERIT_AWARD
    const meritNodes = sovereignGraphService.getNeighbors(studentId, 'EARNED_MERIT');
    const attendanceNodes = sovereignGraphService.getNeighbors(studentId, 'GENERATED_POA');

    // Regra de Mérito (Resumo simplificado para a fase 2300)
    if (meritNodes.length > 5) { // Ex: 5 eventos de mérito recentes
       extraDiscount += this.rules.find(r => r.id === 'rule-academic-merit')?.discountBonus || 0;
    }

    // Regra de Assiduidade
    if (attendanceNodes.length > 20) {
       extraDiscount += this.rules.find(r => r.id === 'rule-platinum-attendance')?.discountBonus || 0;
    }

    // Teto de 50% de desconto total (conforme plano)
    return Math.min(extraDiscount, 0.50);
  }

  /**
   * Registra a emissão de uma bolsa automática no Ledger.
   */
  public async issueSmartGrant(studentId: string, discount: number, reason: string) {
    const grantId = `grant-${studentId}-${Date.now()}`;
    
    const grantData = {
      grantId,
      studentId,
      discount,
      reason,
      timestamp: new Date().toISOString()
    };

    // 1. Grafo Soberano
    sovereignGraphService.addEntity({
      id: grantId,
      type: 'SCHOLARSHIP',
      label: `Smart Grant: ${Math.round(discount * 100)}% off`,
      metadata: grantData
    });
    sovereignGraphService.associate(studentId, grantId, 'ELIGIBLE_FOR', 1);

    // 2. Ledger Imutável
    sovereignLedger.addEntry({
      type: 'SMART_GRANT_ISSUED',
      ...grantData
    });

    logger.info(`[SmartGrant] Bolsa emitida para ${studentId}: ${reason} (${discount * 100}%)`);
    return grantId;
  }

  /**
   * Obtém o saldo de créditos de mérito de um professor.
   */
  public async getTeacherCreditBalance(teacherId: string): Promise<number> {
    // Consulta o Grafo para somar méritos ganhos
    const awards = sovereignGraphService.getNeighbors(teacherId, 'EARNED_MERIT');
    const spent = sovereignGraphService.getNeighbors(teacherId, 'SPENT_CREDITS');
    
    const totalEarned = awards.reduce((acc, node) => acc + (node.metadata?.amount || 0), 0);
    const totalSpent = spent.reduce((acc, node) => acc + (node.metadata?.amount || 0), 0);
    
    // Fallback para simulação inicial se não houver dados no grafo
    return Math.max(0, (totalEarned || 500) - totalSpent);
  }

  /**
   * Adiciona créditos ao professor (ex: por compartilhar material bem avaliado).
   */
  public async addTeacherCredits(teacherId: string, amount: number, reason: string) {
    const awardId = `award-${Date.now()}`;
    
    sovereignGraphService.addEntity({
      id: awardId,
      type: 'MERIT_AWARD',
      label: `Merit Award: +${amount} credits`,
      metadata: { amount, reason, timestamp: new Date().toISOString() }
    });
    sovereignGraphService.associate(teacherId, awardId, 'EARNED_MERIT', 1);

    sovereignLedger.addEntry({
      type: 'TEACHER_MERIT_AWARD',
      teacherId,
      amount,
      reason
    });
  }

  /**
   * Deduz créditos do professor para compras no Marketplace.
   */
  public async spendCredits(teacherId: string, amount: number, assetId: string) {
    const balance = await this.getTeacherCreditBalance(teacherId);
    if (balance < amount) throw new Error('Saldo de créditos insuficiente.');

    const transactionId = `tx-${Date.now()}`;
    
    sovereignGraphService.addEntity({
      id: transactionId,
      type: 'TRANSACTION',
      label: `Purchase: ${assetId}`,
      metadata: { amount, assetId, timestamp: new Date().toISOString() }
    });
    sovereignGraphService.associate(teacherId, transactionId, 'SPENT_CREDITS', 1);

    sovereignLedger.addEntry({
      type: 'MARKETPLACE_PURCHASE',
      teacherId,
      amount,
      assetId
    });

    return transactionId;
  }
}

export const sovereignGrantService = SovereignGrantService.getInstance();
