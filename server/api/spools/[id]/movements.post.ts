import { moveStock } from '../../../services/spools';
import { requireSpoolManagement } from '../../../utils/spool-management';
import { requireUser } from '../../../utils/auth';
import { requireSameOrigin } from '../../../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Record a spool stock movement',
    tags: ['Spools'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/StockMovementInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireSpoolManagement();
  return moveStock(getRouterParam(event, 'id')!, await readBody(event));
});
