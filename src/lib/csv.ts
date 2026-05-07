// Tiny CSV serializer. RFC 4180-ish:
//   - Wrap any field in quotes if it contains a comma, quote, or newline
//   - Inside quotes, escape an embedded quote by doubling it
//   - Use CRLF as the row separator (most spreadsheet apps prefer CRLF)

function escapeField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsQuotes = /[",\r\n]/.test(str);
  if (!needsQuotes) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeField).join(",");
  const bodyLines = rows.map((row) => row.map(escapeField).join(","));
  return [headerLine, ...bodyLines].join("\r\n");
}

export function csvFilename(base: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `fairway-${base}-${today}.csv`;
}
