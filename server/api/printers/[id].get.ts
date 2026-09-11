import { getResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'Get a printer', tags: ['Printers'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return getResource('printers', getRouterParam(event, 'id')!);
});
