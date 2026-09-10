import { getPrint } from '../../services/prints';
import { requireUser } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return getPrint(getRouterParam(event, 'id')!);
});
