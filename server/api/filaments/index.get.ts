import { listResource } from '../../services/master-data';
import { requireUser } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return listResource('filaments', getQuery(event));
});
