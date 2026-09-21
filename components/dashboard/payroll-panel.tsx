'use client';

import { ExternalLink, FileCheck2, FileQuestion } from 'lucide-react';
import { formatDate, moneyExact } from '@/lib/format';
import type { RecordsResponse } from '@/lib/types';
import { InvestigationStatusBadge } from './investigation-status-badge';

type Percentiles = { p5: number; p25: number; p50: number; p75: number; p95: number };
type PeerGroup = { definition: string; peers: number; percentiles: Percentiles; withinTwoPercent: number; aboveFivePercent: number; belowFivePercent: number };
type OvertimeRow = { position: string; workers: number; workersWithOvertime: number; overtimePaid: number; nonOtWagesPaid: number };
type PersonPeriod = {
  periodId: string; position: string; timeType: string; terminationDate: string | null;
  nonOtWagesPaid: number; overtimePaid: number; wagesPlusOvertime: number;
  nonOtPerPayPeriod: number | null; paidToRateRatio: number | null; rateComparisonFigure: number | null; differenceFromRateComparison: number | null;
  source: { file: string; row: number };
};
type TierPerson = {
  id: string; name: string; censusLegalName: string | null; tierReason: string; hireDate: string;
  censusPosition: string | null; censusAnnualizedBaseRate: number | null; censusPositionEffectiveDate: string | null;
  censusRow: number | null; linkBasis: string; periods: PersonPeriod[]; flags: string[];
};

export interface PayrollData {
  meta: { title: string; requestId: string; custodian: string; responseDate: string; recordType: string; employerScope: string; limitations: string[] };
  provenance: { archive: { file: string; bytes: number; sha256: string }; files: { name: string; bytes: number; sha256: string; role: string }[] };
  fieldDictionary: { field: string; source: string; means: string; doesNotMean: string }[];
  publication: { named: string; originalsNote: string; withheldFields: string[]; sensitiveFieldsFoundInSource: string };
  sourceColumns: { payroll: { nonOtWages: string; overtime: string }; census: { annualizedBaseRate: string } };
  commissionerComparison: {
    definition: string; perPayPeriodComparison: number;
    checks: { differencesThatAreWholePayPeriods: number; differencesTested: number; partialPeriodComparisonsExcluded: number; sharedPayCalendarAssumed: boolean };
    rows: { personId: string; name: string; periodId: string; officialPayrollAmount: number; comparisonApplies: boolean; payPeriods: number | null; comparisonFigure: number | null; difference: number | null; differenceUsingUnroundedComparison: number | null; notComparedBecause: string | null; source: { file: string; row: number } }[];
  };
  periods: {
    id: string; label: string; start: string; end: string; partialYear: boolean; payPeriodsInferred: number | null; payPeriodsBasis: string | null;
    payPeriodCorroboration: { peers: number; candidates: { payPeriods: number; peersWithinTwoPercent: number }[]; bestFit: number } | null;
    totals: { workers: number; fullTime: number; partTime: number; withTerminationDate: number; nonOtWagesPaid: number; overtimePaid: number; workersWithOvertime: number; exactDuplicateRowsExcluded: number };
    overtimeByPosition: OvertimeRow[];
  }[];
  censusSummary: { sourceFile: string; rows: number; active: number; inactiveOrBlank: number; note: string };
  peerContext: { note: string; fy2025_26_ytd_salariedPeers: PeerGroup | null; fy2025_26_ytd_allFullTimePeers: PeerGroup | null };
  dataQuality: { id: string; severity: string; description: string; count: number; detail?: string }[];
  publicTier: TierPerson[];
}

type LeadCheck = {
  id: string; personId: string; claim: { name: string; titleClaimed: string; amountClaimed: number; year: number; priorStatus: string; priorSource: string };
  identityAndTitle: string; finding: string; doesNotEstablish: string; recordNeeded: string | null; evidenceStatus: string; statusReason: string;
};
export interface PayrollFindings {
  meta: { asOf: string; editorialStatus: string };
  keyObservations: { id: string; title: string; text: string; evidenceStatus: string; doesNotEstablish?: string; checksPerformed?: string[]; limitations?: string[] }[];
  leadChecks: LeadCheck[];
  lorinMockQuestion: {
    question: string; answer: string; whatTheRecordsShow: string[]; whyTheyCannotAnswerIt: string[]; doesNotEstablish: string;
    separateFromDisprovenClaim: string; davidMotesNote: string; evidenceStatus: string; recordsNeeded: string[];
  };
  recordsNeededItems: { id: string; title: string; question: string; whyNeeded: string; potentialResolvingRecords: string[]; likelyCustodian: string; relatedFindingIds: string[]; priority: string; internalTask?: boolean }[];
  recordsStatus: { request: string; requestStatus: string; resolved: string[]; partiallyResolved: string[]; stillMissing: string[]; sendingPolicy: string };
}

const PERIOD_A = 'fy2024-25';
const PERIOD_B = 'fy2025-26-ytd';
const pct = (a: number | null, b: number | null) => (a && b ? `${b / a >= 1 ? '+' : ''}${((b / a - 1) * 100).toFixed(1)}%` : '—');
const short = (hash: string) => `${hash.slice(0, 12)}…${hash.slice(-6)}`;
const RESPONSE_STATUS_LABELS: Record<string, string> = {
  response_received_completeness_not_verified: 'Response received — completeness not yet verified',
  fulfilled: 'Fulfilled',
  partially_fulfilled: 'Partially fulfilled',
  open: 'Open',
};
const periodLabel = (id: string) => (id === PERIOD_A ? 'FY2024-25' : 'FY2025-26 YTD');

// Evidence archive link. The archive is maintained by the researcher, not by Clay County, and the app
// never reads from it; it is a plain outbound link so the site works if Drive is unavailable.
function ArchiveLink({ response }: { response: RecordsResponse }) {
  return (
    <a className="source-link payroll-archive-link" href={response.publicArchive.url} target="_blank" rel="noopener noreferrer">
      {response.publicArchive.label} <ExternalLink size={12} />
    </a>
  );
}

function HowToCheck({ personId, data, response, status }: { personId: string; data: PayrollData; response: RecordsResponse; status: string }) {
  const person = data.publicTier.find((p) => p.id === personId);
  if (!person) return null;
  const cols = data.sourceColumns;
  return (
    <details className="payroll-verify">
      <summary>How to check this against the original records</summary>
      <dl>
        <div><dt>Source agency</dt><dd>{response.agency}</dd></div>
        <div><dt>Public-records request</dt><dd>{response.requestNumber} · response dated {formatDate(response.responseDate)}</dd></div>
        <div><dt>Covered periods</dt><dd>{response.coveredPeriods.map((c) => `${c.label}: ${formatDate(c.start)} – ${formatDate(c.end)}`).join(' · ')}</dd></div>
        <div><dt>Record type</dt><dd>{data.meta.recordType}</dd></div>
        <div>
          <dt>Where to look</dt>
          <dd>
            <ul>
              {person.periods.map((p) => (
                <li key={p.periodId}>{p.source.file} — row {p.source.row}: column {cols.payroll.nonOtWages} (&ldquo;Fiscal Non-OT YTD Wages&rdquo;) and column {cols.payroll.overtime} (&ldquo;Fiscal Overtime&rdquo;)</li>
              ))}
              {person.censusRow && <li>{data.censusSummary.sourceFile} — row {person.censusRow}: column {cols.census.annualizedBaseRate} (&ldquo;Total Base Pay Annualized&rdquo;), which is a rate, not money paid</li>}
            </ul>
          </dd>
        </div>
        <div><dt>Method</dt><dd>Amounts are copied unchanged from those cells. The comparison figure is the census annualized rate × the number of pay periods ÷ 26. Pay periods are inferred (see the pay-period note); rows are linked between files by last name + hire date + position, since neither file carries an employee ID.</dd></div>
        <div><dt>Limitations</dt><dd>{data.meta.limitations.slice(0, 2).join(' ')}</dd></div>
        <div><dt>Evidence status</dt><dd><InvestigationStatusBadge value={status} /> <small>Reviewed and approved by the project owner; may be revised if later records warrant.</small></dd></div>
        <div><dt>Evidence archive</dt><dd><ArchiveLink response={response} /> <small>Researcher-maintained; not operated by Clay County. Look for the ZIP {response.originalFile.name} or its individual files.</small></dd></div>
      </dl>
    </details>
  );
}

function PersonRow({ person }: { person: TierPerson }) {
  const a = person.periods.find((p) => p.periodId === PERIOD_A);
  const b = person.periods.find((p) => p.periodId === PERIOD_B);
  const rate = person.censusAnnualizedBaseRate;
  return (
    <tr>
      <td>
        <strong>{person.name}</strong>
        <small>{b?.position ?? a?.position ?? person.censusPosition}{person.censusLegalName && ` · census legal name ${person.censusLegalName}`}</small>
        <small>Hired {formatDate(person.hireDate)}{(b ?? a)?.terminationDate ? ` · payroll lists termination ${formatDate((b ?? a)?.terminationDate)}` : ''}</small>
        {person.flags.length > 0 && (
          <details className="payroll-flags">
            <summary>{person.flags.length} note{person.flags.length > 1 ? 's' : ''} on this row</summary>
            <ul>{person.flags.map((f) => <li key={f}>{f}</li>)}</ul>
            <p>Source rows: {person.periods.map((p) => `${p.periodId === PERIOD_A ? 'FY24-25' : 'FY25-26'} row ${p.source.row}`).join(' · ')}{person.censusRow ? ` · census row ${person.censusRow}` : ''}</p>
          </details>
        )}
      </td>
      <td>{rate === null ? '—' : rate === 0 ? <span className="pending-value">$0 in census — not a rate</span> : moneyExact(rate)}</td>
      <td>{a ? moneyExact(a.nonOtWagesPaid) : '—'}</td>
      <td>{a ? moneyExact(a.overtimePaid) : '—'}</td>
      <td>{b ? moneyExact(b.nonOtWagesPaid) : '—'}</td>
      <td>{b ? moneyExact(b.overtimePaid) : '—'}</td>
      <td>{pct(a?.nonOtPerPayPeriod ?? null, b?.nonOtPerPayPeriod ?? null)}</td>
    </tr>
  );
}

function OvertimeTable({ label, rows }: { label: string; rows: OvertimeRow[] }) {
  return (
    <div>
      <h4>{label}</h4>
      <table className="research-table">
        <thead><tr><th>Position title</th><th>Workers</th><th>With overtime</th><th>Overtime paid</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.position}><td>{r.position}</td><td>{r.workers}</td><td>{r.workersWithOvertime}</td><td>{moneyExact(r.overtimePaid)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function PayrollPanel({ data, findings, response }: { data: PayrollData; findings: PayrollFindings; response: RecordsResponse }) {
  const [a, b] = data.periods;
  const salaried = data.peerContext.fy2025_26_ytd_salariedPeers;
  const all = data.peerContext.fy2025_26_ytd_allFullTimePeers;
  const named = data.publicTier;
  return (
    <>
      <div className="disclaimer">
        <FileCheck2 size={19} />
        <div>
          <strong>Official county record, as supplied by the county.</strong>
          <span>
            Supplied by {data.meta.custodian} on {formatDate(data.meta.responseDate)} in response to {data.meta.requestId}. {data.meta.employerScope}
          </span>
        </div>
      </div>

      <section className="panel payroll-source">
        <div className="panel-head">
          <div>
            <span className="section-kicker">SOURCE AND EVIDENCE</span>
            <h3>Where these records came from, and where to inspect them</h3>
          </div>
          <ArchiveLink response={response} />
        </div>
        <div className="payroll-source-body">
          <dl>
            <div><dt>Records produced by</dt><dd>{response.agency}</dd></div>
            <div><dt>Public-records request</dt><dd>{response.requestNumber} · response letter {formatDate(response.responseDate)}</dd></div>
            <div><dt>Request status</dt><dd>{RESPONSE_STATUS_LABELS[response.status] ?? response.status}</dd></div>
            <div><dt>Covered periods</dt><dd>{response.coveredPeriods.map((c) => `${formatDate(c.start)} – ${formatDate(c.end)}`).join(' and ')}</dd></div>
            <div><dt>Files received</dt><dd>{response.originalFile.filesReceived} (original ZIP SHA-256 <code title={response.originalFile.sha256}>{short(response.originalFile.sha256)}</code>)</dd></div>
          </dl>
          <div className="payroll-archive-note">
            <strong>Evidence archive maintained by ClayMoneyTrail, not by Clay County.</strong>
            <p>{response.publicArchive.explanation}</p>
            <p>{response.publicArchive.packageForThisFinding}</p>
          </div>
        </div>
      </section>

      <div className="kpi-grid">
        {[a, b].map((p) => (
          <div className="kpi" key={p.id}>
            <span>{p.label} · wages paid</span>
            <strong>{moneyExact(p.totals.nonOtWagesPaid + p.totals.overtimePaid)}</strong>
            <small>
              {p.totals.workers} workers ({p.totals.fullTime} full-time, {p.totals.partTime} part-time) · non-OT {moneyExact(p.totals.nonOtWagesPaid)} + overtime {moneyExact(p.totals.overtimePaid)}
            </small>
          </div>
        ))}
        <div className="kpi">
          <span>Employees with overtime</span>
          <strong>{a.totals.workersWithOvertime} → {b.totals.workersWithOvertime}</strong>
          <small>FY2024-25 full year → FY2025-26 through {formatDate(b.end)}; the second period is not a full year</small>
        </div>
        <div className="kpi">
          <span>Pay periods covered</span>
          <strong>{a.payPeriodsInferred ?? '?'} → {b.payPeriodsInferred ?? '?'}</strong>
          <small>Inferred, not stated by the county; FY2025-26 is also supported by salaried peers&apos; wages (see comparison note)</small>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">HOW TO READ THE COLUMNS</span>
            <h3>What each figure is — and is not</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table className="research-table">
            <thead><tr><th>Figure</th><th>Comes from</th><th>It is</th><th>It is not</th></tr></thead>
            <tbody>{data.fieldDictionary.map((f) => <tr key={f.field}><td><strong>{f.field}</strong></td><td>{f.source}</td><td>{f.means}</td><td>{f.doesNotMean}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="panel-footnote">
          A salary <em>rate</em> is not money <em>paid</em>. Nothing on this page adds employer benefits or taxes to wages, and no total-compensation figure is shown because the records do not supply the pieces to build one.
        </p>
      </section>

      <section className="panel data-table-panel payroll-named">
        <div className="panel-head">
          <div>
            <span className="section-kicker">NAMED OFFICIALS AND SENIOR STAFF · {named.length} PEOPLE</span>
            <h3>Rate, wages paid, and overtime — kept in separate columns</h3>
          </div>
        </div>
        <table className="research-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Annualized base rate (census, current)</th>
              <th>FY2024-25 non-OT wages paid</th>
              <th>FY2024-25 overtime</th>
              <th>FY2025-26 YTD non-OT wages paid</th>
              <th>FY2025-26 YTD overtime</th>
              <th>Wages per pay period, change</th>
            </tr>
          </thead>
          <tbody>{named.map((p) => <PersonRow key={p.id} person={p} />)}</tbody>
        </table>
        <p className="panel-footnote">
          {data.publication.named} A change in wages per pay period is shown only for someone employed in one position for a whole period, and describes a change in reported wages only. The FY2025-26 columns run through {formatDate(b.end)} ({b.payPeriodsInferred} pay periods, inferred). The census rate applies only to the current period and only where the position has not changed.
        </p>
      </section>

      <section className="panel data-table-panel payroll-comparison">
        <div className="panel-head">
          <div>
            <span className="section-kicker">COMMISSIONERS · OFFICIAL AMOUNT VS. COMPARISON FIGURE</span>
            <h3>What the county&apos;s payroll shows next to a project calculation</h3>
          </div>
        </div>
        <p className="payroll-comparison-def">{data.commissionerComparison.definition}</p>
        <table className="research-table">
          <thead><tr><th>Commissioner</th><th>Period</th><th>Official payroll amount (county)</th><th>Comparison figure (this project)</th><th>Difference</th><th>Source row</th></tr></thead>
          <tbody>
            {data.commissionerComparison.rows.map((r) => (
              <tr key={`${r.personId}-${r.periodId}`}>
                <td><strong>{r.name}</strong></td>
                <td>{periodLabel(r.periodId)}{r.payPeriods ? <small>{r.payPeriods} pay periods</small> : null}</td>
                <td>{moneyExact(r.officialPayrollAmount)}</td>
                <td>{r.comparisonFigure === null ? <span className="pending-value">Not compared</span> : moneyExact(r.comparisonFigure)}{r.notComparedBecause && <small>{r.notComparedBecause}</small>}</td>
                <td>{r.difference === null ? '—' : r.difference === 0 ? 'None' : `${r.difference > 0 ? '+' : '−'}${moneyExact(Math.abs(r.difference))}`}</td>
                <td>row {r.source.row}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="panel-footnote">
          A difference is a research question, not a conclusion. The county&apos;s records give no explanation for any difference, none is offered here, and it is not known whether the comparison figure is the correct benchmark. Tests run: the differences are not whole pay periods, none of the three FY2025-26 comparisons involves a partial period, and 25 pay periods is supported by {data.periods[1].payPeriodCorroboration?.candidates.find((c) => c.payPeriods === 25)?.peersWithinTwoPercent} of {data.periods[1].payPeriodCorroboration?.peers} salaried peers independently of the commissioners. Limits: the $37,000 Charter salary is taken from this project&apos;s source register and the Charter text was not re-read; FY2024-25&apos;s 26 pay periods is inferred with no independent check; one shared pay calendar is assumed. Unrounded, every difference shifts by $0.08. Open question RN-PAY-08.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">WHAT THE RECORDS SHOW ABOUT EARLIER SALARY FIGURES</span>
            <h3>Checking the existing salary leads against the county&apos;s own file</h3>
          </div>
        </div>
        <div className="payroll-checks">
          {findings.leadChecks.map((c) => (
            <article key={c.id}>
              <header>
                <div>
                  <strong>{c.claim.name}</strong>
                  <small>Earlier figure: {moneyExact(c.claim.amountClaimed)} ({c.claim.year}) as {c.claim.titleClaimed} · earlier status {c.claim.priorStatus.replaceAll('_', ' ')}</small>
                </div>
                <InvestigationStatusBadge value={c.evidenceStatus} />
              </header>
              <p><b>Identity and title.</b> {c.identityAndTitle}</p>
              <p><b>What the county file shows.</b> {c.finding}</p>
              <p className="payroll-not"><b>Does not establish.</b> {c.doesNotEstablish}</p>
              <p className="payroll-why"><b>Why this status.</b> {c.statusReason}</p>
              {c.recordNeeded && <p className="payroll-need"><b>Record needed.</b> {c.recordNeeded}</p>}
              <HowToCheck personId={c.personId} data={data} response={response} status={c.evidenceStatus} />
            </article>
          ))}
        </div>
        <p className="panel-footnote">Statuses were reviewed and approved by the project owner and may be revised if later records warrant. The earlier figures came from third-party aggregators and were leads only; a difference from county wages paid does not make an earlier figure false, because the two may measure different things.</p>
      </section>

      <section className="panel payroll-mock">
        <div className="panel-head">
          <div>
            <span className="section-kicker">OPEN QUESTION · FIRE CHIEF</span>
            <h3>{findings.lorinMockQuestion.question}</h3>
          </div>
          <InvestigationStatusBadge value={findings.lorinMockQuestion.evidenceStatus} />
        </div>
        <div className="payroll-mock-body">
          <p className="payroll-answer">{findings.lorinMockQuestion.answer}</p>
          <div className="payroll-two">
            <div><h4>What the records show</h4><ul>{findings.lorinMockQuestion.whatTheRecordsShow.map((t) => <li key={t}>{t}</li>)}</ul></div>
            <div><h4>Why they cannot answer it</h4><ul>{findings.lorinMockQuestion.whyTheyCannotAnswerIt.map((t) => <li key={t}>{t}</li>)}</ul></div>
          </div>
          <p className="payroll-not"><b>Does not establish.</b> {findings.lorinMockQuestion.doesNotEstablish}</p>
          <p>{findings.lorinMockQuestion.separateFromDisprovenClaim}</p>
          <p>{findings.lorinMockQuestion.davidMotesNote}</p>
          <div className="payroll-need"><b>Records needed to resolve this:</b><ul>{findings.lorinMockQuestion.recordsNeeded.map((t) => <li key={t}>{t}</li>)}</ul></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">KEY OBSERVATIONS</span>
            <h3>What can and cannot be concluded from this response</h3>
          </div>
        </div>
        <div className="payroll-observations">
          {findings.keyObservations.map((o) => (
            <article key={o.id}>
              <header><strong>{o.title}</strong><InvestigationStatusBadge value={o.evidenceStatus} /></header>
              <p>{o.text}</p>
              {o.doesNotEstablish && <p className="payroll-not"><b>Does not establish.</b> {o.doesNotEstablish}</p>}
              {o.checksPerformed && <div className="payroll-need"><b>Checks performed.</b><ul>{o.checksPerformed.map((t) => <li key={t}>{t}</li>)}</ul></div>}
              {o.limitations && <p className="payroll-why"><b>Limitations.</b></p>}
              {o.limitations && <ul className="payroll-limit-list">{o.limitations.map((t) => <li key={t}>{t}</li>)}</ul>}
            </article>
          ))}
        </div>
      </section>

      {salaried && all && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">CONTEXT · FY2025-26 YEAR TO DATE</span>
              <h3>How often wages paid differ from the census rate</h3>
            </div>
          </div>
          <div className="table-wrap">
            <table className="research-table">
              <thead><tr><th>Peer group</th><th>Employees</th><th>5th</th><th>25th</th><th>Median</th><th>75th</th><th>95th</th><th>Within ±2%</th><th>More than 5% above</th></tr></thead>
              <tbody>
                {[['Salaried (exempt), full-period, one position', salaried], ['All full-time, full-period, one position', all]].map(([label, g]) => {
                  const group = g as PeerGroup;
                  return (
                    <tr key={label as string}>
                      <td>{label as string}</td><td>{group.peers}</td>
                      <td>{group.percentiles.p5.toFixed(3)}</td><td>{group.percentiles.p25.toFixed(3)}</td><td>{group.percentiles.p50.toFixed(3)}</td><td>{group.percentiles.p75.toFixed(3)}</td><td>{group.percentiles.p95.toFixed(3)}</td>
                      <td>{group.withinTwoPercent}</td><td>{group.aboveFivePercent}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="panel-footnote">Ratio = {salaried.definition}. 1.000 means wages paid equal the rate. {data.peerContext.note}</p>
        </section>
      )}

      <section className="panel payroll-overtime">
        <div className="panel-head">
          <div>
            <span className="section-kicker">OVERTIME BY POSITION TITLE · AGGREGATE ONLY</span>
            <h3>Where overtime was reported (titles with five or more employees)</h3>
          </div>
        </div>
        <div className="payroll-two">
          <OvertimeTable label={`${a.label}`} rows={a.overtimeByPosition} />
          <OvertimeTable label={`${b.label}`} rows={b.overtimeByPosition} />
        </div>
        <p className="panel-footnote">Overtime is reported as a paid amount only. The records do not give hours, cause, or department, and do not show whether overtime was budgeted.</p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">DATA QUALITY</span>
            <h3>Known limits of this response</h3>
          </div>
        </div>
        <ul className="payroll-quality">
          {data.dataQuality.map((q) => (
            <li key={q.id}><strong>{q.count}</strong><span>{q.description}{q.detail ? ` ${q.detail}` : ''}</span></li>
          ))}
        </ul>
        <ul className="payroll-quality payroll-limits">{data.meta.limitations.map((t) => <li key={t}><strong>•</strong><span>{t}</span></li>)}</ul>
      </section>

      <section className="panel payroll-provenance">
        <div className="panel-head">
          <div>
            <span className="section-kicker">PROVENANCE CHAIN</span>
            <h3>From the public-records request to what you see on this page</h3>
          </div>
          <ArchiveLink response={response} />
        </div>
        <ol className="payroll-chain">
          {response.provenanceChain.map((c) => (
            <li key={c.step}><strong>{c.step}</strong><span>{c.detail}</span></li>
          ))}
        </ol>
        <div className="payroll-two">
          <div>
            <h4>Original archive (unaltered)</h4>
            <p><code>{response.originalFile.name}</code></p>
            <p>{response.originalFile.bytes.toLocaleString()} bytes · SHA-256 <code title={response.originalFile.sha256}>{response.originalFile.sha256}</code></p>
            <ul>{data.provenance.files.map((f) => <li key={f.name}>{f.name} <small>· {f.role}</small></li>)}</ul>
            <p className="payroll-not"><small>{response.publicArchive.verificationNote} Checked {formatDate(response.publicArchive.verifiedAccessible)}.</small></p>
          </div>
          <div>
            <h4>Not carried into ClayMoneyTrail&apos;s derived data</h4>
            <ul>{data.publication.withheldFields.map((t) => <li key={t}>{t}</li>)}</ul>
            <p>{data.publication.sensitiveFieldsFoundInSource}</p>
            <p>{data.publication.originalsNote}</p>
            <p><small>Derived datasets: {response.derivedDatasets.map((d) => d.path).join(', ')}. {response.privateData}</small></p>
          </div>
        </div>
      </section>

      <section className="panel payroll-records">
        <div className="panel-head">
          <div>
            <span className="section-kicker"><FileQuestion size={12} /> RECORDS NEEDED · RESEARCH DRAFTS ONLY · NOTHING SENT</span>
            <h3>What this response resolved, and what is still needed</h3>
          </div>
          <span className="pending-value">{RESPONSE_STATUS_LABELS[findings.recordsStatus.requestStatus] ?? findings.recordsStatus.requestStatus}</span>
        </div>
        <div className="payroll-three">
          <div><h4>Resolved</h4><ul>{findings.recordsStatus.resolved.map((t) => <li key={t}>{t}</li>)}</ul></div>
          <div><h4>Partly resolved</h4><ul>{findings.recordsStatus.partiallyResolved.map((t) => <li key={t}>{t}</li>)}</ul></div>
          <div><h4>Still missing</h4><ul>{findings.recordsStatus.stillMissing.map((t) => <li key={t}>{t}</li>)}</ul></div>
        </div>
        <div className="payroll-rn">
          {findings.recordsNeededItems.map((item) => (
            <article key={item.id}>
              <header>
                <span className={`priority priority-${item.priority}`}>{item.priority}</span>
                <div><strong>{item.id} · {item.title}</strong><small>{item.internalTask ? 'Internal task — not a records request' : `Likely custodian: ${item.likelyCustodian}`}</small></div>
              </header>
              <p><b>Research question.</b> {item.question}</p>
              <p className="payroll-why">{item.whyNeeded}</p>
              <p><b>Records that could resolve it:</b> {item.potentialResolvingRecords.join(' · ')}</p>
            </article>
          ))}
        </div>
        <p className="panel-footnote">{findings.recordsStatus.sendingPolicy}</p>
      </section>
    </>
  );
}
