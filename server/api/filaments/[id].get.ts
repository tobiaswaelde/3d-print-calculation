import { getResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get a filament', tags: ['Filaments'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return getResource('filaments', getRouterParam(event, 'id')!);
});
