import { db } from '../utils/db';

export default defineEventHandler(async (event) => {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'ready', version: process.env.npm_package_version ?? 'unknown' };
  } catch {
    setResponseStatus(event, 503);
    return { status: 'unavailable', database: 'unavailable' };
  }
});
