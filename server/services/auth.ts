import { hash, verify } from '@node-rs/argon2';
import { setupSchema, loginSchema } from '#shared/schemas/auth';
import { db } from '../utils/db';
import { apiError } from '../utils/http';

let setupQueue = Promise.resolve();

async function setupApplicationLocked(input: unknown) {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success)
    apiError(422, 'VALIDATION_ERROR', 'errors.validation', parsed.error.flatten().fieldErrors);
  const data = parsed.data;

  try {
    return await db.$transaction(async (transaction) => {
      if (await transaction.user.count()) apiError(409, 'ALREADY_INITIALIZED', 'errors.alreadyInitialized');
      const passwordHash = await hash(data.password, { algorithm: 2 });
      const user = await transaction.user.create({
        data: { email: data.email, displayName: data.displayName, passwordHash, locale: data.locale },
      });
      await transaction.appSettings.create({
        data: {
          id: 1,
          currency: data.currency,
          defaultLocale: data.locale,
          electricityPricePerKwh: data.electricityPrice,
        },
      });
      return user;
    });
  } catch (error) {
    if (await db.user.count()) apiError(409, 'ALREADY_INITIALIZED', 'errors.alreadyInitialized');
    throw error;
  }
}

export function setupApplication(input: unknown) {
  const setup = setupQueue.then(() => setupApplicationLocked(input));
  setupQueue = setup.then(
    () => undefined,
    () => undefined,
  );
  return setup;
}

export async function authenticate(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) apiError(401, 'INVALID_CREDENTIALS', 'errors.invalidCredentials');
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verify(user.passwordHash, parsed.data.password))) {
    apiError(401, 'INVALID_CREDENTIALS', 'errors.invalidCredentials');
  }
  return user;
}
