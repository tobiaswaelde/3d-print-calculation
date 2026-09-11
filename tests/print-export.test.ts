import { describe, expect, it } from 'vitest';
import { csvCell, reportFilename } from '../shared/domain/print-export';
describe('export safety', () => {
  it('quotes RFC4180 text and neutralizes formulas while preserving signed decimal values', () => {
    expect(csvCell('a,"b"\r\nc', true)).toBe('"a,""b""\r\nc"');
    for (const text of ['=HYPERLINK("evil")', '\t+SUM(1)', ' @formula', '-1+2'])
      expect(csvCell(text, true)).toBe(`"'${text.replaceAll('"', '""')}"`);
    expect(csvCell('-0.123')).toBe('"-0.123"');
    expect(csvCell(null)).toBe('""');
    expect(reportFilename('../bad\r\n<script>ß', '2026-09-11T12:00:00Z')).toBe('bad-script-2026-09-11');
  });
});
