import { getPrint } from '../../services/prints';
import { requireUser } from '../../utils/auth';

defineRouteMeta({ openAPI: { summary: 'Get a print', tags: ['Prints'], security: [{ cookieAuth: [] }] } });

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return getPrint(getRouterParam(event, 'id')!);
});
