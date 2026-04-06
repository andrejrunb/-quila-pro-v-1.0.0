import {
  sendContactConfirmationEmail,
  sendContactResponseEmail,
  sendOwnerContactNotification,
} from "./sendgrid";
import { notifyNewContactToChannel, notifyContactResponded } from "./slack";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { contactSubmissions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Workflow completo quando um novo contato é recebido.
 * Canal principal: notificação Manus (sempre funciona).
 * Canal secundário: SendGrid (requer Sender Identity verificado).
 * Canal terciário: Slack (requer webhook configurado).
 */
export async function handleNewContactWorkflow(
  contactId: number,
  name: string,
  email: string,
  subject: string,
  schoolName: string,
  message?: string,
  phone?: string
) {
  console.log(`[Workflow] Iniciando workflow para novo contato #${contactId}`);

  // 1. Notificação Manus (canal principal — sempre funciona)
  try {
    await notifyOwner({
      title: `📬 Novo Contato #${contactId} — ${name}`,
      content: [
        `**Nome:** ${name}`,
        `**Email:** ${email}`,
        phone ? `**Telefone:** ${phone}` : "",
        schoolName && schoolName !== "Não informada" ? `**Escola:** ${schoolName}` : "",
        `**Assunto:** ${subject}`,
        message ? `\n**Mensagem:**\n${message}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    console.log(`[Workflow] Notificação Manus enviada para contato #${contactId}`);
  } catch (err) {
    console.error(`[Workflow] Erro na notificação Manus:`, err);
  }

  // 2. Email via SendGrid para o proprietário (requer Sender Identity verificado)
  try {
    const ownerEmailResult = await sendOwnerContactNotification(
      contactId,
      name,
      email,
      phone,
      schoolName !== "Não informada" ? schoolName : undefined,
      subject,
      message || "(sem mensagem)"
    );
    if (ownerEmailResult.success) {
      console.log(`[Workflow] Email de notificação enviado ao proprietário — messageId: ${ownerEmailResult.messageId}`);
    } else {
      console.warn(`[Workflow] SendGrid não enviou email ao proprietário: ${ownerEmailResult.error}`);
      console.warn(`[Workflow] Para ativar emails, verifique o Sender Identity em: https://app.sendgrid.com/settings/sender_auth`);
    }
  } catch (err) {
    console.error(`[Workflow] Erro ao enviar email ao proprietário:`, err);
  }

  // 3. Email de confirmação para o remetente
  try {
    const confirmResult = await sendContactConfirmationEmail(email, name, contactId, subject);
    if (confirmResult.success) {
      console.log(`[Workflow] Email de confirmação enviado para ${email}`);
    } else {
      console.warn(`[Workflow] SendGrid não enviou confirmação para ${email}: ${confirmResult.error}`);
    }
  } catch (err) {
    console.error(`[Workflow] Erro ao enviar confirmação:`, err);
  }

  // 4. Notificação no Slack (opcional)
  try {
    const slackResult = await notifyNewContactToChannel(name, email, subject, schoolName, contactId);
    if (slackResult.success) {
      console.log(`[Workflow] Notificação Slack enviada`);
    } else {
      console.warn(`[Workflow] Slack não notificado: ${slackResult.error}`);
    }
  } catch (err) {
    console.error(`[Workflow] Erro no Slack:`, err);
  }

  console.log(`[Workflow] Workflow concluído para contato #${contactId}`);
  return { success: true };
}

/**
 * Workflow quando um contato é respondido
 */
export async function handleContactResponseWorkflow(
  contactId: number,
  name: string,
  email: string,
  response: string,
  respondedBy: string
) {
  console.log(`[Workflow] Iniciando workflow de resposta para contato #${contactId}`);

  // 1. Email de resposta via SendGrid
  try {
    const emailResult = await sendContactResponseEmail(email, name, contactId, response, respondedBy);
    if (emailResult.success) {
      console.log(`[Workflow] Email de resposta enviado para ${email}`);
    } else {
      console.warn(`[Workflow] SendGrid não enviou resposta: ${emailResult.error}`);
    }
  } catch (err) {
    console.error(`[Workflow] Erro ao enviar email de resposta:`, err);
  }

  // 2. Notificação no Slack
  try {
    const slackResult = await notifyContactResponded(name, email, contactId, respondedBy);
    if (slackResult.success) {
      console.log(`[Workflow] Notificação Slack de resposta enviada`);
    } else {
      console.warn(`[Workflow] Slack não notificado: ${slackResult.error}`);
    }
  } catch (err) {
    console.error(`[Workflow] Erro no Slack:`, err);
  }

  console.log(`[Workflow] Workflow de resposta concluído para contato #${contactId}`);
  return { success: true };
}
