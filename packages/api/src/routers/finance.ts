import { router, publicProcedure } from '../index';
import { z } from 'zod';

export const financeRouter = router({
  getSummary: publicProcedure.query(async () => {
    return {
      monthlyRevenue: 142800,
      collectedAmount: 134200,
      pendingAmount: 8600,
      defaulterRate: 6.0,
      activeSubscriptions: 187,
      currency: 'BRL',
    };
  }),

  listInvoices: publicProcedure
    .input(z.object({ status: z.enum(['paid', 'pending', 'overdue', 'all']).default('all') }))
    .query(async ({ input }) => {
      const mockInvoices = [
        { id: 'inv_01', studentName: 'João Silva', parentName: 'Carlos Silva', amount: 850, dueDate: '2026-08-10', status: 'pending' },
        { id: 'inv_02', studentName: 'Maria Santos', parentName: 'Ana Santos', amount: 850, dueDate: '2026-08-05', status: 'paid' },
        { id: 'inv_03', studentName: 'Pedro Lima', parentName: 'Roberto Lima', amount: 850, dueDate: '2026-07-10', status: 'overdue' },
      ];
      if (input.status === 'all') return mockInvoices;
      return mockInvoices.filter(i => i.status === input.status);
    }),
});
