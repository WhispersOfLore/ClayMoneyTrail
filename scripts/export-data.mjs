import { readFile, writeFile } from 'node:fs/promises';

const records = JSON.parse(await readFile(new URL('../data/records.json', import.meta.url), 'utf8'));
const sources = JSON.parse(await readFile(new URL('../data/sources.json', import.meta.url), 'utf8'));
const bundle = {
  dataset: 'Clay County Money Trail',
  version: '0.2.0',
  asOf: new Date().toISOString().slice(0, 10),
  disclaimer: 'Budgeted does not equal actual spent. Derived calculations and rough estimates are labeled separately. Null means not yet populated.',
  records,
  sources,
};

const columns = ['id','fiscalYear','domain','flow','department','category','name','amount','measure','sourceStatus','sourceId','notes'];
const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = [columns.join(','), ...records.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\n') + '\n';

await writeFile(new URL('../public/data/clay-county-money-trail.json', import.meta.url), JSON.stringify(bundle, null, 2) + '\n');
await writeFile(new URL('../public/data/clay-county-money-trail.csv', import.meta.url), csv);
