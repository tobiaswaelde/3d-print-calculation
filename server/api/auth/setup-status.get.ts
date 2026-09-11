import { db } from '../../utils/db';

defineRouteMeta({ openAPI: { summary: 'Get setup status', tags: ['Authentication'], security: [] } });

export default defineEventHandler(async () => ({ initialized: (await db.user.count()) > 0 }));
