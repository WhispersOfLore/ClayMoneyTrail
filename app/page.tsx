'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  FileQuestion,
  Landmark,
  Menu,
  Search,
  Shield,
  Users,
  X,
} from 'lucide-react';
import rawRecords from '@/data/records.json';
import rawSources from '@/data/sources.json';
import rawInvestigationMeta from '@/data/investigations/meta.json';
import rawLeads from '@/data/investigations/leads.json';
import rawEvidence from '@/data/investigations/evidence.json';
import rawTimeline from '@/data/investigations/timeline.json';
import rawRecordsRequests from '@/data/investigations/records-requests.json';
import { money, formatDate } from '@/lib/format';
import { computeCoverage } from '@/lib/coverage';
import { computeFlags } from '@/lib/gaps';
import type { EvidenceItem, InvestigationMeta, LeadItem, RecordItem, RecordsRequestItem, SourceItem, TimelineEvent } from '@/lib/types';
import { CoveragePanel } from '@/components/dashboard/coverage-panel';
import { DataGapNotice } from '@/components/dashboard/empty-state';
import { DownloadLinks } from '@/components/dashboard/download-links';
import { Explorer } from '@/components/dashboard/explorer';
import { GapFlagGrid } from '@/components/dashboard/gap-flags';
import { Disclaimer, FilterBar, Kpi, StandardPage, type FilterProps } from '@/components/dashboard/layout';
import { RecordsTable } from '@/components/dashboard/records-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { InvestigationsPanel } from '@/components/dashboard/investigations-panel';

const records = rawRecords as RecordItem[];
const sources = rawSources as SourceItem[];
const investigations = rawInvestigationMeta as InvestigationMeta[];
const leads = rawLeads as LeadItem[];
const evidenceLedger = rawEvidence as EvidenceItem[];
const timeline = rawTimeline as TimelineEvent[];
const recordsRequests = rawRecordsRequests as RecordsRequestItem[];

type Section =
  | 'Overview'
  | 'Money In'
  | 'Money Out'
  | 'People / Payroll'
  | 'Sheriff / Public Safety'
  | 'Stormwater'
  | 'Vendors & Contracts'
  | 'Capital Projects'
  | 'Debt & Reserves'
  | 'Year-over-Year'
  | 'Investigations'
  | 'Questions / Flags'
  | 'Sources';

const navSections: { label: Section; icon: typeof CircleDollarSign }[] = [
  { label: 'Overview', icon: CircleDollarSign },
  { label: 'Money In', icon: ArrowDownRight },
  { label: 'Money Out', icon: ArrowUpRight },
  { label: 'People / Payroll', icon: Users },
  { label: 'Sheriff / Public Safety', icon: Shield },
  { label: 'Stormwater', icon: CircleDollarSign },
  { label: 'Vendors & Contracts', icon: Building2 },
  { label: 'Capital Projects', icon: Landmark },
  { label: 'Debt & Reserves', icon: Landmark },
  { label: 'Year-over-Year', icon: BookOpen },
  { label: 'Investigations', icon: Search },
  { label: 'Questions / Flags', icon: FileQuestion },
  { label: 'Sources', icon: BookOpen },
];

const VENDOR_COLUMNS = [
  'record_id', 'fiscal_year', 'department', 'category', 'vendor_name', 'payment_date',
  'amount', 'measure', 'source_status', 'source_url', 'source_title', 'notes', 'last_verified',
];
const CAPITAL_COLUMNS = [
  'record_id', 'fiscal_year', 'department', 'category', 'name', 'project_status',
  'amount', 'measure', 'source_status', 'source_url', 'source_title', 'notes', 'last_verified',
];
const DEBT_COLUMNS = [
  'record_id', 'fiscal_year', 'department', 'category', 'name', 'maturity_date', 'interest_rate',
  'amount', 'measure', 'source_status', 'source_url', 'source_title', 'notes', 'last_verified',
];
const PAYROLL_COLUMNS = [
  'record_id', 'fiscal_year', 'department', 'category', 'employee_title', 'name',
  'amount', 'measure', 'source_status', 'source_url', 'source_title', 'notes', 'last_verified',
];

export default function Home() {
  const [section, setSection] = useState<Section>('Overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [fiscalYear, setFiscalYear] = useState('FY2025-26');
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [category, setCategory] = useState('All categories');
  const [sourceStatus, setSourceStatus] = useState('All source statuses');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    expense: true,
    revenue: true,
    'sheriff / public safety': true,
    'public works': true,
    stormwater: true,
    countywide: true,
  });

  const departments = ['All departments', ...Array.from(new Set(records.map((r) => r.department)))];
  const categories = ['All categories', ...Array.from(new Set(records.map((r) => r.category)))];

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const q = query.toLowerCase();
        return (
          r.fiscalYear === fiscalYear &&
          (!q || `${r.name} ${r.department} ${r.category}`.toLowerCase().includes(q)) &&
          (department === 'All departments' || r.department === department) &&
          (category === 'All categories' || r.category === category) &&
          (sourceStatus === 'All source statuses' || r.sourceStatus === sourceStatus)
        );
      }),
    [fiscalYear, query, department, category, sourceStatus],
  );

  const coverage = useMemo(() => computeCoverage(records), []);
  const flags = useMemo(() => computeFlags(records), []);
  const openFlags = flags.filter((f) => f.status === 'open');

  const verifiedBudget = records.find((r) => r.id === 'all-funds-total')?.amount ?? 0;
  const estimateRevenue = records.find((r) => r.id === 'stormwater-revenue')?.amount ?? 0;
  const commissionerBase = records.filter((r) => r.id.startsWith('commissioner-')).reduce((s, r) => s + (r.amount ?? 0), 0);

  const setActive = (s: Section) => {
    setSection(s);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filters: FilterProps = { query, setQuery, department, setDepartment, category, setCategory, sourceStatus, setSourceStatus, departments, categories };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Landmark size={20} />
          </div>
          <div>
            <strong>Money Trail</strong>
            <span>Clay County, Florida</span>
          </div>
        </div>
        <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu">
          <X />
        </button>
        <nav>
          {navSections.map(({ label, icon: Icon }) => (
            <button key={label} className={section === label ? 'active' : ''} onClick={() => setActive(label)}>
              <Icon size={17} />
              <span>{label}</span>
              {label === 'Questions / Flags' && <b>{openFlags.length}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>DATA COVERAGE</span>
          <strong>Public data preview</strong>
          <div>
            <i style={{ width: `${coverage.populatedPct}%` }} />
          </div>
          <p>
            {coverage.populated} of {coverage.total} records ({coverage.populatedPct}%) have a populated amount. This
            does not mean the county budget is fully represented.
          </p>
        </div>
      </aside>
      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu />
          </button>
          <div>
            <span className="eyebrow">PUBLIC BUDGET EXPLORER</span>
            <h1>{section}</h1>
          </div>
          <label className="fy-pill">
            <span>Fiscal year</span>
            <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} aria-label="Fiscal year">
              <option value="FY2024-25">FY 2024–25</option>
              <option value="FY2025-26">FY 2025–26</option>
              <option value="FY2026-27">FY 2026–27</option>
            </select>
          </label>
        </header>
        <div className="content">
          {section === 'Overview' && (
            <>
              <div className="intro-row">
                <div>
                  <h2>Follow the public dollar.</h2>
                  <p>Explore verified Clay County budget figures, official estimates, and the gaps that still need answers.</p>
                </div>
                <span className="updated">Growing dataset · {records.length} records</span>
              </div>
              <Disclaimer />
              <div className="kpi-grid">
                <Kpi icon={<ArrowUpRight />} color="blue" label="Total all-funds budget" value={money(verifiedBudget, true)} note="Appropriated · not actual spending" />
                <Kpi icon={<ArrowDownRight />} color="teal" label="Stormwater revenue" value={money(estimateRevenue, true)} note="Official estimate" />
                <Kpi icon={<Users />} color="gold" label="Commissioner base pay" value={money(commissionerBase, true)} note="5 × $37,000 per charter" />
                <Kpi icon={<FileQuestion />} color="gray" label="Actual spending" value="Not yet populated" note="Awaiting expenditure records" muted />
              </div>
              <div className="overview-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <span className="section-kicker">ALL-FUNDS FUNCTIONAL MAP</span>
                      <h3>Where the verified budget goes</h3>
                    </div>
                    <button onClick={() => setActive('Money Out')}>
                      Explore all <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="treemap">
                    <button className="tile sheriff" onClick={() => setActive('Sheriff / Public Safety')}>
                      <span>PUBLIC SAFETY</span>
                      <strong>$228.33M</strong>
                      <small>Budgeted</small>
                    </button>
                    <button className="tile detention" onClick={() => setActive('Money Out')}>
                      <span>GENERAL GOVERNMENT</span>
                      <strong>$114.60M</strong>
                      <small>Budgeted</small>
                    </button>
                    <button className="tile works" onClick={() => setActive('Money Out')}>
                      <span>TRANSPORTATION</span>
                      <strong>$80.35M</strong>
                      <small>Budgeted</small>
                    </button>
                    <button className="tile traffic" onClick={() => setActive('Money Out')}>
                      <span>PHYSICAL ENVIRONMENT</span>
                      <strong>$45.90M</strong>
                    </button>
                    <button className="tile signs" onClick={() => setActive('Money Out')}>
                      <span>HUMAN SERVICES</span>
                      <strong>$32.42M</strong>
                    </button>
                  </div>
                  <div className="legend">
                    <span>
                      <i className="legend-blue" />
                      All funds
                    </span>
                    <span>
                      <i className="legend-teal" />
                      FY2025–26
                    </span>
                    <span>Functional expenditures exclude transfers and ending balances</span>
                  </div>
                </section>
                <section className="panel questions">
                  <div className="panel-head">
                    <div>
                      <span className="section-kicker">OPEN QUESTIONS</span>
                      <h3>What still needs answers</h3>
                    </div>
                    <button onClick={() => setActive('Questions / Flags')}>
                      View all <ChevronRight size={15} />
                    </button>
                  </div>
                  {openFlags.slice(0, 4).map((f, i) => (
                    <button className="question-row" key={f.id} onClick={() => setActive('Questions / Flags')}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{f.title}</strong>
                        <small>{f.description}</small>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </section>
              </div>
              <CoveragePanel coverage={coverage} />
              <section className="panel recent">
                <div className="panel-head">
                  <div>
                    <span className="section-kicker">VERIFIED RECORDS</span>
                    <h3>Initial source-backed figures</h3>
                  </div>
                  <button onClick={() => setActive('Sources')}>
                    Review sources <ChevronRight size={15} />
                  </button>
                </div>
                <RecordsTable records={records.filter((r) => r.amount !== null).slice(0, 6)} sources={sources} />
              </section>
            </>
          )}

          {(section === 'Money In' || section === 'Money Out') && (
            <Explorer
              kind={section === 'Money In' ? 'revenue' : 'expense'}
              records={filtered}
              sources={sources}
              expanded={expanded}
              setExpanded={setExpanded}
              filters={filters}
            />
          )}

          {section === 'People / Payroll' && (
            <StandardPage
              kicker="PEOPLE & COMPENSATION"
              title="What does Clay County government cost to staff?"
              description="Base salary is only one part of compensation. Overtime, benefits, retirement, allowances, and total taxpayer cost remain separate fields."
            >
              <Disclaimer
                title="Aggregate budgets, not named employee pay."
                text="Commissioner entries are charter base salaries. CCSO calculations combine official division totals; they do not estimate compensation for any named employee."
              />
              <DataGapNotice
                title="Countywide individual payroll is not loaded"
                missing="Named-employee salary, overtime, benefits, retirement, and total-compensation figures for county staff."
                recordNeeded="A countywide, individual-level payroll or position-and-salary file, such as the one referenced by the county's DOGE disclosure page."
                templateFile="data/templates/payroll.csv"
                columns={PAYROLL_COLUMNS}
              />
              <FilterBar {...filters} />
              <section className="panel">
                <RecordsTable
                  records={filtered.filter((r) => r.domain === 'people' || (r.domain === 'calculation' && (r.category === 'Payroll' || r.category === 'Personnel')))}
                  sources={sources}
                />
              </section>
            </StandardPage>
          )}

          {section === 'Sheriff / Public Safety' && (
            <StandardPage
              kicker="PUBLIC SAFETY"
              title="Sheriff and detention budget trail"
              description="The Sheriff’s approved presentation and the County’s fund/cost-center budget are preserved as separate accounting views."
            >
              <div className="feature-total">
                <div>
                  <span>CCSO APPROVED PRESENTATION · FY2025–26</span>
                  <strong>{money(109_359_102)}</strong>
                  <small>Law enforcement + detention + judicial + building maintenance + legal advertising</small>
                </div>
                <Shield />
              </div>
              <Disclaimer
                title="Reconciliation required."
                text="CCSO’s presentation and the County’s budget use different fund and cost-center structures. Do not add their totals together; the dashboard preserves both until every transfer and allocation is reconciled."
              />
              <section className="panel">
                <RecordsTable
                  records={records.filter((r) => (r.sourceId === 'ccso-approved-budget' || r.department === 'Sheriff / Public Safety') && r.fiscalYear === fiscalYear)}
                  sources={sources}
                />
              </section>
            </StandardPage>
          )}

          {section === 'Stormwater' && (
            <StandardPage
              kicker="SPECIAL ASSESSMENT"
              title="Stormwater money trail"
              description="Track the proposed assessment from estimated collections through regulatory costs and, later, actual projects and payments."
            >
              <div className="flow-cards">
                <div>
                  <span>Estimated assessment revenue</span>
                  <strong>$8,218,308</strong>
                  <StatusBadge value="official_estimate" />
                </div>
                <ChevronRight />
                <div>
                  <span>First-year regulatory / collection costs</span>
                  <strong>$624,371</strong>
                  <StatusBadge value="official_estimate" />
                </div>
                <ChevronRight />
                <div className="net">
                  <span>Estimated remainder*</span>
                  <strong>$7,593,937</strong>
                  <small>*Arithmetic difference, not a verified allocation</small>
                </div>
              </div>
              <DataGapNotice
                title="Actual stormwater collections and spending are not loaded"
                missing="Actual assessment revenue collected, and actual spending by project or vendor once the assessment takes effect."
                recordNeeded="A published stormwater fund actuals report or year-end financial statement covering the assessment."
                templateFile="data/templates/historical-budget-vs-actual.csv"
                columns={['record_id', 'fiscal_year', 'department', 'category', 'name', 'adopted_budget', 'amended_budget', 'actual_amount', 'source_status', 'source_url', 'source_title', 'notes', 'last_verified']}
              />
              <section className="panel">
                <RecordsTable records={records.filter((r) => r.department === 'Stormwater' && r.fiscalYear === fiscalYear)} sources={sources} />
              </section>
            </StandardPage>
          )}

          {section === 'Vendors & Contracts' && (
            <StandardPage
              kicker="DATASET READY"
              title={section}
              description="The schema is ready for official records, but no verified vendor-level payments have been loaded."
            >
              <DataGapNotice
                title="No vendor or contract payments are loaded"
                missing="Vendor names, individual payment amounts, payment dates, and contract awards."
                recordNeeded="A countywide check register, accounts-payable export, or contract-award log from Clay County's public-records office."
                templateFile="data/templates/vendor-payments.csv"
                columns={VENDOR_COLUMNS}
              />
              <section className="panel">
                <RecordsTable records={records.filter((r) => r.domain === 'vendors' && r.fiscalYear === fiscalYear)} sources={sources} />
              </section>
            </StandardPage>
          )}

          {section === 'Capital Projects' && (
            <StandardPage
              kicker="CAPITAL APPROPRIATIONS"
              title="Capital Projects"
              description="Fund-level appropriations are now loaded. Individual projects, amendments, contracts, and actual payments remain to be imported."
            >
              <DataGapNotice
                title="Project-level capital detail is not loaded"
                missing="Individual project names, budget amendments, contract awards, and actual capital spending."
                recordNeeded="A capital improvement plan or project-status report listing individual projects and their budgets."
                templateFile="data/templates/capital-projects.csv"
                columns={CAPITAL_COLUMNS}
              />
              <section className="panel">
                <RecordsTable records={records.filter((r) => r.domain === 'capital' && r.fiscalYear === fiscalYear)} sources={sources} />
              </section>
            </StandardPage>
          )}

          {section === 'Debt & Reserves' && (
            <StandardPage
              kicker="DEBT & ENDING BALANCES"
              title="Debt & Reserves"
              description="Budgeted debt-service funds and General Fund ending balances are shown separately from actual payments and unrestricted cash."
            >
              <DataGapNotice
                title="Bond-level debt schedules and actual reserve balances are not loaded"
                missing="Individual bond issues, maturity dates, interest rates, payment schedules, and the actual (not budgeted) cash held in each reserve fund."
                recordNeeded="A debt-service schedule or official statement for each outstanding bond, and a fund-balance report showing actual reserve cash."
                templateFile="data/templates/debt-schedules.csv"
                columns={DEBT_COLUMNS}
              />
              <section className="panel">
                <RecordsTable records={records.filter((r) => (r.domain === 'debt' || r.domain === 'reserves') && r.fiscalYear === fiscalYear)} sources={sources} />
              </section>
            </StandardPage>
          )}

          {section === 'Year-over-Year' && (
            <StandardPage
              kicker="FY2021–FY2027"
              title="Year-over-year comparison"
              description="Sheriff division comparisons now cover two approved budgets. Other years and actuals remain open data work."
            >
              <div className="year-strip">
                {['FY2021', 'FY2022', 'FY2023', 'FY2024', 'FY2025', 'FY2026', 'FY2027'].map((y) => (
                  <div key={y} className={y === 'FY2026' ? 'current' : ''}>
                    <span>{y}</span>
                    <strong>{y === 'FY2025' || y === 'FY2026' ? 'Partial data' : 'Not populated'}</strong>
                  </div>
                ))}
              </div>
              <section className="panel">
                <RecordsTable
                  records={records.filter((r) => r.category === 'Sheriff Detail' && (r.fiscalYear === 'FY2024-25' || r.fiscalYear === 'FY2025-26'))}
                  sources={sources}
                />
              </section>
            </StandardPage>
          )}

          {section === 'Questions / Flags' && (
            <StandardPage
              kicker="ACCOUNTABILITY QUEUE"
              title="Questions that records should answer"
              description="Generated from the current dataset: a flag stays open until a matching verified record is loaded, and flips to resolved automatically once one is."
            >
              <GapFlagGrid flags={flags} />
            </StandardPage>
          )}

          {section === 'Investigations' && investigations.length > 0 && (
            <StandardPage
              kicker="COMMISSIONER INVESTIGATIONS"
              title="Clay County Board of County Commissioners, District 1–5"
              description="Evidence-gathering only. Every claim below carries an explicit status — verified fact, documented connection, possible connection, unverified lead, records required, allegation, or disproven claim — and links to its source. Select a district below to see that commissioner's own profile; each district is researched and evidenced independently of the others."
            >
              <InvestigationsPanel
                investigations={investigations}
                leads={leads}
                evidence={evidenceLedger}
                timeline={timeline}
                requests={recordsRequests}
              />
            </StandardPage>
          )}

          {section === 'Sources' && (
            <StandardPage
              kicker="SOURCE REGISTER"
              title="Every number should be traceable"
              description="Official source links, record status, and notes for the initial dataset."
            >
              <section className="panel source-list">
                {sources.map((s) => (
                  <article key={s.id}>
                    <div className="source-icon">
                      <BookOpen />
                    </div>
                    <div>
                      <StatusBadge value={s.status} />
                      <h3>
                        {s.title} <small>Last verified: {formatDate(s.lastVerified)}</small>
                      </h3>
                      <p>
                        {s.publisher} · {s.notes}
                      </p>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        Open official source <ExternalLink size={14} />
                      </a>
                    </div>
                  </article>
                ))}
              </section>
              <DownloadLinks />
            </StandardPage>
          )}
        </div>
        <footer>
          <span>Clay County Money Trail</span>
          <p>Independent civic data project · Neutral, source-first, and incomplete by design until records are verified.</p>
        </footer>
      </main>
    </div>
  );
}
