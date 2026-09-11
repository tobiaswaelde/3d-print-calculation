import { apiError } from '../http';
export type Integration = 'SPOOLMAN' | 'BAMBUBUDDY';
export function integrationConfigured(name: Integration) {
  return !!process.env[`${name}_URL`];
}
export function integrationUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
      throw new Error();
    url.pathname = url.pathname.replace(/\/$/, '') + '/';
    return url;
  } catch {
    return apiError(503, 'INTEGRATION_CONFIG', 'errors.integrationConfig');
  }
}
export async function integrationRequest(
  name: Integration,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<unknown> {
  const base = process.env[`${name}_URL`];
  if (!base) return apiError(503, 'INTEGRATION_DISABLED', 'errors.integrationDisabled');
  const url = new URL(path, integrationUrl(base));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
      redirect: 'error',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(name === 'BAMBUBUDDY' && process.env.BAMBUBUDDY_API_KEY
          ? { 'X-API-Key': process.env.BAMBUBUDDY_API_KEY }
          : {}),
        ...(name === 'SPOOLMAN' && process.env.SPOOLMAN_AUTHORIZATION
          ? { authorization: process.env.SPOOLMAN_AUTHORIZATION }
          : {}),
      },
    });
    if (!response.ok) return apiError(502, `REMOTE_HTTP_${response.status}`, 'errors.integrationRemote');
    const reader = response.body?.getReader();
    if (!reader) throw new Error();
    const parts: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 2_000_000) {
        await reader.cancel();
        throw new Error();
      }
      parts.push(chunk.value);
    }
    return JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown;
  } catch (reason) {
    // Never expose upstream URLs, credentials, bodies or network exception messages.
    if (
      reason &&
      typeof reason === 'object' &&
      'data' in reason &&
      typeof reason.data === 'object' &&
      reason.data &&
      'code' in reason.data &&
      String(reason.data.code).startsWith('REMOTE_HTTP_')
    )
      throw reason;
    return apiError(502, 'INTEGRATION_UNAVAILABLE', 'errors.integrationUnavailable');
  } finally {
    clearTimeout(timeout);
  }
}
