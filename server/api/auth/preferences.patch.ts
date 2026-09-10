import { supportedLocaleSchema } from '#shared/schemas/common';
import { db } from '../../utils/db';
import { requireUser } from '../../utils/auth';
import { apiError, requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  const user = await requireUser(event);
  const result = supportedLocaleSchema.safeParse((await readBody(event)).locale);
  if (!result.success) apiError(422, 'VALIDATION_ERROR', 'errors.validation', result.error.flatten());
  const updated = await db.user.update({ where: { id: user.id }, data: { locale: result.data } });
  return {
    user: { id: updated.id, email: updated.email, displayName: updated.displayName, locale: updated.locale },
  };
});
