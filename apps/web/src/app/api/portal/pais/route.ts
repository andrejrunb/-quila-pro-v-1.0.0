import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerCaller, mapTrpcErrorToResponse } from '@/lib/serverCaller';
import { enforceApiRateLimit } from '@/lib/rateLimit';

const PARENT_ACTION_ALIASES: Record<string, string> = {
  SIGN_OCCURRENCE: 'signOccurrence',
  CONFIRM_PIX: 'confirmPixPayment',
  SET_BIOMETRIC_CONSENT: 'setBiometricConsent',
  CONTEST_GRADE: 'contestGrade',
};

const parentActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('signOccurrence'),
    payload: z.object({
      occurrenceId: z.string().min(1),
      manifestationType: z
        .enum(['SCIENCE_ACKNOWLEDGED', 'DISAGREEMENT_CONTESTATION'])
        .optional(),
      contestationReason: z.string().trim().max(1000).optional(),
    }),
  }),
  z.object({
    action: z.literal('contestGrade'),
    payload: z.object({
      gradeId: z.string().min(1),
      reason: z.string().trim().min(10).max(1000),
    }),
  }),
  z.object({
    action: z.literal('confirmPixPayment'),
    payload: z.object({
      invoiceId: z.string().min(1),
    }),
  }),
  z.object({
    action: z.literal('setBiometricConsent'),
    payload: z.object({
      studentId: z.string().min(1),
      decision: z.enum(['grant', 'revoke']),
      guardianCpf: z.string().min(11).max(18).optional(),
      guardianName: z.string().trim().min(3).max(120).optional(),
    }),
  }),
]);

export async function GET(request: NextRequest) {
  try {
    const searchParams = (request.nextUrl ?? new URL(request.url)).searchParams;
    const studentId = searchParams.get('studentId') || undefined;
    const { caller } = await createServerCaller(request);
    const data = await caller.parent.getWorkspace(studentId ? { studentId } : undefined);
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
      'portal-pais-post',
      { maxRequests: 60, windowMs: 60_000 },
      ctx.user?.id
    );
    if (rateLimited) return rateLimited;

    const rawBody = await request.json();
    const body =
      rawBody && typeof rawBody === 'object' && 'action' in rawBody
        ? {
            ...(rawBody as Record<string, unknown>),
            action: PARENT_ACTION_ALIASES[String((rawBody as { action: unknown }).action)] ?? (rawBody as { action: unknown }).action,
          }
        : rawBody;
    const parsed = parentActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido para ação do responsável.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, payload } = parsed.data;

    switch (action) {
      case 'signOccurrence':
        return NextResponse.json(await caller.parent.signOccurrence(payload));
      case 'contestGrade':
        return NextResponse.json(await caller.parent.contestGrade(payload));
      case 'confirmPixPayment':
        return NextResponse.json(await caller.finance.confirmPixPayment(payload));
      case 'setBiometricConsent':
        return NextResponse.json(await caller.parent.setBiometricConsent(payload));
    }
  } catch (error) {
    return mapTrpcErrorToResponse(error);
  }
}
