import { readFile } from 'node:fs/promises';

const records = JSON.parse(await readFile(new URL('../data/records.json', import.meta.url), 'utf8'));
const sources = JSON.parse(await readFile(new URL('../data/sources.json', import.meta.url), 'utf8'));
const errors = [];
const ids = new Set();
const sourceIds = new Set(sources.map((source) => source.id));

const VALID_STATUSES = new Set(['verified_official', 'official_estimate', 'derived_estimate', 'rough_estimate', 'pending']);

for (const record of records) {
  if (ids.has(record.id)) errors.push(`Duplicate record id: ${record.id}`);
  ids.add(record.id);
  if (!sourceIds.has(record.sourceId)) errors.push(`Missing source ${record.sourceId} for ${record.id}`);
  if (!Object.hasOwn(record, 'amount')) errors.push(`Missing amount field: ${record.id}`);
  if (!record.sourceStatus) errors.push(`Missing source status: ${record.id}`);
  if (record.sourceStatus && !VALID_STATUSES.has(record.sourceStatus)) {
    errors.push(`Unrecognized source status "${record.sourceStatus}" on ${record.id}`);
  }
  if (record.sourceStatus === 'pending' && record.amount !== null) {
    errors.push(`Record ${record.id} is marked pending but has a non-null amount`);
  }
  if (record.amount === null && record.sourceStatus !== 'pending') {
    errors.push(`Record ${record.id} has a null amount but source status "${record.sourceStatus}" instead of "pending"`);
  }
}

for (const source of sources) {
  if (!Object.hasOwn(source, 'lastVerified')) errors.push(`Source ${source.id} is missing the lastVerified field (use null if unknown)`);
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

// --- Investigations layer ---
const investigationMeta = JSON.parse(await readFile(new URL('../data/investigations/meta.json', import.meta.url), 'utf8'));
const leads = JSON.parse(await readFile(new URL('../data/investigations/leads.json', import.meta.url), 'utf8'));
const evidence = JSON.parse(await readFile(new URL('../data/investigations/evidence.json', import.meta.url), 'utf8'));
const timeline = JSON.parse(await readFile(new URL('../data/investigations/timeline.json', import.meta.url), 'utf8'));
const recordsRequests = JSON.parse(await readFile(new URL('../data/investigations/records-requests.json', import.meta.url), 'utf8'));

const VALID_EVIDENCE_STATUSES = new Set([
  'verified_fact', 'partially_verified', 'unverified_lead', 'allegation', 'possible_connection',
  'documented_connection', 'conflicting_evidence', 'disproven_claim', 'records_required',
]);
const investigationIds = new Set(investigationMeta.map((i) => i.id));
const leadIds = new Set();

for (const inv of investigationMeta) {
  if (!inv.id || !inv.subject || !inv.disclaimer) errors.push(`Investigation ${inv.id ?? '(no id)'} is missing id/subject/disclaimer`);
}

for (const lead of leads) {
  if (leadIds.has(lead.id)) errors.push(`Duplicate lead id: ${lead.id}`);
  leadIds.add(lead.id);
  if (!investigationIds.has(lead.investigationId)) errors.push(`Lead ${lead.id} references unknown investigationId ${lead.investigationId}`);
  if (!VALID_EVIDENCE_STATUSES.has(lead.status)) errors.push(`Lead ${lead.id} has unrecognized status "${lead.status}"`);
  if (!['high', 'medium', 'low'].includes(lead.priority)) errors.push(`Lead ${lead.id} has unrecognized priority "${lead.priority}"`);
}

const evidenceIds = new Set();
for (const ev of evidence) {
  if (evidenceIds.has(ev.id)) errors.push(`Duplicate evidence id: ${ev.id}`);
  evidenceIds.add(ev.id);
  if (!investigationIds.has(ev.investigationId)) errors.push(`Evidence ${ev.id} references unknown investigationId ${ev.investigationId}`);
  if (!VALID_EVIDENCE_STATUSES.has(ev.status)) errors.push(`Evidence ${ev.id} has unrecognized status "${ev.status}"`);
  if (ev.status === 'verified_fact' && !ev.url) errors.push(`Evidence ${ev.id} is marked verified_fact but has no source url`);
  for (const relatedId of ev.relatedLeadIds ?? []) {
    if (!leadIds.has(relatedId)) errors.push(`Evidence ${ev.id} references unknown lead id ${relatedId}`);
  }
}

const timelineIds = new Set();
for (const tl of timeline) {
  if (timelineIds.has(tl.id)) errors.push(`Duplicate timeline id: ${tl.id}`);
  timelineIds.add(tl.id);
  if (!investigationIds.has(tl.investigationId)) errors.push(`Timeline event ${tl.id} references unknown investigationId ${tl.investigationId}`);
  if (!VALID_EVIDENCE_STATUSES.has(tl.status)) errors.push(`Timeline event ${tl.id} has unrecognized status "${tl.status}"`);
  for (const evId of tl.evidenceIds ?? []) {
    if (!evidenceIds.has(evId)) errors.push(`Timeline event ${tl.id} references unknown evidence id ${evId}`);
  }
}

const VALID_REQUEST_STATUSES = new Set(['suggested_not_sent', 'drafted', 'sent', 'partially_fulfilled', 'fulfilled', 'denied', 'no_response']);
const requestIds = new Set();
for (const req of recordsRequests) {
  if (requestIds.has(req.id)) errors.push(`Duplicate records-request id: ${req.id}`);
  requestIds.add(req.id);
  if (!investigationIds.has(req.relatedInvestigation)) errors.push(`Records request ${req.id} references unknown investigation ${req.relatedInvestigation}`);
  if (!VALID_REQUEST_STATUSES.has(req.status)) errors.push(`Records request ${req.id} has unrecognized status "${req.status}"`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Data audit passed: ${records.length} records, ${sources.length} sources, ${ids.size} unique IDs, ` +
      `${leads.length} leads, ${evidence.length} evidence entries, ${timeline.length} timeline events, ${recordsRequests.length} records requests.`,
  );
}
