import { logger } from '../logger';

export interface ExamBanca {
  id: string;
  name: string;
  style: 'multiple_choice' | 'true_false' | 'essay' | 'complex_ri';
  description: string;
  promptDirectives: string;
}

/**
 * ExamIntelligenceService — Phase 2600: Vestibular Alignment
 * Cataloga estilos de bancas de exames nacionais e regionais para 'tunning' de I.A.
 */
export class ExamIntelligenceService {
  private static instance: ExamIntelligenceService;

  private bancas: ExamBanca[] = [
    {
      id: 'banca-enem',
      name: 'ENEM (INEP)',
      style: 'multiple_choice',
      description: 'Foco em competências, habilidades e TRI. Questões contextualizadas.',
      promptDirectives: 'Use o padrão ENEM: textos base longos, 5 alternativas (A-E), foque na Teoria de Resposta ao Item (TRI) e contextualização social/científica.'
    },
    {
      id: 'banca-unirv',
      name: 'UniRV',
      style: 'multiple_choice',
      description: 'Foco em conteúdos específicos do Centro-Oeste brasileiro.',
      promptDirectives: 'Use o padrão UniRV: questões diretas, conteudistas, foco em biologia e química (foco medicina), múltiplas alternativas.'
    },
    {
      id: 'banca-unb',
      name: 'UnB (Cebraspe)',
      style: 'true_false',
      description: 'Questões de Certo ou Errado com fator de correção (uma errada anula uma certa).',
      promptDirectives: 'Use o padrão Cebraspe/UnB: Proponha itens de julgamento (CERTO ou ERRADO). Linguagem formal e rigorosa.'
    },
    {
      id: 'banca-vunesp',
      name: 'Vunesp (USP/Others)',
      style: 'multiple_choice',
      description: 'Clareza e objetividade. Distribuição equilibrada de temas.',
      promptDirectives: 'Use o padrão Vunesp: enunciados claros, sem pegadinhas, foco na base curricular paulista.'
    }
  ];

  private oldExamLinks: Record<string, string[]> = {
    'banca-enem': [
      'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D1_CD1.pdf',
      'https://download.inep.gov.br/enem/provas_e_gabaritos/2022_PV_impresso_D1_CD1.pdf'
    ],
    'banca-unirv': [
      'https://www.unirv.edu.br/vestibular_provas.php?id=2024-1',
      'https://www.unirv.edu.br/vestibular_provas.php?id=2023-2'
    ],
    'banca-unb': [
      'https://www.cebraspe.org.br/vestibulares/UNB_24/provas_e_gabaritos',
      'https://www.cebraspe.org.br/vestibulares/UNB_23_PAS3/provas_e_gabaritos'
    ],
    'banca-vunesp': [
      'https://www.vunesp.com.br/provas_e_gabaritos'
    ]
  };

  private constructor() {}

  public static getInstance(): ExamIntelligenceService {
    if (!ExamIntelligenceService.instance) {
      ExamIntelligenceService.instance = new ExamIntelligenceService();
    }
    return ExamIntelligenceService.instance;
  }

  public getAvailableBancas(): ExamBanca[] {
    return this.bancas;
  }

  public getBancas(): ExamBanca[] {
    return this.bancas;
  }

  public getBancaById(id: string): ExamBanca | undefined {
    return this.bancas.find(b => b.id === id);
  }

  public getResourcesForBanca(bancaId: string) {
    const banca = this.getBancaById(bancaId);
    return {
      name: banca?.name || 'Desconhecida',
      directives: banca?.promptDirectives || '',
      oldExams: this.oldExamLinks[bancaId] || []
    };
  }

  /**
   * Sugere a melhor banca com base no ano escolar.
   */
  public getSuggestedBancaForGrade(grade: number): string {
    if (grade === 1) return 'banca-enem';
    if (grade === 2) return 'banca-unirv';
    if (grade === 3) return 'banca-unb';
    return 'banca-enem';
  }
}

export const examIntelligenceService = ExamIntelligenceService.getInstance();
