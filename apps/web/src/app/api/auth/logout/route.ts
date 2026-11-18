import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revokedSessions } from '@aquila/db';
import { getInitializedWebDb } from '@/lib/authDb';
import { verifySession } from '@/lib/session';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('aquila_session')?.value;
    if (token) {
      const session = await verifySession(token);
      if (session?.jti) {
        const db = await getInitializedWebDb();
        await db
          .insert(revokedSessions)
          .values({
            jti: session.jti,
            userId: session.userId ?? null,
            reason: 'user_logout',
            revokedAt: new Date(),
            expiresAt: new Date((session.exp ?? Math.floor(Date.now() / 1000) + 28800) * 1000),
          })
          .onConflictDoNothing();
      }
    }
  } catch (error) {
    console.error('[Aquila Logout Revocation]', error);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('aquila_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
