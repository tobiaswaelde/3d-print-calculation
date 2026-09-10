import { hash } from '@node-rs/argon2';
import { db } from '../server/utils/db';

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];
if (!email || !password || password.length < 12) {
  throw new Error('Usage: pnpm db:reset-password <email> <new-password-at-least-12-characters>');
}

const user = await db.user.findUnique({ where: { email } });
if (!user) throw new Error('No local user found for that email address.');
await db.$transaction([
  db.user.update({ where: { id: user.id }, data: { passwordHash: await hash(password, { algorithm: 2 }) } }),
  db.session.deleteMany({ where: { userId: user.id } }),
]);
await db.$disconnect();
process.stdout.write('Password changed and all sessions invalidated.\n');
