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

if (hits.length) {
  console.error(`Sensitive-data scan FAILED:\n${hits.map((h) => `  - ${h}`).join('\n')}`);
  process.exitCode = 1;
} else console.log(`Sensitive-data scan passed: ${files.length} publishable files checked${rosterChecked ? `, ${rosterChecked} withheld employee names not found anywhere` : ''}.`);
