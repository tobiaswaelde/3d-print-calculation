import { getResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get a component', tags: ['Components'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return getResource('components', getRouterParam(event, 'id')!);
});
