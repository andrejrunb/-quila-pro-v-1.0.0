import { router, adminProcedure, parentProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { invoices, students, users } from '@aquila/db';
import { and, eq, inArray } from 'drizzle-orm';
import {
  assertStudentAccess,
  computeSha256,
  enqueueEdgeSyncCommand,
  recordAuditEvent,
  resolveAccessibleStudentIds,
} from '../lib/governance';

export const financeRouter = router({
  getSummary: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.db) {
      return {
        monthlyRevenue: 0,
        collectedAmount: 0,
        pendingAmount: 0,
        defaulterRate: 0,
        activeSubscriptions: 0,
        currency: 'BRL',
      };
    }

    const rows = ctx.user.institutionId
      ? await ctx.db
          .select()
          .from(invoices)
          .where(eq(invoices.institutionId, ctx.user.institutionId))
      : await ctx.db.select().from(invoices);

    const active = rows.filter((r) => r.status !== 'cancelled');
    const collectedCents = active.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
    const pendingCents = active
      .filter((r) => r.status === 'pending' || r.status === 'overdue')
      .reduce((s, r) => s + r.amount, 0);
    const totalCents = collectedCents + pendingCents;
    const overdueCount = active.filter((r) => r.status === 'overdue').length;

    return {
      monthlyRevenue: Math.round(totalCents / 100),
      collectedAmount: Math.round(collectedCents / 100),
      pendingAmount: Math.round(pendingCents / 100),
      defaulterRate: active.length > 0 ? Number(((overdueCount / active.length) * 100).toFixed(1)) : 0,
      activeSubscriptions: active.length,
      currency: 'BRL',
    };
  }),

  listInvoices: adminProcedure
    .input(z.object({ status: z.enum(['paid', 'pending', 'overdue', 'all']).default('all') }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return [];

      const conditions = [];
      if (ctx.user.institutionId) {
        conditions.push(eq(invoices.institutionId, ctx.user.institutionId));
      }
      if (input.status !== 'all') {
        conditions.push(eq(invoices.status, input.status));
      }

      const rows = await ctx.db
        .select({
          id: invoices.id,
          studentId: invoices.studentId,
          description: invoices.description,
          amountCents: invoices.amount,
          dueDate: invoices.dueDate,
          status: invoices.status,
          paymentMethod: invoices.paymentMethod,
          studentName: students.name,
          parentName: users.name,
        })
        .from(invoices)
        .leftJoin(students, eq(invoices.studentId, students.id))
        .leftJoin(users, eq(students.parentUserId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return rows.map((row) => ({
        id: row.id,
        studentId: row.studentId,
        studentName: row.studentName ?? 'Estudante',
        parentName: row.parentName ?? 'Responsável',
        description: row.description,
        amount: Math.round(row.amountCents / 100),
        amountCents: row.amountCents,
        dueDate: row.dueDate,
        status: row.status,
        paymentMethod: row.paymentMethod,
      }));
    }),

  listMyInvoices: parentProcedure.query(async ({ ctx }) => {
    if (!ctx.db) return [];
    const allowedIds = await resolveAccessibleStudentIds(ctx.db, ctx.user);
    if (allowedIds.length === 0) return [];

    return await ctx.db
      .select()
      .from(invoices)
      .where(inArray(invoices.studentId, allowedIds));
  }),

  confirmPixPayment: parentProcedure
    .input(z.object({ invoiceId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }

      const found = await ctx.db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);
      const invoice = found[0];
      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Fatura não localizada.' });
      }

      await assertStudentAccess(ctx.db, ctx.user, invoice.studentId);

      if (invoice.status === 'cancelled') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Fatura cancelada não pode receber confirmação de pagamento.',
        });
      }

      const paidAt = invoice.status === 'paid' && invoice.paidAt ? invoice.paidAt : new Date();
      const receiptHashSha256 =
        invoice.status === 'paid' && invoice.receiptHashSha256
          ? invoice.receiptHashSha256
          : computeSha256({
              invoiceId: invoice.id,
              studentId: invoice.studentId,
              amount: invoice.amount,
              paidAt: paidAt.toISOString(),
              confirmedBy: ctx.user.id,
            });

      if (invoice.status !== 'paid') {
        await ctx.db
          .update(invoices)
          .set({
            status: 'paid',
            paymentMethod: 'pix',
            paidAt,
            receiptHashSha256,
          })
          .where(eq(invoices.id, invoice.id));
      }

      const financeCmd = await enqueueEdgeSyncCommand(ctx.db, {
        institutionId: invoice.institutionId,
        targetDomain: 'finance',
        action: 'PIX_PAYMENT_CONFIRMATION_REPORTED',
        actorUserId: ctx.user.id,
        conflictPolicy: 'bank_settlement_authoritative',
        payload: {
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amountCents: invoice.amount,
          paymentMethod: 'pix',
          paidAt: paidAt.toISOString(),
          receiptHashSha256,
          reconciliationState: 'PENDING_EDGE_RECONCILIATION',
        },
      });

      await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: 'INVOICE_PIX_SETTLED',
        entity: 'invoices',
        entityId: invoice.id,
        details: {
          studentId: invoice.studentId,
          receiptHashSha256,
          commandId: financeCmd.commandId,
          reconciliationState: 'PENDING_EDGE_RECONCILIATION',
        },
        ipAddress: ctx.ipAddress,
      });

      return {
        ok: true,
        invoiceId: invoice.id,
        status: 'paid' as const,
        paidAt: paidAt.toISOString(),
        receiptHashSha256,
        commandId: financeCmd.commandId,
        syncStatus: financeCmd.status,
        reconciliationState: 'PENDING_EDGE_RECONCILIATION' as const,
      };
    }),
});
