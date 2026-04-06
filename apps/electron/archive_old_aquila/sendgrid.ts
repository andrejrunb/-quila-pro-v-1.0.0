import { ENV } from "../_core/env";

/**
 * Integração com SendGrid para envio de emails
 * Documentação: https://docs.sendgrid.com/
 */

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface SendGridResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia um email via SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<SendGridResponse> {
  try {
    if (!ENV.sendgridApiKey) {
      throw new Error("SENDGRID_API_KEY não configurada");
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ENV.sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
            cc: options.cc?.map(email => ({ email })),
            bcc: options.bcc?.map(email => ({ email })),
          },
        ],
        from: {
          email: options.from || "noreply@aquilapro.com",
          name: "Áquila Pro",
        },
        reply_to: options.replyTo ? { email: options.replyTo } : undefined,
        subject: options.subject,
        content: [
          {
            type: "text/html",
            value: options.htmlContent,
          },
          ...(options.textContent
            ? [{ type: "text/plain", value: options.textContent }]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${response.status} - ${error}`);
    }

    const messageId = response.headers.get("x-message-id");

    return {
      success: true,
      messageId: messageId || undefined,
    };
  } catch (error) {
    console.error("[SendGrid] Erro ao enviar email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia email de confirmação de contato
 */
export async function sendContactConfirmationEmail(
  email: string,
  name: string,
  ticketId: number,
  subject: string
): Promise<SendGridResponse> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .ticket { background-color: #e8f4f8; padding: 10px; border-left: 4px solid #0066cc; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Obrigado pelo seu contato!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Recebemos sua mensagem sobre: <strong>${subject}</strong></p>
            <p>Nossa equipe está analisando sua solicitação e entraremos em contato em breve.</p>
            <div class="ticket">
              <p><strong>Número do Ticket:</strong> #${ticketId}</p>
              <p>Guarde este número para referência futura.</p>
            </div>
            <p>Se tiver dúvidas adicionais, responda este email.</p>
            <p>Atenciosamente,<br><strong>Equipe Áquila Pro</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Áquila Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Recebemos seu contato - Áquila Pro (Ticket #${ticketId})`,
    htmlContent,
  });
}

/**
 * Envia email de alerta de segurança
 */
export async function sendSecurityAlertEmail(
  email: string,
  studentName: string,
  alertType: string,
  location: string,
  timestamp: string,
  cameraId: string
): Promise<SendGridResponse> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background-color: #ff4444; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h1>🚨 ALERTA DE SEGURANÇA</h1>
          </div>
          <div class="content">
            <p>Um evento de segurança foi detectado no seu sistema Áquila Pro.</p>
            <div class="details">
              <p><strong>Aluno:</strong> ${studentName}</p>
              <p><strong>Tipo de Alerta:</strong> ${alertType}</p>
              <p><strong>Local:</strong> ${location}</p>
              <p><strong>Hora:</strong> ${timestamp}</p>
              <p><strong>Câmera:</strong> ${cameraId}</p>
            </div>
            <p>Por favor, verifique imediatamente no painel de controle do Áquila Pro.</p>
            <p>Atenciosamente,<br><strong>Sistema Áquila Pro</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Áquila Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🚨 ALERTA: ${alertType} - ${studentName}`,
    htmlContent,
  });
}

/**
 * Envia email de resposta a contato
 */
export async function sendContactResponseEmail(
  email: string,
  name: string,
  ticketId: number,
  response: string,
  respondedBy: string
): Promise<SendGridResponse> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00aa00; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .response { background-color: #e8f8e8; padding: 15px; border-left: 4px solid #00aa00; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sua solicitação foi respondida!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Respondemos à sua solicitação (Ticket #${ticketId}).</p>
            <div class="response">
              <p><strong>Resposta:</strong></p>
              <p>${response}</p>
            </div>
            <p><strong>Respondido por:</strong> ${respondedBy}</p>
            <p>Se tiver mais dúvidas, responda este email.</p>
            <p>Atenciosamente,<br><strong>Equipe Áquila Pro</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Áquila Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Resposta: Sua solicitação (Ticket #${ticketId})`,
    htmlContent,
  });
}

/**
 * Envia relatório diário por email
 */
export async function sendDailyReportEmail(
  email: string,
  date: string,
  totalStudents: number,
  presentStudents: number,
  absentStudents: number,
  alertsCount: number,
  averageAttendance: number
): Promise<SendGridResponse> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
          .stat { background-color: #fff; padding: 15px; border-radius: 5px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #0066cc; }
          .stat-label { color: #666; font-size: 12px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Relatório Diário - Áquila Pro</h1>
            <p>${date}</p>
          </div>
          <div class="content">
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${presentStudents}</div>
                <div class="stat-label">Alunos Presentes</div>
              </div>
              <div class="stat">
                <div class="stat-value">${absentStudents}</div>
                <div class="stat-label">Alunos Ausentes</div>
              </div>
              <div class="stat">
                <div class="stat-value">${averageAttendance.toFixed(1)}%</div>
                <div class="stat-label">Taxa de Presença</div>
              </div>
              <div class="stat">
                <div class="stat-value">${alertsCount}</div>
                <div class="stat-label">Alertas</div>
              </div>
            </div>
            <p><strong>Total de Alunos:</strong> ${totalStudents}</p>
            <p>Acesse o painel para mais detalhes.</p>
            <p>Atenciosamente,<br><strong>Sistema Áquila Pro</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Áquila Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Relatório Diário - Áquila Pro (${date})`,
    htmlContent,
  });
}
