import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "+5561999623099";
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+5561999623099";

if (!accountSid || !authToken) {
  console.warn("Twilio credentials not configured. SMS/WhatsApp features will be disabled.");
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Enviar SMS para um número de telefone
 * @param toNumber Número de telefone do destinatário (formato: +5561999623099)
 * @param message Mensagem a enviar
 * @returns SID da mensagem
 */
export async function sendSMS(toNumber: string, message: string): Promise<string> {
  if (!client) {
    throw new Error("Twilio não está configurado");
  }

  try {
    const msg = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: toNumber,
    });

    console.log(`SMS enviado com sucesso. SID: ${msg.sid}`);
    return msg.sid;
  } catch (error) {
    console.error("Erro ao enviar SMS:", error);
    throw new Error("Falha ao enviar SMS");
  }
}

/**
 * Enviar mensagem via WhatsApp
 * @param toNumber Número de WhatsApp do destinatário (formato: whatsapp:+5561999623099)
 * @param message Mensagem a enviar
 * @returns SID da mensagem
 */
export async function sendWhatsApp(toNumber: string, message: string): Promise<string> {
  if (!client) {
    throw new Error("Twilio não está configurado");
  }

  try {
    const msg = await client.messages.create({
      body: message,
      from: twilioWhatsAppNumber,
      to: `whatsapp:${toNumber.replace("whatsapp:", "")}`,
    });

    console.log(`WhatsApp enviado com sucesso. SID: ${msg.sid}`);
    return msg.sid;
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    throw new Error("Falha ao enviar WhatsApp");
  }
}

/**
 * Enviar alerta de segurança via SMS
 * @param parentPhone Telefone do responsável
 * @param studentName Nome do aluno
 * @param alertType Tipo de alerta (saída não autorizada, atraso, etc)
 * @returns SID da mensagem
 */
export async function sendSecurityAlert(
  parentPhone: string,
  studentName: string,
  alertType: string
): Promise<string> {
  const alertMessages: Record<string, string> = {
    unauthorized_exit: `⚠️ ALERTA: ${studentName} saiu da escola sem autorização às {time}. Contate a escola imediatamente.`,
    late_arrival: `ℹ️ Seu filho ${studentName} chegou atrasado na escola hoje.`,
    absence: `⚠️ ${studentName} não foi marcado presente na escola hoje.`,
    health_incident: `🚨 ALERTA: Incidente de saúde com ${studentName}. A escola está tomando as medidas necessárias.`,
  };

  const message = alertMessages[alertType] || `Alerta de segurança: ${alertType}`;
  const finalMessage = message.replace("{time}", new Date().toLocaleTimeString("pt-BR"));

  return sendSMS(parentPhone, finalMessage);
}

/**
 * Enviar notificação de presença via WhatsApp
 * @param parentWhatsApp WhatsApp do responsável
 * @param studentName Nome do aluno
 * @param arrivalTime Hora de chegada
 * @returns SID da mensagem
 */
export async function sendAttendanceNotification(
  parentWhatsApp: string,
  studentName: string,
  arrivalTime: string
): Promise<string> {
  const message = `✅ Presença confirmada: ${studentName} chegou na escola às ${arrivalTime}. Tenha um ótimo dia!`;

  return sendWhatsApp(parentWhatsApp, message);
}

/**
 * Enviar relatório diário de presença via WhatsApp
 * @param parentWhatsApp WhatsApp do responsável
 * @param studentName Nome do aluno
 * @param attendanceData Dados de presença
 * @returns SID da mensagem
 */
export async function sendDailyReport(
  parentWhatsApp: string,
  studentName: string,
  attendanceData: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  }
): Promise<string> {
  const message = `📊 Relatório de Presença - ${studentName}
  
Presente: ${attendanceData.presentDays} dias
Ausente: ${attendanceData.absentDays} dias
Atrasado: ${attendanceData.lateDays} dias
Taxa: ${(attendanceData.attendanceRate * 100).toFixed(1)}%

Acesse o portal para mais detalhes.`;

  return sendWhatsApp(parentWhatsApp, message);
}

/**
 * Enviar confirmação de cadastro via SMS
 * @param phoneNumber Número de telefone
 * @param verificationCode Código de verificação
 * @returns SID da mensagem
 */
export async function sendVerificationCode(phoneNumber: string, verificationCode: string): Promise<string> {
  const message = `Seu código de verificação Áquila Pro é: ${verificationCode}. Válido por 10 minutos.`;

  return sendSMS(phoneNumber, message);
}

/**
 * Enviar notificação de suporte via SMS
 * @param phoneNumber Número de telefone
 * @param subject Assunto
 * @param message Mensagem
 * @returns SID da mensagem
 */
export async function sendSupportNotification(
  phoneNumber: string,
  subject: string,
  message: string
): Promise<string> {
  const fullMessage = `🔔 ${subject}\n\n${message}`;

  return sendSMS(phoneNumber, fullMessage);
}

/**
 * Obter status de uma mensagem
 * @param messageSid SID da mensagem
 * @returns Status da mensagem
 */
export async function getMessageStatus(messageSid: string): Promise<string> {
  if (!client) {
    throw new Error("Twilio não está configurado");
  }

  try {
    const message = await client.messages(messageSid).fetch();
    return message.status; // delivered, failed, sent, queued, etc
  } catch (error) {
    console.error("Erro ao obter status da mensagem:", error);
    throw new Error("Falha ao obter status da mensagem");
  }
}
