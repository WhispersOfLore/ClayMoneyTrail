#!/usr/bin/env node
// Non-destructive cross-reference utility for Investigation 001.
//
// Checks campaign-contribution data against the other investigation data
// files (leads, evidence, timeline) for name/keyword overlaps and prints a
// report. This is a discovery aid, not a verdict: every line is labeled
// MATCH FOUND / POSSIBLE MATCH / NEEDS MANUAL REVIEW and nothing stronger.
// It never prints words like "corruption," "kickback," or "favoritism" —
// see the mission's own instruction on this. A human reviews every line
// before it's treated as anything more than a lead.
//
// Run: node scripts/cross-reference-check.mjs
import { readFile } from 'node:fs/promises';

const load = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

const contributions = await load('../data/investigations/campaign-contributions-2020.json');
const leads = await load('../data/investigations/leads.json');
const evidence = await load('../data/investigations/evidence.json');
const timeline = await load('../data/investigations/timeline.json');

const norm = (s) => (s ?? '').toLowerCase().replace(/[.,]/g, '').trim();

// Every named entity/keyword from leads + evidence + timeline, so a
// contributor name/address overlapping any of them is worth a human look.
const GENERIC_KEYWORD_STOPLIST = new Set([
  'county', 'business', 'clay', 'commissioner', 'district', 'development',
  'connections', 'increase', 'proposal', 'matters', 'company', 'interests',
]);

const investigationEntities = new Set();
const investigationKeywords = new Set();
for (const lead of leads) {
  for (const e of lead.entitiesInvolved ?? []) investigationEntities.add(norm(e));
  for (const w of lead.title.split(/[\s/–—-]+/)) {
    const n = norm(w);
    if (n.length > 4 && !GENERIC_KEYWORD_STOPLIST.has(n)) investigationKeywords.add(n);
  }
}
for (const ev of evidence) {
  for (const e of ev.entities ?? []) investigationEntities.add(norm(e));
}
for (const tl of timeline) {
  for (const key of ['applicant', 'developer', 'llc', 'location', 'parcel']) {
    if (tl[key]) investigationKeywords.add(norm(tl[key]));
  }
}

const results = [];

for (const c of contributions) {
  const name = norm(c.contributor);
  const address = norm(c.address);

  // Check 1: campaign contributor <-> named entity elsewhere in the investigation
  for (const entity of investigationEntities) {
    if (!entity) continue;
    if (name === entity || (name.length > 3 && entity.includes(name))) {
      results.push({
        check: 'Campaign contributor <-> investigation entity',
        verdict: 'MATCH FOUND',
        detail: `Contributor "${c.contributor}" (${c.report}, $${c.amount}) matches a named entity elsewhere in the investigation ("${entity}").`,
      });
    }
  }

  // Check 2: campaign contributor address <-> corridor/location keyword (e.g. "Sandridge")
  for (const kw of investigationKeywords) {
    if (kw.length > 5 && address.includes(kw)) {
      results.push({
        check: 'Campaign contributor address <-> investigation location keyword',
        verdict: 'POSSIBLE MATCH',
        detail: `Contributor "${c.contributor}"'s address ("${c.address}") contains "${kw}", which also appears in investigation lead/timeline data. Geographic proximity only — not a demonstrated relationship. Needs manual review.`,
      });
    }
  }

  // Check 3: business-type contributors with no identified owner yet
  if (c.type === 'business') {
    results.push({
      check: 'Business contributor <-> owner identification',
      verdict: 'NEEDS MANUAL REVIEW',
      detail: `"${c.contributor}" ($${c.amount}, ${c.report}) is a business contributor with no owner/officer on record in this dataset. Resolve via Sunbiz before treating as a distinct entity from any similarly-named individual.`,
    });
  }
}

// De-duplicate identical lines (a contributor can appear in multiple reports)
const seen = new Set();
const deduped = results.filter((r) => {
  const key = `${r.check}|${r.detail}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const byVerdict = { 'MATCH FOUND': [], 'POSSIBLE MATCH': [], 'NEEDS MANUAL REVIEW': [] };
for (const r of deduped) byVerdict[r.verdict].push(r);

console.log(`Cross-reference check: ${contributions.length} 2020-cycle contributions checked against ${leads.length} leads, ${evidence.length} evidence entries, ${timeline.length} timeline events.\n`);
for (const verdict of Object.keys(byVerdict)) {
  console.log(`\n=== ${verdict} (${byVerdict[verdict].length}) ===`);
  for (const r of byVerdict[verdict]) console.log(`- [${r.check}] ${r.detail}`);
}

console.log('\nThis output is a discovery aid, not a finding. Every line requires human review before being added to the Evidence Ledger with a status.');
