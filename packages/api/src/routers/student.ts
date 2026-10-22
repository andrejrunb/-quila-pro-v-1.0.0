import { router, publicProcedure } from '../index';
import { z } from 'zod';
import { students } from '@aquila/db';
import { eq } from 'drizzle-orm';

export const studentRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50), classId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return [];
      
      return await ctx.db.select().from(students)
        .where(input.classId ? eq(students.classId, input.classId) : undefined)
        .limit(input.limit);
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(3),
      registrationNumber: z.string(),
      classId: z.string(),
      institutionId: z.string(),
      dateOfBirth: z.string(),
      status: z.enum(['active', 'inactive', 'graduated', 'transferred']).default('active')
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) throw new Error('DB not configured');
      
      const newStudent = {
        id: `std_${Date.now()}`,
        ...input,
        enrolledAt: new Date(),
      };
      
      await ctx.db.insert(students).values(newStudent);
      return newStudent;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return null;
      const result = await ctx.db.select().from(students).where(eq(students.id, input.id)).limit(1);
      return result[0] || null;
    }),
});
