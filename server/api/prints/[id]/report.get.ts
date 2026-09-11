import { getPrint } from '../../../services/prints';
import { requireUser } from '../../../utils/auth';
import { apiError } from '../../../utils/http';
export default defineEventHandler(async (event) => {
  await requireUser(event);
  const print = await getPrint(getRouterParam(event, 'id')!);
  if (print.status !== 'DONE') apiError(409, 'REPORT_NOT_ALLOWED', 'errors.reportNotAllowed');
  setHeader(event, 'cache-control', 'no-store');
  return print;
});
