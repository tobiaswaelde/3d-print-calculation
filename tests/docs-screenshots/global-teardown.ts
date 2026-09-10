import { basename } from 'node:path';
import { rmSync } from 'node:fs';

export default function globalTeardown() {
  const testRoot = process.env.PRINT_COST_SCREENSHOT_ROOT;
  if (!testRoot || !basename(testRoot).startsWith('print-cost-screenshots-')) return;
  rmSync(testRoot, { recursive: true, force: true });
}
