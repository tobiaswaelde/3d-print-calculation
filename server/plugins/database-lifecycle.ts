import { db } from '../utils/db';

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', async () => {
    await db.$disconnect();
  });
});
