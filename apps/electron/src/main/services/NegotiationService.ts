import { Database } from '../../database/Database';
import { logger } from '../logger';
import { LegalDocumentService } from './LegalDocumentService';

export interface NegotiationOption {
  type: 'CASH' | 'BALANCED' | 'EXTENDED';
  installments: number;
  installmentValue: number;
  totalValue: number;
  discount: number;
  interest: number;
}

export interface SettlementProposal {
  studentId: string;
  totalDebt: number;
  options: NegotiationOption[];
  validUntil: string;
}

/**
 * NEGOTIATION SERVICE (v406)
 * --------------------------
 * Motor de negociação inteligente para alunos inadimplentes.
 * Utiliza o "Córtex Financeiro" para calcular propostas éticas.
 */
export class NegotiationService {
  constructor(private db: Database, private legalService: LegalDocumentService) {}

  /**
   * Gera opções de negociação baseadas na dívida total.
   */
  public generateProposals(studentId: string, totalDebt: number): SettlementProposal {
    logger.info(`[Negotiation] Gerando propostas para ${studentId} (Dívida: ${totalDebt})`);

    const options: NegotiationOption[] = [
      {
        type: 'CASH',
        installments: 1,
        totalValue: totalDebt * 0.85, 
        installmentValue: totalDebt * 0.85,
        discount: 15,
        interest: 0
      },
      {
        type: 'BALANCED',
        installments: 3,
        totalValue: totalDebt,
        installmentValue: totalDebt / 3,
        discount: 0,
        interest: 0
      },
      {
        type: 'EXTENDED',
        installments: 12,
        totalValue: totalDebt * 1.10,
        installmentValue: (totalDebt * 1.10) / 12,
        discount: 0,
        interest: 10
      }
    ];

    return {
      studentId,
      totalDebt,
      options,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Registra a aceitação de uma proposta e gera o termo PDF.
   */
  public async acceptProposal(studentId: string, optionType: string): Promise<{ success: boolean; pdfPath?: string }> {
    logger.info(`[Negotiation] Acordo aceito para ${studentId}: ${optionType}`);
    
    // 1. Buscar detalhes da dívida (Mock por enquanto)
    const totalDebt = 850.0; // Mock
    const proposal = this.generateProposals(studentId, totalDebt);
    const selected = proposal.options.find(o => o.type === optionType);

    if (!selected) return { success: false };

    // 2. Gerar PDF
    const pdfPath = await this.legalService.generateSettlementPDF({
      studentId,
      studentName: 'André Santos', // Mock: buscar no DB futuramente
      totalDebt,
      settlementType: optionType,
      installments: selected.installments,
      installmentValue: selected.installmentValue,
      totalSettlement: selected.totalValue
    });

    return { success: true, pdfPath };
  }
}
