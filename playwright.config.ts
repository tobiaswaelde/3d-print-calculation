import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { assertSafeTestDatabaseUrl } from './tests/utils/test-database';

const testRoot = process.env.PRINT_COST_E2E_ROOT ?? mkdtempSync(join(tmpdir(), 'print-cost-browser-'));
const databaseUrl = `file:${join(testRoot, 'app.db')}`;
const port = Number(process.env.PRINT_COST_E2E_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;
assertSafeTestDatabaseUrl(databaseUrl, testRoot);
process.env.PRINT_COST_E2E_ROOT = testRoot;

export default defineConfig({
  outputDir: 'test-results/e2e',
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm db:deploy && pnpm dev --host 127.0.0.1 --port ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl,
      NODE_ENV: 'test',
      NUXT_IGNORE_LOCK: '1',
      PRINT_COST_BUILD_DIR: join(testRoot, 'nuxt'),
    },
  },
});
