import { apiError } from '../http';
import { getIntegrationConfig, type IntegrationName } from '../../services/integration-settings';

export async function integrationConfigured(name: IntegrationName) {
  const config = await getIntegrationConfig(name);
  return config.enabled && !!config.url && (name !== 'BAMBUBUDDY' || !!config.credential);
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
  name: IntegrationName,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<unknown> {
  const config = await getIntegrationConfig(name);
  if (!config.enabled || !config.url)
    return apiError(503, 'INTEGRATION_DISABLED', 'errors.integrationDisabled');
  const url = new URL(path, integrationUrl(config.url));
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
        ...(name === 'BAMBUBUDDY' && config.credential ? { 'X-API-Key': config.credential } : {}),
        ...(name === 'SPOOLMAN' && config.credential ? { authorization: config.credential } : {}),
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
