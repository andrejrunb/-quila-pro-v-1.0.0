import { NextResponse } from 'next/server';
import { appRouter } from '@aquila/api';
import { getInitializedWebDb } from '@/lib/authDb';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ ok: false, error: 'Payload JSON inválido.' }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Não foi possível ler os dados enviados.' }, { status: 400 });
  }

  const rate = checkRateLimit(`contact:${getClientIp(request)}`, {
    maxRequests: 5,
    windowMs: 5 * 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Limite temporário de envios atingido. Aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 160) : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  const school = typeof body.school === 'string' ? body.school.trim().slice(0, 160) : '';
  const role = typeof body.role === 'string' ? body.role.trim().slice(0, 80) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
  const type = typeof body.type === 'string' ? body.type.trim().slice(0, 40) : 'contact';
  const context = typeof body.context === 'string' ? body.context.trim().slice(0, 160) : '';
  const lgpdConsent = Boolean(body.lgpdConsent);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'Informe um e-mail institucional válido.' },
      { status: 400 }
    );
  }

  if (type !== 'newsletter' && (!name || !school)) {
    return NextResponse.json(
      { ok: false, error: 'Preencha nome e instituição de ensino.' },
      { status: 400 }
    );
  }

  if (!lgpdConsent) {
    return NextResponse.json(
      { ok: false, error: 'É necessário confirmar a ciência da Política de Privacidade (LGPD).' },
      { status: 400 }
    );
  }

  const protocol = `AQ-H01-${Date.now().toString(36).toUpperCase()}`;
  const receivedAt = new Date().toISOString();
  const webhookUrl = process.env.AQUILA_CONTACT_WEBHOOK_URL?.trim();
  const initialDeliveryMode = webhookUrl ? 'webhook_dispatched' : 'persisted_for_followup';

  let persistedInDb = false;
  let leadRecordId: string | null = null;
  try {
    const db = await getInitializedWebDb();
    const caller = appRouter.createCaller({
      db,
      user: null,
      ipAddress: getClientIp(request),
    });
    const leadResult = await caller.lead.submit({
      protocol,
      type,
      name: name || (type === 'newsletter' ? 'Assinante Boletim' : name),
      school: school || (type === 'newsletter' ? 'Boletim Áquila Pro' : school),
      role: role || undefined,
      email,
      message: message || undefined,
      context: context || undefined,
      lgpdConsent,
      deliveryMode: initialDeliveryMode,
    });
    leadRecordId = leadResult.id ?? null;
    persistedInDb = Boolean(leadRecordId);
  } catch (err) {
    console.error('[Aquila Contact API] Erro ao persistir lead:', err);
  }

  let webhookDelivered = false;
  if (webhookUrl) {
    try {
      const forward = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol,
          receivedAt,
          type,
          name,
          school,
          role,
          email,
          message,
          context,
          lgpdConsent,
        }),
      });
      if (!forward.ok) {
        return NextResponse.json(
          { ok: false, error: 'Falha ao encaminhar solicitação ao canal de atendimento.' },
          { status: 502 }
        );
      }
      webhookDelivered = true;
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Canal de recebimento indisponível no momento.' },
        { status: 502 }
      );
    }
  }

  if (!persistedInDb && !webhookDelivered) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Canal de atendimento indisponível no momento: não foi possível registrar nem encaminhar sua solicitação.',
      },
      { status: 503 }
    );
  }

  const verifiedDeliveryMode = webhookDelivered ? 'webhook_dispatched' : 'persisted_for_followup';

  return NextResponse.json({
    ok: true,
    protocol,
    leadId: leadRecordId,
    persistedInDb,
    webhookDelivered,
    receivedAt,
    deliveryMode: verifiedDeliveryMode,
    message:
      type === 'newsletter'
        ? 'Inscrição registrada com sucesso na base do boletim técnico Áquila Pro.'
        : webhookDelivered
          ? 'Solicitação encaminhada ao canal de atendimento com protocolo verificável.'
          : 'Solicitação persistida com protocolo verificável. Nossa equipe técnica retornará o contato.',
  });
}
