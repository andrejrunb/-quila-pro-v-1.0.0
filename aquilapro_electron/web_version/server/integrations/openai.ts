import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analisar um alerta de segurança usando IA
 * @param alertDescription Descrição do alerta
 * @returns Análise e recomendações
 */
export async function analyzeSecurityAlert(alertDescription: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em segurança escolar. Analise o alerta de segurança fornecido e forneça:
1. Avaliação de risco (baixo, médio, alto, crítico)
2. Possíveis causas
3. Ações recomendadas
4. Próximos passos

Seja conciso e prático.`,
        },
        {
          role: "user",
          content: alertDescription,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Não foi possível analisar o alerta.";
  } catch (error) {
    console.error("Erro ao analisar alerta com OpenAI:", error);
    throw new Error("Falha ao analisar alerta de segurança");
  }
}

/**
 * Gerar resumo de presença usando IA
 * @param attendanceData Dados de presença
 * @returns Resumo em linguagem natural
 */
export async function generateAttendanceSummary(attendanceData: {
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  date: string;
}): Promise<string> {
  try {
    const prompt = `
Gere um resumo executivo de presença escolar para o dia ${attendanceData.date}:
- Total de alunos: ${attendanceData.totalStudents}
- Presentes: ${attendanceData.presentStudents}
- Ausentes: ${attendanceData.absentStudents}
- Atrasados: ${attendanceData.lateStudents}

Forneça insights sobre a taxa de presença e possíveis padrões.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um analista de dados educacionais. Gere resumos claros e acionáveis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content || "Não foi possível gerar o resumo.";
  } catch (error) {
    console.error("Erro ao gerar resumo com OpenAI:", error);
    throw new Error("Falha ao gerar resumo de presença");
  }
}

/**
 * Chatbot de suporte usando IA
 * @param userMessage Mensagem do usuário
 * @returns Resposta do chatbot
 */
export async function chatbotResponse(userMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente de suporte do Sistema Áquila Pro. Você ajuda pais, professores e administradores com dúvidas sobre:
- Segurança escolar
- Monitoramento de presença
- Alertas e notificações
- Funcionalidades do sistema
- Conformidade com LGPD

Seja amigável, profissional e forneça informações precisas. Se não souber a resposta, sugira contatar o suporte técnico.`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    return response.choices[0].message.content || "Desculpe, não consegui processar sua pergunta.";
  } catch (error) {
    console.error("Erro ao processar mensagem do chatbot:", error);
    throw new Error("Falha ao processar mensagem");
  }
}

/**
 * Detectar anomalias em padrões de presença
 * @param studentAttendanceHistory Histórico de presença do aluno
 * @returns Análise de anomalias
 */
export async function detectAnomalies(studentAttendanceHistory: {
  studentName: string;
  lastWeekAttendance: number[];
  averageAttendance: number;
}): Promise<string> {
  try {
    const prompt = `
Analise o padrão de presença do aluno ${studentAttendanceHistory.studentName}:
- Presença última semana (0-5 dias): ${studentAttendanceHistory.lastWeekAttendance.join(", ")}
- Média histórica: ${studentAttendanceHistory.averageAttendance}%

Identifique:
1. Anomalias ou padrões preocupantes
2. Possíveis causas
3. Recomendações de ação
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em análise de dados educacionais. Identifique padrões e anomalias.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 350,
    });

    return response.choices[0].message.content || "Não foi possível detectar anomalias.";
  } catch (error) {
    console.error("Erro ao detectar anomalias:", error);
    throw new Error("Falha ao analisar padrões de presença");
  }
}
