import { authenticate } from '../../services/auth';
import { createSession } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  const user = await authenticate(await readBody(event));
  await createSession(event, user.id);
  return { user: { id: user.id, email: user.email, displayName: user.displayName, locale: user.locale } };
});
