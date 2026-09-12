import { readRestoreStatus } from '../../../services/backups';

defineRouteMeta({
  openAPI: {
    summary: 'Get database restore status',
    description: 'Returns the short-lived status of a restore while the application restarts.',
    tags: ['Backups'],
    security: [],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
    responses: {
      200: { description: 'Restore status.' },
      404: { description: 'Restore status not found or expired.' },
    },
  },
});

export default defineEventHandler((event) => readRestoreStatus(getRouterParam(event, 'id') ?? ''));
