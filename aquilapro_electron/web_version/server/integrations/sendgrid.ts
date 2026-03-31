import { ENV } from "../_core/env";

/**
 * Integração com SendGrid para envio de emails
 * IMPORTANTE: O email remetente deve ser um domínio ou endereço verificado no SendGrid.
 * Use o email de domínio verificado ou configure o Sender Authentication no painel SendGrid.
 * Documentação: https://docs.sendgrid.com/
 */

// Email remetente verificado no SendGrid (Sender Authentication)
// Se não tiver domínio verificado, use o email da conta SendGrid
const SENDER_EMAIL = process.env.SENDGRID_SENDER_EMAIL || "noreply@aquilapro.com.br";
const SENDER_NAME = "Áquila Pro";
const OWNER_EMAIL = "andrejrunb@yahoo.com.br";

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface SendGridResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Envia um email via SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<SendGridResponse> {
  try {
    if (!ENV.sendgridApiKey) {
      console.warn("[SendGrid] SENDGRID_API_KEY não configurada — email não enviado");
      return {
        success: false,
        error: "SENDGRID_API_KEY não configurada",
      };
    }

    const fromEmail = options.from || SENDER_EMAIL;
    const fromName = options.fromName || SENDER_NAME;

    const body: Record<string, unknown> = {
      personalizations: [
        {
          to: [{ email: options.to }],
          ...(options.cc?.length ? { cc: options.cc.map(email => ({ email })) } : {}),
          ...(options.bcc?.length ? { bcc: options.bcc.map(email => ({ email })) } : {}),
        },
      ],
      from: {
        email: fromEmail,
        name: fromName,
      },
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
    };

    // Adicionar reply-to se especificado
    if (options.replyTo) {
      body.reply_to = { email: options.replyTo };
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SendGrid] Erro HTTP ${response.status}:`, errorText);
      return {
        success: false,
        error: `SendGrid retornou ${response.status}: ${errorText}`,
        statusCode: response.status,
      };
    }

    const messageId = response.headers.get("x-message-id");
    console.log(`[SendGrid] Email enviado com sucesso para ${options.to} — messageId: ${messageId}`);

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
 * Envia notificação de novo contato para o proprietário
 */
export async function sendOwnerContactNotification(
  contactId: number,
  name: string,
  email: string,
  phone: string | undefined,
  schoolName: string | undefined,
  subject: string,
  message: string
): Promise<SendGridResponse> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .wrapper { padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 24px; }
          .header h1 { margin: 0; font-size: 22px; }
          .header p { margin: 6px 0 0; opacity: 0.85; font-size: 13px; }
          .content { padding: 24px; }
          .field { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #eee; }
          .field:last-child { border-bottom: none; }
          .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .value { font-size: 15px; color: #222; font-weight: 500; }
          .message-box { background: #f8f9fa; border-left: 4px solid #0066cc; padding: 14px; border-radius: 4px; margin-top: 16px; }
          .footer { background: #f8f9fa; padding: 16px 24px; text-align: center; font-size: 12px; color: #999; }
          .badge { display: inline-block; background: #0066cc; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>📬 Novo Contato Recebido</h1>
              <p>Ticket #${contactId} — ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nome</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${email}" style="color:#0066cc;">${email}</a></div>
              </div>
              ${phone ? `<div class="field"><div class="label">Telefone</div><div class="value"><a href="tel:${phone}" style="color:#0066cc;">${phone}</a></div></div>` : ""}
              ${schoolName ? `<div class="field"><div class="label">Escola</div><div class="value">${schoolName}</div></div>` : ""}
              <div class="field">
                <div class="label">Assunto</div>
                <div class="value">${subject}</div>
              </div>
              <div class="message-box">
                <div class="label" style="margin-bottom:8px;">Mensagem</div>
                <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div>
              </div>
            </div>
            <div class="footer">
              <p>Áquila Pro — Sistema de Segurança e Engajamento Escolar</p>
              <p>Responda diretamente para: <a href="mailto:${email}" style="color:#0066cc;">${email}</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: OWNER_EMAIL,
    subject: `[Áquila Pro] Novo Contato #${contactId} — ${name}: ${subject}`,
    htmlContent,
    replyTo: email,
    textContent: `Novo contato recebido!\n\nTicket: #${contactId}\nNome: ${name}\nEmail: ${email}\n${phone ? `Telefone: ${phone}\n` : ""}${schoolName ? `Escola: ${schoolName}\n` : ""}Assunto: ${subject}\n\nMensagem:\n${message}`,
  });
}

/**
 * Envia email de confirmação de contato para o remetente
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
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .wrapper { padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 24px; }
          .header h1 { margin: 0; font-size: 22px; }
          .content { padding: 24px; }
          .ticket { background: #e8f4ff; border-left: 4px solid #0066cc; padding: 14px; border-radius: 4px; margin: 16px 0; }
          .ticket strong { font-size: 20px; color: #0066cc; }
          .footer { background: #f8f9fa; padding: 16px 24px; text-align: center; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>✅ Mensagem Recebida!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Recebemos sua mensagem sobre: <strong>${subject}</strong></p>
              <p>Nossa equipe analisará sua solicitação e entrará em contato em até <strong>24 horas úteis</strong>.</p>
              <div class="ticket">
                <p style="margin:0 0 4px;">Número do Ticket</p>
                <strong>#${ticketId}</strong>
                <p style="margin:6px 0 0;font-size:13px;color:#666;">Guarde este número para referência futura.</p>
              </div>
              <p>Para dúvidas urgentes, entre em contato diretamente:</p>
              <ul>
                <li>WhatsApp: <a href="https://wa.me/5561999623099" style="color:#0066cc;">+55 (61) 99962-3099</a></li>
                <li>Email: <a href="mailto:andrejrunb@yahoo.com.br" style="color:#0066cc;">andrejrunb@yahoo.com.br</a></li>
              </ul>
              <p>Atenciosamente,<br><strong>Equipe Áquila Pro</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Áquila Pro. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Recebemos seu contato — Áquila Pro (Ticket #${ticketId})`,
    htmlContent,
    replyTo: OWNER_EMAIL,
  });
}

/**
 * Envia email de notificação de novo orçamento para o proprietário
 */
export async function sendOwnerQuoteNotification(
  quoteId: number,
  data: {
    schoolName: string;
    schoolType: string;
    city: string;
    state: string;
    contactName: string;
    contactRole: string;
    contactEmail: string;
    contactPhone: string;
    contactWhatsapp?: string;
    totalStudents: number;
    totalRooms: number;
    existingCameras: number;
    budget: string;
    timeline: string;
    message?: string;
  }
): Promise<SendGridResponse> {
  const schoolTypeLabels: Record<string, string> = {
    public_municipal: "Pública Municipal",
    public_state: "Pública Estadual",
    public_federal: "Pública Federal",
    private: "Particular",
    other: "Outro",
  };
  const budgetLabels: Record<string, string> = {
    under_10k: "Até R$ 10.000",
    "10k_25k": "R$ 10.000 – R$ 25.000",
    "25k_50k": "R$ 25.000 – R$ 50.000",
    "50k_100k": "R$ 50.000 – R$ 100.000",
    above_100k: "Acima de R$ 100.000",
    unknown: "Não definido",
  };
  const timelineLabels: Record<string, string> = {
    immediate: "Imediato",
    "1_month": "1 mês",
    "3_months": "3 meses",
    "6_months": "6 meses",
    next_year: "Próximo ano",
    unknown: "Não definido",
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .wrapper { padding: 20px; }
          .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 24px; }
          .header h1 { margin: 0; font-size: 22px; }
          .header p { margin: 6px 0 0; opacity: 0.85; font-size: 13px; }
          .content { padding: 24px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; color: #0066cc; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #e8f4ff; }
          .row { display: flex; padding: 7px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .row-label { width: 180px; color: #666; flex-shrink: 0; }
          .row-value { flex: 1; font-weight: 500; }
          .highlight { background: #e8f4ff; border-left: 4px solid #0066cc; padding: 12px 16px; border-radius: 4px; margin-top: 16px; font-size: 14px; line-height: 1.6; }
          .footer { background: #f8f9fa; padding: 16px 24px; text-align: center; font-size: 12px; color: #999; }
          .cta { text-align: center; margin: 20px 0; }
          .cta a { display: inline-block; background: #0066cc; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>💼 Nova Solicitação de Orçamento #${quoteId}</h1>
              <p>Recebida em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div class="content">
              <div class="section">
                <div class="section-title">🏫 Dados da Escola</div>
                <div class="row"><span class="row-label">Nome:</span><span class="row-value">${data.schoolName}</span></div>
                <div class="row"><span class="row-label">Tipo:</span><span class="row-value">${schoolTypeLabels[data.schoolType] || data.schoolType}</span></div>
                <div class="row"><span class="row-label">Localização:</span><span class="row-value">${data.city} / ${data.state}</span></div>
              </div>
              <div class="section">
                <div class="section-title">👤 Dados do Contato</div>
                <div class="row"><span class="row-label">Nome:</span><span class="row-value">${data.contactName}</span></div>
                <div class="row"><span class="row-label">Cargo:</span><span class="row-value">${data.contactRole}</span></div>
                <div class="row"><span class="row-label">Email:</span><span class="row-value"><a href="mailto:${data.contactEmail}" style="color:#0066cc;">${data.contactEmail}</a></span></div>
                <div class="row"><span class="row-label">Telefone:</span><span class="row-value"><a href="tel:${data.contactPhone}" style="color:#0066cc;">${data.contactPhone}</a></span></div>
                ${data.contactWhatsapp ? `<div class="row"><span class="row-label">WhatsApp:</span><span class="row-value"><a href="https://wa.me/${data.contactWhatsapp.replace(/\D/g, "")}" style="color:#0066cc;">${data.contactWhatsapp}</a></span></div>` : ""}
              </div>
              <div class="section">
                <div class="section-title">📊 Dados do Projeto</div>
                <div class="row"><span class="row-label">Total de Alunos:</span><span class="row-value">${data.totalStudents}</span></div>
                <div class="row"><span class="row-label">Total de Salas:</span><span class="row-value">${data.totalRooms}</span></div>
                <div class="row"><span class="row-label">Câmeras Existentes:</span><span class="row-value">${data.existingCameras}</span></div>
                <div class="row"><span class="row-label">Orçamento:</span><span class="row-value">${budgetLabels[data.budget] || data.budget}</span></div>
                <div class="row"><span class="row-label">Prazo:</span><span class="row-value">${timelineLabels[data.timeline] || data.timeline}</span></div>
              </div>
              ${data.message ? `<div class="highlight"><strong>Mensagem:</strong><br>${data.message}</div>` : ""}
              <div class="cta">
                <a href="mailto:${data.contactEmail}?subject=Re: Orçamento Áquila Pro #${quoteId}">Responder ao Cliente</a>
              </div>
            </div>
            <div class="footer">
              <p>Áquila Pro — Sistema de Segurança e Engajamento Escolar</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: OWNER_EMAIL,
    subject: `[Áquila Pro] Orçamento #${quoteId} — ${data.schoolName} (${data.city}/${data.state})`,
    htmlContent,
    replyTo: data.contactEmail,
    textContent: `Nova solicitação de orçamento #${quoteId}\n\nEscola: ${data.schoolName}\nTipo: ${schoolTypeLabels[data.schoolType] || data.schoolType}\nLocalização: ${data.city}/${data.state}\n\nContato: ${data.contactName} (${data.contactRole})\nEmail: ${data.contactEmail}\nTelefone: ${data.contactPhone}\n${data.contactWhatsapp ? `WhatsApp: ${data.contactWhatsapp}\n` : ""}\nAlunos: ${data.totalStudents}\nSalas: ${data.totalRooms}\nOrçamento: ${budgetLabels[data.budget] || data.budget}\nPrazo: ${timelineLabels[data.timeline] || data.timeline}\n${data.message ? `\nMensagem: ${data.message}` : ""}`,
  });
}

/**
 * Envia confirmação de orçamento para o cliente
 */
export async function sendQuoteConfirmationEmail(
  email: string,
  name: string,
  quoteId: number,
  schoolName: string
): Promise<SendGridResponse> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .wrapper { padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 24px; }
          .header h1 { margin: 0; font-size: 22px; }
          .content { padding: 24px; }
          .quote-box { background: #e8f4ff; border-left: 4px solid #0066cc; padding: 16px; border-radius: 4px; margin: 16px 0; }
          .quote-box strong { font-size: 22px; color: #0066cc; }
          .steps { margin: 20px 0; }
          .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
          .step-num { background: #0066cc; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-right: 12px; margin-top: 2px; }
          .footer { background: #f8f9fa; padding: 16px 24px; text-align: center; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>✅ Solicitação de Orçamento Recebida!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Recebemos a solicitação de orçamento para <strong>${schoolName}</strong>. Nossa equipe comercial analisará sua proposta e entrará em contato em até <strong>24 horas úteis</strong>.</p>
              <div class="quote-box">
                <p style="margin:0 0 4px;font-size:13px;color:#555;">Número do Orçamento</p>
                <strong>#${quoteId}</strong>
                <p style="margin:6px 0 0;font-size:13px;color:#666;">Guarde este número para referência.</p>
              </div>
              <p><strong>Próximos passos:</strong></p>
              <div class="steps">
                <div class="step"><div class="step-num">1</div><div>Nossa equipe analisará as necessidades da sua escola</div></div>
                <div class="step"><div class="step-num">2</div><div>Entraremos em contato para agendar uma demonstração</div></div>
                <div class="step"><div class="step-num">3</div><div>Apresentaremos uma proposta personalizada</div></div>
              </div>
              <p>Para contato imediato:</p>
              <ul>
                <li>WhatsApp: <a href="https://wa.me/5561999623099" style="color:#0066cc;">+55 (61) 99962-3099</a></li>
                <li>Email: <a href="mailto:andrejrunb@yahoo.com.br" style="color:#0066cc;">andrejrunb@yahoo.com.br</a></li>
              </ul>
              <p>Atenciosamente,<br><strong>Equipe Comercial Áquila Pro</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Áquila Pro. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Orçamento #${quoteId} recebido — Áquila Pro`,
    htmlContent,
    replyTo: OWNER_EMAIL,
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
      <head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#cc0000;color:white;padding:20px;border-radius:5px;">
            <h1 style="margin:0;">🚨 ALERTA DE SEGURANÇA</h1>
          </div>
          <div style="padding:20px;background:#f9f9f9;">
            <p>Um evento de segurança foi detectado.</p>
            <p><strong>Aluno:</strong> ${studentName}</p>
            <p><strong>Tipo:</strong> ${alertType}</p>
            <p><strong>Local:</strong> ${location}</p>
            <p><strong>Hora:</strong> ${timestamp}</p>
            <p><strong>Câmera:</strong> ${cameraId}</p>
            <p>Verifique imediatamente no painel de controle.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🚨 ALERTA: ${alertType} — ${studentName}`,
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
      <head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#00aa00;color:white;padding:20px;border-radius:5px;">
            <h1 style="margin:0;">Sua solicitação foi respondida!</h1>
          </div>
          <div style="padding:20px;background:#f9f9f9;">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Respondemos à sua solicitação (Ticket #${ticketId}).</p>
            <div style="background:#e8f8e8;padding:15px;border-left:4px solid #00aa00;margin:10px 0;">
              <p><strong>Resposta:</strong></p>
              <p>${response}</p>
            </div>
            <p><strong>Respondido por:</strong> ${respondedBy}</p>
            <p>Atenciosamente,<br><strong>Equipe Áquila Pro</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Resposta: Sua solicitação (Ticket #${ticketId})`,
    htmlContent,
    replyTo: OWNER_EMAIL,
  });
}
