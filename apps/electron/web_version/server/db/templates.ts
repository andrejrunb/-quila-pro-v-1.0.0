import { getDb } from "../db";
import {
  smsTemplates,
  whatsappTemplates,
  messageLogs,
  type SmsTemplate,
  type WhatsappTemplate,
  type MessageLog,
  type InsertSmsTemplate,
  type InsertWhatsappTemplate,
  type InsertMessageLog,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const getDatabase = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
};

/**
 * SMS Templates
 */

export async function createSmsTemplate(
  data: InsertSmsTemplate
): Promise<SmsTemplate> {
  const db = await getDatabase();
  await db.insert(smsTemplates).values(data);
  const templates = await getAllSmsTemplates();
  return templates[templates.length - 1] as SmsTemplate;
}

export async function getSmsTemplateById(id: number): Promise<SmsTemplate | null> {
  const db = await getDatabase();
  const result = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
  return result[0] || null;
}

export async function getAllSmsTemplates(): Promise<SmsTemplate[]> {
  const db = await getDatabase();
  return db.select().from(smsTemplates).orderBy(smsTemplates.createdAt);
}

export async function getSmsTemplatesByType(alertType: string): Promise<SmsTemplate[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(smsTemplates)
    .where(and(eq(smsTemplates.alertType, alertType as any), eq(smsTemplates.isActive, 1)));
}

export async function updateSmsTemplate(
  id: number,
  data: Partial<InsertSmsTemplate>
): Promise<SmsTemplate | null> {
  const db = await getDatabase();
  await db.update(smsTemplates).set(data).where(eq(smsTemplates.id, id));
  return getSmsTemplateById(id);
}

export async function deleteSmsTemplate(id: number): Promise<boolean> {
  const db = await getDatabase();
  await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
  return true;
}

export async function toggleSmsTemplateStatus(id: number): Promise<SmsTemplate | null> {
  const template = await getSmsTemplateById(id);
  if (!template) return null;

  const newStatus = template.isActive === 1 ? 0 : 1;
  return updateSmsTemplate(id, { isActive: newStatus });
}

/**
 * WhatsApp Templates
 */

export async function createWhatsappTemplate(
  data: InsertWhatsappTemplate
): Promise<WhatsappTemplate> {
  const db = await getDatabase();
  await db.insert(whatsappTemplates).values(data);
  const templates = await getAllWhatsappTemplates();
  return templates[templates.length - 1] as WhatsappTemplate;
}

export async function getWhatsappTemplateById(id: number): Promise<WhatsappTemplate | null> {
  const db = await getDatabase();
  const result = await db
    .select()
    .from(whatsappTemplates)
    .where(eq(whatsappTemplates.id, id));
  return result[0] || null;
}

export async function getAllWhatsappTemplates(): Promise<WhatsappTemplate[]> {
  const db = await getDatabase();
  return db.select().from(whatsappTemplates).orderBy(whatsappTemplates.createdAt);
}

export async function getWhatsappTemplatesByType(
  notificationType: string
): Promise<WhatsappTemplate[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(whatsappTemplates)
    .where(
      and(
        eq(whatsappTemplates.notificationType, notificationType as any),
        eq(whatsappTemplates.isActive, 1)
      )
    );
}

export async function updateWhatsappTemplate(
  id: number,
  data: Partial<InsertWhatsappTemplate>
): Promise<WhatsappTemplate | null> {
  const db = await getDatabase();
  await db.update(whatsappTemplates).set(data).where(eq(whatsappTemplates.id, id));
  return getWhatsappTemplateById(id);
}

export async function deleteWhatsappTemplate(id: number): Promise<boolean> {
  const db = await getDatabase();
  await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id));
  return true;
}

export async function toggleWhatsappTemplateStatus(id: number): Promise<WhatsappTemplate | null> {
  const template = await getWhatsappTemplateById(id);
  if (!template) return null;

  const newStatus = template.isActive === 1 ? 0 : 1;
  return updateWhatsappTemplate(id, { isActive: newStatus });
}

/**
 * Message Logs
 */

export async function createMessageLog(data: InsertMessageLog): Promise<MessageLog> {
  const db = await getDatabase();
  await db.insert(messageLogs).values(data);
  const logs = await getRecentMessageLogs(1);
  return logs[0] as MessageLog;
}

export async function getMessageLogById(id: number): Promise<MessageLog | null> {
  const db = await getDatabase();
  const result = await db.select().from(messageLogs).where(eq(messageLogs.id, id));
  return result[0] || null;
}

export async function getMessageLogsByTemplate(templateId: number): Promise<MessageLog[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(messageLogs)
    .where(eq(messageLogs.templateId, templateId))
    .orderBy(messageLogs.sentAt);
}

export async function getMessageLogsByStatus(status: string): Promise<MessageLog[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(messageLogs)
    .where(eq(messageLogs.status, status as any))
    .orderBy(messageLogs.sentAt);
}

export async function updateMessageLogStatus(
  id: number,
  status: "pending" | "sent" | "delivered" | "failed",
  deliveredAt?: Date
): Promise<MessageLog | null> {
  const db = await getDatabase();
  const updateData: any = { status };
  if (deliveredAt) {
    updateData.deliveredAt = deliveredAt;
  }

  await db.update(messageLogs).set(updateData).where(eq(messageLogs.id, id));
  return getMessageLogById(id);
}

export async function getRecentMessageLogs(limit: number = 50): Promise<MessageLog[]> {
  const db = await getDatabase();
  return db
    .select()
    .from(messageLogs)
    .orderBy(messageLogs.sentAt)
    .limit(limit);
}

export async function getMessageLogStats(): Promise<{
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}> {
  const db = await getDatabase();
  const logs = await db.select().from(messageLogs);

  return {
    total: logs.length,
    sent: logs.filter((l: MessageLog) => l.status === "sent").length,
    delivered: logs.filter((l: MessageLog) => l.status === "delivered").length,
    failed: logs.filter((l: MessageLog) => l.status === "failed").length,
    pending: logs.filter((l: MessageLog) => l.status === "pending").length,
  };
}
