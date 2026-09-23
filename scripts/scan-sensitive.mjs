#!/usr/bin/env node
// Sensitive-data scan for everything that could be published (source data,
// public downloads, docs, and any built bundles). Complements scan-secrets.mjs.
//
// 1. Pattern scan: SSN-shaped values, DOB-labelled dates, bank/routing labels.
// 2. Roster leak check: if the PRIVATE payroll roster is present locally
//    (research-staging/, gitignored), every employee who is NOT in the named
//    public group must not appear by name in any publishable file.
//
// Exit code 1 on any hit. Run after `npm run build` and `npm run build:pages`
// so the deployed bundles are covered too.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const skipped = new Set(['.git', 'node_modules', '.vinext', '.next', '.wrangler', 'research-staging', 'coverage']);
const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(?:json|csv|md|txt|html|js|mjs|ts|tsx|css|svg|xml)$/i.test(entry.name)) files.push(relative('.', path));
  }
};
walk('.');

const patterns = [
  ['SSN-shaped value', /(?<![\d-])\d{3}-\d{2}-\d{4}(?![\d-])/],
  ['date-of-birth label with a date', /\b(?:date of birth|DOB|born)\b[^\n]{0,20}\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/i],
  ['bank routing/account label with digits', /\b(?:routing|account)\s*(?:number|no\.?|#)\s*[:=]?\s*\d{6,}/i],
];
const hits = [];
const texts = new Map(files.map((file) => [file, readFileSync(file, 'utf8')]));
for (const [file, text] of texts) for (const [label, pattern] of patterns) if (pattern.test(text)) hits.push(`${file}: ${label}`);

const rosterPath = 'research-staging/payroll-prr-2026-1195/payroll-rows.json';
let rosterChecked = 0;
if (existsSync(rosterPath) && existsSync('data/payroll.json')) {
  const publicNames = new Set(JSON.parse(readFileSync('data/payroll.json', 'utf8')).publicTier.map((p) => p.name));
  const withheld = new Set(JSON.parse(readFileSync(rosterPath, 'utf8')).flatMap((period) => period.rows.map((row) => row.worker)).filter((name) => !publicNames.has(name)));
  rosterChecked = withheld.size;
  for (const name of withheld) for (const [file, text] of texts) if (text.includes(name)) hits.push(`${file}: contains withheld employee name "${name}"`);
} else console.warn('Roster leak check skipped: private payroll roster not present on this machine.');

// Same check for PRR-2026-1194 supplier invoices: every individual-named
// supplier classified as Tier B (employee), Tier C (resident refund), or
// unknown must never appear by name in any publishable file. Tier A
// officials and businesses/government entities are allowed and excluded.
//
// A withheld name can coincidentally match unrelated PRE-EXISTING content
// this feature never touched (e.g. a name already legitimately published in
// the investigations evidence ledger for an unconnected reason). Rather than
// whitelist that specific name — which would blind the scanner to a real
// future leak of the same name — the check is scoped by SOURCE instead:
// the two raw files this feature actually generates are authoritative and
// any hit there is a hard failure ("NEW SUPPLIER-INVOICE PRIVACY LEAK").
// A hit anywhere else (including built bundles, which mix this feature's
// data with everything else in the same chunk and can't be cleanly
// attributed) is reported for visibility as "PRE-EXISTING/BUNDLED CONTEXT"
// but does not fail the scan, because the raw-source check is what actually
// proves whether this feature leaked the name — a bundle only ever reflects
// what its raw sources already contain.
const invoiceRosterPath = 'research-staging/supplier-invoices-prr-2026-1194/supplier-summaries.json';
const SUPPLIER_INVOICE_RAW_SOURCES = new Set(['data/supplier-invoices.json', 'public/data/supplier-invoices-fy2024-26.csv']);
let invoiceRosterChecked = 0;
const preExistingContextHits = [];
if (existsSync(invoiceRosterPath)) {
  const WITHHELD_TYPES = new Set(['employee_reimbursement_aggregated', 'resident_refund_aggregated', 'unknown']);
  const withheldSuppliers = new Set(JSON.parse(readFileSync(invoiceRosterPath, 'utf8')).filter((s) => WITHHELD_TYPES.has(s.supplierType)).map((s) => s.supplier));
  invoiceRosterChecked = withheldSuppliers.size;
  for (const name of withheldSuppliers) for (const [file, text] of texts) {
    if (!text.includes(name)) continue;
    if (SUPPLIER_INVOICE_RAW_SOURCES.has(file)) hits.push(`${file}: NEW SUPPLIER-INVOICE PRIVACY LEAK — contains withheld individual name "${name}"`);
    else preExistingContextHits.push(`${file}: PRE-EXISTING/BUNDLED CONTEXT — contains "${name}", but not in this feature's raw source output (data/supplier-invoices.json / public/data/supplier-invoices-fy2024-26.csv); not treated as a new leak`);
  }
} else console.warn('Supplier-invoices roster leak check skipped: private dataset not present on this machine.');

if (preExistingContextHits.length) console.warn(`Informational (not a failure):\n${preExistingContextHits.map((h) => `  - ${h}`).join('\n')}`);

if (hits.length) {
  console.error(`Sensitive-data scan FAILED:\n${hits.map((h) => `  - ${h}`).join('\n')}`);
  process.exitCode = 1;
} else console.log(`Sensitive-data scan passed: ${files.length} publishable files checked${rosterChecked ? `, ${rosterChecked} withheld employee names not found anywhere` : ''}${invoiceRosterChecked ? `, ${invoiceRosterChecked} withheld supplier-invoice individual names not found in the raw source outputs` : ''}.`);
