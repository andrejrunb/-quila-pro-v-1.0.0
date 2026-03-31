import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  parents,
  parentStudentLinks,
  parentSessions,
  parentNotifications,
  students,
  events,
  studentMetrics,
  absences,
  lateArrivals,
  classes,
} from "../../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { sendEmail } from "../integrations/sendgrid";

// ============================================================================
// HELPERS
// ============================================================================

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === verify;
}

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function generateSessionToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

// Middleware para autenticação de pais via header
async function getParentFromToken(token: string | undefined) {
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;

  const sessions = await db
    .select()
    .from(parentSessions)
    .where(
      and(
        eq(parentSessions.token, token),
        gte(parentSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (sessions.length === 0) return null;

  const parentRows = await db
    .select()
    .from(parents)
    .where(eq(parents.id, sessions[0].parentId))
    .limit(1);

  return parentRows.length > 0 ? parentRows[0] : null;
}

// ============================================================================
// ROUTER
// ============================================================================

export const parentPortalRouter = router({
  // ---- CADASTRO ----
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
        email: z.string().email("Email inválido"),
        phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
        cpf: z.string().optional(),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string(),
        relationship: z.enum(["father", "mother", "guardian", "grandparent", "other"]).default("guardian"),
        schoolId: z.number().int().positive(),
        studentCode: z.string().optional(), // Código de matrícula do aluno para vincular
      })
    )
    .mutation(async ({ input }) => {
      if (input.password !== input.confirmPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "As senhas não coincidem" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      // Verificar se email já existe
      const existing = await db
        .select()
        .from(parents)
        .where(eq(parents.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Este email já está cadastrado" });
      }

      const passwordHash = hashPassword(input.password);
      const verificationToken = generateToken();

      // Criar parent
      const result = await db.insert(parents).values({
        schoolId: input.schoolId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        cpf: input.cpf || null,
        passwordHash,
        relationship: input.relationship,
        verificationToken,
      });

      const parentId = Number(result[0].insertId);

      // Se forneceu código de matrícula, vincular ao aluno
      if (input.studentCode) {
        const studentRows = await db
          .select()
          .from(students)
          .where(
            and(
              eq(students.schoolId, input.schoolId),
              eq(students.studentId, input.studentCode)
            )
          )
          .limit(1);

        if (studentRows.length > 0) {
          await db.insert(parentStudentLinks).values({
            parentId,
            studentId: studentRows[0].id,
            relationship: input.relationship,
            isPrimary: 1,
            canReceiveAlerts: 1,
            canViewReports: 1,
          });
        }
      }

      return {
        success: true,
        message: "Cadastro realizado com sucesso! Verifique seu email para ativar a conta.",
        parentId,
      };
    }),

  // ---- LOGIN ----
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const parentRows = await db
        .select()
        .from(parents)
        .where(eq(parents.email, input.email))
        .limit(1);

      if (parentRows.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
      }

      const parent = parentRows[0];

      if (!parent.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada. Entre em contato com a escola." });
      }

      if (!verifyPassword(input.password, parent.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
      }

      // Criar sessão
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      await db.insert(parentSessions).values({
        parentId: parent.id,
        token,
        ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress || "unknown",
        userAgent: ctx.req.headers["user-agent"] || "unknown",
        expiresAt,
      });

      // Atualizar último login
      await db
        .update(parents)
        .set({ lastLoginAt: new Date() })
        .where(eq(parents.id, parent.id));

      return {
        success: true,
        token,
        parent: {
          id: parent.id,
          name: parent.name,
          email: parent.email,
          phone: parent.phone,
          relationship: parent.relationship,
        },
        expiresAt,
      };
    }),

  // ---- LOGOUT ----
  logout: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true };

      await db
        .delete(parentSessions)
        .where(eq(parentSessions.token, input.token));

      return { success: true };
    }),

  // ---- ME (dados do pai autenticado) ----
  me: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const parent = await getParentFromToken(input.token);
      if (!parent) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada. Faça login novamente." });
      }

      return {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        relationship: parent.relationship,
        schoolId: parent.schoolId,
      };
    }),

  // ---- LISTAR FILHOS VINCULADOS ----
  myStudents: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const parent = await getParentFromToken(input.token);
      if (!parent) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada" });

      const db = await getDb();
      if (!db) return [];

      const links = await db
        .select({
          linkId: parentStudentLinks.id,
          studentId: students.id,
          studentName: students.name,
          studentCode: students.studentId,
          className: classes.name,
          grade: classes.grade,
          relationship: parentStudentLinks.relationship,
          isPrimary: parentStudentLinks.isPrimary,
          canReceiveAlerts: parentStudentLinks.canReceiveAlerts,
          canViewReports: parentStudentLinks.canViewReports,
        })
        .from(parentStudentLinks)
        .innerJoin(students, eq(parentStudentLinks.studentId, students.id))
        .innerJoin(classes, eq(students.classId, classes.id))
        .where(eq(parentStudentLinks.parentId, parent.id));

      return links;
    }),

  // ---- PRESENÇA DO ALUNO HOJE ----
  studentAttendanceToday: publicProcedure
    .input(z.object({ token: z.string(), studentId: z.number() }))
    .query(async ({ input }) => {
      const parent = await getParentFromToken(input.token);
      if (!parent) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada" });

      const db = await getDb();
      if (!db) return null;

      // Verificar se é filho vinculado
      const link = await db
        .select()
        .from(parentStudentLinks)
        .where(
          and(
            eq(parentStudentLinks.parentId, parent.id),
            eq(parentStudentLinks.studentId, input.studentId)
          )
        )
        .limit(1);

      if (link.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem acesso a este aluno" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayEvents = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.studentId, input.studentId),
            gte(events.createdAt, today)
          )
        )
        .orderBy(desc(events.createdAt));

      return {
        studentId: input.studentId,
        date: today.toISOString().split("T")[0],
        events: todayEvents.map((e) => ({
          id: e.id,
          type: e.eventType,
          duration: e.duration,
          metadata: e.metadata,
          createdAt: e.createdAt,
        })),
        isPresent: todayEvents.some((e) => e.eventType === "arrival" || e.eventType === "presence"),
        isLate: todayEvents.some((e) => e.eventType === "late_arrival"),
        isAbsent: todayEvents.length === 0 || todayEvents.some((e) => e.eventType === "absence"),
      };
    }),

  // ---- HISTÓRICO DE PRESENÇA ----
  studentAttendanceHistory: publicProcedure
    .input(
      z.object({
        token: z.string(),
        studentId: z.number(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const parent = await getParentFromToken(input.token);
      if (!parent) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada" });

      const db = await getDb();
      if (!db) return { absences: [], lateArrivals: [], metrics: null };

      // Verificar vínculo
      const link = await db
        .select()
        .from(parentStudentLinks)
        .where(
          and(
            eq(parentStudentLinks.parentId, parent.id),
            eq(parentStudentLinks.studentId, input.studentId)
          )
        )
        .limit(1);

      if (link.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const absenceRows = await db
        .select()
        .from(absences)
        .where(eq(absences.studentId, input.studentId))
        .orderBy(desc(absences.createdAt))
        .limit(100);

      const lateRows = await db
        .select()
        .from(lateArrivals)
        .where(eq(lateArrivals.studentId, input.studentId))
        .orderBy(desc(lateArrivals.createdAt))
        .limit(100);

      const metricsRows = await db
        .select()
        .from(studentMetrics)
        .where(eq(studentMetrics.studentId, input.studentId))
        .orderBy(desc(studentMetrics.lastUpdated))
        .limit(1);

      return {
        absences: absenceRows,
        lateArrivals: lateRows,
        metrics: metricsRows.length > 0 ? metricsRows[0] : null,
      };
    }),

  // ---- NOTIFICAÇÕES ----
  myNotifications: publicProcedure
    .input(
      z.object({
        token: z.string(),
        limit: z.number().default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const parent = await getParentFromToken(input.token);
      if (!parent) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada" });

      const db = await getDb();
      if (!db) return [];

      let query = db
        .select()
        .from(parentNotifications)
        .where(
          input.unreadOnly
            ? and(
                eq(parentNotifications.parentId, parent.id),
                eq(parentNotifications.isRead, 0)
              )
            : eq(parentNotifications.parentId, parent.id)
        )
        .orderBy(desc(parentNotifications.createdAt))
        .limit(input.limit);

      return query;
    }),

  // ---- MARCAR NOTIFICAÇÃO COMO LIDA ----
  markNotificationRead: publicProcedure
    .input(z.object({ token: z.string(), notificationId: z.number() }))
    .mutation(async ({ input }) => {
      const parent = await getParentFromToken(input.token);
      if (!parent) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada" });

      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(parentNotifications)
        .set({ isRead: 1, readAt: new Date() })
        .where(
          and(
            eq(parentNotifications.id, input.notificationId),
            eq(parentNotifications.parentId, parent.id)
          )
        );

      return { success: true };
    }),

  // ---- RECUPERAÇÃO DE SENHA ----
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: true, message: "Se o email existir, você receberá um link de recuperação." };

      const parentRows = await db
        .select()
        .from(parents)
        .where(eq(parents.email, input.email))
        .limit(1);

      if (parentRows.length > 0) {
        const resetToken = generateToken();
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await db
          .update(parents)
          .set({
            resetPasswordToken: resetToken,
            resetPasswordExpires: expires,
          })
          .where(eq(parents.id, parentRows[0].id));

        // Enviar email com link de recuperação
        const resetUrl = `${ctx.req.headers.origin || 'https://aquila-pro.manus.space'}/portal-pais/reset-senha?token=${resetToken}`;
        try {
          await sendEmail({
            to: input.email,
            subject: 'Recuperação de Senha - Portal dos Pais | Áquila Pro',
            htmlContent: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
                    .btn { display: inline-block; background-color: #0066cc; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                    .warning { background-color: #fff3cd; padding: 12px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 4px; }
                    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>Recuperação de Senha</h1>
                      <p>Portal dos Pais - Áquila Pro</p>
                    </div>
                    <div class="content">
                      <p>Olá <strong>${parentRows[0].name}</strong>,</p>
                      <p>Recebemos uma solicitação para redefinir a senha da sua conta no Portal dos Pais.</p>
                      <p style="text-align: center;">
                        <a href="${resetUrl}" class="btn">Redefinir Minha Senha</a>
                      </p>
                      <div class="warning">
                        <p><strong>Atenção:</strong> Este link expira em <strong>1 hora</strong>.</p>
                        <p>Se você não solicitou esta alteração, ignore este email.</p>
                      </div>
                      <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                      <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
                      <p>Atenciosamente,<br><strong>Equipe Áquila Pro</strong></p>
                    </div>
                    <div class="footer">
                      <p>© 2026 Áquila Pro. Todos os direitos reservados.</p>
                      <p>Este é um email automático, não responda.</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });
          console.log(`[Parent Portal] Password reset email sent to ${input.email}`);
        } catch (e) {
          console.error(`[Parent Portal] Failed to send reset email:`, e);
        }
      }

      return {
        success: true,
        message: "Se o email existir no sistema, você receberá um link de recuperação.",
      };
    }),

  // ---- RESETAR SENHA ----
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "As senhas não coincidem" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const parentRows = await db
        .select()
        .from(parents)
        .where(
          and(
            eq(parents.resetPasswordToken, input.token),
            gte(parents.resetPasswordExpires, new Date())
          )
        )
        .limit(1);

      if (parentRows.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token inválido ou expirado" });
      }

      const passwordHash = hashPassword(input.newPassword);

      await db
        .update(parents)
        .set({
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        })
        .where(eq(parents.id, parentRows[0].id));

      return { success: true, message: "Senha alterada com sucesso!" };
    }),

  // ---- ATUALIZAR PERFIL ----
  updateProfile: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string().min(3).optional(),
        phone: z.string().min(10).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const parent = await getParentFromToken(input.token);
      if (!parent) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.phone) updateData.phone = input.phone;

      if (Object.keys(updateData).length > 0) {
        await db.update(parents).set(updateData).where(eq(parents.id, parent.id));
      }

      return { success: true, message: "Perfil atualizado com sucesso!" };
    }),

  // ---- VINCULAR ALUNO (por código de matrícula) ----
  linkStudent: publicProcedure
    .input(
      z.object({
        token: z.string(),
        studentCode: z.string().min(1, "Código de matrícula é obrigatório"),
        relationship: z.enum(["father", "mother", "guardian", "grandparent", "other"]).default("guardian"),
      })
    )
    .mutation(async ({ input }) => {
      const parent = await getParentFromToken(input.token);
      if (!parent) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar aluno pelo código de matrícula
      const studentRows = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.schoolId, parent.schoolId),
            eq(students.studentId, input.studentCode)
          )
        )
        .limit(1);

      if (studentRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado com este código de matrícula" });
      }

      // Verificar se já está vinculado
      const existingLink = await db
        .select()
        .from(parentStudentLinks)
        .where(
          and(
            eq(parentStudentLinks.parentId, parent.id),
            eq(parentStudentLinks.studentId, studentRows[0].id)
          )
        )
        .limit(1);

      if (existingLink.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Este aluno já está vinculado à sua conta" });
      }

      await db.insert(parentStudentLinks).values({
        parentId: parent.id,
        studentId: studentRows[0].id,
        relationship: input.relationship,
        canReceiveAlerts: 1,
        canViewReports: 1,
      });

      return {
        success: true,
        message: `Aluno ${studentRows[0].name} vinculado com sucesso!`,
        student: {
          id: studentRows[0].id,
          name: studentRows[0].name,
        },
      };
    }),
});
