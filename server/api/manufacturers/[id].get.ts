import { getResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return getResource('manufacturers', getRouterParam(event, 'id')!);
});
