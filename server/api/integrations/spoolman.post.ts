import { spoolmanActionSchema } from '#shared/schemas/integrations';
import {
  importSpoolman,
  unlinkSpoolman,
  syncSpoolman,
  reconcileSpoolOperation,
} from '../../services/spoolman';
import { requireSpoolManagement } from '../../utils/spool-management';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
import { parseBody } from '../../utils/validation';
defineRouteMeta({
  openAPI: {
    summary: 'Run a Spoolman action',
    tags: ['Integrations'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/SpoolmanActionInput' } } },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireSpoolManagement();
  const input = parseBody(spoolmanActionSchema, await readBody(event));
  if (input.action === 'IMPORT') return importSpoolman(input.data);
  if (input.action === 'UNLINK') return unlinkSpoolman(input.data);
  if (input.action === 'SYNC') await syncSpoolman(input.spoolId);
  if (input.action === 'OPERATION') await reconcileSpoolOperation(input.data);
  return { ok: true };
});
