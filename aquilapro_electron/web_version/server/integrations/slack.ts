import { ENV } from "../_core/env";

/**
 * Integração com Slack para notificações em tempo real
 * Documentação: https://api.slack.com/messaging/webhooks
 */

interface SlackMessage {
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

interface SlackResponse {
  success: boolean;
  error?: string;
}

/**
 * Envia uma mensagem para o Slack via Webhook
 */
export async function sendSlackMessage(message: SlackMessage): Promise<SlackResponse> {
  try {
    if (!ENV.slackWebhookUrl) {
      throw new Error("SLACK_WEBHOOK_URL não configurada");
    }

    const response = await fetch(ENV.slackWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Slack error: ${response.status} - ${error}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Slack] Erro ao enviar mensagem:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Notifica sobre novo contato recebido
 */
export async function notifyNewContact(
  name: string,
  email: string,
  subject: string,
  schoolName: string,
  ticketId: number
): Promise<SlackResponse> {
  return sendSlackMessage({
    text: `📧 Novo contato recebido`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📧 Novo Contato Recebido",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Nome:*\n${name}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${email}`,
          },
          {
            type: "mrkdwn",
            text: `*Escola:*\n${schoolName || "Não informada"}`,
          },
          {
            type: "mrkdwn",
            text: `*Ticket:*\n#${ticketId}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Assunto:*\n${subject}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Ver Detalhes",
              emoji: true,
            },
            url: `https://aquilapro.com/admin/contatos`,
            action_id: "view_contact",
          },
        ],
      },
    ],
  });
}

/**
 * Notifica sobre alerta de segurança
 */
export async function notifySecurityAlert(
  studentName: string,
  alertType: string,
  location: string,
  timestamp: string,
  cameraId: string,
  priority: "HIGH" | "MEDIUM" | "LOW" = "HIGH"
): Promise<SlackResponse> {
  const colorMap = {
    HIGH: "#FF0000",
    MEDIUM: "#FFA500",
    LOW: "#FFFF00",
  };

  return sendSlackMessage({
    text: `🚨 ALERTA: ${alertType}`,
    attachments: [
      {
        color: colorMap[priority],
        title: `🚨 Alerta de Segurança - ${priority}`,
        fields: [
          {
            title: "Aluno",
            value: studentName,
            short: true,
          },
          {
            title: "Tipo",
            value: alertType,
            short: true,
          },
          {
            title: "Local",
            value: location,
            short: true,
          },
          {
            title: "Câmera",
            value: cameraId,
            short: true,
          },
          {
            title: "Hora",
            value: timestamp,
            short: false,
          },
        ],
        footer: "Áquila Pro",
        ts: Math.floor(new Date().getTime() / 1000),
      },
    ],
  });
}

/**
 * Notifica sobre contato respondido
 */
export async function notifyContactResponded(
  name: string,
  email: string,
  ticketId: number,
  respondedBy: string
): Promise<SlackResponse> {
  return sendSlackMessage({
    text: `✅ Contato respondido`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "✅ Contato Respondido",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Nome:*\n${name}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${email}`,
          },
          {
            type: "mrkdwn",
            text: `*Ticket:*\n#${ticketId}`,
          },
          {
            type: "mrkdwn",
            text: `*Respondido por:*\n${respondedBy}`,
          },
        ],
      },
    ],
  });
}

/**
 * Notifica resumo diário
 */
export async function notifyDailySummary(
  date: string,
  totalStudents: number,
  presentStudents: number,
  absentStudents: number,
  alertsCount: number,
  averageAttendance: number
): Promise<SlackResponse> {
  return sendSlackMessage({
    text: `📊 Resumo Diário - ${date}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `📊 Resumo Diário - ${date}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Alunos Presentes:*\n${presentStudents}/${totalStudents}`,
          },
          {
            type: "mrkdwn",
            text: `*Taxa de Presença:*\n${averageAttendance.toFixed(1)}%`,
          },
          {
            type: "mrkdwn",
            text: `*Alunos Ausentes:*\n${absentStudents}`,
          },
          {
            type: "mrkdwn",
            text: `*Alertas:*\n${alertsCount}`,
          },
        ],
      },
    ],
  });
}

/**
 * Notifica sobre erro do sistema
 */
export async function notifySystemError(
  errorMessage: string,
  errorType: string,
  timestamp: string
): Promise<SlackResponse> {
  return sendSlackMessage({
    text: `⚠️ Erro do Sistema`,
    attachments: [
      {
        color: "#FF0000",
        title: `⚠️ Erro do Sistema - ${errorType}`,
        text: errorMessage,
        footer: "Áquila Pro",
        ts: Math.floor(new Date().getTime() / 1000),
      },
    ],
  });
}

/**
 * Notifica sobre nova submissão de contato (para #new-contacts)
 */
export async function notifyNewContactToChannel(
  name: string,
  email: string,
  subject: string,
  schoolName: string,
  ticketId: number
): Promise<SlackResponse> {
  return sendSlackMessage({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📧 *Novo Contato*\n*${name}* (${email})\n*Assunto:* ${subject}\n*Escola:* ${schoolName || "Não informada"}\n*Ticket:* #${ticketId}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Responder",
            },
            url: `https://aquilapro.com/admin/contatos`,
            action_id: "respond_contact",
          },
        ],
      },
    ],
  });
}
