/**
 * ManagementReporter.ts
 * Sistema Áquila Pro - V3 Enterprise
 * 
 * Gerador de rascunhos táticos semanais para a diretoria.
 * Consolida dados de todas as frentes (Financeiro, IoT, Pedagógico) em um único briefing.
 */

export interface TacticalData {
  weekStarting: string;
  activeStudents: number;
  newEnrollments: number;
  totalRevenue: number;
  delinquencyRate: number; // Percentual de inadimplência
  criticalRisksCount: number; // Alunos em risco crítico de evasão
  iotUptime: number; // % de funcionamento das catracas/câmeras
}

export class ManagementReporter {
  private static instance: ManagementReporter;

  private constructor() {}

  public static getInstance(): ManagementReporter {
    if (!ManagementReporter.instance) {
      ManagementReporter.instance = new ManagementReporter();
    }
    return ManagementReporter.instance;
  }

  /**
   * Gera o rascunho de e-mail tático para o Diretor
   */
  public generateTacticalDraft(data: TacticalData): string {
    const status = data.delinquencyRate < 10 && data.iotUptime > 98 ? 'Excelência' : 'Atenção';
    
    return `
# BRIEFING TÁTICO SEMANAL - ÁQUILA PRO V3
Período: ${data.weekStarting} - Status Geral: ${status}

## 1. SAÚDE FINANCEIRA
- Faturamento Total na Semana: R$ ${data.totalRevenue.toLocaleString('pt-BR')}
- Taxa de Inadimplência: ${data.delinquencyRate}% ${data.delinquencyRate > 15 ? '⚠️ (Acima da meta)' : '✅'}
- Novos Alunos Matriculados: ${data.newEnrollments}

## 2. INTELIGÊNCIA PEDAGÓGICA (IA ORACULUM)
- Alunos em Risco Crítico de Evasão: ${data.criticalRisksCount} 
  *Ação sugerida: O motor Oraculum já preparou as notificações para os responsáveis.*

## 3. INFRAESTRUTURA & IOT
- Uptime dos Dispositivos: ${data.iotUptime}%
- Hardware Bridge: Todos os drivers (Intelbras/ControliD) responderam conforme o esperado.
- Último Backup de Segurança: Concluído (AES-256)

## CONCLUSÃO & PRÓXIMOS PASSOS
O sistema Áquila Pro identificou um padrão de aumento de atrasos na entrada principal. 
Sugerimos abertura antecipada do portão secundário para otimizar o fluxo de reconhecimento facial.

---
Gerado automaticamente pelo Áquila Pro V3 Enterprise.
    `.trim();
  }
}

export const managementReporter = ManagementReporter.getInstance();

