import { renderSVG } from 'uqr';
import { requireUser } from '../../../utils/auth';
import { db } from '../../../utils/db';
import { requireFeature } from '../../../utils/features';

defineRouteMeta({
  openAPI: { summary: 'Get a spool QR code', tags: ['Spools'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  await requireFeature('spoolManagementEnabled');
  const id = getRouterParam(event, 'id')!;
  await db.spool.findUniqueOrThrow({ where: { id }, select: { id: true } });
  const target = new URL(`/spools/${encodeURIComponent(id)}`, getRequestURL(event).origin);
  setHeader(event, 'Content-Type', 'image/svg+xml');
  setHeader(event, 'Cache-Control', 'private, no-store');
  return renderSVG(target.href, { border: 4 });
});
