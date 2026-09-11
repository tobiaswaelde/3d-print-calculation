import { listResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';

defineRouteMeta({
  openAPI: { summary: 'List printers', tags: ['Printers'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return listResource('printers', getQuery(event));
});
