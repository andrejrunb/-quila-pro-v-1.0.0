
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "+55119999999999";
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+55119999999999";

if (!accountSid || !authToken) {
  console.warn("Twilio credentials not configured. SMS/WhatsApp features will be disabled.");
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Enviar SMS para um número de telefone
 * @param toNumber Número de telefone do destinatário (formato: +55119999999999)
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
 * @param toNumber Número de WhatsApp do destinatário (formato: whatsapp:+55119999999999)
 * @param message Mensagem a enviar
 * @returns SID da mensagem
 */
export async function sendWhatsApp(toNumber: string, message: string): Promise<string> {
  if (!client) {
    throw new Error("Twilio não está configurado");
  }
