import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { defineConfig, devices } from '@playwright/test';

const screenshotRoot = mkdtempSync(join(tmpdir(), 'print-cost-screenshots-'));
const databaseUrl = `file:${join(screenshotRoot, 'app.db')}`;
process.env.PRINT_COST_SCREENSHOT_ROOT = screenshotRoot;

if (!databaseUrl.includes('print-cost-screenshots-')) {
  throw new Error('Refusing to run the documentation screenshot suite against a non-temporary database.');
}

export default defineConfig({
  testDir: './tests/docs-screenshots',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  globalTeardown: './tests/docs-screenshots/global-teardown.ts',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3001',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm db:deploy && pnpm dev --host 127.0.0.1 --port 3001',
    url: 'http://127.0.0.1:3001/api/health',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DOCS_SCREENSHOTS: 'true',
      NODE_ENV: 'test',
    },
  },
});
