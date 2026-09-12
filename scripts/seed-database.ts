import { hash } from '@node-rs/argon2';
import { setupSchema } from '../shared/schemas/auth';
import { assertEmptyDatabase, createDemoData } from '../server/services/demo-data';
import { db } from '../server/utils/db';

function argument(name: string) {
  const position = process.argv.indexOf(`--${name}`);
  if (position === -1) return undefined;
  const value = process.argv[position + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for --${name}.`);
  return value;
}

function parseCredentials() {
  const allowed = new Set(['--email', '--password']);
  for (const value of process.argv.slice(2)) {
    if (value.startsWith('--') && !allowed.has(value)) throw new Error(`Unknown option: ${value}`);
  }
  const parsed = setupSchema.safeParse({
    displayName: 'Demo Operator',
    email: argument('email'),
    password: argument('password'),
    locale: 'de-DE',
    currency: 'EUR',
    electricityPrice: '0.32',
    printSeriesEnabled: true,
    spoolManagementEnabled: true,
    createDemoData: true,
  });
  if (!parsed.success) {
    throw new Error('Usage: pnpm db:seed -- --email <email> --password <password-at-least-12-characters>');
  }
  return parsed.data;
}

async function seed(credentials: ReturnType<typeof parseCredentials>) {
  await db.$transaction(
    async (transaction) => {
      await assertEmptyDatabase(transaction);
      await transaction.user.create({
        data: {
          id: 'demo-user',
          email: credentials.email,
          displayName: credentials.displayName,
          passwordHash: await hash(credentials.password, { algorithm: 2 }),
          locale: credentials.locale,
        },
      });
      await transaction.appSettings.create({
        data: {
          id: 1,
          currency: credentials.currency,
          defaultLocale: credentials.locale,
          electricityPricePerKwh: credentials.electricityPrice,
          printSeriesEnabled: true,
          spoolManagementEnabled: true,
          calculationVersion: '3',
        },
      });
      await createDemoData(transaction, {
        currency: credentials.currency,
        electricityPrice: credentials.electricityPrice,
        printSeriesEnabled: true,
        spoolManagementEnabled: true,
      });
    },
    { maxWait: 5_000, timeout: 30_000 },
  );
}

try {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed when NODE_ENV=production.');
  const credentials = parseCredentials();
  await seed(credentials);
  process.stdout.write(`Created synthetic demo data for ${credentials.email}.\n`);
} catch (error) {
  const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;
  if (code === 'P2021') {
    process.stderr.write('Database schema is missing. Run pnpm db:deploy or pnpm db:migrate first.\n');
  } else {
    process.stderr.write(`${error instanceof Error ? error.message : 'Database seed failed.'}\n`);
  }
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
