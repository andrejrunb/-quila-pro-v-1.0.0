import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const school = typeof body?.school === 'string' ? body.school.trim() : '';
    const type = typeof body?.type === 'string' ? body.type : 'contact';
    const lgpdConsent = Boolean(body?.lgpdConsent);

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

    return NextResponse.json({
      ok: true,
      protocol,
      receivedAt: new Date().toISOString(),
      message:
        type === 'newsletter'
          ? 'Inscrição confirmada no boletim técnico Áquila Pro.'
          : 'Solicitação registrada com sucesso. Nossa equipe técnica retornará com o roteiro do piloto.',
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Não foi possível processar a solicitação.' },
      { status: 400 }
    );
  }
}
