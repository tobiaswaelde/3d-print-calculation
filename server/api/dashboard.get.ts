import { dashboardData } from '../services/dashboard';
import { requireUser } from '../utils/auth';

export default defineEventHandler(async (event) => {
  await requireUser(event);
  return dashboardData(getQuery(event).period);
});
