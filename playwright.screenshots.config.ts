import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { defineConfig, devices } from '@playwright/test';

const screenshotRoot =
  process.env.PRINT_COST_SCREENSHOT_ROOT ?? mkdtempSync(join(tmpdir(), 'print-cost-screenshots-'));
const databaseUrl = `file:${join(screenshotRoot, 'app.db')}`;
const appPort = process.env.PRINT_COST_SCREENSHOT_APP_PORT ?? '3001';
const integrationPort = process.env.PRINT_COST_SCREENSHOT_INTEGRATION_PORT ?? '3003';
const appUrl = `http://127.0.0.1:${appPort}`;
process.env.PRINT_COST_SCREENSHOT_ROOT = screenshotRoot;

if (!databaseUrl.includes('print-cost-screenshots-')) {
  throw new Error('Refusing to run the documentation screenshot suite against a non-temporary database.');
}

export default defineConfig({
  outputDir: 'test-results/screenshots',
  testDir: './tests/docs-screenshots',
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 10_000 },
  globalTeardown: './tests/docs-screenshots/global-teardown.ts',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: appUrl,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm db:deploy && pnpm dev --host 127.0.0.1 --port ${appPort}`,
    url: `${appUrl}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      NUXT_IGNORE_LOCK: '1',
      PRINT_COST_BUILD_DIR: join(screenshotRoot, 'nuxt'),
      DOCS_SCREENSHOTS: 'true',
      SPOOLMAN_URL: `http://127.0.0.1:${integrationPort}`,
      SPOOLMAN_AUTHORIZATION: 'Bearer synthetic-secret',
      BAMBUBUDDY_URL: `http://127.0.0.1:${integrationPort}`,
      BAMBUBUDDY_API_KEY: 'synthetic-key',
      NODE_ENV: 'test',
    },
  },
});
