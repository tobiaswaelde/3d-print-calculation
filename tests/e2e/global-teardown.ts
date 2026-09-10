import { rmSync } from 'node:fs';

export default function teardown() {
  const testRoot = process.env.PRINT_COST_E2E_ROOT;
  if (testRoot?.includes('print-cost-browser-')) rmSync(testRoot, { recursive: true, force: true });
}
