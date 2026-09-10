import Decimal from 'decimal.js';

export function canonicalDecimal(value: Decimal.Value): string {
  return new Decimal(value).toFixed();
}
