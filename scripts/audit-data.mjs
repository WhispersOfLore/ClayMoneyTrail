import { readFile } from 'node:fs/promises';

const records = JSON.parse(await readFile(new URL('../data/records.json', import.meta.url), 'utf8'));
const sources = JSON.parse(await readFile(new URL('../data/sources.json', import.meta.url), 'utf8'));
const errors = [];
const ids = new Set();
const sourceIds = new Set(sources.map((source) => source.id));

const VALID_STATUSES = new Set(['verified_official', 'official_estimate', 'derived_estimate', 'rough_estimate', 'pending', 'news_report']);

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

// --- Phase 6 datasets (state funding, Public Safety Complex, geographic
// spending, taxes/assessments, Black Creek, payroll/fuel leads) ------------
// These files are looser/more research-shaped than the money-trail and
// investigations layers above, so validation here focuses on the invariants
// that matter: unique IDs, status values drawn from the fixed vocabularies,
// and (for commissioner photos) that the referenced local asset actually
// exists on disk rather than a dangling path.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const stateFunding = JSON.parse(await readFile(new URL('../data/state-funding.json', import.meta.url), 'utf8'));
const stateFundingIds = new Set();
for (const r of stateFunding.requests) {
  if (stateFundingIds.has(r.id)) errors.push(`Duplicate state-funding request id: ${r.id}`);
  stateFundingIds.add(r.id);
  if (!VALID_STATUSES.has(r.sourceStatus)) errors.push(`State-funding request ${r.id} has unrecognized sourceStatus "${r.sourceStatus}"`);
  const validLegislativeStatus = new Set(['requested', 'appropriated', 'vetoed', 'partially_vetoed', 'unknown_pending_gaa_review', 'withdrawn']);
  if (!validLegislativeStatus.has(r.legislativeStatus)) errors.push(`State-funding request ${r.id} has unrecognized legislativeStatus "${r.legislativeStatus}"`);
}

const geoSpending = JSON.parse(await readFile(new URL('../data/geographic-spending.json', import.meta.url), 'utf8'));
const geoIds = new Set();
for (const c of geoSpending.classification) {
  if (geoIds.has(c.id)) errors.push(`Duplicate geographic-spending classification id: ${c.id}`);
  geoIds.add(c.id);
  if (!VALID_EVIDENCE_STATUSES.has(c.evidenceStatus)) errors.push(`Geographic-spending entry ${c.id} has unrecognized evidenceStatus "${c.evidenceStatus}"`);
}

const payrollFuel = JSON.parse(await readFile(new URL('../data/payroll-fuel.json', import.meta.url), 'utf8'));
for (const c of payrollFuel.payrollClaims) {
  if (!VALID_EVIDENCE_STATUSES.has(c.status)) errors.push(`Payroll claim "${c.name}" has unrecognized status "${c.status}"`);
}

// --- Payroll (PRR-2026-1195): generated public dataset + hand-written findings ---
// data/payroll.json is generated by scripts/build-payroll-dataset.mjs and must
// stay free of withheld personal fields; data/payroll-findings.json is editorial
// prose whose cited figures must match the generated data exactly.
const payroll = JSON.parse(await readFile(new URL('../data/payroll.json', import.meta.url), 'utf8'));
const payrollFindings = JSON.parse(await readFile(new URL('../data/payroll-findings.json', import.meta.url), 'utf8'));
if (payroll.meta.sourceStatus !== 'verified_official') errors.push('Payroll dataset must carry sourceStatus verified_official (county-produced record)');
if (payroll.provenance.files.length !== 10 || !/^[0-9a-f]{64}$/.test(payroll.provenance.archive.sha256)) errors.push('Payroll provenance must list all 10 response files and a SHA-256 archive hash');
const tierIds = new Set();
for (const person of payroll.publicTier) {
  if (tierIds.has(person.id)) errors.push(`Duplicate payroll tier id: ${person.id}`);
  tierIds.add(person.id);
}
const WITHHELD_KEY = /gender|ssn|birth|dob|address|phone|email|benefit|taxes|active|insurance|dependent/i;
const scanKeys = (node, path) => {
  if (Array.isArray(node)) return node.forEach((item, i) => scanKeys(item, `${path}[${i}]`));
  if (node && typeof node === 'object') for (const [key, value] of Object.entries(node)) {
    if (WITHHELD_KEY.test(key) && !/^(withheldFields|sensitiveFieldsFoundInSource|employerPaidBenefits|employerTaxes)$/.test(key)) errors.push(`Payroll public data exposes a withheld-type key at ${path}.${key}`);
    scanKeys(value, `${path}.${key}`);
  }
};
scanKeys(payroll.publicTier, 'publicTier');
for (const period of payroll.periods) {
  const t = period.totals;
  if (t.workers + t.exactDuplicateRowsExcluded !== t.rowsInSource) errors.push(`Payroll ${period.id}: workers + excluded duplicates does not equal source rows`);
  if (t.fullTime + t.partTime !== t.workers) errors.push(`Payroll ${period.id}: full-time + part-time does not equal workers`);
}
const SENSITIVE_VALUE = /\b\d{3}-\d{2}-\d{4}\b|[\w.+-]+@[\w-]+\.[\w.]+/;
if (SENSITIVE_VALUE.test(JSON.stringify(payroll))) errors.push('Payroll public data contains an SSN-like or email-like value');
const resolveRef = (ref) => {
  const step = (node, key) => (Array.isArray(node)
    ? node.find((item) => item.id === key || `${item.personId}@${item.periodId}` === key)
    : node?.[key]);
  const [head, ...rest] = ref.split('/');
  if (payroll[head]) return rest.reduce(step, payroll[head]);
  const person = payroll.publicTier.find((p) => p.id === head);
  if (!person) return undefined;
  if (rest.length === 1) return person[rest[0]];
  return person.periods.find((p) => p.periodId === rest[0])?.[rest[1]];
};
const checkFigures = (owner, figures = []) => {
  for (const { ref, value } of figures) {
    const actual = resolveRef(ref);
    if (typeof actual !== 'number' || Math.abs(actual - value) > 0.005) errors.push(`Payroll findings ${owner} cites ${ref}=${value} but payroll.json has ${actual}`);
  }
};
for (const o of payrollFindings.keyObservations) {
  if (!VALID_EVIDENCE_STATUSES.has(o.evidenceStatus)) errors.push(`Payroll observation ${o.id} has unrecognized evidenceStatus "${o.evidenceStatus}"`);
  checkFigures(o.id, o.citedFigures);
}
for (const check of payrollFindings.leadChecks) {
  if (!VALID_EVIDENCE_STATUSES.has(check.evidenceStatus)) errors.push(`Payroll lead check ${check.id} has unrecognized evidenceStatus "${check.evidenceStatus}"`);
  if (!tierIds.has(check.personId)) errors.push(`Payroll lead check ${check.id} references unknown person ${check.personId}`);
  checkFigures(check.id, check.citedFigures);
  const claim = payrollFuel.payrollClaims.find((c) => c.officialCheckId === check.id);
  if (!claim) errors.push(`Payroll lead check ${check.id} is not linked from any payrollClaims entry in payroll-fuel.json`);
  else if (claim.status !== check.evidenceStatus) errors.push(`Payroll claim "${claim.name}" status "${claim.status}" disagrees with lead check ${check.id} status "${check.evidenceStatus}"`);
}
for (const c of payrollFuel.payrollClaims) {
  if (c.officialCheckId && !payrollFindings.leadChecks.some((k) => k.id === c.officialCheckId)) errors.push(`Payroll claim "${c.name}" references unknown lead check ${c.officialCheckId}`);
}
if (!VALID_EVIDENCE_STATUSES.has(payrollFindings.lorinMockQuestion.evidenceStatus)) errors.push('Lorin Mock question has an unrecognized evidenceStatus');
if (payrollFindings.lorinMockQuestion.evidenceStatus !== 'records_required') errors.push('Lorin Mock question must stay records_required until a record actually resolves it');
// Standing correction: the Fire Chief and Fire Marshal are different people.
const chief = payroll.publicTier.find((p) => p.periods.some((x) => x.position === 'Fire Chief'));
const marshal = payroll.publicTier.find((p) => p.periods.some((x) => x.position === 'Fire Marshal'));
if (!chief || !marshal || chief.id === marshal.id) errors.push('Payroll data must show the Fire Chief and Fire Marshal as two different people');

// Standing safeguard: the census holds two different employees named William Latham. Only the
// Assistant County Manager ("Latham, Charlie" in payroll) may appear, exactly once, and the other
// employee must never be named or merged into him.
const lathams = payroll.publicTier.filter((p) => /^latham\b/i.test(p.name));
if (lathams.length !== 1 || lathams[0].name !== 'Latham, Charlie' || !lathams[0].periods.every((x) => x.position === 'Assistant County Manager')) errors.push('Payroll named group must contain exactly one Latham: "Latham, Charlie", Assistant County Manager');
if (!lathams[0]?.flags.some((f) => /2 different employees/.test(f))) errors.push('Latham entry must keep its warning that the census lists two different employees with the same legal name');
// Any "Latham, <given name>" in public payroll data other than the Assistant County Manager's payroll name is a leak of the other employee.
if (/Latham,\s+(?!Charlie\b)[A-Z][a-z]+/.test(JSON.stringify([payroll, payrollFindings]))) errors.push('The second employee sharing the William Latham legal name must not be named in public payroll data');
if (!payrollFindings.keyObservations.some((o) => o.id === 'identity-linking')) errors.push('Payroll findings must keep the identity-linking observation');

// Records-response registry (provenance model) --------------------------------
const responsesRegistry = JSON.parse(await readFile(new URL('../data/records-responses.json', import.meta.url), 'utf8'));
const VALID_RESPONSE_STATUSES = new Set(Object.keys(responsesRegistry.meta.statusVocabulary));
const responseIds = new Set();
const contracts = JSON.parse(await readFile(new URL('../data/contracts-vendors.json', import.meta.url), 'utf8'));
const rnIds = new Set([...payrollFindings.recordsNeededItems.map((i) => i.id), ...contracts.recordsNeeded.map((i) => i.id)]);
for (const r of responsesRegistry.responses) {
  if (responseIds.has(r.id)) errors.push(`Duplicate records-response id: ${r.id}`);
  responseIds.add(r.id);
  if (!VALID_RESPONSE_STATUSES.has(r.status)) errors.push(`Records response ${r.id} has unrecognized status "${r.status}"`);
  if (['fulfilled', 'partially_fulfilled'].includes(r.status) && !r.requestWording.located) errors.push(`Records response ${r.id} cannot be ${r.status} while the original request wording is not located`);
  if (!/^https:\/\/drive\.google\.com\/drive\/folders\/[\w-]+/.test(r.publicArchive.url)) errors.push(`Records response ${r.id} archive URL is not a Google Drive folder link`);
  if (!/not Clay County/i.test(r.publicArchive.maintainedBy) || !/not operated or controlled by Clay County/i.test(r.publicArchive.explanation)) errors.push(`Records response ${r.id} must state that the evidence archive is researcher-maintained and not operated by Clay County`);
  if (r.originalFile.filesReceived !== r.filesReceived.length) errors.push(`Records response ${r.id}: filesReceived count does not match the file list`);
  for (const id of r.unresolvedQuestionIds) if (!rnIds.has(id)) errors.push(`Records response ${r.id} references unknown records-needed item ${id}`);
}
const prr = responsesRegistry.responses.find((r) => r.id === payroll.provenance.registryId);
if (!prr) errors.push('Payroll provenance.registryId does not match any records-response entry');
else {
  if (prr.originalFile.sha256 !== payroll.provenance.archive.sha256) errors.push('Registry ZIP SHA-256 differs from the hash recorded by the payroll build');
  if (prr.originalFile.name !== payroll.provenance.archive.file || prr.originalFile.bytes !== payroll.provenance.archive.bytes) errors.push('Registry ZIP name/size differs from the payroll build');
  const byName = (a, b) => a.localeCompare(b);
  const built = payroll.provenance.files.map((f) => f.name).sort(byName).join('|');
  if (built !== [...prr.filesReceived].sort(byName).join('|')) errors.push('Registry file list differs from the files hashed by the payroll build');
  if (prr.requestNumber !== payroll.meta.requestId) errors.push('Registry request number differs from payroll meta.requestId');
}
// Google Drive is an evidence archive, never a runtime dependency: no code may hard-code or fetch it.
for (const dir of ['app', 'components', 'lib']) {
  for (const entry of readdirSync(new URL(`../${dir}/`, import.meta.url), { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    const text = readFileSync(join(entry.parentPath, entry.name), 'utf8');
    if (/drive\.google\.com|googleapis\.com\/drive/.test(text)) errors.push(`${dir}/${entry.name} references Google Drive directly; the archive URL must come from data/records-responses.json only`);
  }
}

// Records Needed drafts are research-only; nothing may be marked sendable.
for (const item of payrollFindings.recordsNeededItems) {
  if (item.sendEnabled) errors.push(`Payroll records-needed item ${item.id} must not be send-enabled`);
  for (const ref of item.relatedFindingIds) if (!payrollFindings.keyObservations.some((o) => o.id === ref) && !payrollFindings.leadChecks.some((c) => c.id === ref)) errors.push(`Payroll records-needed item ${item.id} references unknown finding ${ref}`);
}
if (new Set(payrollFindings.recordsNeededItems.map((i) => i.id)).size !== payrollFindings.recordsNeededItems.length) errors.push('Duplicate payroll records-needed id');

// Commissioner comparison: recompute every difference and forbid explanations or loaded wording.
for (const row of payroll.commissionerComparison.rows) {
  if (row.comparisonApplies) {
    const expected = Math.round((row.officialPayrollAmount - row.comparisonFigure) * 100) / 100;
    if (Math.abs(expected - row.difference) > 0.005) errors.push(`Commissioner comparison ${row.personId}@${row.periodId}: difference does not equal official amount minus comparison figure`);
  } else if (row.comparisonFigure !== null || row.difference !== null) errors.push(`Commissioner comparison ${row.personId}@${row.periodId}: a partial-period row must not carry a comparison`);
}
const LOADED = /overpa(?:y|id|yment)|improper|unauthori[sz]ed|extra pay|illegal|kickback|padding/i;
for (const [label, text] of [['payroll.json', JSON.stringify(payroll)], ['payroll-findings.json', JSON.stringify(payrollFindings)], ['records-responses.json', JSON.stringify(responsesRegistry)], ['payroll-panel.tsx', readFileSync(new URL('../components/dashboard/payroll-panel.tsx', import.meta.url), 'utf8')]]) {
  const hit = text.match(LOADED);
  if (hit) errors.push(`${label} uses loaded wording ("${hit[0]}"); differences may not be characterized beyond what the records establish`);
}

// Public Safety Complex, taxes/assessments, and Black Creek are read purely
// to confirm they parse as valid JSON (they're consumed directly by the UI
// with no additional cross-referencing needed yet).
JSON.parse(await readFile(new URL('../data/public-safety-complex.json', import.meta.url), 'utf8'));
JSON.parse(await readFile(new URL('../data/taxes-assessments.json', import.meta.url), 'utf8'));
JSON.parse(await readFile(new URL('../data/black-creek.json', import.meta.url), 'utf8'));

const contractIds = new Set();
for (const r of contracts.records) {
  if (contractIds.has(r.id)) errors.push(`Duplicate contract-registry id: ${r.id}`);
  contractIds.add(r.id);
  if (r.actualPayments !== null) errors.push(`Contract registry ${r.id} must not assert payments without a payment-ledger source`);
}
const contractInventory = JSON.parse(await readFile(new URL('../data/contracts-fy25-26.json', import.meta.url), 'utf8'));
const VALID_CHAIN_STATUSES = new Set(['FOUND', 'MISSING', 'N/A', 'NEEDS VERIFICATION']);
if (contractInventory.meta.documents_examined !== 427) errors.push('FY25/26 contract inventory document count changed unexpectedly');
if (contractInventory.meta.verified_actual_payments_identified !== 0) errors.push('FY25/26 contract inventory must show zero verified actual payments currently identified');
if (contractInventory.meta.clerk_index_metadata_only + contractInventory.meta.substantive_official_document_reviewed !== contractInventory.meta.inventory_records) {
  errors.push('FY25/26 evidence-depth counts do not reconcile to inventory records');
}
const inventoryKeys = new Set();
for (const r of contractInventory.records) {
  const key = `${r.document_type}|${r.record_number}|${r.title}`;
  if (inventoryKeys.has(key)) errors.push(`Duplicate FY25/26 inventory row: ${key}`);
  inventoryKeys.add(key);
  for (const field of ['procurement_status','award_status','contract_status','amendment_status','po_status','invoice_status','payment_status']) {
    if (!VALID_CHAIN_STATUSES.has(r[field])) errors.push(`Invalid ${field} on FY25/26 inventory row ${key}`);
  }
  if (!['CLERK INDEX METADATA ONLY','SUBSTANTIVE OFFICIAL DOCUMENT REVIEWED'].includes(r.evidence_basis)) errors.push(`Invalid evidence_basis on FY25/26 inventory row ${key}`);
  if (r.verified_actual_payments !== null) errors.push(`FY25/26 inventory row ${key} asserts actual payment without ledger evidence`);
}
if (contracts.recordsNeeded.length !== 8) errors.push(`Expected 8 contract Records Needed drafts, found ${contracts.recordsNeeded.length}`);
for (const request of contracts.recordsNeeded) {
  if (request.status !== 'draft_research_only' || request.sendEnabled !== false) errors.push(`Contract Records Needed item ${request.id} is not locked as a non-sending research draft`);
}
for (const id of ['2526-055','2526-014']) {
  const unresolved = contracts.records.find((record) => record.id === id);
  if (!unresolved || !/need.*procurement_chain_verification/.test(unresolved.status) || !/not verified/i.test(unresolved.vendor ?? '')) {
    errors.push(`Rejected-solicitation relationship ${id} is no longer explicitly unresolved`);
  }
}
const contractCsvHeader = (await readFile(new URL('../public/data/fy25-26-contract-inventory.csv', import.meta.url), 'utf8')).split('\n', 1)[0].split(',');
for (const column of ['approved_amount','contract_ceiling','verified_actual_payments']) {
  if (!contractCsvHeader.includes(column)) errors.push(`FY25/26 contract CSV is missing separate ${column} field`);
}

// --- Supplier invoices (PRR-2026-1194): generated public dataset ---------
// data/supplier-invoices.json is generated by scripts/build-supplier-invoices-dataset.mjs.
// These are structural safeguards against exactly the mistakes the
// terminology/privacy/attribution rules for this dataset exist to prevent —
// see RECORDS_NEEDED.md "Supplier invoices / accounts payable".
const supplierInvoices = JSON.parse(await readFile(new URL('../data/supplier-invoices.json', import.meta.url), 'utf8'));
if (supplierInvoices.meta.csvDownload.startsWith('/')) errors.push('Supplier-invoices csvDownload must be a relative path (no leading slash), like contracts-vendors.json\'s inventoryCsv, so the link works under a GitHub Pages base-path subdirectory');
const siPrr = responsesRegistry.responses.find((r) => r.id === supplierInvoices.meta.registryId);
if (!siPrr) errors.push('Supplier-invoices dataset registryId does not match any records-response entry');
else if (siPrr.originalFile.sha256 !== 'd868c970a5e5b843bdbb710fe5c5112fe79cc4ec55b73555e28566071bb24dc6') errors.push('PRR-2026-1194 registry ZIP SHA-256 has changed unexpectedly');
// "Approved" is the only status word that may ever mean money moved, and even
// that only with the disclaimer attached — Canceled/Denied/Draft/In Progress
// must never accumulate into anything read as spending.
const st = supplierInvoices.meta.statusTotals;
if (Object.keys(st).sort().join('|') !== ['Approved','Canceled','Denied','Draft','In Progress'].sort().join('|')) errors.push('Supplier-invoices statusTotals must carry exactly the five Workday statuses, with no combined/derived total field');
if (!/not proof of payment|not establish that funds were disbursed/i.test(supplierInvoices.meta.terminologyNote)) errors.push('Supplier-invoices dataset is missing its terminology disclaimer');
// Government/constitutional-office transfers must never appear in the external-vendor ranking.
const govNames = new Set(supplierInvoices.governmentTransfers.entities.map((g) => g.supplier));
for (const v of supplierInvoices.externalVendors.topByApprovedInvoiceValue) if (govNames.has(v.supplier)) errors.push(`Supplier-invoices external-vendor ranking includes a government transfer entity: ${v.supplier}`);
// Accounting bridge: every dollar of Approved invoice value must land in exactly one of these buckets,
// with zero unexplained remainder. Prevents a future change from silently double-counting or losing rows.
{
  const govApproved = supplierInvoices.governmentTransfers.entities.reduce((a, g) => a + g.approvedInvoiceValue, 0);
  const tierAApproved = supplierInvoices.namedOfficialReimbursements.reduce((a, r) => a + (r.approvedInvoiceAmount ?? 0), 0);
  const bridgeSum = govApproved + tierAApproved + supplierInvoices.employeeReimbursementsAggregated.approvedInvoiceValue + supplierInvoices.residentRefundsAggregated.approvedInvoiceValue + supplierInvoices.individualPayeesUnclassified.approvedInvoiceValue + supplierInvoices.externalVendors.totalApprovedInvoiceValue;
  const remainder = Math.round((supplierInvoices.meta.statusTotals.Approved - bridgeSum) * 100) / 100;
  if (Math.abs(remainder) > 0.01) errors.push(`Supplier-invoices accounting bridge does not reconcile: Approved total ${supplierInvoices.meta.statusTotals.Approved} minus buckets (government ${govApproved}, Tier A ${tierAApproved}, Tier B ${supplierInvoices.employeeReimbursementsAggregated.approvedInvoiceValue}, Tier C ${supplierInvoices.residentRefundsAggregated.approvedInvoiceValue}, unknown ${supplierInvoices.individualPayeesUnclassified.approvedInvoiceValue}, external vendors ${supplierInvoices.externalVendors.totalApprovedInvoiceValue}) leaves an unexplained remainder of ${remainder}`);
}
// Kirby Development's countywide invoice total must never be silently presented as the Carl Pugh Park contract's cost.
const kirby = supplierInvoices.contractCrossReference.find((c) => c.recordsNeededId === 'rn-2526-041-payments');
if (!kirby || !/COUNTYWIDE VENDOR TOTAL|NOT ATTRIBUTABLE/i.test(kirby.attributionStatus)) errors.push('Kirby Development contract cross-reference is missing its countywide-total misattribution warning');
if (kirby && kirby.match && kirby.contractCeiling != null && kirby.match.approvedInvoiceValue <= kirby.contractCeiling) errors.push('Kirby Development misattribution warning is no longer needed (countywide total is not larger than the single-contract ceiling) — re-check this safeguard');
for (const id of ['rn-2526-016-chain', 'rn-2526-074-payments']) {
  const c = supplierInvoices.contractCrossReference.find((x) => x.recordsNeededId === id);
  if (!c || !/PO-TO-CONTRACT ATTRIBUTION REQUIRED/.test(c.attributionStatus)) errors.push(`Contract cross-reference ${id} is missing its PO-to-contract attribution warning`);
}
// Mixed-purpose vendors may only ever appear as possible matches, never verified; Bound Tree Medical must never appear as software at all.
for (const name of ['Motorola Solutions', 'Butterfly Network']) {
  if (supplierInvoices.softwareSaas.verifiedMatches.some((m) => m.vendor === name)) errors.push(`${name} must not appear in softwareSaas.verifiedMatches — its invoice activity mixes non-software items`);
  if (!supplierInvoices.softwareSaas.possibleMatches.some((m) => m.vendor === name)) errors.push(`${name} is missing from softwareSaas.possibleMatches`);
}
if (supplierInvoices.softwareSaas.verifiedMatches.some((m) => /bound tree/i.test(m.vendor)) || supplierInvoices.softwareSaas.possibleMatches.some((m) => /bound tree/i.test(m.vendor))) errors.push('Bound Tree Medical must never appear as a software/SaaS match (verified or possible) — it is an EMS/medical supply vendor');
// Terminology guard: no publishable text describing this dataset's figures may claim disbursement.
// (The dataset's own terminologyNote quotes forbidden words as negative examples, so it is excluded
// from this scan rather than re-worded around a regex.)
const PAID_LANGUAGE = /invoices? (?:were|was|are|is) paid|vendor payments totaling|\bmoney paid\b|checks issued|paid out to (?:the )?suppliers?/i;
const { terminologyNote: _omit, ...supplierInvoicesMetaForScan } = supplierInvoices.meta;
for (const [label, text] of [['supplier-invoices.json', JSON.stringify({ ...supplierInvoices, meta: supplierInvoicesMetaForScan })], ['civic-records-panel.tsx', readFileSync(new URL('../components/dashboard/civic-records-panel.tsx', import.meta.url), 'utf8')]]) {
  const hit = text.match(PAID_LANGUAGE);
  if (hit) errors.push(`${label} uses payment-implying language ("${hit[0]}") for supplier-invoice figures; invoice approval does not establish disbursement`);
}
// Individual-payee privacy: only Tier A officials may be named row-level; the CSV must never contain a Tier B/C/unknown supplier type.
// Checked as a raw substring test (not column-split) because CSV fields like `memo` are quoted and may
// contain commas, which would throw off a naive split(',') column index.
const WITHHELD_CSV_TYPES = ['employee_reimbursement_aggregated', 'resident_refund_aggregated', 'unknown', 'elected_or_senior_official_reimbursement'];
const csvText = await readFile(new URL('../public/data/supplier-invoices-fy2024-26.csv', import.meta.url), 'utf8');
for (const type of WITHHELD_CSV_TYPES) if (csvText.includes(`,${type},`)) errors.push(`Supplier-invoices CSV contains a row with disallowed supplier_type "${type}" — only business/government_entity rows may be row-level`);
// The free-text `memo` field is not sanitized by supplier classification (it can name a third-party
// individual on an ordinary business invoice) and must never be reintroduced into the general CSV.
if (csvText.split('\n', 1)[0].split(',').includes('memo')) errors.push('Supplier-invoices CSV must not include the memo column — it can name third-party individuals regardless of the supplier\'s own classification');

const publicEmail = JSON.parse(await readFile(new URL('../data/public-email.json', import.meta.url), 'utf8'));
if (/\bcommitted malfeasance\b/i.test(JSON.stringify(publicEmail))) errors.push('Public-email dataset contains a prohibited legal conclusion');
if (publicEmail.mailboxes.length !== 5) errors.push('Public-email review must cover all five commissioner mailboxes');
for (const item of publicEmail.validationCases ?? []) {
  if (item.status === 'awaiting_complete_thread' && item.archiveUrl !== null) errors.push(`Validation case ${item.label} has an archive URL but remains marked awaiting`);
}
const contacts = JSON.parse(await readFile(new URL('../data/public-records-contacts.json', import.meta.url), 'utf8'));
for (const c of contacts.contacts) if (!c.url || !c.verified) errors.push(`Public-record contact ${c.id} lacks a URL or verification date`);
const humanServices = JSON.parse(await readFile(new URL('../data/human-services.json', import.meta.url), 'utf8'));
if (humanServices.meta.functionalTotal !== 32422874) errors.push('Human Services functional total no longer matches the adopted FY2025-26 budget');
const impactFees = JSON.parse(await readFile(new URL('../data/impact-fees.json', import.meta.url), 'utf8'));
for (const rate of impactFees.rates) if (rate.total2025 <= 0 || rate.total2026 <= 0) errors.push(`Invalid impact-fee total for ${rate.landUse}`);

for (const inv of investigationMeta) {
  if (inv.photoUrl) {
    const localPath = new URL(`../public${inv.photoUrl}`, import.meta.url);
    if (!existsSync(localPath)) errors.push(`Investigation ${inv.id} references photoUrl "${inv.photoUrl}" but no such file exists under public/`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Data audit passed: ${records.length} records, ${sources.length} sources, ${ids.size} unique IDs, ` +
      `${leads.length} leads, ${evidence.length} evidence entries, ${timeline.length} timeline events, ${recordsRequests.length} records requests, ` +
      `${stateFunding.requests.length} state-funding requests, ${geoSpending.classification.length} geographic-spending entries.`,
  );
}
