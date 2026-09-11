import { deleteResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

defineRouteMeta({
  openAPI: { summary: 'Delete a filament', tags: ['Filaments'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return deleteResource('filaments', getRouterParam(event, 'id')!);
});
