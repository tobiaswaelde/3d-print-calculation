import { db } from '../../utils/db';

export default defineEventHandler(async () => ({ initialized: (await db.user.count()) > 0 }));
