import { readFileSync } from 'node:fs';

function flatten(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return entry && typeof entry === 'object' && !Array.isArray(entry)
      ? flatten(entry as Record<string, unknown>, path)
      : [path];
  });
}

const catalogs = ['de-DE', 'en-US'].map((locale) => ({
  locale,
  keys: flatten(JSON.parse(readFileSync(`app/i18n/locales/${locale}.json`, 'utf8'))).sort(),
}));
const baseline = catalogs[0]!;
for (const catalog of catalogs.slice(1)) {
  const missing = baseline.keys.filter((key) => !catalog.keys.includes(key));
  const extra = catalog.keys.filter((key) => !baseline.keys.includes(key));
  if (missing.length || extra.length) {
    throw new Error(
      `${catalog.locale} catalog mismatch. Missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}`,
    );
  }
}
process.stdout.write(`Translation catalogs match (${baseline.keys.length} keys).\n`);
