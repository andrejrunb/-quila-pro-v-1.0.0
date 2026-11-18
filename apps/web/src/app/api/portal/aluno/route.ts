import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerCaller, mapTrpcErrorToResponse } from '@/lib/serverCaller';
import { enforceApiRateLimit } from '@/lib/rateLimit';

const STUDENT_ACTION_ALIASES: Record<string, string> = {
  ADVANCE_MISSION: 'advanceMission',
  LOG_STUDY_SESSION: 'logStudySession',
  CONTEST_GRADE: 'contestGrade',
};

const studentActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('advanceMission'),
    payload: z.object({
      missionId: z.string().min(1),
      delta: z.number().int().min(5).max(100).default(40),
    }),
  }),
  z.object({
    action: z.literal('logStudySession'),
    payload: z.object({
      studentId: z.string().optional(),
      mode: z.enum(['focus_sprint_3min', 'kumon_3min', 'flashcards_srs', 'essay_lab', 'socratic_tutor']),
      durationSeconds: z.number().int().min(10).max(7200).default(180),
      topic: z.string().max(400).optional(),
    }),
  }),
  z.object({
    action: z.literal('contestGrade'),
    payload: z.object({
      gradeId: z.string().min(1),
      reason: z.string().trim().min(10).max(1000),
    }),
  }),
]);

export async function GET(request: NextRequest) {
  try {
    const searchParams = (request.nextUrl ?? new URL(request.url)).searchParams;
    const studentId = searchParams.get('studentId') || undefined;
    const { caller } = await createServerCaller(request);
    const data = await caller.studentPortal.getWorkspace(studentId ? { studentId } : undefined);
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
      'portal-aluno-post',
      { maxRequests: 60, windowMs: 60_000 },
      ctx.user?.id
    );
    if (rateLimited) return rateLimited;

    const rawBody = await request.json();
    const body =
      rawBody && typeof rawBody === 'object' && 'action' in rawBody
        ? {
            ...(rawBody as Record<string, unknown>),
            action: STUDENT_ACTION_ALIASES[String((rawBody as { action: unknown }).action)] ?? (rawBody as { action: unknown }).action,
          }
        : rawBody;
    const parsed = studentActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido para ação do estudante.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, payload } = parsed.data;

    switch (action) {
      case 'advanceMission':
        return NextResponse.json(await caller.studentPortal.advanceMission(payload));
      case 'logStudySession':
        return NextResponse.json(await caller.studentPortal.logStudySession(payload));
      case 'contestGrade':
        return NextResponse.json(await caller.studentPortal.contestGrade(payload));
    }
  } catch (error) {
    return mapTrpcErrorToResponse(error);
  }
}
