import { listPrints } from '../../services/prints';
import { requireUser } from '../../utils/auth';

defineRouteMeta({ openAPI: { summary: 'List prints', tags: ['Prints'], security: [{ cookieAuth: [] }] } });

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return listPrints(getQuery(event));
});
