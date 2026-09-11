import { duplicatePrint } from '../../../services/prints';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';

defineRouteMeta({ openAPI: { summary: 'Repeat a print', tags: ['Prints'], security: [{ cookieAuth: [] }] } });

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  return duplicatePrint(getRouterParam(event, 'id')!, 'repeat');
});
