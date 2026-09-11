import { printListQuerySchema } from '#shared/schemas/prints';
import { printCsvColumns, printCsvRow } from '#shared/domain/print-export';
import { listPrints } from '../../services/prints';
import { db } from '../../utils/db';
import { requireUser } from '../../utils/auth';
import { apiError } from '../../utils/http';
import { parseBody } from '../../utils/validation';

defineRouteMeta({
  openAPI: { summary: 'Export completed prints', tags: ['Prints'], security: [{ cookieAuth: [] }] },
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const query = parseBody(printListQuerySchema, getQuery(event));
  // ponytail: cap exports at 5,000 rows; use a background export if larger datasets become necessary.
  const csv = await db.$transaction(
    async (transaction) => {
      let result = printCsvColumns.join(',') + '\r\n';
      if (query.status && query.status !== 'DONE') return result;
      for (let page = 1; ; page++) {
        const batch = await listPrints({ ...query, status: 'DONE', page, pageSize: 100 }, transaction);
        if (batch.total > 5000) apiError(422, 'EXPORT_TOO_LARGE', 'errors.exportTooLarge');
        result += batch.items.map(printCsvRow).join('');
        if (page * 100 >= batch.total) return result;
      }
    },
    { timeout: 30000 },
  );
  setHeaders(event, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': 'attachment; filename="ezprint-completed.csv"',
    'cache-control': 'no-store',
  });
  return csv;
});
