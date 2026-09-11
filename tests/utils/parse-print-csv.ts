// The export has an unquoted invariant header and fully quoted RFC 4180 data cells.
export function parsePrintCsv(csv: string) {
  const firstLine = csv.indexOf('\r\n');
  if (firstLine < 0) throw new Error('Missing CSV header');
  const columns = csv.slice(0, firstLine).split(',');
  const cells = [...csv.slice(firstLine + 2).matchAll(/"((?:[^"]|"")*)"(?:,|\r\n)/g)].map((match) =>
    match[1]!.replaceAll('""', '"'),
  );
  if (cells.length % columns.length) throw new Error('Incomplete CSV row');
  const rows: Record<string, string>[] = [];
  for (let index = 0; index < cells.length; index += columns.length)
    rows.push(Object.fromEntries(columns.map((column, offset) => [column, cells[index + offset]!])));
  return { columns, rows };
}
