import Logger from './Logger';

/**
 * Passo 4: Adicionar Brasil API para Validação de Dados
 * Integração com dados públicos de escolas brasileiras (INEP, MEC)
 */

export interface SchoolData {
  cnpj: string;
  name: string;
  city: string;
  state: string;
  address: string;
  ideb?: number;
  approvalRate?: number;
  studentCount?: number;
  teacherCount?: number;
  infrastructure?: {
    hasLibrary: boolean;
    hasLab: boolean;
    hasGym: boolean;
    hasInternet: boolean;
  };
}

export interface ValidationResult {
  isValid: boolean;
  school: SchoolData | null;
  matches: {
    name: boolean;
    city: boolean;
    cnpj: boolean;
  };
  differences: string[];
  indicators: {
    ideb: number | null;
    approvalRate: number | null;
    studentCount: number | null;
  };
}

export class BrasilAPIIntegration {
  private logger: Logger;
  private baseUrl = 'https://api.basedosdados.org/api/v1';
  private inepUrl = 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos';
  private qeduUrl = 'https://qedu.org.br/api';

  constructor() {
    this.logger = new Logger('BrasilAPIIntegration');
  }

  /**
   * Validar dados da escola contra dados públicos
   */
  async validateSchoolData(localSchoolData: {
    cnpj: string;
    name: string;
    city: string;
    state: string;
  }): Promise<ValidationResult> {
    try {
      this.logger.info(`Validando escola: ${localSchoolData.name}`);

      // Tentar obter dados públicos
      const publicData = await this.getSchoolDataByCNPJ(localSchoolData.cnpj);

      if (!publicData) {
        return {
          isValid: false,
          school: null,
          matches: { name: false, city: false, cnpj: false },
          differences: ['Escola não encontrada nos dados públicos'],
          indicators: { ideb: null, approvalRate: null, studentCount: null },
        };
      }

      // Comparar dados
      const matches = {
        name: this.normalizeString(publicData.name) === this.normalizeString(localSchoolData.name),
        city: this.normalizeString(publicData.city) === this.normalizeString(localSchoolData.city),
        cnpj: publicData.cnpj === localSchoolData.cnpj,
      };

      const differences: string[] = [];
      if (!matches.name) {
        differences.push(
          `Nome diferente: Local="${localSchoolData.name}" vs Público="${publicData.name}"`
        );
      }
      if (!matches.city) {
        differences.push(
          `Cidade diferente: Local="${localSchoolData.city}" vs Público="${publicData.city}"`
        );
      }

      return {
        isValid: matches.cnpj && matches.name && matches.city,
        school: publicData,
        matches,
        differences,
        indicators: {
          ideb: publicData.ideb || null,
          approvalRate: publicData.approvalRate || null,
          studentCount: publicData.studentCount || null,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao validar escola: ${(error as Error).message}`);
      return {
        isValid: false,
        school: null,
        matches: { name: false, city: false, cnpj: false },
        differences: [`Erro na validação: ${(error as Error).message}`],
        indicators: { ideb: null, approvalRate: null, studentCount: null },
      };
    }
  }

  /**
   * Obter dados da escola por CNPJ
   */
  async getSchoolDataByCNPJ(cnpj: string): Promise<SchoolData | null> {
    try {
      // Simular dados públicos (em produção, fazer requisição real à API)
      const mockData: Record<string, SchoolData> = {
        '12345678000190': {
          cnpj: '12.345.678/0001-90',
          name: 'Escola Estadual Exemplo',
          city: 'São Paulo',
          state: 'SP',
          address: 'Rua A, 123',
          ideb: 6.5,
          approvalRate: 85,
          studentCount: 500,
          teacherCount: 30,
          infrastructure: {
            hasLibrary: true,
            hasLab: true,
            hasGym: true,
            hasInternet: true,
          },
        },
      };

      const normalizedCNPJ = cnpj.replace(/\\D/g, '');
      const data = mockData[normalizedCNPJ];

      if (data) {
        this.logger.info(`Dados da escola encontrados: ${data.name}`);
        return data;
      }

      // Tentar API real (comentado por enquanto)
      // const response = await fetch(`${this.baseUrl}/schools?cnpj=${cnpj}`);
      // const data = await response.json();
      // return data.schools[0] || null;

      this.logger.warn(`Escola ${cnpj} não encontrada nos dados públicos`);
      return null;
    } catch (error) {
      this.logger.error(`Erro ao buscar dados da escola: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Obter indicadores educacionais da escola
   */
  async getEducationalIndicators(cnpj: string): Promise<any> {
    try {
      this.logger.info(`Buscando indicadores para ${cnpj}`);

      // Simular dados de indicadores
      const indicators = {
        ideb: {
          year: 2023,
          score: 6.5,
          trend: 'improving', // improving, stable, declining
        },
        approvalRate: {
          year: 2023,
          percentage: 85,
          trend: 'improving',
        },
        dropoutRate: {
          year: 2023,
          percentage: 5,
          trend: 'declining',
        },
        infrastructure: {
          library: true,
          computerLab: true,
          gymnasium: true,
          internet: true,
          accessibility: true,
        },
        comparison: {
          cityAverage: 6.2,
          stateAverage: 6.0,
          nationalAverage: 5.8,
          ranking: 'above_average',
        },
      };

      return indicators;
    } catch (error) {
      this.logger.error(`Erro ao buscar indicadores: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Comparar escola com outras da região
   */
  async compareWithRegionalSchools(city: string, state: string): Promise<any> {
    try {
      this.logger.info(`Comparando com escolas de ${city}, ${state}`);

      const comparison = {
        city,
        state,
        totalSchools: 150,
        averageIDEB: 6.2,
        averageApprovalRate: 82,
        topSchools: [
          {
            name: 'Escola A',
            ideb: 7.5,
            approvalRate: 95,
          },
          {
            name: 'Escola B',
            ideb: 7.2,
            approvalRate: 92,
          },
        ],
        yourSchoolRanking: 'Top 20%',
      };

      return comparison;
    } catch (error) {
      this.logger.error(`Erro ao comparar escolas: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Gerar relatório de validação
   */
  generateValidationReport(result: ValidationResult): string {
    const lines: string[] = [
      '═══════════════════════════════════════════════════════════',
      '📊 RELATÓRIO DE VALIDAÇÃO DE DADOS - BRASIL API',
      '═══════════════════════════════════════════════════════════',
      '',
      `Status: ${result.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`,
      '',
    ];

    if (result.school) {
      lines.push('📋 DADOS PÚBLICOS ENCONTRADOS');
      lines.push(`  Nome: ${result.school.name}`);
      lines.push(`  CNPJ: ${result.school.cnpj}`);
      lines.push(`  Cidade: ${result.school.city}, ${result.school.state}`);
      lines.push(`  Endereço: ${result.school.address}`);
      lines.push('');

      if (result.school.ideb) {
        lines.push(`  📈 IDEB: ${result.school.ideb}`);
      }
      if (result.school.approvalRate) {
        lines.push(`  ✅ Taxa de Aprovação: ${result.school.approvalRate}%`);
      }
      if (result.school.studentCount) {
        lines.push(`  👥 Alunos: ${result.school.studentCount}`);
      }
      lines.push('');
    }

    lines.push('🔍 VALIDAÇÃO');
    lines.push(`  Nome: ${result.matches.name ? '✅' : '❌'}`);
    lines.push(`  Cidade: ${result.matches.city ? '✅' : '❌'}`);
    lines.push(`  CNPJ: ${result.matches.cnpj ? '✅' : '❌'}`);
    lines.push('');

    if (result.differences.length > 0) {
      lines.push('⚠️ DIFERENÇAS ENCONTRADAS');
      result.differences.forEach(diff => lines.push(`  ${diff}`));
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════════');

    return lines.join('\
');
  }

  /**
   * Normalizar string para comparação
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
  }
}

export default BrasilAPIIntegration;


