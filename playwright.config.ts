import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { assertSafeTestDatabaseUrl } from './tests/utils/test-database';

const testRoot = mkdtempSync(join(tmpdir(), 'print-cost-browser-'));
const databaseUrl = `file:${join(testRoot, 'app.db')}`;
assertSafeTestDatabaseUrl(databaseUrl, testRoot);
process.env.PRINT_COST_E2E_ROOT = testRoot;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm db:deploy && pnpm dev --host 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000/api/health',
    reuseExistingServer: false,
    env: { DATABASE_URL: databaseUrl, NODE_ENV: 'test' },
  },
});
