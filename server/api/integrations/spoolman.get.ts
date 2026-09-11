import { spoolmanPreview, spoolmanStatus } from '../../services/spoolman';
import { requireUser } from '../../utils/auth';
export default defineEventHandler(async (event) => {
  await requireUser(event);
  setHeader(event, 'cache-control', 'no-store');
  return getQuery(event).view === 'preview' ? spoolmanPreview(getQuery(event)) : spoolmanStatus();
});
