import { sendContactConfirmationEmail, sendContactResponseEmail } from "./sendgrid";
import { exportContactsToGoogleSheets } from "./google-sheets";
import { notifyNewContactToChannel, notifyContactResponded } from "./slack";
import { getDb } from "../db";
import { contactSubmissions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Workflow completo quando um novo contato é recebido
 */
export async function handleNewContactWorkflow(
  contactId: number,
  name: string,
  email: string,
  subject: string,
  schoolName: string
) {
  try {
    console.log(`[Workflow] Iniciando workflow para novo contato #${contactId}`);

    // 1. Enviar email de confirmação
    console.log(`[Workflow] Enviando email de confirmação para ${email}`);
    const emailResult = await sendContactConfirmationEmail(
      email,
      name,
      contactId,
      subject
    );
    if (!emailResult.success) {
      console.error(`[Workflow] Erro ao enviar email:`, emailResult.error);
    } else {
      console.log(`[Workflow] Email enviado com sucesso`);
    }

    // 2. Notificar no Slack
    console.log(`[Workflow] Notificando no Slack`);
    const slackResult = await notifyNewContactToChannel(
      name,
      email,
      subject,
      schoolName,
      contactId
    );
    if (!slackResult.success) {
      console.error(`[Workflow] Erro ao notificar Slack:`, slackResult.error);
    } else {
      console.log(`[Workflow] Notificação Slack enviada`);
    }

    // 3. Exportar para Google Sheets
    console.log(`[Workflow] Exportando para Google Sheets`);
    const db = await getDb();
    if (db) {
      const contactData = await db
        .select()
        .from(contactSubmissions)
        .where(eq(contactSubmissions.id, contactId))
        .limit(1);

      if (contactData.length > 0) {
        const contact = contactData[0];
        const sheetsResult = await exportContactsToGoogleSheets([
          {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone || undefined,
            schoolName: contact.schoolName || undefined,
            subject: contact.subject,
            status: contact.status,
            createdAt: contact.createdAt,
          },
        ]);
        if (!sheetsResult.success) {
          console.error(
            `[Workflow] Erro ao exportar para Google Sheets:`,
            sheetsResult.error
          );
        } else {
          console.log(`[Workflow] Exportado para Google Sheets`);
        }
      }
    }

    console.log(`[Workflow] Workflow concluído para contato #${contactId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Workflow] Erro no workflow:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
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
  try {
    console.log(`[Workflow] Iniciando workflow de resposta para contato #${contactId}`);

    // 1. Enviar email de resposta
    console.log(`[Workflow] Enviando email de resposta para ${email}`);
    const emailResult = await sendContactResponseEmail(
      email,
      name,
      contactId,
      response,
      respondedBy
    );
    if (!emailResult.success) {
      console.error(`[Workflow] Erro ao enviar email:`, emailResult.error);
    } else {
      console.log(`[Workflow] Email de resposta enviado`);
    }

    // 2. Notificar no Slack
    console.log(`[Workflow] Notificando resposta no Slack`);
    const slackResult = await notifyContactResponded(
      name,
      email,
      contactId,
      respondedBy
    );
    if (!slackResult.success) {
      console.error(`[Workflow] Erro ao notificar Slack:`, slackResult.error);
    } else {
      console.log(`[Workflow] Notificação Slack enviada`);
    }

    console.log(`[Workflow] Workflow de resposta concluído para contato #${contactId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Workflow] Erro no workflow de resposta:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Exporta todos os contatos para Google Sheets (batch)
 */
export async function exportAllContactsToGoogleSheets() {
  try {
    console.log(`[Workflow] Exportando todos os contatos para Google Sheets`);

    const db = await getDb();
    if (!db) {
      throw new Error("Banco de dados não disponível");
    }

    const contacts = await db.select().from(contactSubmissions);

    if (contacts.length === 0) {
      console.log(`[Workflow] Nenhum contato para exportar`);
      return { success: true, exported: 0 };
    }

    const result = await exportContactsToGoogleSheets(
      contacts.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || undefined,
        schoolName: c.schoolName || undefined,
        subject: c.subject,
        status: c.status,
        createdAt: c.createdAt,
      }))
    );

    if (!result.success) {
      throw new Error(result.error || "Erro ao exportar");
    }

    console.log(`[Workflow] ${contacts.length} contatos exportados`);
    return { success: true, exported: contacts.length };
  } catch (error) {
    console.error(`[Workflow] Erro ao exportar contatos:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
