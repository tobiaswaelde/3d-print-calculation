import { describe, expect, it } from 'vitest';
import { assertSafeTestDatabaseUrl } from './utils/test-database';

describe('test database safety', () => {
  it('accepts only isolated SQLite paths', () => {
    expect(assertSafeTestDatabaseUrl('file:/tmp/suite/app.db', '/tmp/suite')).toBe('/tmp/suite/app.db');
    expect(() => assertSafeTestDatabaseUrl('file:/data/app.db', '/tmp/suite')).toThrow();
    expect(() => assertSafeTestDatabaseUrl('postgres://production', '/tmp/suite')).toThrow();
  });
});
