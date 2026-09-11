import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  outputDir: 'test-results/docs',
  testDir: './tests/docs-e2e',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm docs:dev --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/ezprint/',
    reuseExistingServer: false,
  },
});
