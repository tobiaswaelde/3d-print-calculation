import { describe, expect, it } from 'vitest';
import { formatDateTime, formatDuration } from '../app/utils/display-formatting';

describe('display formatting', () => {
  it('combines the selected date and time patterns with Day.js', () => {
    const value = new Date(2026, 8, 11, 13, 5, 9);

    expect(formatDateTime(value, 'DD.MM.YYYY', 'HH:mm', 'de-DE')).toBe('11.09.2026 13:05');
    expect(formatDateTime(value, 'MM/DD/YYYY', 'hh:mm A', 'en-US')).toBe('09/11/2026 01:05 PM');
    expect(formatDateTime(value, 'YYYY-MM-DD', 'HH:mm:ss', 'en-US')).toBe('2026-09-11 13:05:09');
  });

  it('formats exact durations in human, compact, clock, and decimal forms', () => {
    expect(formatDuration(5_400, 'human', 'de-DE')).toBe('1 Stunde 30 Minuten');
    expect(formatDuration(5_400, 'human', 'en-US')).toBe('1 hour 30 minutes');
    expect(formatDuration(5_490, 'compact', 'en-US')).toBe('1h 31m 30s');
    expect(formatDuration(5_400, 'clock', 'en-US')).toBe('01:30:00');
    expect(formatDuration(5_400, 'decimal', 'de-DE')).toBe('1,5 h');
  });
});
