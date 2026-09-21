#!/usr/bin/env node
// Reproducible importer for a BCC Personnel payroll records response
// (two Workday payroll reports + an employee census, delivered in one ZIP).
//
//   ORIGINAL ZIP -> hash -> parse -> normalize -> validate -> sanitize -> data/payroll.json
//
// Read-only on the ZIP. Writes two things:
//   1. PRIVATE full dataset + validation detail -> research-staging/ (gitignored)
//   2. PUBLIC sanitized dataset                  -> data/payroll.json
//
// Only fields actually present in the source are used. Nothing is filled in:
// a value that the records do not supply stays null. The parser refuses to run
// if a report's header row is not exactly what this script was written for, so a
// layout change upstream cannot silently corrupt published numbers.
//
// Usage: node scripts/build-payroll-dataset.mjs <response.zip> [--private-dir DIR] [--out FILE]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { readZipEntries } from './lib/zip-reader.mjs';
import { readXlsx } from './lib/xlsx-reader.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const zipPath = args.find((a) => !a.startsWith('--') && a !== flag('--private-dir') && a !== flag('--out'));
if (!zipPath) throw new Error('Usage: node scripts/build-payroll-dataset.mjs <response.zip> [--private-dir DIR] [--out FILE]');
const privateDir = flag('--private-dir', 'research-staging/payroll-prr-2026-1195');
const outFile = flag('--out', 'data/payroll.json');

const PAYROLL_HEADERS = ['Worker', 'Hire Date', 'Termination Date', 'Gender', 'Position', 'Position Time Type', 'Fiscal Non-OT YTD Wages', 'Fiscal Overtime', 'Fiscal YTD Employer Paid Benefits', 'Fiscal YTD Employer Taxes'];
const CENSUS_HEADERS = ['Legal Name - First Name', 'Legal Name - Last Name', 'Employee Type', 'Active Status', 'Exempt', 'Gender', 'Position Title', 'Hire Date', 'Time Type', 'Total Base Pay Annualized - Amount', 'Effective Date for Current Position', 'Years in Current Position'];

// Charter salary anchor used ONLY to infer how many bi-weekly pay periods a
// report covers (see inferPayPeriods). $37,000 / 26 = $1,423.0769...
const CHARTER_COMMISSIONER_SALARY = 37000;

// Roles whose holders are named in the public dataset. Everyone else appears
// only in aggregate. Editing this list is the single control over who is named.
const PUBLIC_TIER = [
  { test: /^County Commissioner$/, reason: 'Elected county commissioner' },
  { test: /^County Manager$/, reason: 'County Manager' },
  { test: /^Assistant County Manager\b/, reason: 'Assistant County Manager (senior executive staff)' },
  { test: /^(Fire Chief|Assistant Fire Chief|Fire Marshal)$/, reason: 'Fire Rescue leadership role named in existing ClayMoneyTrail research' },
];

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const round2 = (n) => Math.round(n * 100) / 100;
const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slug = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pctile = (sorted, p) => sorted[Math.floor(p * (sorted.length - 1))];
// Payroll uses preferred first names; a match means one normalized name starts with the other.
const sameGivenName = (payrollGiven, legalFirst) => { const a = norm(payrollGiven), b = norm(legalFirst); return !!a && !!b && (a.startsWith(b) || b.startsWith(a)); };
const tierOf = (position) => PUBLIC_TIER.find((t) => t.test.test(position ?? ''))?.reason ?? null;

// ---------------------------------------------------------------- read ZIP
const archive = readFileSync(zipPath);
const zip = readZipEntries(archive);
const findEntry = (pattern) => {
  const hits = [...zip.keys()].filter((name) => pattern.test(name));
  if (hits.length !== 1) throw new Error(`Expected exactly one ZIP entry matching ${pattern}, found ${hits.length}: ${hits.join(', ')}`);
  return hits[0];
};
const files = {
  fy1: findEntry(/^Payroll_Report .*\.xlsx$/),
  fy2: findEntry(/^Current_Payroll_Report .*\.xlsx$/),
  census: findEntry(/^Employee_Census.*\.xlsx$/),
};
for (const name of zip.keys()) if (!zip.get(name).crcOk()) throw new Error(`ZIP CRC failure: ${name}`);

const table = (entryName, expectedHeaders) => {
  const { rows } = readXlsx(zip.get(entryName).read());
  const header = rows[0].cells;
  if (JSON.stringify(header) !== JSON.stringify(expectedHeaders)) throw new Error(`${entryName}: header row changed.\n expected ${JSON.stringify(expectedHeaders)}\n found    ${JSON.stringify(header)}`);
  return rows.slice(1).filter((r) => r.cells.some((c) => c !== null)).map((r) => ({ rowNumber: r.rowNumber, cells: r.cells }));
};

const periodFromName = (name) => {
  const m = name.match(/(\d{1,2})\.(\d{1,2})\.(\d{4}) - (\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) throw new Error(`Cannot read period dates from file name: ${name}`);
  const iso = (mo, d, y) => `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return { start: iso(m[1], m[2], m[3]), end: iso(m[4], m[5], m[6]) };
};
const fiscalLabel = (start) => {
  const [y, mo] = start.split('-').map(Number);
  const fy = mo >= 10 ? y : y - 1;
  return `FY${fy}-${String((fy + 1) % 100).padStart(2, '0')}`;
};

// ------------------------------------------------------- payroll reports
function loadPayroll(id, entryName) {
  const period = periodFromName(entryName);
  const parsed = table(entryName, PAYROLL_HEADERS).map(({ rowNumber, cells }) => {
    const [worker, hire, term, gender, position, timeType, nonOt, ot, benefits, taxes] = cells;
    for (const [label, value] of [['Fiscal Non-OT YTD Wages', nonOt], ['Fiscal Overtime', ot], ['Fiscal YTD Employer Paid Benefits', benefits], ['Fiscal YTD Employer Taxes', taxes]]) {
      if (typeof value !== 'number') throw new Error(`${entryName} row ${rowNumber}: ${label} is not numeric (${JSON.stringify(value)})`);
    }
    const comma = worker.indexOf(',');
    return {
      periodId: id, sourceFile: entryName, sourceRow: rowNumber, worker,
      lastName: comma < 0 ? worker : worker.slice(0, comma), firstNames: comma < 0 ? '' : worker.slice(comma + 1).trim(),
      hireDate: hire, terminationDate: term, gender, position, timeType,
      nonOtWagesPaid: nonOt, overtimePaid: ot, employerPaidBenefits: benefits, employerTaxes: taxes,
      duplicateOfRow: null,
    };
  });
  // Exact duplicate rows (every field identical) are an export artifact, not two
  // people. Both rows are kept in the private data; only the first is counted.
  const seen = new Map();
  for (const row of parsed) {
    const key = JSON.stringify([row.worker, row.hireDate, row.terminationDate, row.position, row.timeType, row.nonOtWagesPaid, row.overtimePaid, row.employerPaidBenefits, row.employerTaxes]);
    if (seen.has(key)) row.duplicateOfRow = seen.get(key);
    else seen.set(key, row.sourceRow);
  }
  return { id, sourceFile: entryName, ...period, fiscalYear: fiscalLabel(period.start), rows: parsed };
}
const periods = [loadPayroll('fy2024-25', files.fy1), loadPayroll('fy2025-26-ytd', files.fy2)];

// ------------------------------------------------------------------ census
const censusEnd = files.census.match(/- (\w+) (\d{1,2}) (\d{4})\.xlsx$/);
const censusEndIso = new Date(`${censusEnd[1]} ${censusEnd[2]}, ${censusEnd[3]} 12:00:00 UTC`).toISOString().slice(0, 10);
const census = table(files.census, CENSUS_HEADERS).map(({ rowNumber, cells }) => {
  const [first, last, type, active, exempt, gender, position, hire, timeType, rate, effective, years] = cells;
  return { sourceRow: rowNumber, firstName: first, lastName: last, employeeType: type, activeStatus: active === 'Yes' ? 'Yes' : null, exempt: exempt === 'Yes', gender, position, hireDate: hire, timeType, annualizedBaseRate: rate, positionEffectiveDate: effective, yearsInCurrentPosition: years };
});
const censusByKey = Map.groupBy(census, (c) => `${norm(c.lastName)}|${c.hireDate}`);

// Link payroll rows to census rows on last name + hire date, never on full
// name: the payroll reports use preferred first names ("Charlie") while the
// census uses legal names ("William"). Ambiguity is resolved only by an equal
// position title or first initial; otherwise the row stays unlinked.
function linkCensus(row) {
  const candidates = censusByKey.get(`${norm(row.lastName)}|${row.hireDate}`) ?? [];
  if (candidates.length === 0) return { census: null, basis: 'none' };
  if (candidates.length === 1) return { census: candidates[0], basis: 'last name + hire date' };
  const byPosition = candidates.filter((c) => norm(c.position) === norm(row.position));
  if (byPosition.length === 1) return { census: byPosition[0], basis: 'last name + hire date + position title' };
  const byInitial = candidates.filter((c) => norm(c.firstName)[0] === norm(row.firstNames)[0]);
  if (byInitial.length === 1) return { census: byInitial[0], basis: 'last name + hire date + first initial' };
  return { census: null, basis: 'ambiguous' };
}
for (const period of periods) for (const row of period.rows) Object.assign(row, { link: linkCensus(row) });

// ENTITY-RESOLUTION GUARD. The census contains different people who share a legal
// name (two employees are listed as "William Latham"). Two different payroll
// workers must never resolve to the same census record within a report; if they
// do, the link is wrong and the build stops instead of merging two people.
for (const period of periods) {
  const owners = new Map();
  for (const row of period.rows.filter((r) => !r.duplicateOfRow && r.link.census)) {
    const key = row.link.census.sourceRow;
    if (owners.has(key) && owners.get(key) !== row.worker) throw new Error(`Entity-resolution failure in ${period.id}: census row ${key} linked from both "${owners.get(key)}" and "${row.worker}"`);
    owners.set(key, row.worker);
  }
}

// ------------------------------------------- pay periods (inferred, labeled)
// Both reports are bi-weekly. Commissioners are paid a flat $37,000 salary, so
// a full-period commissioner's non-OT wages equal $1,423.08 x N pay periods.
// N is accepted only when at least two commissioners agree on the same integer.
function inferPayPeriods(period) {
  const perPeriod = CHARTER_COMMISSIONER_SALARY / 26;
  const counts = period.rows
    .filter((r) => r.position === 'County Commissioner' && r.hireDate <= period.start && !r.terminationDate && !r.duplicateOfRow)
    .map((r) => r.nonOtWagesPaid / perPeriod)
    .filter((n) => Math.abs(n - Math.round(n)) < 0.001)
    .map(Math.round);
  const tally = Map.groupBy(counts, (n) => n);
  const best = [...tally.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  return best && best[1].length >= 2 ? best[0] : null;
}
for (const period of periods) period.payPeriods = inferPayPeriods(period);

// -------------------------------------------------------------- aggregates
const counted = (period) => period.rows.filter((r) => !r.duplicateOfRow);
const sum = (rows, key) => round2(rows.reduce((total, r) => total + r[key], 0));
function totals(period) {
  const rows = counted(period);
  return {
    rowsInSource: period.rows.length,
    exactDuplicateRowsExcluded: period.rows.length - rows.length,
    workers: rows.length,
    fullTime: rows.filter((r) => r.timeType === 'Full time').length,
    partTime: rows.filter((r) => r.timeType === 'Part time').length,
    withTerminationDate: rows.filter((r) => r.terminationDate).length,
    nonOtWagesPaid: sum(rows, 'nonOtWagesPaid'),
    overtimePaid: sum(rows, 'overtimePaid'),
    workersWithOvertime: rows.filter((r) => r.overtimePaid > 0).length,
    employerPaidBenefits: sum(rows, 'employerPaidBenefits'),
    employerTaxes: sum(rows, 'employerTaxes'),
  };
}

function overtimeByPosition(period) {
  const groups = Map.groupBy(counted(period), (r) => r.position);
  return [...groups.entries()].filter(([, rows]) => rows.length >= 5).map(([position, rows]) => ({
    position, workers: rows.length, workersWithOvertime: rows.filter((r) => r.overtimePaid > 0).length,
    overtimePaid: sum(rows, 'overtimePaid'), nonOtWagesPaid: sum(rows, 'nonOtWagesPaid'),
  })).sort((a, b) => b.overtimePaid - a.overtimePaid).slice(0, 12);
}

// Peers for rate comparisons: full-period, single-position, full-time, with a
// census rate that describes the period (see rateApplies).
const peerRows = (period, { salariedOnly }) => counted(period).filter((r) => {
  const c = r.link.census;
  return c && c.annualizedBaseRate > 0 && r.hireDate <= period.start && !r.terminationDate && r.timeType === 'Full time'
    && c.timeType === 'Full time' && c.positionEffectiveDate <= period.start && (!salariedOnly || c.exempt);
});
const ratiosAt = (rows, periodsCount) => rows.map((r) => r.nonOtWagesPaid / (r.link.census.annualizedBaseRate * periodsCount / 26)).sort((a, b) => a - b);

// How often paid non-OT wages differ from the census annualized rate, so a
// difference for any one person can be read against the whole workforce.
function paidToRateRatios(period, { salariedOnly }) {
  if (!period.payPeriods || period.end !== censusEndIso) return null;
  const ratios = ratiosAt(peerRows(period, { salariedOnly }), period.payPeriods);
  return {
    definition: `Non-OT wages paid ÷ (census annualized base rate × ${period.payPeriods}/26 pay periods)`,
    peers: ratios.length,
    percentiles: Object.fromEntries([['p5', 0.05], ['p25', 0.25], ['p50', 0.5], ['p75', 0.75], ['p95', 0.95]].map(([k, p]) => [k, round2(pctile(ratios, p) * 1000) / 1000])),
    withinTwoPercent: ratios.filter((x) => Math.abs(x - 1) <= 0.02).length,
    aboveFivePercent: ratios.filter((x) => x > 1.05).length,
    belowFivePercent: ratios.filter((x) => x < 0.95).length,
  };
}

// Independent check of the inferred pay-period count that does NOT use the
// commissioners: which N (24-27) do the salaried non-commissioner peers' wages
// fit best against their own census rates? Only possible where the census rate
// describes the period.
function corroboratePayPeriods(period) {
  if (period.end !== censusEndIso) return null;
  const rows = peerRows(period, { salariedOnly: true }).filter((r) => r.position !== 'County Commissioner');
  const candidates = [24, 25, 26, 27].map((n) => ({ payPeriods: n, peersWithinTwoPercent: ratiosAt(rows, n).filter((x) => Math.abs(x - 1) <= 0.02).length }));
  const best = candidates.reduce((a, b) => (b.peersWithinTwoPercent > a.peersWithinTwoPercent ? b : a));
  return { method: 'Salaried, non-commissioner peers: count of peers whose wages are within 2% of (census rate × N ÷ 26), for each candidate N', peers: rows.length, candidates, bestFit: best.payPeriods, agreesWithInferred: best.payPeriods === period.payPeriods };
}

// ----------------------------------------------------------- public tier
const personKey = (r) => `${r.worker}|${r.hireDate}`;
const people = new Map();
for (const period of periods) for (const row of counted(period)) {
  const person = people.get(personKey(row)) ?? people.set(personKey(row), { worker: row.worker, hireDate: row.hireDate, rows: {} }).get(personKey(row));
  person.rows[period.id] = row;
}
const tierPeople = [];
for (const person of people.values()) {
  const positions = Object.values(person.rows).map((r) => r.position);
  const linked = Object.values(person.rows).map((r) => r.link.census).find(Boolean) ?? null;
  const reason = [...positions, linked?.position].map(tierOf).find(Boolean);
  if (reason) tierPeople.push({ ...person, census: linked, reason, linkBasis: Object.values(person.rows)[0].link.basis });
}
// The census carries only the CURRENT rate, so it can describe a period only if
// that period runs to the census date and the person's position did not change
// after the period began. Otherwise a rate-based comparison would be misleading.
const rateApplies = (period, c) => !!(period.payPeriods && c && period.end === censusEndIso && c.positionEffectiveDate <= period.start);
const censusNameCounts = Map.groupBy(census, (c) => `${norm(c.firstName)}|${norm(c.lastName)}`);
function publicPerson(p) {
  const c = p.census;
  const flags = [];
  const firstPayroll = Object.values(p.rows)[0];
  if (c && firstPayroll && !sameGivenName(firstPayroll.firstNames, c.firstName)) {
    flags.push(`Payroll reports list the given name "${firstPayroll.firstNames}"; the census lists legal first name "${c.firstName}". Linked by last name + hire date${p.linkBasis.includes('position') ? ' + position title' : ''}.`);
  }
  if (c && censusNameCounts.get(`${norm(c.firstName)}|${norm(c.lastName)}`).length > 1) {
    flags.push(`The census lists ${censusNameCounts.get(`${norm(c.firstName)}|${norm(c.lastName)}`).length} different employees with the legal name "${c.firstName} ${c.lastName}". This person is distinguished by hire date and position title.`);
  }
  if (c && c.annualizedBaseRate === 0) flags.push('Census "Total Base Pay Annualized" is $0 for this position. That is not evidence the person was unpaid — payroll wages are shown separately.');
  const positionsSeen = new Set(Object.values(p.rows).map((r) => r.position));
  if (positionsSeen.size > 1) flags.push('Position title differs between the two payroll reports.');
  return {
    id: slug(p.worker),
    name: p.worker,
    censusLegalName: c ? `${c.firstName} ${c.lastName}` : null,
    tierReason: p.reason,
    hireDate: p.hireDate,
    censusPosition: c?.position ?? null,
    censusAnnualizedBaseRate: c ? c.annualizedBaseRate : null,
    censusPositionEffectiveDate: c?.positionEffectiveDate ?? null,
    censusRow: c?.sourceRow ?? null,
    linkBasis: p.linkBasis,
    periods: periods.filter((period) => p.rows[period.id]).map((period) => {
      const r = p.rows[period.id];
      // A per-period average is only meaningful for someone employed the whole
      // period in one position; a position change (or an unknown one) blanks it.
      const fullPeriod = r.hireDate <= period.start && !r.terminationDate && positionsSeen.size === 1 && (!c || c.positionEffectiveDate <= period.start);
      return {
        periodId: period.id,
        position: r.position,
        timeType: r.timeType,
        terminationDate: r.terminationDate,
        nonOtWagesPaid: r.nonOtWagesPaid,
        overtimePaid: r.overtimePaid,
        wagesPlusOvertime: round2(r.nonOtWagesPaid + r.overtimePaid),
        nonOtPerPayPeriod: fullPeriod && period.payPeriods ? round2(r.nonOtWagesPaid / period.payPeriods) : null,
        paidToRateRatio: fullPeriod && rateApplies(period, c) && c.annualizedBaseRate > 0
          ? Math.round((r.nonOtWagesPaid / (c.annualizedBaseRate * period.payPeriods / 26)) * 1000) / 1000 : null,
        // COMPARISON FIGURE (not an official amount): current annualized rate x pay periods / 26.
        rateComparisonFigure: fullPeriod && rateApplies(period, c) && c.annualizedBaseRate > 0 ? round2(c.annualizedBaseRate * period.payPeriods / 26) : null,
        differenceFromRateComparison: fullPeriod && rateApplies(period, c) && c.annualizedBaseRate > 0 ? round2(r.nonOtWagesPaid - c.annualizedBaseRate * period.payPeriods / 26) : null,
        source: { file: r.sourceFile, row: r.sourceRow },
      };
    }),
    flags,
  };
}
// Display order: commissioners, County Manager, Assistant County Managers, then Fire Rescue leadership.
const orderRank = (reason) => (reason.startsWith('Elected') ? 0 : reason === 'County Manager' ? 1 : reason.startsWith('Assistant County Manager') ? 2 : 3);
const publicTierPeople = tierPeople.map(publicPerson).sort((a, b) => orderRank(a.tierReason) - orderRank(b.tierReason) || a.name.localeCompare(b.name));

// ------------------------------------ commissioner COMPARISON (not official)
// OFFICIAL PAYROLL AMOUNT = what the county's report shows. COMPARISON FIGURE =
// this project's calculation: annual Charter salary / 26 x pay periods. The two
// are kept apart everywhere; a difference is a research question, nothing more.
const commissionerComparison = (() => {
  const perPayPeriod = round2(CHARTER_COMMISSIONER_SALARY / 26);
  const rows = [];
  for (const person of publicTierPeople.filter((p) => p.tierReason.startsWith('Elected'))) {
    for (const per of person.periods) {
      const period = periods.find((x) => x.id === per.periodId);
      const source = counted(period).find((r) => r.sourceRow === per.source.row);
      const full = source.hireDate <= period.start && !source.terminationDate && !!period.payPeriods;
      rows.push({
        personId: person.id, name: person.name, periodId: per.periodId,
        officialPayrollAmount: per.nonOtWagesPaid,
        comparisonApplies: full,
        payPeriods: full ? period.payPeriods : null,
        comparisonFigure: full ? round2(perPayPeriod * period.payPeriods) : null,
        difference: full ? round2(per.nonOtWagesPaid - perPayPeriod * period.payPeriods) : null,
        differenceUsingUnroundedComparison: full ? round2(per.nonOtWagesPaid - CHARTER_COMMISSIONER_SALARY * period.payPeriods / 26) : null,
        differenceInPayPeriods: full ? Math.round(((per.nonOtWagesPaid - perPayPeriod * period.payPeriods) / perPayPeriod) * 1000) / 1000 : null,
        notComparedBecause: full ? null : source.terminationDate ? 'Employment ended during the period (partial period).' : source.hireDate > period.start ? 'Hired during the period (partial period).' : 'Pay periods could not be inferred.',
        source: per.source,
      });
    }
  }
  const nonzero = rows.filter((r) => r.difference);
  return {
    definition: `Comparison figure = annual Charter salary of $${CHARTER_COMMISSIONER_SALARY.toLocaleString('en-US')} ÷ 26 bi-weekly periods (= $${perPayPeriod.toLocaleString('en-US', { minimumFractionDigits: 2 })}, rounded to the cent) × the number of pay periods in the report. It is a calculation by this project, not a county-reported amount.`,
    perPayPeriodComparison: perPayPeriod,
    checks: {
      differencesThatAreWholePayPeriods: nonzero.filter((r) => Math.abs(r.differenceInPayPeriods - Math.round(r.differenceInPayPeriods)) < 0.01).length,
      differencesTested: nonzero.length,
      partialPeriodComparisonsExcluded: rows.filter((r) => !r.comparisonApplies).length,
      sharedPayCalendarAssumed: true,
    },
    rows,
  };
})();

const colLetter = (index) => String.fromCharCode(65 + index);
const sourceColumns = {
  payroll: { worker: colLetter(PAYROLL_HEADERS.indexOf('Worker')), nonOtWages: colLetter(PAYROLL_HEADERS.indexOf('Fiscal Non-OT YTD Wages')), overtime: colLetter(PAYROLL_HEADERS.indexOf('Fiscal Overtime')), position: colLetter(PAYROLL_HEADERS.indexOf('Position')), hireDate: colLetter(PAYROLL_HEADERS.indexOf('Hire Date')) },
  census: { annualizedBaseRate: colLetter(CENSUS_HEADERS.indexOf('Total Base Pay Annualized - Amount')), positionTitle: colLetter(CENSUS_HEADERS.indexOf('Position Title')), legalFirstName: colLetter(CENSUS_HEADERS.indexOf('Legal Name - First Name')), legalLastName: colLetter(CENSUS_HEADERS.indexOf('Legal Name - Last Name')), positionEffectiveDate: colLetter(CENSUS_HEADERS.indexOf('Effective Date for Current Position')) },
};

// ----------------------------------------------------------- data quality
const allRows = periods.flatMap((p) => p.rows);
const dq = [];
const add = (id, severity, description, count, detail) => dq.push({ id, severity, description, count, ...(detail ? { detail } : {}) });
add('exact-duplicate-rows', 'exclude', 'Rows that are identical in every field to an earlier row in the same report. Counted once in every total; both rows are kept in the private data.', allRows.filter((r) => r.duplicateOfRow).length);
add('terminated-before-period-with-pay', 'note', 'Termination date is before the report period begins but wages are shown — consistent with final pay, leave payout, or corrections being paid in a later period. The report does not say which.', periods.reduce((n, p) => n + counted(p).filter((r) => r.terminationDate && r.terminationDate < p.start && r.nonOtWagesPaid > 0).length, 0));
add('hire-date-after-period-end', 'note', 'Hire date is after the period ends yet wages are shown for the period — consistent with a re-hire where the report carries the most recent hire date.', periods.reduce((n, p) => n + counted(p).filter((r) => r.hireDate > p.end).length, 0));
add('payroll-row-without-census-link', 'note', 'Payroll rows that could not be linked to a census row by last name + hire date (+ position/initial).', counted({ rows: allRows }).filter((r) => !r.link.census).length);
add('payroll-given-name-differs-from-census', 'note', 'Linked rows where the payroll given name differs from the census legal first name (preferred-name usage). Identity for any published person is confirmed by hire date and position, not name.', counted({ rows: allRows }).filter((r) => r.link.census && !sameGivenName(r.firstNames, r.link.census.firstName)).length);
add('census-rows-not-in-either-payroll-report', 'note', 'Census rows with no linked payroll row in either report (mostly former staff who left before the first report period, plus staff hired on the census end date).', census.filter((c) => !allRows.some((r) => r.link.census === c)).length,
  `${census.filter((c) => !allRows.some((r) => r.link.census === c) && c.activeStatus !== 'Yes').length} have a blank Active Status; ${census.filter((c) => !allRows.some((r) => r.link.census === c) && c.activeStatus === 'Yes').length} are marked active.`);
add('census-zero-base-pay', 'note', 'Census rows with annualized base pay of $0 (including every sitting commissioner). Zero here means "no rate recorded in this field", not "unpaid".', census.filter((c) => c.annualizedBaseRate === 0).length);
const activeCensus = census.filter((c) => c.activeStatus === 'Yes');
add('census-years-in-position-inconsistent', 'unreliable', `Census "Years in Current Position" disagrees (tolerance 0.06 yr) with the census's own "Effective Date for Current Position" measured to ${censusEndIso}. The field is not used for any published figure.`,
  activeCensus.filter((c) => Math.abs((new Date(censusEndIso) - new Date(c.positionEffectiveDate)) / (365.25 * 864e5) - c.yearsInCurrentPosition) >= 0.06).length);

// --------------------------------------------------------------- outputs
const zipEntries = [...zip.entries()].map(([name, entry]) => ({ name, bytes: entry.size, sha256: sha256(entry.read()) }));
const roleOf = (name) => (name === files.fy1 || name === files.fy2 ? 'payroll report (xlsx)' : name === files.census ? 'employee census (xlsx)' : name.startsWith('PRR-') ? 'cover letter (pdf)' : /contributions/.test(name) ? 'state FRS contribution-rate chart (pdf)' : 'benefits guide (pdf)');

const publicData = {
  meta: {
    title: 'Clay County BCC payroll — Public Records Request PRR-2026-1195',
    generatedBy: 'scripts/build-payroll-dataset.mjs',
    sourceStatus: 'verified_official',
    requestId: 'PRR-2026-1195',
    custodian: 'Clay County Board of County Commissioners — Personnel and Benefits Department',
    responseDate: '2026-09-17',
    recordType: 'Workday payroll report exports and employee census, produced by the county in response to a public-records request',
    employerScope: 'Board of County Commissioners employees only. The county stated it can provide information for the BCC and not for the constitutional offices, so the Sheriff, Clerk, Tax Collector, Property Appraiser, Supervisor of Elections, School Board, and municipal/utility employers are NOT covered and are never mixed in.',
    limitations: [
      'Wage figures are as reported by the county for the report period; the source does not state whether they are pay-date or earned-date amounts.',
      '"Fiscal Non-OT YTD Wages" is a single combined figure. The source does not break it into base pay, leave payout, special/assignment/acting pay, allowances, or retroactive pay, so none of those can be identified from it.',
      'The census shows only each employee\'s CURRENT position and rate; it does not show earlier positions or rates.',
      'Employer-paid benefits and employer taxes are county costs, not employee pay. Per-person values are not carried into ClayMoneyTrail\'s derived data (the original records, unaltered, remain in the public evidence archive).',
      'The FY2025-26 report covers October 1, 2025 – September 16, 2026 (year to date), so its amounts are not a full fiscal year.',
    ],
  },
  provenance: { registryId: 'PRR-2026-1195', archive: { file: basename(zipPath), bytes: archive.length, sha256: sha256(archive) }, files: zipEntries.map((e) => ({ ...e, role: roleOf(e.name) })) },
  fieldDictionary: [
    { field: 'Fiscal Non-OT YTD Wages', source: 'payroll reports', means: 'Wages paid in the report period other than overtime, as one combined figure.', doesNotMean: 'Base salary or annual rate; it cannot be split into base, leave payout, special pay, or allowances.' },
    { field: 'Fiscal Overtime', source: 'payroll reports', means: 'Overtime wages paid in the report period.', doesNotMean: 'Any other category of pay.' },
    { field: 'Total Base Pay Annualized', source: 'employee census', means: 'The employee\'s current annualized base rate. A rate, not money paid.', doesNotMean: 'Amount paid in any period. It is $0 for sitting commissioners.' },
    { field: 'Wages + overtime', source: 'derived here', means: 'Non-OT wages plus overtime, computed by this project.', doesNotMean: 'Total compensation. It excludes employer-paid benefits, retirement, and employer taxes.' },
    { field: 'Fiscal YTD Employer Paid Benefits / Employer Taxes', source: 'payroll reports', means: 'County-paid costs on behalf of employees.', doesNotMean: 'Pay received by the employee. Shown in aggregate only.' },
  ],
  publication: {
    named: 'Elected commissioners, the County Manager, Assistant County Managers, and the Fire Rescue leadership roles already named in ClayMoneyTrail research (see tier definition). Everyone else appears only in aggregate.',
    tierDefinition: PUBLIC_TIER.map((t) => ({ pattern: t.test.source, reason: t.reason })),
    originalsNote: 'ClayMoneyTrail\'s derived datasets are sanitized and purpose-limited. The original county records are preserved unaltered in a separate, researcher-maintained public evidence archive and contain fields that are not carried into ClayMoneyTrail\'s data.',
    withheldFields: ['Gender', 'Per-person employer-paid benefits and employer taxes (can reveal insurance elections)', 'Names, hire dates, and pay of employees outside the tier', 'Census "Active Status", "Employee Type", and "Years in Current Position" (the last is internally inconsistent)'],
    sensitiveFieldsFoundInSource: 'None of: SSN, bank/account, home address, personal phone/email, date of birth, dependent, or medical fields. Gender and per-person benefit costs are present in the original records and are not carried into ClayMoneyTrail\'s derived data.',
  },
  periods: periods.map((p) => ({
    id: p.id, label: `${p.fiscalYear}${p.id.endsWith('ytd') ? ' (year to date)' : ''}`, fiscalYear: p.fiscalYear, start: p.start, end: p.end, partialYear: p.id.endsWith('ytd'),
    sourceFile: p.sourceFile, payPeriodsInferred: p.payPeriods,
    payPeriodsBasis: p.payPeriods ? `Inferred, not stated by the county: the full-period commissioners paid the flat amount have wages equal to $1,423.08 × ${p.payPeriods}${corroboratePayPeriods(p) ? `; independently, the best fit for ${corroboratePayPeriods(p).peers} salaried non-commissioner peers is ${corroboratePayPeriods(p).bestFit} pay periods` : ' (no independent census-rate corroboration is possible for this period because the census rate describes only the current period)'}.` : null,
    payPeriodCorroboration: corroboratePayPeriods(p),
    totals: totals(p),
    overtimeByPosition: overtimeByPosition(p),
  })),
  sourceColumns,
  commissionerComparison,
  censusSummary: {
    sourceFile: files.census,
    rows: census.length,
    active: activeCensus.length,
    inactiveOrBlank: census.length - activeCensus.length,
    fullTime: census.filter((c) => c.timeType === 'Full time').length,
    partTime: census.filter((c) => c.timeType === 'Part time').length,
    note: 'The census lists each employee\'s current (or last) position and current annualized rate for the window October 1, 2024 – September 16, 2026, and includes employees who are no longer active.',
  },
  peerContext: {
    note: 'For most staff, paid non-OT wages differ from the census rate by a few percent, so a gap between paid wages and rate is common and is not, by itself, informative. Salaried (exempt) staff track their rate most closely.',
    fy2025_26_ytd_allFullTimePeers: paidToRateRatios(periods[1], { salariedOnly: false }),
    fy2025_26_ytd_salariedPeers: paidToRateRatios(periods[1], { salariedOnly: true }),
  },
  dataQuality: dq,
  publicTier: publicTierPeople,
};

// Private, complete dataset (never committed): full names, gender, benefits.
mkdirSync(privateDir, { recursive: true });
const priv = (name, value) => writeFileSync(`${privateDir}/${name}`, `${JSON.stringify(value, null, 2)}\n`);
priv('payroll-rows.json', periods.map((p) => ({ periodId: p.id, sourceFile: p.sourceFile, start: p.start, end: p.end, payPeriodsInferred: p.payPeriods, rows: p.rows.map(({ link, ...r }) => ({ ...r, censusRow: link.census?.sourceRow ?? null, censusLinkBasis: link.basis })) })));
priv('census-rows.json', census);
priv('validation-report.json', { generatedAt: new Date().toISOString(), zipSha256: sha256(archive), files: zipEntries, periods: periods.map((p) => ({ id: p.id, payPeriods: p.payPeriods, totals: totals(p) })), dataQuality: dq, unlinkedPayrollRows: allRows.filter((r) => !r.link.census).map((r) => ({ periodId: r.periodId, row: r.sourceRow, worker: r.worker, hireDate: r.hireDate, basis: r.link.basis })), duplicateRows: allRows.filter((r) => r.duplicateOfRow).map((r) => ({ periodId: r.periodId, row: r.sourceRow, duplicateOfRow: r.duplicateOfRow, worker: r.worker })) });

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(publicData, null, 2)}\n`);

console.log(`Wrote ${outFile} (${publicTierPeople.length} named tier people) and private dataset in ${privateDir}/`);
for (const p of publicData.periods) console.log(`  ${p.label}: ${p.totals.workers} workers, non-OT $${p.totals.nonOtWagesPaid.toLocaleString()}, OT $${p.totals.overtimePaid.toLocaleString()}, pay periods ${p.payPeriodsInferred ?? 'not inferred'}, duplicates excluded ${p.totals.exactDuplicateRowsExcluded}`);
for (const item of dq) console.log(`  [${item.severity}] ${item.id}: ${item.count}`);
