import { searchApplication } from '../services/search';
import { requireUser } from '../utils/auth';

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return searchApplication(getQuery(event));
});
