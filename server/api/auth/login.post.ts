import { authenticate } from '../../services/auth';
import { createSession } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';

defineRouteMeta({
  openAPI: {
    summary: 'Sign in',
    description: 'Validates credentials and sets the HTTP-only print-cost-session cookie.',
    tags: ['Authentication'],
    security: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', format: 'password' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Signed in; the response sets print-cost-session.',
        headers: {
          'Set-Cookie': { schema: { type: 'string' } },
        },
      },
      401: { description: 'Invalid credentials.' },
      422: { description: 'Invalid request body.' },
    },
  },
});

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  const user = await authenticate(await readBody(event));
  await createSession(event, user.id);
  return { user: { id: user.id, email: user.email, displayName: user.displayName, locale: user.locale } };
});
