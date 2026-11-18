import { randomUUID } from 'node:crypto';
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { leads } from '@aquila/db';

export const leadRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        protocol: z.string(),
        type: z.string().default('contact'),
        name: z.string().min(1),
        school: z.string().min(1),
        role: z.string().optional(),
        email: z.string().email(),
        message: z.string().optional(),
        context: z.string().optional(),
        lgpdConsent: z.boolean(),
        deliveryMode: z.string().default('persisted_db'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.lgpdConsent) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Consentimento LGPD obrigatório.',
        });
      }
      if (!ctx.db) {
        return { ok: true, id: null, protocol: input.protocol };
      }

      const id = `lead_${randomUUID().slice(0, 12)}`;
      await ctx.db.insert(leads).values({
        id,
        protocol: input.protocol,
        type: input.type,
        name: input.name,
        school: input.school,
        role: input.role ?? null,
        email: input.email,
        message: input.message ?? null,
        context: input.context ?? null,
        lgpdConsent: input.lgpdConsent,
        deliveryMode: input.deliveryMode,
        status: 'new',
        createdAt: new Date(),
      });

      return { ok: true, id, protocol: input.protocol };
    }),
});
