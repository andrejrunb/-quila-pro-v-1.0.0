import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getInitializedWebDb, resolveLiveSessionUser } from '@/lib/authDb';
import { isPortalPublicExposureBlocked } from '@/lib/portalAccess';
import { verifySession } from '@/lib/session';

export async function GET() {
  if (isPortalPublicExposureBlocked()) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: 'PORTALS_BLOCKED_PENDING_PHASE2',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  const cookieStore = await cookies();
  const token = cookieStore.get('aquila_session')?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const session = await verifySession(token);
  if (!session) {
    const response = NextResponse.json(
      { authenticated: false, user: null },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
    response.cookies.set('aquila_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }

  let liveUser = null;
  try {
    const db = await getInitializedWebDb();
    liveUser = await resolveLiveSessionUser(db, session);
  } catch (error) {
    console.error('[Aquila Session Check]', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: 'PERSISTENCE_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!liveUser) {
    const response = NextResponse.json(
      { authenticated: false, user: null },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
    response.cookies.set('aquila_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        username: session.username,
        role: session.role,
        portal: session.portal,
        userId: session.userId,
        institutionId: session.institutionId,
        linkedStudentIds: session.linkedStudentIds,
      },
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
