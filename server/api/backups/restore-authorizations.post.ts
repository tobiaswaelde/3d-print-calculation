import { restoreAuthorizationSchema } from '#shared/schemas/backups';
import { authorizeRestore } from '../../services/backups';
import { requireUser } from '../../utils/auth';
import { requireSameOrigin } from '../../utils/http';
import { parseBody } from '../../utils/validation';

defineRouteMeta({
  openAPI: {
    summary: 'Authorize a database restore',
    description:
      'Rechecks the current user password and issues a single-use restore token valid for five minutes.',
    tags: ['Backups'],
    security: [{ cookieAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['password'],
            properties: { password: { type: 'string', format: 'password', minLength: 1, maxLength: 256 } },
          },
        },
      },
    },
    responses: {
      200: { description: 'Restore authorized.' },
      401: { description: 'Authentication or password verification failed.' },
    },
  },
} as never);

export default defineEventHandler(async (event) => {
  requireSameOrigin(event);
  const user = await requireUser(event);
  const input = parseBody(restoreAuthorizationSchema, await readBody(event));
  return authorizeRestore(user.id, input.password);
});
