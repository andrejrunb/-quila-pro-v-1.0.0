import { eq, desc } from "drizzle-orm";
import { contactSubmissions, InsertContactSubmission, ContactSubmission } from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * Criar uma nova submissão de contato
 */
export async function createContactSubmission(
  data: InsertContactSubmission
): Promise<ContactSubmission | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(contactSubmissions).values(data);
    const id = (result as any).insertId;

    if (!id) return null;

    const created = await db
      .select()
      .from(contactSubmissions)
      .where(eq(contactSubmissions.id, id))
      .limit(1);

    return created[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao criar submissão de contato:", error);
    return null;
  }
}

/**
 * Obter todas as submissões de contato
 */
export async function getAllContactSubmissions(): Promise<ContactSubmission[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao obter submissões de contato:", error);
    return [];
  }
}

/**
 * Obter submissões de contato por status
 */
export async function getContactSubmissionsByStatus(
  status: "new" | "read" | "responded" | "archived"
): Promise<ContactSubmission[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(contactSubmissions)
      .where(eq(contactSubmissions.status, status))
      .orderBy(desc(contactSubmissions.createdAt));
  } catch (error) {
    console.error("[Database] Erro ao obter submissões por status:", error);
    return [];
  }
}

/**
 * Obter uma submissão de contato por ID
 */
export async function getContactSubmissionById(
  id: number
): Promise<ContactSubmission | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(contactSubmissions)
      .where(eq(contactSubmissions.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Erro ao obter submissão de contato:", error);
    return null;
  }
}

/**
 * Atualizar status de uma submissão de contato
 */
export async function updateContactSubmissionStatus(
  id: number,
  status: "new" | "read" | "responded" | "archived"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(contactSubmissions)
      .set({ status })
      .where(eq(contactSubmissions.id, id));

    return true;
  } catch (error) {
    console.error("[Database] Erro ao atualizar status de contato:", error);
    return false;
  }
}

/**
 * Adicionar resposta a uma submissão de contato
 */
export async function respondToContactSubmission(
  id: number,
  responseMessage: string,
  respondedBy: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(contactSubmissions)
      .set({
        responseMessage,
        respondedBy,
        status: "responded",
        respondedAt: new Date(),
      })
      .where(eq(contactSubmissions.id, id));

    return true;
  } catch (error) {
    console.error("[Database] Erro ao responder contato:", error);
    return false;
  }
}

/**
 * Deletar uma submissão de contato
 */
export async function deleteContactSubmission(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .delete(contactSubmissions)
      .where(eq(contactSubmissions.id, id));

    return true;
  } catch (error) {
    console.error("[Database] Erro ao deletar submissão de contato:", error);
    return false;
  }
}

export default {
  createContactSubmission,
  getAllContactSubmissions,
  getContactSubmissionsByStatus,
  getContactSubmissionById,
  updateContactSubmissionStatus,
  respondToContactSubmission,
  deleteContactSubmission,
};
