import { randomUUID } from 'node:crypto';
import type { H3Event } from 'h3';

export function apiError(statusCode: number, code: string, messageKey: string, fieldErrors?: unknown): never {
  throw createError({
    statusCode,
    data: { code, messageKey, fieldErrors, requestId: randomUUID() },
  });
}

export function requireSameOrigin(event: H3Event) {
  const method = getMethod(event);
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return;
  const origin = getHeader(event, 'origin');
  const fetchSite = getHeader(event, 'sec-fetch-site');
  if (fetchSite === 'cross-site') apiError(403, 'CROSS_ORIGIN', 'errors.crossOrigin');
  if (origin && origin !== getRequestURL(event).origin) apiError(403, 'CROSS_ORIGIN', 'errors.crossOrigin');
}
