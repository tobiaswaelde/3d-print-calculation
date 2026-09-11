import { spoolmanActionSchema } from '#shared/schemas/integrations';
import {
  importSpoolman,
  unlinkSpoolman,
  syncSpoolman,
  reconcileSpoolOperation,
} from '../../services/spoolman';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
import { parseBody } from '../../utils/validation';
import { requireFeature } from '../../utils/features';
export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  await requireUser(event);
  await requireFeature('spoolManagementEnabled');
  const input = parseBody(spoolmanActionSchema, await readBody(event));
  if (input.action === 'IMPORT') return importSpoolman(input.data);
  if (input.action === 'UNLINK') return unlinkSpoolman(input.data);
  if (input.action === 'SYNC') await syncSpoolman(input.spoolId);
  if (input.action === 'OPERATION') await reconcileSpoolOperation(input.data);
  return { ok: true };
});
