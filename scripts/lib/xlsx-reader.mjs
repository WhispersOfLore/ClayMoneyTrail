// Minimal, dependency-free .xlsx reader (Node built-ins only). It returns the
// cell values exactly as stored — text stays text, numbers stay numbers, and
// date-formatted cells become ISO dates — with the 1-based spreadsheet row
// number attached so every parsed value can be traced to its source row.
// Only what Workday-style exports need is implemented; unsupported structure
// throws instead of being guessed at.
import { readFileSync } from 'node:fs';
import { readZipEntries } from './zip-reader.mjs';

const decodeXml = (text) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const textOf = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1])).join('');

function columnIndex(ref) {
  let index = 0;
  for (const char of ref.replace(/[0-9]/g, '')) index = index * 26 + char.charCodeAt(0) - 64;
  return index - 1;
}

// Excel date serials -> ISO. Serial 25569 is 1970-01-01 (1900 leap-year quirk already absorbed).
const serialToIso = (serial) => {
  const date = new Date(Math.round((serial - 25569) * 86400) * 1000);
  const iso = date.toISOString();
  return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso.slice(0, 19);
};

const builtInDateFormats = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);

function dateStyleIndexes(styles) {
  const custom = new Map([...styles.matchAll(/<numFmt\s+numFmtId="(\d+)"\s+formatCode="([^"]*)"/g)].map((m) => [Number(m[1]), decodeXml(m[2])]));
  const cellXfs = styles.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1] ?? '';
  const isDate = new Set();
  [...cellXfs.matchAll(/<xf\s[^>]*?numFmtId="(\d+)"/g)].forEach((m, index) => {
    const id = Number(m[1]);
    const code = custom.get(id);
    if (builtInDateFormats.has(id) || (code && /[dmyhs]/i.test(code.replace(/"[^"]*"|\[[^\]]*\]|\\.|_.|\*./g, '')))) isDate.add(index);
  });
  return isDate;
}

/**
 * Read one worksheet. Returns { sheetName, sheets, rows } where rows is an
 * array of { rowNumber, cells } and cells is a sparse-free array of raw values
 * (null for empty cells) indexed by column.
 */
export function readXlsx(pathOrBuffer, { sheet = 0 } = {}) {
  const label = Buffer.isBuffer(pathOrBuffer) ? 'xlsx buffer' : pathOrBuffer;
  const entries = readZipEntries(Buffer.isBuffer(pathOrBuffer) ? pathOrBuffer : readFileSync(pathOrBuffer));
  const need = (name) => {
    const read = entries.get(name);
    if (!read) throw new Error(`${label}: missing ${name}`);
    return read.read().toString('utf8');
  };
  const workbook = need('xl/workbook.xml');
  const sheets = [...workbook.matchAll(/<sheet\s+name="([^"]*)"/g)].map((m) => decodeXml(m[1]));
  if (!sheets[sheet]) throw new Error(`${label}: no sheet at index ${sheet}`);
  const shared = entries.has('xl/sharedStrings.xml')
    ? [...need('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]))
    : [];
  const dateStyles = dateStyleIndexes(need('xl/styles.xml'));
  const sheetXml = need(`xl/worksheets/sheet${sheet + 1}.xml`);

  const rows = [];
  for (const rowMatch of sheetXml.matchAll(/<row\s([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowNumber = Number(rowMatch[1].match(/\br="(\d+)"/)?.[1]);
    const cells = [];
    for (const cell of (rowMatch[2] ?? '').matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cell[1];
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const type = attrs.match(/\bt="(\w+)"/)?.[1] ?? 'n';
      const style = Number(attrs.match(/\bs="(\d+)"/)?.[1] ?? 0);
      const inner = cell[2] ?? '';
      const rawValue = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let value = null;
      if (type === 's' && rawValue !== undefined) value = shared[Number(rawValue)];
      else if (type === 'inlineStr') value = textOf(inner);
      else if (type === 'str' || type === 'e') value = rawValue === undefined ? null : decodeXml(rawValue);
      else if (type === 'b') value = rawValue === '1';
      else if (rawValue !== undefined) value = dateStyles.has(style) ? serialToIso(Number(rawValue)) : Number(rawValue);
      cells[columnIndex(ref)] = value;
    }
    rows.push({ rowNumber, cells: Array.from(cells, (value) => value ?? null) });
  }
  return { sheetName: sheets[sheet], sheets, rows };
}
