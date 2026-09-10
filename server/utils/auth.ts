import { createHash, randomBytes } from 'node:crypto';
import type { H3Event } from 'h3';
import type { SessionUser } from '#shared/types/auth';
import { db } from './db';
import { apiError } from './http';

const COOKIE_NAME = 'print-cost-session';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function publicUser(user: { id: string; email: string; displayName: string; locale: string }): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    locale: user.locale as SessionUser['locale'],
  };
}

export async function createSession(event: H3Event, userId: string) {
  const token = randomBytes(32).toString('base64url');
  const ttlHours = Number(useRuntimeConfig(event).sessionTtlHours);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    deleteCookie(event, COOKIE_NAME, { path: '/' });
    return null;
  }
  return publicUser(session.user);
}

export async function requireUser(event: H3Event) {
  const user = await getSessionUser(event);
  if (!user) apiError(401, 'UNAUTHORIZED', 'errors.unauthorized');
  return user;
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME);
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  deleteCookie(event, COOKIE_NAME, { path: '/' });
}
