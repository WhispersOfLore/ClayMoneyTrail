#!/usr/bin/env node
// Reproducible importer for a Workday "Find Supplier Invoices" export
// (PRR-2026-1194: one .xlsx inside one ZIP, no cover letter, no header row).
//
//   ORIGINAL ZIP -> hash -> parse -> classify -> sanitize -> PRIVATE + PUBLIC datasets
//
// Read-only on the ZIP.
//
// TERMINOLOGY (binding on every field name and string this script writes):
// these are SUPPLIER INVOICES, not payments. "Approved" means the county's
// Workday system approved the invoice for payment processing — it does not
// by itself establish that funds were disbursed. Canceled, Denied, Draft, and
// In Progress invoices are not spending. Never write "payment", "spending",
// "money paid", or "checks issued" for a figure that comes only from this
// export; write "invoice", "approved invoice value", or "invoice activity".
//
// PRIVACY MODEL (three tiers for individual-named suppliers; see README.md):
//   Tier A — elected officials / senior public officials: named, row-level.
//   Tier B — ordinary employee reimbursements: aggregated only, never named.
//   Tier C — private resident refunds: aggregated only, never named.
//   Unknown — individual-shaped supplier name, tier not determinable from
//     the fields in this export: aggregated only, never named (same as B/C).
// Businesses and government entities are never aggregated away: full
// row-level detail is preserved (JSON for the top vendors, full CSV for
// everything) because they are not private individuals.
//
// Usage: node scripts/build-supplier-invoices-dataset.mjs <response.zip> [--private-dir DIR] [--out FILE] [--csv FILE]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { readZipEntries } from './lib/zip-reader.mjs';
import { readXlsx } from './lib/xlsx-reader.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const zipPath = args.find((a) => !a.startsWith('--') && a !== flag('--private-dir') && a !== flag('--out') && a !== flag('--csv'));
if (!zipPath) throw new Error('Usage: node scripts/build-supplier-invoices-dataset.mjs <response.zip> [--private-dir DIR] [--out FILE] [--csv FILE]');
const privateDir = flag('--private-dir', 'research-staging/supplier-invoices-prr-2026-1194');
const outFile = flag('--out', 'data/supplier-invoices.json');
const csvFile = flag('--csv', 'public/data/supplier-invoices-fy2024-26.csv');

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const round2 = (n) => Math.round(n * 100) / 100;
const sum2 = (rows, key) => round2(rows.reduce((a, r) => a + r[key], 0));

// ---------------------------------------------------------------- parse ---
const archive = readFileSync(zipPath);
const zipEntries = [...readZipEntries(archive).entries()].map(([name, entry]) => {
  const buf = entry.read();
  return { name, bytes: buf.length, sha256: sha256(buf) };
});
if (zipEntries.length !== 1) throw new Error(`Expected exactly one file in the ZIP, found ${zipEntries.length}: ${zipEntries.map((e) => e.name).join(', ')}`);
const sourceFile = zipEntries[0].name;
const xlsxBuffer = readZipEntries(archive).get(sourceFile).read();
const parsed = readXlsx(xlsxBuffer);
if (parsed.sheets.length !== 1) throw new Error(`Expected exactly one sheet, found ${parsed.sheets.length}: ${parsed.sheets.join(', ')}`);

const meta = parsed.rows.filter((r) => r.rowNumber <= 3);
const title = meta.find((r) => r.rowNumber === 1)?.cells[0];
const companyRow = meta.find((r) => r.rowNumber === 2);
const dateFilterRow = meta.find((r) => r.rowNumber === 3);
if (title !== 'Find Supplier Invoices') throw new Error(`Unexpected report title: ${title}`);
if (companyRow?.cells[0] !== 'Company') throw new Error(`Unexpected row 2 label: ${companyRow?.cells[0]}`);
if (dateFilterRow?.cells[0] !== 'Invoice Date On or After') throw new Error(`Unexpected row 3 label: ${dateFilterRow?.cells[0]}`);
const company = companyRow.cells[1];
const invoiceDateOnOrAfter = dateFilterRow.cells[1];

const dataRows = parsed.rows.filter((r) => r.rowNumber >= 4);
const malformed = dataRows.filter((r) => r.cells.length !== 11 || !r.cells[1] || typeof r.cells[8] !== 'number');
if (malformed.length) throw new Error(`${malformed.length} data rows do not match the expected 11-column layout, e.g. row ${malformed[0].rowNumber}`);

const invoices = dataRows.map((r) => {
  const [, invoiceNumber, companyCell, status, supplier, supplierRef, invoiceDate, memo, amount, poNumber] = r.cells;
  return { sourceRow: r.rowNumber, invoiceNumber, company: companyCell, status, supplier, supplierRef, invoiceDate, memo, amount, poNumber };
});
const byInvoiceNumber = Map.groupBy(invoices, (i) => i.invoiceNumber);
const duplicateInvoiceNumbers = [...byInvoiceNumber.entries()].filter(([, rows]) => rows.length > 1);
if (duplicateInvoiceNumbers.length) throw new Error(`${duplicateInvoiceNumbers.length} invoice numbers appear more than once, e.g. ${duplicateInvoiceNumbers[0][0]}`);

const STATUSES = ['Approved', 'In Progress', 'Canceled', 'Denied', 'Draft'];
const unknownStatuses = [...new Set(invoices.map((i) => i.status))].filter((s) => !STATUSES.includes(s));
if (unknownStatuses.length) throw new Error(`Unrecognized invoice status values: ${unknownStatuses.join(', ')}`);

const fiscalYearOf = (isoDate) => {
  if (!isoDate) return null;
  const [y, m] = isoDate.split('-').map(Number);
  return m >= 10 ? `FY${y}-${String(y + 1).slice(2)}` : `FY${y - 1}-${String(y).slice(2)}`;
};
for (const i of invoices) i.fiscalYear = fiscalYearOf(i.invoiceDate);

// ------------------------------------------------------- classification ---
// Government transfers: an explicit allowlist, not a regex on "Clay County",
// because plenty of real businesses ("Clay County Transmission", "Clay County
// Auto Tag Agency") coincidentally share the county's name.
const GOVERNMENT_TRANSFERS = new Map([
  ['Clay County Sheriff', { kind: 'constitutional_office_transfer', label: 'Clay County Sheriff (constitutional office)' }],
  ["Clay County Sheriff's Office - School Resource Officer", { kind: 'constitutional_office_transfer', label: 'Clay County Sheriff — School Resource Officer' }],
  ['Clay County Clerk Of The Circuit Court', { kind: 'constitutional_office_transfer', label: 'Clay County Clerk of the Circuit Court (constitutional office)' }],
  ['Clay County Property Appraiser', { kind: 'constitutional_office_transfer', label: 'Clay County Property Appraiser (constitutional office)' }],
  ['Clay County Supervisor Of Elections', { kind: 'constitutional_office_transfer', label: 'Clay County Supervisor of Elections (constitutional office)' }],
  ['Clay County Tax Collector', { kind: 'constitutional_office_transfer', label: 'Clay County Tax Collector (constitutional office)' }],
  ['Clay County School Board', { kind: 'other_government_entity', label: 'Clay County School Board (separate governmental entity, not a BCC constitutional office)' }],
  ['Clay County Utility Authority', { kind: 'other_government_entity', label: 'Clay County Utility Authority (independent special district)' }],
  ['Clay County Health Department', { kind: 'other_government_entity', label: 'Clay County Health Department (state-county partnership agency)' }],
  ['Putnam County Board of County Commissioners', { kind: 'other_government_entity', label: "Putnam County Board of County Commissioners (another county's government)" }],
  // Added after a reconciliation pass over the top-50 external-vendor list: all
  // three are unambiguous governmental entities (confirmed by invoice-level
  // memo/reference patterns, not just name), not private vendors.
  ['City of Green Cove Springs', { kind: 'other_government_entity', label: 'City of Green Cove Springs (municipal government) — recurring small-dollar utility/service billing tied to specific county facility addresses' }],
  ['Jacksonville Trans Auth', { kind: 'other_government_entity', label: 'Jacksonville Transportation Authority (regional government transportation authority) — recurring monthly billing' }],
  ['Florida Dept Of Juvenile Justice', { kind: 'other_government_entity', label: 'Florida Department of Juvenile Justice (state agency) — recurring monthly billing, consistent with the state-mandated county cost-share for juvenile detention' }],
]);

// Tier A: the same named public-official roster already published in
// data/payroll.json's publicTier, matched here by census legal name. Reused
// for consistency rather than re-derived, so "who is named" answers the same
// way across every ClayMoneyTrail dataset.
const payrollPublicTier = JSON.parse(readFileSync('data/payroll.json', 'utf8')).publicTier;
// Some officials' invoices use a commonly-used first name that matches
// neither their census legal name nor their payroll-report name (e.g. "Betsy
// Condon", "Jim Renninger" — the same names already used for them elsewhere
// in ClayMoneyTrail, e.g. REPEAT_ENTITIES.md). Payroll-preferred names
// ("Latham, Charlie" -> "Charlie Latham") are covered automatically.
const KNOWN_ALIASES = { 'condon-elizabeth-a': 'Betsy Condon', 'renninger-james-b': 'Jim Renninger' };
const TIER_A = new Map();
for (const p of payrollPublicTier) {
  const info = { id: p.id, officialName: p.censusLegalName, tierReason: p.tierReason };
  const [last, first] = p.name.split(', ');
  for (const alias of [p.censusLegalName, `${first} ${last}`, KNOWN_ALIASES[p.id]].filter(Boolean)) TIER_A.set(alias, info);
}

// Individual-shaped supplier name: "First [Middle/Initial] Last", no digits.
// A coarse shape heuristic that over-catches short 2-word BUSINESS names
// ("Duval Ford", "Workday Inc"), so it is never used alone — see classify().
const personShape = (s) => /^[A-Z][a-z]+(\s[A-Z]\.?)?\s[A-Z][a-zA-Z'-]+$/.test(s ?? '') && !/\d/.test(s ?? '');
// Business words that appear inside an otherwise person-shaped name (entity
// suffixes, trade names, brand words). Catches "Workday Inc", "Galls LLC",
// "Sherwin Williams", "Duval Ford", etc. before they are ever treated as a
// person, even though the corresponding legal-entity-suffix words alone
// would not have excluded them from the 2-word shape test above.
const BUSINESS_WORDS = /\b(INC|LLC|LLP|LP|CORP|CORPORATION|CO|COMPANY|BANK|SYSTEMS|SYSTEM|SERVICE|SERVICES|ENTERPRISE|ENTERPRISES|SUPPLY|SUPPLIES|FOUNDATION|GROUP|SOLUTIONS|WATERWORKS|SURFACES|WARE|FORD|CHEVROLET|TOYOTA|HONDA|DODGE|GMC|MOTORS|ROOFING|CONSTRUCTION|CONTRACTING|ELECTRIC|ELECTRICAL|PLUMBING|MECHANICAL|ENGINEERING|CONSULTING|ASSOCIATES|PARTNERS|HOLDINGS|TRUST|INDUSTRIES|INTERNATIONAL|TECHNOLOGIES|TECHNOLOGY|MANAGEMENT|RENTAL|RENTALS|REALTY|PROPERTIES|CAPS|WINLECTRIC|MATERIALS|ANALYTICS|LABORATORIES|PROMOTIONS|FIRM|FOIA|WATER|INFLATABLES|TANK|PRESS|PRINTS|PRINT|MEDIA|DIGITAL|DATA|STUDIO|DESIGN|LABS|LAW|SENSATIONS|FIRE|SAFETY|SECURITY|ARMOR|APPAREL|UNIFORMS|FLORIDA|JACKSONVILLE|VISIT|DESTINATIONS|PRODUCTION|PRODUCTIONS)\b/i;

// Per-supplier aggregates, used to apply the two structural business signals:
// a supplier that shows up on 2+ distinct POs, or whose average invoice size
// is >= $5,000, is transacting through the county's formal procurement
// process at a scale reimbursements and refunds never reach in this export.
const bySupplierAll = Map.groupBy(invoices, (i) => i.supplier);
function supplierType(supplier) {
  if (TIER_A.has(supplier)) return 'elected_or_senior_official_reimbursement';
  if (GOVERNMENT_TRANSFERS.has(supplier)) return 'government_entity';
  if (!personShape(supplier) || BUSINESS_WORDS.test(supplier)) return 'business';
  const rows = bySupplierAll.get(supplier);
  const poCount = new Set(rows.map((r) => r.poNumber).filter(Boolean)).size;
  const avgInvoice = rows.reduce((a, r) => a + r.amount, 0) / rows.length;
  if (poCount >= 2 || avgInvoice >= 5000) return 'business';
  return 'individual_unresolved_tier'; // resolved to employee/resident/unknown below
}
for (const i of invoices) i.supplierType = supplierType(i.supplier);

// Among individual-shaped, non-Tier-A suppliers, sub-classify by the
// supplier-reference-code prefix Workday assigns (observed directly in the
// data, not assumed): "Travel/Boot/Mileage/Tuition"-style prefixes are
// operational employee reimbursements; "Refund"-style prefixes, or a memo
// naming a deposit/refund, are resident refunds. Everything else (the
// majority — mostly blank references with a program/event memo) is left
// "unknown" rather than guessed, per the sanitization decision: unknown
// individuals get the same treatment as Tier B/C (aggregated, never named).
const EMPLOYEE_REF_PREFIX = /^(Travel|Boot|Boots|Uniform|Mileage|Tuition|Tutition|Reimbursement|CCFR)/i;
const RESIDENT_REF_PREFIX = /^Refund/i;
const looksLikeResidentRefund = (i) => RESIDENT_REF_PREFIX.test(i.supplierRef ?? '') || /\b(deposit refund|security deposit|rental refund)\b/i.test(i.memo ?? '');
function individualBucket(i) {
  if (EMPLOYEE_REF_PREFIX.test(i.supplierRef ?? '')) return 'employee_reimbursement_aggregated';
  if (looksLikeResidentRefund(i)) return 'resident_refund_aggregated';
  return 'unknown';
}
for (const i of invoices) if (i.supplierType === 'individual_unresolved_tier') i.supplierType = individualBucket(i);

// ------------------------------------------------------------- rollups ---
const statusTotals = Object.fromEntries(STATUSES.map((s) => [s, sum2(invoices.filter((i) => i.status === s), 'amount')]));

const govRows = invoices.filter((i) => i.supplierType === 'government_entity');
const governmentTransfers = [...GOVERNMENT_TRANSFERS.entries()].map(([supplier, info]) => {
  const rows = govRows.filter((r) => r.supplier === supplier);
  if (rows.length === 0) return null;
  const dates = rows.map((r) => r.invoiceDate).sort((a, b) => a.localeCompare(b));
  return { supplier, kind: info.kind, label: info.label, invoiceCount: rows.length, statusTotals: Object.fromEntries(STATUSES.map((s) => [s, sum2(rows.filter((r) => r.status === s), 'amount')])), approvedInvoiceValue: sum2(rows.filter((r) => r.status === 'Approved'), 'amount'), firstInvoiceDate: dates[0], lastInvoiceDate: dates.at(-1) };
}).filter(Boolean);

const businessRows = invoices.filter((i) => i.supplierType === 'business');
const businessBySupplier = Map.groupBy(businessRows, (i) => i.supplier);
const externalVendorSummaries = [...businessBySupplier.entries()].map(([supplier, rows]) => {
  const dates = rows.map((r) => r.invoiceDate).sort((a, b) => a.localeCompare(b));
  return { supplier, invoiceCount: rows.length, statusTotals: Object.fromEntries(STATUSES.map((s) => [s, sum2(rows.filter((r) => r.status === s), 'amount')])), approvedInvoiceValue: sum2(rows.filter((r) => r.status === 'Approved'), 'amount'), poNumberCount: new Set(rows.map((r) => r.poNumber).filter(Boolean)).size, firstInvoiceDate: dates[0], lastInvoiceDate: dates.at(-1) };
}).sort((a, b) => b.approvedInvoiceValue - a.approvedInvoiceValue);

const officialRows = invoices.filter((i) => i.supplierType === 'elected_or_senior_official_reimbursement').map((i) => ({ official: i.supplier, tierReason: TIER_A.get(i.supplier).tierReason, invoiceNumber: i.invoiceNumber, invoiceStatus: i.status, invoiceDate: i.invoiceDate, fiscalYear: i.fiscalYear, memo: i.memo, supplierRef: i.supplierRef, approvedInvoiceAmount: i.status === 'Approved' ? i.amount : null, invoiceAmount: i.amount, poNumber: i.poNumber, sourceRow: i.sourceRow })).sort((a, b) => a.official.localeCompare(b.official) || a.invoiceDate.localeCompare(b.invoiceDate));

function aggregateBucket(bucketName) {
  const rows = invoices.filter((i) => i.supplierType === bucketName);
  const suppliers = new Set(rows.map((r) => r.supplier));
  return { supplierCount: suppliers.size, invoiceCount: rows.length, statusTotals: Object.fromEntries(STATUSES.map((s) => [s, sum2(rows.filter((r) => r.status === s), 'amount')])), approvedInvoiceValue: sum2(rows.filter((r) => r.status === 'Approved'), 'amount') };
}
const employeeReimbursementsAggregated = { ...aggregateBucket('employee_reimbursement_aggregated'), note: 'Ordinary county employee reimbursements (travel, safety boots/uniforms, mileage, tuition/training). Aggregated per the Tier B privacy policy: not named, regardless of amount, unless a specific documented public-interest reason later requires it.' };
const residentRefundsAggregated = { ...aggregateBucket('resident_refund_aggregated'), note: 'Refunds to private residents (facility/security deposits, rental refunds, and similar routine refunds). Aggregated per the Tier C privacy policy and never named — ClayMoneyTrail does not create a searchable directory of residents receiving routine refunds. The original county-produced record remains accessible only through the researcher-maintained public evidence archive, by the researcher\'s deliberate choice, not through this dataset.' };
const individualPayeesUnclassified = { ...aggregateBucket('unknown'), note: 'Individual-named suppliers whose invoices could not be reliably sorted into an employee-reimbursement or resident-refund category from the reference code and memo fields in this export (most are recurring small stipends or program payments with no reference code, e.g. recreation-program instructor fees). Aggregated and not named, using the same policy as Tier B/C, because their status is genuinely unresolved from this record alone.' };

// ---------------------------------------------------- review flags ---
const findRows = (supplier, po) => invoices.filter((i) => i.supplier === supplier && (!po || i.poNumber === po));
const dbCivilRows = findRows('DB Civil Construction, LLC', 'PO-1012684');
const dbCivilFlag = {
  id: 'rf-2026-1194-db-civil-po-1012684',
  label: 'MULTIPLE CANCELED / DENIED INVOICE RECORDS — CONTEXT REQUIRED',
  vendor: 'DB Civil Construction, LLC',
  poNumber: 'PO-1012684',
  whatTheRecordShows: `${dbCivilRows.length} invoice records on PO-1012684: ${dbCivilRows.map((r) => `${r.status} $${r.amount.toLocaleString()} (${r.invoiceDate}, ${r.invoiceNumber})`).join('; ')}.`,
  whatWeStillNeedToKnow: 'Whether these represent corrections, resubmissions, replacement invoices, duplicate system records, or separate invoice events. Cancellation and denial do not themselves establish anything improper.',
  recordsThatCouldResolve: ['Invoice-detail history for PO-1012684', 'Workday event/audit history for these invoice numbers', 'PO backup documentation', 'Replacement or correction records, if any'],
  sourceRows: dbCivilRows.map((r) => r.sourceRow),
};
const wgiRows = invoices.filter((i) => i.supplier === 'WGI Inc');
const wgiCanceled = sum2(wgiRows.filter((r) => r.status === 'Canceled'), 'amount');
const wgiApproved = sum2(wgiRows.filter((r) => r.status === 'Approved'), 'amount');
const wgiFlag = {
  id: 'rf-2026-1194-wgi-high-canceled',
  label: 'HIGH CANCELED-INVOICE ACTIVITY — CONTEXT REQUIRED',
  vendor: 'WGI Inc',
  whatTheRecordShows: `Canceled-status invoice value ($${wgiCanceled.toLocaleString()}) exceeds Approved-status invoice value ($${wgiApproved.toLocaleString()}) across ${new Set(wgiRows.map((r) => r.poNumber).filter(Boolean)).size} POs. Canceled invoice value does not mean money was paid and then lost — it means an invoice record was canceled in Workday.`,
  whatWeStillNeedToKnow: 'Whether this is routine Workday correction/resubmission activity, a project change, replaced invoices, or something else.',
  poNumbers: [...new Set(wgiRows.map((r) => r.poNumber).filter(Boolean))],
  sourceRows: wgiRows.map((r) => r.sourceRow),
};

// ---------------------------------------------- contract cross-reference ---
const supplierByExactName = new Map(externalVendorSummaries.map((s) => [s.supplier, s]));
const contractMatch = (vendorName, poCount, businessName) => {
  const s = supplierByExactName.get(businessName);
  return s ? { matchedSupplier: businessName, invoiceCount: s.invoiceCount, approvedInvoiceValue: s.approvedInvoiceValue, statusTotals: s.statusTotals, poNumberCount: poCount ?? s.poNumberCount, firstInvoiceDate: s.firstInvoiceDate, lastInvoiceDate: s.lastInvoiceDate } : null;
};
const contractCrossReference = [
  { recordsNeededId: 'rn-2526-084-payments', vendor: 'Vector Disease Control International', contract: '2025/2026-0173', contractCeiling: null, match: contractMatch('Vector Disease Control International', null, 'Vector Disease Control International'), attributionStatus: 'MATCHED — a single named supplier with no other identified county contracts; still not confirmed which PO(s) map to this specific agreement without contract-file cross-check.' },
  { recordsNeededId: 'rn-2526-073-payments', vendor: "Fly'n Bryan Trailer Sales dba FB Trailers", contract: '2025/2026-0207', contractCeiling: 75196, match: contractMatch("Fly'n Bryan Trailer Sales dba FB Trailers", null, "Fly'n Bryan Trailer Sales LLC"), attributionStatus: 'Approved invoice value is below the identified contract ceiling. This is not "savings" — the contract may be as-needed or the invoice record may be incomplete.' },
  { recordsNeededId: 'rn-2526-016-chain', vendor: 'Eisman & Russo, Inc.', contract: '2025/2026-229', contractCeiling: null, match: contractMatch('Eisman & Russo, Inc.', null, 'Eisman & Russo Inc'), attributionStatus: 'PO-TO-CONTRACT ATTRIBUTION REQUIRED — do not assume these invoices belong to the SUN Trail procurement specifically until PO/contract attribution is established.' },
  { recordsNeededId: 'rn-2526-074-payments', vendor: 'H&H Land and Marine, LLC', contract: '2025/2026-0192', contractCeiling: null, match: contractMatch('H&H Land and Marine, LLC', null, 'H & H Land & Marine LLC'), attributionStatus: 'PO-TO-CONTRACT ATTRIBUTION REQUIRED — do not compare this total against the previously identified $156,770.20 award until all invoices/POs are confirmed to belong to that exact contract.' },
  { recordsNeededId: 'rn-2526-041-payments', vendor: 'Kirby Development, Inc.', contract: '2025/2026-0193', contractCeiling: 250559.42, match: contractMatch('Kirby Development, Inc.', null, 'Kirby Development Inc'), attributionStatus: 'COUNTYWIDE VENDOR TOTAL — NOT ATTRIBUTABLE TO THIS CONTRACT. This figure is Kirby Development\'s entire invoice activity with the county across all its contracts in the covered window, not the cost of the Carl Pugh Park drainage contract (ceiling $250,559.42). Which PO(s), if any, correspond to that specific contract is still unidentified.' },
  { recordsNeededId: 'rn-2526-017-payments', vendor: 'Firetrol Protection Systems, Inc.', contract: '2025/2026-0191', contractCeiling: null, match: null, attributionStatus: 'NO SUPPLIER MATCH FOUND in this invoice export. Remains unresolved.' },
  { recordsNeededId: 'rn-2526-087-chain', vendor: 'EMS supplies — ten awarded vendors', contract: null, contractCeiling: null, match: null, attributionStatus: 'UNRESOLVED — the ten awarded vendor names are not yet identified, so no cross-reference against this invoice export is possible yet.' },
];
if (contractMatch('Kirby Development, Inc.', null, 'Kirby Development Inc')?.approvedInvoiceValue < contractCrossReference.find((c) => c.recordsNeededId === 'rn-2526-041-payments').contractCeiling) {
  throw new Error('Kirby Development countywide total is no longer larger than the single-contract ceiling — re-check the misattribution warning still applies');
}

// ------------------------------------------------------------ software ---
const softwareRecords = JSON.parse(readFileSync('data/contracts-fy25-26.json', 'utf8')).softwareRecords;
const norm = (s) => (s ?? '').toUpperCase().replace(/[.,'()&]/g, ' ').split(/\s+/).filter((w) => w && !['INC', 'LLC', 'LP', 'CORP', 'CO', 'PA', 'PLLC', 'LTD', 'THE', 'AND', 'OF', 'DBA'].includes(w)).join(' ');
const invoiceSupplierByNorm = new Map(externalVendorSummaries.map((s) => [norm(s.supplier), s]));
const EXCLUDED_SOFTWARE_MATCHES = new Map([['BOUND TREE MEDICAL OPERATIVE', { reason: 'EMS/medical supply vendor. A wordset name match to "Bound Tree Medical LLC" is a false positive for the software/SaaS category and is excluded.' }]]);
const MIXED_PURPOSE_VENDORS = new Set(['Motorola Solutions', 'Granicus / Carahsoft', 'Butterfly Network']);
const softwareSaas = { verifiedMatches: [], possibleMatches: [], excluded: [] };
for (const vendorName of new Set(softwareRecords.map((r) => r.normalized_vendor).filter(Boolean))) {
  if (EXCLUDED_SOFTWARE_MATCHES.has(vendorName)) { softwareSaas.excluded.push({ vendor: vendorName, ...EXCLUDED_SOFTWARE_MATCHES.get(vendorName) }); continue; }
  const exact = invoiceSupplierByNorm.get(norm(vendorName));
  if (!exact) continue;
  const entry = { vendor: vendorName, matchedSupplier: exact.supplier, invoiceCount: exact.invoiceCount, approvedInvoiceValue: exact.approvedInvoiceValue, poNumberCount: exact.poNumberCount };
  if (MIXED_PURPOSE_VENDORS.has(vendorName)) softwareSaas.possibleMatches.push({ ...entry, reason: 'Entity match confirmed, but this vendor\'s invoice activity may include non-software items (hardware, infrastructure, medical devices, or bundled services), so the approved invoice value should not be described as entirely software spending.' });
  else softwareSaas.verifiedMatches.push(entry);
}

// -------------------------------------------------------- fuel (Gate Petroleum) ---
const gateRows = invoices.filter((i) => i.supplier === 'Gate Petroleum Co');
const gateByFY = Map.groupBy(gateRows, (r) => r.fiscalYear);
const fuelConnection = {
  supplier: 'Gate Petroleum Co',
  invoiceCount: gateRows.length,
  statusTotals: Object.fromEntries(STATUSES.map((s) => [s, sum2(gateRows.filter((r) => r.status === s), 'amount')])),
  approvedInvoiceValue: sum2(gateRows.filter((r) => r.status === 'Approved'), 'amount'),
  poNumbers: [...new Set(gateRows.map((r) => r.poNumber).filter(Boolean))],
  byFiscalYear: [...gateByFY.entries()].map(([fy, rows]) => ({ fiscalYear: fy, invoiceCount: rows.length, approvedInvoiceValue: sum2(rows.filter((r) => r.status === 'Approved'), 'amount') })).sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear)),
  note: 'Preserved for the existing payroll/fuel research thread. Not yet linked to a specific fuel purchasing agreement or connected to any cost conclusion — that cross-reference is future work.',
};

// -------------------------------------------------------------- data quality ---
const negatives = invoices.filter((i) => i.amount < 0);
const noPO = invoices.filter((i) => !i.poNumber && i.status === 'Approved');

// ----------------------------------------------------------------- writes ---
const publicData = {
  meta: {
    registryId: 'PRR-2026-1194',
    asOf: new Date().toISOString().slice(0, 10),
    terminologyNote: "These are supplier invoices recorded in Clay County's Workday accounts-payable system, not proof of payment. \"Approved\" means the invoice was approved for payment processing in Workday; it does not by itself establish that funds were disbursed to the supplier. Canceled, Denied, Draft, and In Progress invoices are not county spending. This dataset and the pages built from it use \"invoice\", \"approved invoice value\", and \"invoice activity\" — never \"payment\", \"spending\", \"money paid\", or \"checks issued\" — unless a separate disbursement record establishes that funds actually moved.",
    coveredInvoiceDates: { start: invoiceDateOnOrAfter, end: invoices.map((i) => i.invoiceDate).sort((a, b) => a.localeCompare(b)).at(-1) },
    reportCompanyFilter: company,
    totalInvoiceRows: invoices.length,
    distinctSuppliers: bySupplierAll.size,
    distinctPONumbers: new Set(invoices.map((i) => i.poNumber).filter(Boolean)).size,
    statusTotals,
    statusDefinitions: {
      Approved: 'Approved for payment processing in Workday. Not itself proof of disbursement.',
      'In Progress': 'Still moving through approval; not yet approved or paid.',
      Canceled: 'The invoice record was canceled. Not county spending.',
      Denied: 'The invoice was denied. Not county spending.',
      Draft: 'Not yet submitted for approval. Not county spending.',
    },
    // Relative path (matches contracts-vendors.json's inventoryCsv convention) so the
    // link still resolves correctly under a GitHub Pages base-path subdirectory.
    csvDownload: csvFile.replace(/^public\//, ''),
  },
  governmentTransfers: {
    note: 'These are intra-government budget-draw transfers or payments to other governmental entities, not third-party vendor invoices. They must never be ranked alongside, or described as, external vendor spending.',
    entities: governmentTransfers.sort((a, b) => b.approvedInvoiceValue - a.approvedInvoiceValue),
  },
  externalVendors: {
    note: 'Third-party businesses. Full invoice-level detail for every business and government supplier is in the downloadable CSV; this list is the top 50 by approved invoice value for on-page display.',
    totalSuppliers: externalVendorSummaries.length,
    totalApprovedInvoiceValue: sum2(businessRows.filter((r) => r.status === 'Approved'), 'amount'),
    topByApprovedInvoiceValue: externalVendorSummaries.slice(0, 50),
  },
  namedOfficialReimbursements: officialRows,
  employeeReimbursementsAggregated,
  residentRefundsAggregated,
  individualPayeesUnclassified,
  contractCrossReference,
  reviewFlags: [dbCivilFlag, wgiFlag],
  softwareSaas,
  fuelConnection,
  dataQuality: {
    negativeAmountInvoices: { count: negatives.length, note: 'Credit / adjustment activity against an earlier invoice, not new spending and not treated as anomalous.' },
    approvedInvoicesWithoutPO: { count: noPO.length, note: 'Expected for employee reimbursements, refunds, utilities, and small purchases below the PO threshold. Not itself a review flag.' },
    ambiguousClassifications: [
      { supplier: 'Tax Collector #373118-0551 Code 701', note: 'Classified as business (external vendor) by default because its identity is not established. Invoice memos ("Body Storage Fees", "ARME"-prefixed references) suggest this may be a Medical Examiner or similar government billing code rather than literally the Clay County Tax Collector\'s office — the "Clay County Tax Collector" entity already tracked separately under government transfers is a much smaller, distinct total. Left unclassified rather than guessed; needs manual verification before being named as either a vendor or a government transfer.' },
    ],
  },
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(publicData, null, 2)}\n`);

// Full row-level CSV for every business and government-entity invoice (never
// for Tier A/B/C or unknown individuals — those stay aggregated-only above).
// `memo` is deliberately EXCLUDED: it is county staff's free-text field and,
// unlike the supplier name, is not itself sanitized by supplier classification
// — a memo on an ordinary business invoice can name a third-party individual
// (e.g. "Firefighter return-to-duty exam" invoices naming the employee, or a
// uniform order naming the wearer) or embed a utility/vendor account number.
// Tier A officials' own memos are reviewed by hand and published separately
// in namedOfficialReimbursements above; that is the only place memo appears.
const csvRows = invoices.filter((i) => i.supplierType === 'business' || i.supplierType === 'government_entity');
const csvHeader = ['invoice_number', 'invoice_status', 'fiscal_year', 'supplier', 'supplier_type', 'supplier_reference', 'invoice_date', 'invoice_amount', 'po_number', 'source_row'];
const csvEscape = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = [csvHeader.join(','), ...csvRows.map((r) => [r.invoiceNumber, r.status, r.fiscalYear, r.supplier, r.supplierType, r.supplierRef, r.invoiceDate, r.amount, r.poNumber, r.sourceRow].map(csvEscape).join(','))].join('\n');
mkdirSync(dirname(csvFile), { recursive: true });
writeFileSync(csvFile, `${csv}\n`);

// Private, complete dataset (never committed): every row, with its resolved
// supplierType, for later research and for the sensitive-data roster check.
mkdirSync(privateDir, { recursive: true });
const priv = (name, value) => writeFileSync(`${privateDir}/${name}`, `${JSON.stringify(value, null, 2)}\n`);
priv('invoice-rows.json', invoices);
priv('supplier-summaries.json', [...bySupplierAll.entries()].map(([supplier, rows]) => {
  const dates = rows.map((r) => r.invoiceDate).sort((a, b) => a.localeCompare(b));
  return { supplier, supplierType: rows[0].supplierType, invoiceCount: rows.length, approvedTotal: sum2(rows.filter((r) => r.status === 'Approved'), 'amount'), statusTotals: Object.fromEntries(STATUSES.map((s) => [s, sum2(rows.filter((r) => r.status === s), 'amount')])), poNumbers: [...new Set(rows.map((r) => r.poNumber).filter(Boolean))], firstInvoiceDate: dates[0], lastInvoiceDate: dates.at(-1) };
}).sort((a, b) => b.approvedTotal - a.approvedTotal));
const validationReport = {
  generatedAt: new Date().toISOString(),
  zipPath: basename(zipPath),
  zipSha256: sha256(archive),
  sourceFile: { name: sourceFile, bytes: zipEntries[0].bytes, sha256: zipEntries[0].sha256 },
  reportFilters: { company, invoiceDateOnOrAfter },
  totalDataRows: invoices.length,
  distinctSuppliers: bySupplierAll.size,
  distinctPOs: new Set(invoices.map((i) => i.poNumber).filter(Boolean)).size,
  statusTotals,
  supplierTypeBreakdown: Object.fromEntries([...Map.groupBy(invoices, (i) => i.supplierType).entries()].map(([k, v]) => [k, v.length])),
  dataQuality: [
    { id: 'negative-amount-rows', severity: 'info', count: negatives.length },
    { id: 'approved-without-po', severity: 'info', count: noPO.length },
  ],
};
priv('validation-report.json', validationReport);

console.log(`Parsed ${invoices.length} invoice rows, ${bySupplierAll.size} distinct suppliers, ${validationReport.distinctPOs} distinct POs.`);
console.log('Status totals:', statusTotals);
console.log('Supplier type breakdown:', validationReport.supplierTypeBreakdown);
console.log(`Wrote public dataset to ${outFile}, CSV (${csvRows.length} rows) to ${csvFile}, private dataset to ${privateDir}/.`);
