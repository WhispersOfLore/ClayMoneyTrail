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
  Mail,
  MapPin,
  Menu,
  Percent,
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
import stateFundingData from '@/data/state-funding.json';
import publicSafetyComplexData from '@/data/public-safety-complex.json';
import geographicSpendingData from '@/data/geographic-spending.json';
import taxesAssessmentsData from '@/data/taxes-assessments.json';
import blackCreekData from '@/data/black-creek.json';
import contractsVendorsData from '@/data/contracts-vendors.json';
import contractsInventoryData from '@/data/contracts-fy25-26.json';
import supplierInvoicesData from '@/data/supplier-invoices.json';
import publicEmailData from '@/data/public-email.json';
import publicRecordsContactsData from '@/data/public-records-contacts.json';
import humanServicesData from '@/data/human-services.json';
import impactFeesData from '@/data/impact-fees.json';
import payrollData from '@/data/payroll.json';
import payrollFindingsData from '@/data/payroll-findings.json';
import recordsResponsesData from '@/data/records-responses.json';
import { money, formatDate } from '@/lib/format';
import { computeCoverage } from '@/lib/coverage';
import { computeFlags } from '@/lib/gaps';
import type { EvidenceItem, InvestigationMeta, LeadItem, RecordItem, RecordsRequestItem, RecordsResponse, SourceItem, TimelineEvent } from '@/lib/types';
import { CoveragePanel } from '@/components/dashboard/coverage-panel';
import { DataGapNotice } from '@/components/dashboard/empty-state';
import { DownloadLinks } from '@/components/dashboard/download-links';
import { Explorer } from '@/components/dashboard/explorer';
import { GapFlagGrid } from '@/components/dashboard/gap-flags';
import { Disclaimer, FilterBar, Kpi, StandardPage, type FilterProps } from '@/components/dashboard/layout';
import { RecordsTable } from '@/components/dashboard/records-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { InvestigationsPanel } from '@/components/dashboard/investigations-panel';
import { StateFundingPanel, type StateFundingDataset } from '@/components/dashboard/state-funding-panel';
import { PublicSafetyComplexPanel, type PublicSafetyComplexData } from '@/components/dashboard/public-safety-complex-panel';
import { GeographicSpendingPanel, type GeographicSpendingData } from '@/components/dashboard/geographic-spending-panel';
import { TaxesAssessmentsPanel, type TaxesAssessmentsData } from '@/components/dashboard/taxes-assessments-panel';
import { PayrollPanel, type PayrollData, type PayrollFindings } from '@/components/dashboard/payroll-panel';
import { ContractsPanel, HumanServicesPanel, ImpactFeesPanel, PublicEmailPanel, RecordsDirectoryPanel, RecordsResponsesPanel, RESPONSE_STATUS_LABELS, SupplierInvoicesPanel } from '@/components/dashboard/civic-records-panel';

const records = rawRecords as RecordItem[];
const sources = rawSources as SourceItem[];
const stateFunding = stateFundingData as unknown as StateFundingDataset;
const publicSafetyComplex = publicSafetyComplexData as unknown as PublicSafetyComplexData;
const geographicSpending = geographicSpendingData as unknown as GeographicSpendingData;
const taxesAssessments = taxesAssessmentsData as unknown as TaxesAssessmentsData;
const payroll = payrollData as unknown as PayrollData;
const payrollFindings = payrollFindingsData as unknown as PayrollFindings;
const recordsResponses = recordsResponsesData.responses as unknown as RecordsResponse[];
const payrollResponse = recordsResponses.find((r) => r.id === 'PRR-2026-1195') as RecordsResponse;
// Public-records responses appear in the Sources register. The archive URL comes from the provenance
// registry (single source of truth) and is labeled as researcher-maintained, never as county- or Google-operated.
const responseSources: (SourceItem & { linkLabel?: string })[] = recordsResponses.map((r) => ({
  id: `records-response-${r.id.toLowerCase()}`,
  title: `${r.requestNumber} — official public-records response`,
  publisher: r.agency,
  url: r.publicArchive.url,
  status: 'verified_official',
  notes: `Official records produced by ${r.agency} in response to ${r.requestNumber} (response letter ${r.responseDate}; covers ${r.coveredPeriods.map((c) => `${c.start} to ${c.end}`).join(' and ')}; ${r.originalFile.filesReceived} files; original ZIP SHA-256 ${r.originalFile.sha256}). Request status: ${RESPONSE_STATUS_LABELS[r.status] ?? r.status}. The link opens an evidence archive maintained by ClayMoneyTrail / the project researcher — not operated or controlled by Clay County or Google — where the original files are preserved unaltered.`,
  lastVerified: r.publicArchive.verifiedAccessible,
  linkLabel: r.publicArchive.label,
}));
const allSources: (SourceItem & { linkLabel?: string })[] = [...sources, ...responseSources];
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
  | 'Human Services'
  | 'Impact Fees'
  | 'Public Email'
  | 'Public Records'
  | 'Capital Projects'
  | 'Public Safety Complex'
  | 'State Funding'
  | 'Geographic Spending'
  | 'Taxes & Assessments'
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
  { label: 'Human Services', icon: Users },
  { label: 'Impact Fees', icon: Percent },
  { label: 'Capital Projects', icon: Landmark },
  { label: 'Public Safety Complex', icon: Shield },
  { label: 'State Funding', icon: Landmark },
  { label: 'Geographic Spending', icon: MapPin },
  { label: 'Taxes & Assessments', icon: Percent },
  { label: 'Debt & Reserves', icon: Landmark },
  { label: 'Year-over-Year', icon: BookOpen },
  { label: 'Investigations', icon: Search },
  { label: 'Public Email', icon: Mail },
  { label: 'Public Records', icon: BookOpen },
  { label: 'Questions / Flags', icon: FileQuestion },
  { label: 'Sources', icon: BookOpen },
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
              <PayrollPanel data={payroll} findings={payrollFindings} response={payrollResponse} />
              <Disclaimer
                title="Below: budgets and Charter figures, not individual pay."
                text="Commissioner entries are Charter base salaries. CCSO calculations combine official division totals; they do not estimate compensation for any named employee. Sheriff's Office employee-level payroll is a separate employer and is not in the county's response."
              />
              <DataGapNotice
                title="Still not loaded: earnings detail and other employers"
                missing="Earnings by pay code (base, leave payout, special or acting pay, allowances), position and rate history, fiscal years before FY2024-25, and employee-level payroll for the constitutional offices (Sheriff, Clerk, Tax Collector, Property Appraiser, Supervisor of Elections) and other employers."
                recordNeeded="Workday earnings-by-pay-code detail from the BCC Personnel Department, and separate payroll records from each constitutional office's own custodian. Research drafts only — nothing has been requested."
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
              description="Official FY2025-26 procurement notices, kept separate from signed contracts, ceilings, invoices, and actual payments."
            >
              <ContractsPanel data={contractsVendorsData} inventory={contractsInventoryData} />
              <SupplierInvoicesPanel data={supplierInvoicesData} />
            </StandardPage>
          )}

          {section === 'Human Services' && <StandardPage kicker="FY2025-26 BUDGET RESEARCH" title="Human Services" description="Published functional spending and cost-center history, with budget and actual measures kept distinct."><HumanServicesPanel data={humanServicesData}/></StandardPage>}

          {section === 'Impact Fees' && <StandardPage kicker="EFFECTIVE OCTOBER 1, 2026" title="Comprehensive impact fees" description="A like-for-like comparison of the official 2025 and 2026 county comprehensive schedules."><ImpactFeesPanel data={impactFeesData}/></StandardPage>}

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
              <div className="panel-head">
                <div>
                  <span className="section-kicker">FEATURED PROJECTS</span>
                  <h3>Two large projects with their own dedicated trails</h3>
                </div>
              </div>
              <div className="overview-grid">
                <button className="tile-card" onClick={() => setActive('Public Safety Complex')}>
                  <span className="section-kicker">P3 · RFP {publicSafetyComplex.rfp.number}</span>
                  <h3>Public Safety Complex</h3>
                  <p>{publicSafetyComplex.meta.summary}</p>
                  <span className="source-link">
                    Open full trail <ChevronRight size={14} />
                  </span>
                </button>
                <button className="tile-card" onClick={() => setActive('Geographic Spending')}>
                  <span className="section-kicker">SJRWMD · {money(blackCreekData.costEstimates[1].amount, true)}</span>
                  <h3>{blackCreekData.meta.title}</h3>
                  <p>
                    {blackCreekData.statedPrimaryPurpose.value.split('.')[0]}. Original estimate {money(blackCreekData.costEstimates[0].amount, true)}{' '}
                    (2017) grew to {money(blackCreekData.costEstimates[1].amount, true)} today.
                  </p>
                  <a className="source-link" href={blackCreekData.statedPrimaryPurpose.sourceUrl} target="_blank" rel="noreferrer">
                    SJRWMD project page <ExternalLink size={12} />
                  </a>
                </button>
              </div>
            </StandardPage>
          )}

          {section === 'Public Safety Complex' && (
            <StandardPage
              kicker="P3 · RFP 25/26-085"
              title="Public Safety Complex money trail"
              description={publicSafetyComplex.meta.disclaimer}
            >
              <PublicSafetyComplexPanel data={publicSafetyComplex} />
            </StandardPage>
          )}

          {section === 'State Funding' && (
            <StandardPage
              kicker="STATE APPROPRIATIONS"
              title="Florida Senate Local Funding Initiative Requests"
              description="Clay County's FY2026-27 state funding asks, tracked from request through the Governor's signature — requested, appropriated, vetoed, and received are modeled as distinct stages, never collapsed into one number."
            >
              <StateFundingPanel dataset={stateFunding} />
            </StandardPage>
          )}

          {section === 'Geographic Spending' && (
            <StandardPage
              kicker="WHERE DOES THE MONEY GO"
              title="Geographic spending"
              description={geographicSpending.meta.originQuestion}
            >
              <GeographicSpendingPanel data={geographicSpending} />
            </StandardPage>
          )}

          {section === 'Taxes & Assessments' && (
            <StandardPage
              kicker="TAXES & ASSESSMENTS"
              title="Clay County property taxes, 2019-2025"
              description="Millage history, the seven-year ad valorem series, and an independent check of statewide numbers a community post claimed — verified against Florida DOR, Census, and FRED where possible."
            >
              <TaxesAssessmentsPanel data={taxesAssessments} />
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

          {section === 'Public Email' && <StandardPage kicker="PUBLIC CORRESPONDENCE" title="Commissioner email review" description="A neutral index and evidence-preserving workflow for communications potentially relevant to Charter §2.2.J."><PublicEmailPanel data={publicEmailData}/></StandardPage>}

          {section === 'Public Records' && <StandardPage kicker="VERIFIED DIRECTORY" title="Public records and contacts" description="Official routes for finding records or requesting the records that are not directly published."><RecordsDirectoryPanel data={publicRecordsContactsData}/><RecordsResponsesPanel responses={recordsResponses}/></StandardPage>}

          {section === 'Sources' && (
            <StandardPage
              kicker="SOURCE REGISTER"
              title="Every number should be traceable"
              description="Official source links, public-records responses, record status, and notes for the dataset."
            >
              <section className="panel source-list">
                {allSources.map((s) => (
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
                        {s.linkLabel ?? 'Open official source'} <ExternalLink size={14} />
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
