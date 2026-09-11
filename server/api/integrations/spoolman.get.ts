import { spoolmanPreview, spoolmanStatus } from '../../services/spoolman';
import { requireUser } from '../../utils/auth';
import { requireFeature } from '../../utils/features';
defineRouteMeta({
  openAPI: {
    summary: 'Get Spoolman status or import preview',
    tags: ['Integrations'],
    security: [{ cookieAuth: [] }],
  },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  await requireFeature('spoolManagementEnabled');
  setHeader(event, 'cache-control', 'no-store');
  return getQuery(event).view === 'preview' ? spoolmanPreview(getQuery(event)) : spoolmanStatus();
});
