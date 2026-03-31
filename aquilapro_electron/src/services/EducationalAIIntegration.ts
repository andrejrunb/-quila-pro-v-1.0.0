import Logger from './Logger';

/**
 * Passo 5: Explorar IA Educacional com OpenAI
 * Análise de padrões de presença, engajamento e recomendações personalizadas
 */

export interface StudentAnalysis {
  studentId: string;
  studentName: string;
  attendanceRate: number;
  absencePattern: string;
  engagementLevel: 'high' | 'medium' | 'low';
  riskFactors: string[];
  recommendations: string[];
  insights: string;
}

export interface ClassAnalysis {
  classId: string;
  className: string;
  averageAttendance: number;
  attendanceVariance: number;
  criticalStudents: string[];
  classPatterns: string;
  recommendations: string[];
}

export class EducationalAIIntegration {
  private apiKey: string;
  private logger: Logger;
  private baseUrl = 'https://api.openai.com/v1';
  private model = 'gpt-4';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.logger = new Logger('EducationalAIIntegration');

    if (!this.apiKey) {
      this.logger.warn('OpenAI API key não configurada. Usando modo simulado.');
    }
  }

  /**
   * Analisar padrão de presença de um aluno
   */
  async analyzeStudentAttendance(
    studentId: string,
    studentName: string,
    attendanceData: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateArrivals: number;
      earlyDepartures: number;
      absencePattern: string[]; // ['M', 'T', 'W', 'Th', 'F'] pattern
    }
  ): Promise<StudentAnalysis> {
    try {
      const attendanceRate = Math.round((attendanceData.presentDays / attendanceData.totalDays) * 100);

      // Se não tiver API key, usar análise simulada
      if (!this.apiKey) {
        return this.simulateStudentAnalysis(studentId, studentName, attendanceRate);
      }

      // Preparar prompt para IA
      const prompt = `
Analise o padrão de presença do aluno e forneça insights educacionais:

Aluno: ${studentName}
Taxa de Presença: ${attendanceRate}%
Dias Presentes: ${attendanceData.presentDays}/${attendanceData.totalDays}
Dias Ausentes: ${attendanceData.absentDays}
Chegadas Atrasadas: ${attendanceData.lateArrivals}
Saídas Antecipadas: ${attendanceData.earlyDepartures}
Padrão de Ausências: ${attendanceData.absencePattern.join(', ')}

Forneça:
1. Padrão identificado (ex: ausências em dias específicos)
2. Nível de engajamento (alto, médio, baixo)
3. Fatores de risco (ex: padrão de absenteísmo, chegadas atrasadas)
4. Recomendações específicas para melhorar presença
5. Insight geral sobre a situação do aluno

Resposta em formato JSON.
      `.trim();

      const response = await this.callOpenAI(prompt);

      // Parsear resposta
      const analysis = this.parseAIResponse(response);

      return {
        studentId,
        studentName,
        attendanceRate,
        absencePattern: analysis.pattern || 'Padrão normal',
        engagementLevel: analysis.engagement || 'medium',
        riskFactors: analysis.riskFactors || [],
        recommendations: analysis.recommendations || [],
        insights: analysis.insights || 'Análise concluída',
      };
    } catch (error) {
      this.logger.error(`Erro ao analisar presença: ${(error as Error).message}`);
      return this.simulateStudentAnalysis(studentId, studentName, 0);
    }
  }

  /**
   * Analisar padrões de uma turma
   */
  async analyzeClassPatterns(
    classId: string,
    className: string,
    studentAttendanceData: Array<{ name: string; rate: number }>
  ): Promise<ClassAnalysis> {
    try {
      const averageAttendance = Math.round(
        studentAttendanceData.reduce((sum, s) => sum + s.rate, 0) / studentAttendanceData.length
      );

      const criticalStudents = studentAttendanceData
        .filter(s => s.rate < 70)
        .map(s => s.name);

      if (!this.apiKey) {
        return this.simulateClassAnalysis(classId, className, averageAttendance, criticalStudents);
      }

      const prompt = `
Analise os padrões de presença da turma:

Turma: ${className}
Média de Presença: ${averageAttendance}%
Alunos Críticos (< 70%): ${criticalStudents.join(', ')}
Total de Alunos: ${studentAttendanceData.length}

Forneça:
1. Padrão geral da turma
2. Possíveis causas de absenteísmo
3. Alunos que precisam de intervenção
4. Recomendações para melhorar presença
5. Estratégias pedagógicas sugeridas

Resposta em formato JSON.
      `.trim();

      const response = await this.callOpenAI(prompt);
      const analysis = this.parseAIResponse(response);

      return {
        classId,
        className,
        averageAttendance,
        attendanceVariance: this.calculateVariance(
          studentAttendanceData.map(s => s.rate),
          averageAttendance
        ),
        criticalStudents,
        classPatterns: analysis.pattern || 'Padrão normal',
        recommendations: analysis.recommendations || [],
      };
    } catch (error) {
      this.logger.error(`Erro ao analisar turma: ${(error as Error).message}`);
      return this.simulateClassAnalysis(classId, className, 0, []);
    }
  }

  /**
   * Gerar recomendações personalizadas
   */
  async generatePersonalizedRecommendations(
    studentName: string,
    attendanceRate: number,
    riskFactors: string[]
  ): Promise<string[]> {
    try {
      if (!this.apiKey) {
        return this.simulateRecommendations(attendanceRate);
      }

      const prompt = `
Gere recomendações personalizadas para melhorar a presença escolar:

Aluno: ${studentName}
Taxa de Presença: ${attendanceRate}%
Fatores de Risco: ${riskFactors.join(', ')}

Forneça 5 recomendações específicas e acionáveis para:
1. Melhorar a presença
2. Aumentar o engajamento
3. Resolver os fatores de risco identificados

Resposta como lista JSON de strings.
      `.trim();

      const response = await this.callOpenAI(prompt);
      return this.parseRecommendations(response);
    } catch (error) {
      this.logger.error(`Erro ao gerar recomendações: ${(error as Error).message}`);
      return this.simulateRecommendations(attendanceRate);
    }
  }

  /**
   * Chamar API OpenAI
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em educação e análise de dados educacionais. Forneça análises detalhadas e recomendações práticas.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      this.logger.error(`Erro ao chamar OpenAI: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Parsear resposta da IA
   */
  private parseAIResponse(response: string): any {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      this.logger.error(`Erro ao parsear resposta: ${(error as Error).message}`);
      return {};
    }
  }

  /**
   * Parsear recomendações
   */
  private parseRecommendations(response: string): string[] {
    try {
      const arrayMatch = response.match(/\\[[\\s\\S]*\\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      return [];
    } catch (error) {
      this.logger.error(`Erro ao parsear recomendações: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Simular análise de aluno (sem API key)
   */
  private simulateStudentAnalysis(
    studentId: string,
    studentName: string,
    attendanceRate: number
  ): StudentAnalysis {
    let engagementLevel: 'high' | 'medium' | 'low' = 'medium';
    let riskFactors: string[] = [];
    let recommendations: string[] = [];
    let insights = '';

    if (attendanceRate > 90) {
      engagementLevel = 'high';
      insights = `${studentName} tem excelente presença. Continuar monitorando para manter o padrão.`;
      recommendations = [
        'Manter o ritmo de presença',
        'Considerar como aluno modelo',
        'Envolver em atividades de liderança',
      ];
    } else if (attendanceRate > 75) {
      engagementLevel = 'medium';
      insights = `${studentName} tem presença satisfatória. Pequenas melhorias podem aumentar o desempenho.`;
      recommendations = [
        'Motivar para aumentar presença',
        'Investigar causas de ausências',
        'Oferecer suporte adicional',
      ];
      riskFactors = ['Presença abaixo do ideal'];
    } else {
      engagementLevel = 'low';
      insights = `${studentName} tem presença baixa. Intervenção necessária.`;
      recommendations = [
        'Contato com responsáveis',
        'Investigar problemas pessoais',
        'Oferecer acompanhamento especial',
        'Considerar reforço escolar',
      ];
      riskFactors = ['Absenteísmo crítico', 'Risco de abandono escolar'];
    }

    return {
      studentId,
      studentName,
      attendanceRate,
      absencePattern: 'Padrão variável',
      engagementLevel,
      riskFactors,
      recommendations,
      insights,
    };
  }

  /**
   * Simular análise de turma (sem API key)
   */
  private simulateClassAnalysis(
    classId: string,
    className: string,
    averageAttendance: number,
    criticalStudents: string[]
  ): ClassAnalysis {
    return {
      classId,
      className,
      averageAttendance,
      attendanceVariance: 15,
      criticalStudents,
      classPatterns: 'Padrão normal com alguns alunos críticos',
      recommendations: [
        'Monitorar alunos críticos',
        'Oferecer suporte personalizado',
        'Contato com responsáveis',
        'Investigar causas de absenteísmo',
      ],
    };
  }

  /**
   * Simular recomendações (sem API key)
   */
  private simulateRecommendations(attendanceRate: number): string[] {
    if (attendanceRate > 90) {
      return [
        'Manter o excelente padrão de presença',
        'Considerar como aluno modelo para outros',
        'Envolver em atividades de liderança',
      ];
    } else if (attendanceRate > 75) {
      return [
        'Aumentar motivação e engajamento',
        'Investigar causas de ausências ocasionais',
        'Oferecer incentivos por presença',
      ];
    } else {
      return [
        'Contato urgente com responsáveis',
        'Investigar problemas pessoais ou familiares',
        'Oferecer acompanhamento especial',
        'Considerar reforço escolar',
        'Avaliar risco de abandono',
      ];
    }
  }

  /**
   * Calcular variância
   */
  private calculateVariance(values: number[], mean: number): number {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(Math.sqrt(variance));
  }
}

export default EducationalAIIntegration;

