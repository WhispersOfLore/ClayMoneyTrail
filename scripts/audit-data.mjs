import { readFile } from 'node:fs/promises';

const records = JSON.parse(await readFile(new URL('../data/records.json', import.meta.url), 'utf8'));
const sources = JSON.parse(await readFile(new URL('../data/sources.json', import.meta.url), 'utf8'));
const errors = [];
const ids = new Set();
const sourceIds = new Set(sources.map((source) => source.id));

for (const record of records) {
  if (ids.has(record.id)) errors.push(`Duplicate record id: ${record.id}`);
  ids.add(record.id);
  if (!sourceIds.has(record.sourceId)) errors.push(`Missing source ${record.sourceId} for ${record.id}`);
  if (!Object.hasOwn(record, 'amount')) errors.push(`Missing amount field: ${record.id}`);
  if (!record.sourceStatus) errors.push(`Missing source status: ${record.id}`);
}

const amount = (id) => records.find((record) => record.id === id)?.amount;
const assertSum = (label, totalId, componentIds) => {
  const expected = amount(totalId);
  const actual = componentIds.reduce((sum, id) => sum + (amount(id) ?? 0), 0);
  if (actual !== expected) errors.push(`${label}: ${actual} does not equal ${expected}`);
};

assertSum('All-funds functional expenditures', 'function-expenses-total', [
  'function-general-government','function-courts','function-public-safety','function-physical-environment',
  'function-transportation','function-economic-environment','function-human-services','function-culture-recreation',
]);
assertSum('CCSO presentation calculation', 'ccso-presentation-derived-26', [
  'ccso-personnel-derived-26','ccso-operating-derived-26','ccso-capital-derived-26',
]);
assertSum('All-authorities property taxes', 'allfund-revenue-advalorem-derived', [
  'tax-countywide-services','tax-conservation-lands','tax-unincorporated-mstu','tax-law-enforcement-mstu','tax-fire-mstu','tax-challenger-mstu',
]);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Data audit passed: ${records.length} records, ${sources.length} sources, ${ids.size} unique IDs.`);
}
