import { describe, expect, it, vi } from 'vitest';
import { terminalOutcome, bambuStateSchema } from '../server/utils/integrations/bambu-contract';
import { spoolmanSpoolSchema } from '../server/utils/integrations/spoolman-contract';
import { integrationUrl } from '../server/utils/integrations/http';
import { spoolmanImportSchema } from '../shared/schemas/integrations';
vi.stubGlobal('createError', (value: unknown) => Object.assign(new Error('API error'), value));
describe('integration trust boundaries', () => {
  it('accepts only authoritative terminal log states with a valid completion timestamp', () => {
    for (const state of [
      'IDLE',
      'RUNNING',
      'PAUSE',
      'PREPARE',
      'SLICING',
      'disconnected',
      'cancelled',
      'stopped',
      'skipped',
    ])
      expect(terminalOutcome(state, '2026-09-11T00:00:00Z')).toBeNull();
    expect(terminalOutcome('completed', null)).toBeNull();
    expect(terminalOutcome('completed', 'not a date')).toBeNull();
    expect(terminalOutcome('completed', '2026-09-11T00:00:00Z')).toBe('SUCCESS');
    expect(terminalOutcome('failed', '2026-09-11T00:00:00Z')).toBe('FAILED');
  });
  it('strips unneeded upstream fields, validates server URLs and defaults to read-only ownership', () => {
    const printer = bambuStateSchema.parse({
      id: 1,
      name: 'Fixture',
      connected: false,
      access_code: 'must-not-leak',
    });
    expect(printer).not.toHaveProperty('access_code');
    for (const url of [
      'file:///etc/passwd',
      'http://user:password@host/',
      'https://host/?token=secret',
      'https://host/#secret',
    ])
      expect(() => integrationUrl(url)).toThrow();
    expect(integrationUrl('http://spoolman:7912').href).toBe('http://spoolman:7912/');
    expect(spoolmanImportSchema.parse({ remoteId: 1, previewHash: 'a'.repeat(64) }).authority).toBe(
      'SPOOLMAN_READ_ONLY',
    );
    expect(spoolmanSpoolSchema.safeParse({ id: 1, filament: {}, archived: false }).success).toBe(false);
  });
});
