import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerCaller, mapTrpcErrorToResponse } from '@/lib/serverCaller';
import { enforceApiRateLimit } from '@/lib/rateLimit';

const PROFESSOR_ACTION_ALIASES: Record<string, string> = {
  SAVE_ATTENDANCE: 'saveRosterAttendance',
  SAVE_DIARY: 'saveLessonDiary',
  SAVE_ASSESSMENT: 'saveAssessment',
  REVIEW_SUBMISSION: 'reviewSubmissionGrade',
  SAVE_GRADES: 'saveGradesBatch',
  APPLY_RADAR_ACTION: 'applyRadarAction',
};

const professorActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('saveRosterAttendance'),
    payload: z.object({
      classId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      entries: z
        .array(
          z.object({
            studentId: z.string().min(1),
            status: z.enum(['present', 'absent', 'late', 'justified']),
            detectedBy: z.enum(['manual', 'nfc', 'qr_badge']).default('manual'),
          })
        )
        .min(1),
    }),
  }),
  z.object({
    action: z.literal('saveLessonDiary'),
    payload: z.object({
      id: z.string().optional(),
      classId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      subject: z.string().min(2).max(100),
      topic: z.string().min(2).max(160),
      content: z.string().min(3).max(2000),
      bnccCodes: z.array(z.string().min(2)).min(1),
      homework: z.string().max(400).optional(),
      dinnerPrompt: z.string().max(400).optional(),
      sign: z.boolean().default(true),
    }),
  }),
  z.object({
    action: z.literal('saveAssessment'),
    payload: z.object({
      id: z.string().optional(),
      classId: z.string().min(1),
      title: z.string().min(3).max(160),
      instructions: z.string().min(3).max(2000),
      subject: z.string().min(2).max(100).default('Física Aplicada'),
      bimestre: z.enum(['1bim', '2bim', '3bim', '4bim']).default('4bim'),
      questions: z.array(
        z.object({
          id: z.string().min(1),
          bncc: z.string().min(1),
          stem: z.string().min(3),
          options: z.array(z.string()),
          answer: z.string(),
        })
      ),
      approveForRelease: z.boolean().default(false),
    }),
  }),
  z.object({
    action: z.literal('reviewSubmissionGrade'),
    payload: z.object({
      submissionId: z.string().min(1),
      finalScore: z.number().min(0).max(10),
      feedback: z.string().max(800).optional(),
    }),
  }),
  z.object({
    action: z.literal('saveGradesBatch'),
    payload: z.object({
      classId: z.string().min(1),
      subject: z.string().min(2),
      period: z.enum(['1bim', '2bim', '3bim', '4bim']).default('4bim'),
      evaluationType: z.enum(['prova', 'trabalho', 'participacao']).default('prova'),
      maxScore: z.number().min(1).max(100).default(10),
      entries: z
        .array(
          z.object({
            studentId: z.string().min(1),
            score: z.number().min(0).max(100),
          })
        )
        .min(1),
    }),
  }),
  z.object({
    action: z.literal('applyRadarAction'),
    payload: z.object({
      occurrenceId: z.string().min(1),
      actionApplied: z.string().min(3).max(400),
    }),
  }),
]);

export async function GET(request: NextRequest) {
  try {
    const searchParams = (request.nextUrl ?? new URL(request.url)).searchParams;
    const classId = searchParams.get('classId') || undefined;
    const date = searchParams.get('date') || undefined;
    const { caller } = await createServerCaller(request);
    const data = await caller.teacher.getWorkspace(
      classId || date ? { ...(classId ? { classId } : {}), ...(date ? { date } : {}) } : undefined
    );
    return NextResponse.json(data);
  } catch (error) {
    return mapTrpcErrorToResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, caller } = await createServerCaller(request);
    const rateLimited = enforceApiRateLimit(
      request,
      'portal-professor-post',
      { maxRequests: 60, windowMs: 60_000 },
      ctx.user?.id
    );
    if (rateLimited) return rateLimited;

    const rawBody = await request.json();
    const body =
      rawBody && typeof rawBody === 'object' && 'action' in rawBody
        ? {
            ...(rawBody as Record<string, unknown>),
            action: PROFESSOR_ACTION_ALIASES[String((rawBody as { action: unknown }).action)] ?? (rawBody as { action: unknown }).action,
          }
        : rawBody;
    const parsed = professorActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido para ação docente.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, payload } = parsed.data;

    switch (action) {
      case 'saveRosterAttendance':
        return NextResponse.json(await caller.teacher.saveRosterAttendance(payload));
      case 'saveLessonDiary':
        return NextResponse.json(await caller.teacher.saveLessonDiary(payload));
      case 'saveAssessment':
        return NextResponse.json(await caller.teacher.saveAssessment(payload));
      case 'reviewSubmissionGrade':
        return NextResponse.json(await caller.teacher.reviewSubmissionGrade(payload));
      case 'saveGradesBatch':
        return NextResponse.json(await caller.teacher.saveGradesBatch(payload));
      case 'applyRadarAction':
        return NextResponse.json(await caller.teacher.applyRadarAction(payload));
    }
  } catch (error) {
    return mapTrpcErrorToResponse(error);
  }
}
