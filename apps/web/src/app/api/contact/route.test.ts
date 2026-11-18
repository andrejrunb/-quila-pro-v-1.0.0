import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { resetWebDbCacheForTests } from '@aquila/db';
import { POST } from './route';
import { resetRateLimitBuckets } from '@/lib/rateLimit';

describe('contact and newsletter API route', () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  afterEach(() => {
    delete process.env.AQUILA_CONTACT_WEBHOOK_URL;
    vi.unstubAllGlobals();
  });

  it('rejects invalid JSON, invalid email, missing school/name, or missing lgpdConsent with 400', async () => {
    const badJson = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      })
    );
    expect(badJson.status).toBe(400);

    const badEmail = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Maria', school: 'Colégio Áquila', email: 'invalid', lgpdConsent: true }),
      })
    );
    expect(badEmail.status).toBe(400);

    const missingSchool = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Maria', school: '', email: 'maria@escola.edu.br', lgpdConsent: true }),
      })
    );
    expect(missingSchool.status).toBe(400);

    const missingLgpd = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Maria',
          school: 'Colégio Áquila',
          email: 'maria@escola.edu.br',
          lgpdConsent: false,
        }),
      })
    );
    expect(missingLgpd.status).toBe(400);
  });

  it('accepts valid contact and newsletter payloads with LGPD consent', async () => {
    const contactRes = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.1' },
        body: JSON.stringify({
          name: 'Diretor Carlos',
          school: 'Escola Horizonte',
          email: 'carlos@horizonte.edu.br',
          lgpdConsent: true,
        }),
      })
    );
    expect(contactRes.status).toBe(200);
    expect(await contactRes.json()).toMatchObject({
      ok: true,
      persistedInDb: true,
      webhookDelivered: false,
      deliveryMode: 'persisted_for_followup',
    });

    const newsletterRes = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.2' },
        body: JSON.stringify({
          type: 'newsletter',
          email: 'dpo@horizonte.edu.br',
          lgpdConsent: true,
        }),
      })
    );
    expect(newsletterRes.status).toBe(200);
    expect(await newsletterRes.json()).toMatchObject({
      ok: true,
      persistedInDb: true,
      deliveryMode: 'persisted_for_followup',
      message: 'Inscrição registrada com sucesso na base do boletim técnico Áquila Pro.',
    });
  });

  it('enforces rate limiting after 5 requests per window', async () => {
    for (let i = 0; i < 5; i += 1) {
      const okRes = await POST(
        new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.99' },
          body: JSON.stringify({
            type: 'newsletter',
            email: `user${i}@horizonte.edu.br`,
            lgpdConsent: true,
          }),
        })
      );
      expect(okRes.status).toBe(200);
    }

    const blocked = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.99' },
        body: JSON.stringify({
          type: 'newsletter',
          email: 'blocked@horizonte.edu.br',
          lgpdConsent: true,
        }),
      })
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });

  it('forwards to AQUILA_CONTACT_WEBHOOK_URL and returns 502 if upstream fails', async () => {
    process.env.AQUILA_CONTACT_WEBHOOK_URL = 'https://crm.example.invalid/webhook';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('ok', { status: 200 })));
    const okRes = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.40' },
        body: JSON.stringify({
          name: 'Ana',
          school: 'Instituto Sul',
          email: 'ana@sul.edu.br',
          lgpdConsent: true,
        }),
      })
    );
    expect(okRes.status).toBe(200);
    expect(await okRes.json()).toMatchObject({ ok: true, deliveryMode: 'webhook_dispatched' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('error', { status: 500 })));
    const failRes = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.41' },
        body: JSON.stringify({
          name: 'Ana',
          school: 'Instituto Sul',
          email: 'ana@sul.edu.br',
          lgpdConsent: true,
        }),
      })
    );
    expect(failRes.status).toBe(502);
  });

  it('returns 503 when neither DB persistence nor webhook delivery succeeds (no silent false success)', async () => {
    delete process.env.AQUILA_CONTACT_WEBHOOK_URL;
    const prevVercel = process.env.VERCEL;
    const prevDbPath = process.env.AQUILA_WEB_DB_PATH;
    process.env.VERCEL = '1';
    delete process.env.AQUILA_WEB_DB_PATH;
    resetWebDbCacheForTests();

    try {
      const unavailableRes = await POST(
        new NextRequest('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.77' },
          body: JSON.stringify({
            name: 'Coordenação Teste',
            school: 'Escola Sem Persistência',
            email: 'contato@escola.edu.br',
            lgpdConsent: true,
          }),
        })
      );
      expect(unavailableRes.status).toBe(503);
      const body = await unavailableRes.json();
      expect(body.ok).toBe(false);
    } finally {
      if (prevVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prevVercel;
      if (prevDbPath === undefined) process.env.AQUILA_WEB_DB_PATH = ':memory:';
      else process.env.AQUILA_WEB_DB_PATH = prevDbPath;
      resetWebDbCacheForTests();
    }
  });
});
