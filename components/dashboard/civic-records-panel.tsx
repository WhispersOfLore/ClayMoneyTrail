import { ExternalLink, FileSearch, Mail, Phone } from 'lucide-react';
import { money, moneyExact, formatDate } from '@/lib/format';
import type { RecordsResponse } from '@/lib/types';

type ContractRecord = { id:string; bidNumber:string; title:string; noticeType:string; noticeDate:string; vendor:string|null; approvedAward:number|null; contractCeiling:number|null; actualPayments:number|null; contractNumber?:string|null; sourceUrl?:string };
type ContractData = { meta: { disclaimer: string; contractSearchUrl:string; accountsPayableContact:string; inventoryCsv:string; recordsNeededStatus:string }; records: ContractRecord[]; additionalMatches:Array<{id:string;bidNumber:string;vendor:string;approvedAward:number|null;amountMeaning:string;sourceUrl:string}>; recordsNeeded:Array<{id:string;vendor:string;contract:string|null;contractCeiling:number|null;missing:string;searched:string[];custodian:string;dateRange:string;priority:string;status:string;sendEnabled:boolean;reason:string}> };
type ContractInventory = { meta:{methodology:string;documents_examined:number;inventory_records:number;distinct_vendors_identified:number;agreement_rows:number;amendment_renewal_rows:number;software_records:number;clerk_index_metadata_only:number;substantive_official_document_reviewed:number;approved_amount_total:number;verified_actual_payments_identified:number;categories:Record<string,number>}; softwareRecords:Array<{record_number:string|null;title:string;normalized_vendor:string|null;document_type:string;payment_status:string;source_url:string}> };
type EmailData = { meta:{ disclaimer:string; sourceUrl:string }; mailboxes:Array<{district:string; commissioner:string; reviewedMessages:number}>; reviewStates:Array<{id:string;label:string;meaning:string}> };
type DirectoryData = { contacts:Array<{id:string;agency:string;name:string;recordTypes:string[];method:string;url:string;email:string|null;phone:string|null;verified:string}> };
type HumanData = { meta:{functionalTotal:number;note:string}; records:Array<{id:string;name:string;costCenter:string|null;reconciliation:string;fy2023Actual:number|null;fy2024Actual:number|null;fy2025Budget:number|null;fy2026Budget:number|null}>; openResearch:string[] };
type FeeData = { meta:{note:string;source2025:string;source2026:string}; rates:Array<{landUse:string;unit:string;total2025:number;total2026:number}> };

export function ContractsPanel({ data, inventory }: { data: ContractData; inventory: ContractInventory }) {
  return <>
    <div className="disclaimer"><FileSearch size={19}/><div><strong>A registry is not a payment ledger.</strong><span>{data.meta.disclaimer}</span></div></div>
    <div className="contract-inventory-metrics"><article><span>OFFICIAL INDEX ROWS EXAMINED</span><strong>{inventory.meta.documents_examined}</strong></article><article><span>DEDUPED INVENTORY RECORDS</span><strong>{inventory.meta.inventory_records}</strong></article><article><span>INDEX METADATA ONLY</span><strong>{inventory.meta.clerk_index_metadata_only}</strong></article><article><span>SUBSTANTIVE OFFICIAL RECORD REVIEWED</span><strong>{inventory.meta.substantive_official_document_reviewed}</strong></article></div>
    <section className="financial-proof-grid"><article className="award-proof"><span>VERIFIED APPROVED AWARDS</span><strong>{money(inventory.meta.approved_amount_total)}</strong><p>Four approved award amounts from this bid-notice inventory specifically. This is not spending and is not an actual-payment total.</p></article><article className="payment-proof"><span>ACTUAL PAYMENTS INDEPENDENTLY VERIFIED</span><strong>None yet</strong><p>This does not mean the county paid nothing — supplier-invoice records (vendor names, amounts, and dates) are now available below and in Supplier Invoices / Accounts Payable. What remains unverified is confirmation that any specific invoice was actually disbursed, not whether invoice records exist.</p></article></section>
    <section className="panel contract-method"><div><span className="section-kicker">PUBLIC METHODOLOGY</span><h3>An evolving document-chain inventory</h3><p>{inventory.meta.methodology}</p></div><a className="source-link" href={data.meta.inventoryCsv} download>Download research CSV</a></section>
    <section className="panel category-summary"><div className="panel-head"><div><span className="section-kicker">CATEGORY COVERAGE</span><h3>Records by research category</h3></div></div><div>{Object.entries(inventory.meta.categories).map(([name,count])=><span key={name}><strong>{count}</strong>{name}</span>)}</div></section>
    <section className="panel data-table-panel"><table className="research-table"><thead><tr><th>Bid</th><th>Notice</th><th>Date</th><th>Vendor / contract</th><th>Approved or ceiling</th><th>Actual paid</th></tr></thead><tbody>{data.records.map((r)=><tr key={r.id}><td><strong>{r.bidNumber}</strong></td><td>{r.title}<small>{r.noticeType.replaceAll('_',' ')}</small></td><td>{r.noticeDate}</td><td>{r.vendor ?? 'Not extracted'}<small>{r.contractNumber ? `Contract ${r.contractNumber}` : 'Contract not yet matched'}</small></td><td>{r.contractCeiling != null ? money(r.contractCeiling) : r.approvedAward != null ? `${money(r.approvedAward)} award` : <span className="pending-value">Not verified</span>}</td><td><span className="pending-value">Not located</span></td></tr>)}</tbody></table></section>
    <section className="panel matched-leads"><div className="panel-head"><div><span className="section-kicker">ADDITIONAL OFFICIAL MATCHES</span><h3>Vendor and award facts found in BCC records</h3></div></div>{data.additionalMatches.map((item)=><article key={item.id}><div><strong>{item.bidNumber} · {item.vendor}</strong><p>{item.amountMeaning}</p></div><div>{item.approvedAward == null ? 'No fixed award' : money(item.approvedAward)}<a href={item.sourceUrl} target="_blank" rel="noreferrer">Official record <ExternalLink size={12}/></a></div></article>)}</section>
    <section className="panel software-sweep"><div className="panel-head"><div><span className="section-kicker">DEDICATED SOFTWARE SWEEP</span><h3>{inventory.meta.software_records} agreements, renewals, and amendments flagged</h3></div></div><div className="software-list">{inventory.softwareRecords.map((item)=><article key={`${item.record_number}-${item.title}`}><div><strong>{item.normalized_vendor ?? item.title}</strong><small>{item.record_number ?? 'Procurement-only record'} · {item.document_type}</small></div><span>{item.payment_status}</span><a href={item.source_url} target="_blank" rel="noreferrer" aria-label={`Open ${item.title}`}><ExternalLink size={14}/></a></article>)}</div></section>
    <section className="panel records-needed-queue"><div className="panel-head"><div><span className="section-kicker">RECORDS NEEDED · DRAFTS ONLY</span><h3>Narrow research items generated from verified gaps</h3><p className="draft-only-note">{data.meta.recordsNeededStatus}</p></div><a className="source-link" href={data.meta.contractSearchUrl} target="_blank" rel="noreferrer">Search contracts <ExternalLink size={12}/></a></div>{data.recordsNeeded.map((item)=><article key={item.id}><div className="records-needed-title"><span className={`priority priority-${item.priority}`}>{item.priority}</span><div><strong>{item.vendor}</strong><small>{item.contract ? `Contract ${item.contract}` : 'Executed contract not yet matched'} · draft research item</small></div></div><p>{item.reason}</p><dl><div><dt>Missing</dt><dd>{item.missing}</dd></div><div><dt>Already searched</dt><dd>{item.searched.join(' · ')}</dd></div><div><dt>Likely custodian</dt><dd>{item.custodian}</dd></div><div><dt>Date range</dt><dd>{item.dateRange}</dd></div></dl></article>)}</section>
  </>;
}

type InvoiceStatusTotals = { Approved: number; 'In Progress': number; Canceled: number; Denied: number; Draft: number };
type SupplierInvoicesData = {
  meta: { registryId: string; asOf: string; terminologyNote: string; coveredInvoiceDates: { start: string; end: string }; totalInvoiceRows: number; distinctSuppliers: number; distinctPONumbers: number; statusTotals: InvoiceStatusTotals; statusDefinitions: Record<string, string>; csvDownload: string };
  governmentTransfers: { note: string; entities: Array<{ supplier: string; kind: string; label: string; invoiceCount: number; approvedInvoiceValue: number; firstInvoiceDate: string; lastInvoiceDate: string }> };
  externalVendors: { note: string; totalSuppliers: number; totalApprovedInvoiceValue: number; topByApprovedInvoiceValue: Array<{ supplier: string; invoiceCount: number; approvedInvoiceValue: number; poNumberCount: number; firstInvoiceDate: string; lastInvoiceDate: string }> };
  namedOfficialReimbursements: Array<{ official: string; tierReason: string; invoiceNumber: string; invoiceStatus: string; invoiceDate: string; fiscalYear: string; memo: string | null; approvedInvoiceAmount: number | null; poNumber: string | null }>;
  employeeReimbursementsAggregated: { supplierCount: number; invoiceCount: number; approvedInvoiceValue: number; note: string };
  residentRefundsAggregated: { supplierCount: number; invoiceCount: number; approvedInvoiceValue: number; note: string };
  individualPayeesUnclassified: { supplierCount: number; invoiceCount: number; approvedInvoiceValue: number; note: string };
  contractCrossReference: Array<{ recordsNeededId: string; vendor: string; contract: string | null; contractCeiling: number | null; match: { matchedSupplier: string; invoiceCount: number; approvedInvoiceValue: number; poNumberCount: number } | null; attributionStatus: string }>;
  reviewFlags: Array<{ id: string; label: string; vendor: string; poNumber?: string; whatTheRecordShows: string; whatWeStillNeedToKnow: string; recordsThatCouldResolve?: string[] }>;
  softwareSaas: { verifiedMatches: Array<{ vendor: string; matchedSupplier: string; approvedInvoiceValue: number; invoiceCount: number; note?: string }>; possibleMatches: Array<{ vendor: string; matchedSupplier: string; approvedInvoiceValue: number; invoiceCount: number; reason: string }>; excluded: Array<{ vendor: string; reason: string }> };
  fuelConnection: { supplier: string; invoiceCount: number; approvedInvoiceValue: number; byFiscalYear: Array<{ fiscalYear: string; invoiceCount: number; approvedInvoiceValue: number }>; note: string };
  dataQuality: { negativeAmountInvoices: { count: number; note: string }; approvedInvoicesWithoutPO: { count: number; note: string } };
};

// Supplier invoices / accounts payable (PRR-2026-1194). Lives in Vendors &
// Contracts alongside ContractsPanel rather than as its own section — it is
// the accounts-payable side of the same procurement-chain question.
export function SupplierInvoicesPanel({ data }: { data: SupplierInvoicesData }) {
  const s = data.meta.statusTotals;
  return <>
    <div className="disclaimer"><FileSearch size={19}/><div><strong>Supplier invoices are not proof of payment.</strong><span>{data.meta.terminologyNote}</span></div></div>
    <div className="invoice-status-grid">
      <article><span>APPROVED INVOICES</span><strong>{money(s.Approved)}</strong><p>{data.meta.statusDefinitions.Approved}</p></article>
      <article><span>IN PROGRESS</span><strong>{money(s['In Progress'])}</strong><p>{data.meta.statusDefinitions['In Progress']}</p></article>
      <article><span>CANCELED</span><strong>{money(s.Canceled)}</strong><p>{data.meta.statusDefinitions.Canceled}</p></article>
      <article><span>DENIED</span><strong>{money(s.Denied)}</strong><p>{data.meta.statusDefinitions.Denied}</p></article>
      <article><span>DRAFT</span><strong>{money(s.Draft)}</strong><p>{data.meta.statusDefinitions.Draft}</p></article>
    </div>
    <p className="source-footnote">{data.meta.totalInvoiceRows.toLocaleString()} invoice records · {data.meta.distinctSuppliers.toLocaleString()} distinct suppliers · {data.meta.distinctPONumbers.toLocaleString()} distinct PO numbers · invoice dates {formatDate(data.meta.coveredInvoiceDates.start)} to {formatDate(data.meta.coveredInvoiceDates.end)} · <a href={data.meta.csvDownload} download>Download full business/government invoice CSV</a></p>

    <section className="panel data-table-panel"><div className="panel-head"><div><span className="section-kicker">GOVERNMENT / CONSTITUTIONAL OFFICE TRANSFERS</span><h3>Kept separate from vendor spending</h3><p className="draft-only-note">{data.governmentTransfers.note}</p></div></div>
      <table className="research-table"><thead><tr><th>Entity</th><th>Invoices</th><th>Approved invoice value</th><th>Covered dates</th></tr></thead><tbody>
        {data.governmentTransfers.entities.map((g) => <tr key={g.supplier}><td><strong>{g.supplier}</strong><small>{g.label}</small></td><td>{g.invoiceCount}</td><td>{money(g.approvedInvoiceValue)}</td><td>{formatDate(g.firstInvoiceDate)} – {formatDate(g.lastInvoiceDate)}</td></tr>)}
      </tbody></table>
    </section>

    <section className="panel data-table-panel"><div className="panel-head"><div><span className="section-kicker">EXTERNAL VENDORS</span><h3>Top 50 of {data.externalVendors.totalSuppliers.toLocaleString()} suppliers by approved invoice value</h3><p className="draft-only-note">{data.externalVendors.note}</p></div></div>
      <table className="research-table"><thead><tr><th>Supplier</th><th>Invoices</th><th>POs</th><th>Approved invoice value</th></tr></thead><tbody>
        {data.externalVendors.topByApprovedInvoiceValue.map((v) => <tr key={v.supplier}><td><strong>{v.supplier}</strong></td><td>{v.invoiceCount}</td><td>{v.poNumberCount}</td><td>{money(v.approvedInvoiceValue)}</td></tr>)}
      </tbody></table>
    </section>

    <section className="panel matched-leads"><div className="panel-head"><div><span className="section-kicker">CONTRACT ↔ INVOICE CROSS-REFERENCE</span><h3>FY25/26 contract inventory records with matched invoice activity</h3></div></div>
      {data.contractCrossReference.map((c) => <article key={c.recordsNeededId}><div><strong>{c.vendor}</strong><p>{c.contract ? `Contract ${c.contract}` : 'No specific contract identified yet'}{c.contractCeiling != null ? ` · ceiling ${money(c.contractCeiling)}` : ''}</p><p>{c.attributionStatus}</p></div><div>{c.match ? <>{money(c.match.approvedInvoiceValue)}<small>{c.match.invoiceCount} invoices · {c.match.poNumberCount} POs</small></> : 'No match'}</div></article>)}
    </section>

    <section className="panel records-needed-queue"><div className="panel-head"><div><span className="section-kicker">REVIEW FLAGS</span><h3>Worth examining — not findings of anything improper</h3></div></div>
      {data.reviewFlags.map((f) => <div className="review-flag-card" key={f.id}><h4>{f.label}</h4><dl>
        <div><dt>Vendor{f.poNumber ? ' / PO' : ''}</dt><dd>{f.vendor}{f.poNumber ? ` · ${f.poNumber}` : ''}</dd></div>
        <div><dt>What the record shows</dt><dd>{f.whatTheRecordShows}</dd></div>
        <div><dt>What we still need to know</dt><dd>{f.whatWeStillNeedToKnow}</dd></div>
        {f.recordsThatCouldResolve && <div><dt>Records that could resolve it</dt><dd>{f.recordsThatCouldResolve.join(' · ')}</dd></div>}
      </dl></div>)}
    </section>

    <section className="panel data-table-panel"><div className="panel-head"><div><span className="section-kicker">TIER A — NAMED OFFICIAL REIMBURSEMENTS</span><h3>Elected commissioners and senior officials only</h3><p className="draft-only-note">Shown because the reimbursement concerns the official&apos;s government role. A reimbursement is routine and is not, by itself, evidence of anything improper.</p></div></div>
      <table className="research-table"><thead><tr><th>Official</th><th>Date</th><th>Purpose</th><th>Status</th><th>Amount</th><th>PO</th></tr></thead><tbody>
        {data.namedOfficialReimbursements.map((r) => <tr key={r.invoiceNumber}><td><strong>{r.official}</strong><small>{r.tierReason}</small></td><td>{formatDate(r.invoiceDate)}</td><td>{r.memo ?? '—'}</td><td>{r.invoiceStatus}</td><td>{r.approvedInvoiceAmount != null ? moneyExact(r.approvedInvoiceAmount) : '—'}</td><td>{r.poNumber ?? '—'}</td></tr>)}
      </tbody></table>
    </section>

    <div className="tier-aggregate-grid">
      <article><span>TIER B · EMPLOYEE REIMBURSEMENTS</span><strong>{money(data.employeeReimbursementsAggregated.approvedInvoiceValue)}</strong><p>{data.employeeReimbursementsAggregated.supplierCount} people, {data.employeeReimbursementsAggregated.invoiceCount} invoices — aggregated, not named. {data.employeeReimbursementsAggregated.note}</p></article>
      <article><span>TIER C · RESIDENT REFUNDS</span><strong>{money(data.residentRefundsAggregated.approvedInvoiceValue)}</strong><p>{data.residentRefundsAggregated.supplierCount} people, {data.residentRefundsAggregated.invoiceCount} invoices — aggregated, not named. {data.residentRefundsAggregated.note}</p></article>
      <article><span>UNCLASSIFIED INDIVIDUALS</span><strong>{money(data.individualPayeesUnclassified.approvedInvoiceValue)}</strong><p>{data.individualPayeesUnclassified.supplierCount} people, {data.individualPayeesUnclassified.invoiceCount} invoices — aggregated, not named. {data.individualPayeesUnclassified.note}</p></article>
    </div>

    <section className="panel software-sweep"><div className="panel-head"><div><span className="section-kicker">SOFTWARE / SAAS INVOICE ACTIVITY</span><h3>Matched against the existing 38-record software sweep</h3></div></div>
      <div className="software-list">
        {data.softwareSaas.verifiedMatches.map((m) => <article key={m.vendor}><div><strong>{m.matchedSupplier}</strong><small>Verified software/service match{m.note ? ` — ${m.note}` : ''}</small></div><span>{money(m.approvedInvoiceValue)}</span></article>)}
        {data.softwareSaas.possibleMatches.map((m) => <article key={m.vendor}><div><strong>{m.matchedSupplier}</strong><small>Possible match — review required: {m.reason}</small></div><span>{money(m.approvedInvoiceValue)}</span></article>)}
        {data.softwareSaas.excluded.map((m) => <article key={m.vendor}><div><strong>{m.vendor}</strong><small>Excluded: {m.reason}</small></div><span>—</span></article>)}
      </div>
    </section>

    <section className="panel contract-method"><div><span className="section-kicker">FUEL / PAYROLL-FUEL RESEARCH CONNECTION</span><h3>{data.fuelConnection.supplier}</h3><p>{data.fuelConnection.invoiceCount} invoices, {money(data.fuelConnection.approvedInvoiceValue)} approved invoice value across {data.fuelConnection.byFiscalYear.map((fy) => `${fy.fiscalYear}: ${money(fy.approvedInvoiceValue)}`).join(', ')}. {data.fuelConnection.note}</p></div></section>

    <p className="source-footnote">{data.dataQuality.negativeAmountInvoices.count} negative-amount invoices ({data.dataQuality.negativeAmountInvoices.note}) · {data.dataQuality.approvedInvoicesWithoutPO.count} approved invoices with no PO number ({data.dataQuality.approvedInvoicesWithoutPO.note})</p>
  </>;
}

export function PublicEmailPanel({ data }: { data: EmailData }) {
  return <>
    <div className="disclaimer"><Mail size={19}/><div><strong>Review language, not people.</strong><span>{data.meta.disclaimer}</span></div></div>
    <div className="metric-grid">{data.mailboxes.map((m)=><article className="research-card" key={m.district}><span>DISTRICT {m.district}</span><h3>{m.commissioner}</h3><p>Official mailbox available · {m.reviewedMessages} messages reviewed in this dataset</p><a href={data.meta.sourceUrl} target="_blank" rel="noreferrer">Open archive <ExternalLink size={12}/></a></article>)}</div>
    <section className="panel review-workflow"><div className="panel-head"><div><span className="section-kicker">§2.2.J REVIEW WORKFLOW</span><h3>Neutral classification queue</h3></div></div>{data.reviewStates.map((s)=><article key={s.id}><strong>{s.label}</strong><p>{s.meaning}</p></article>)}</section>
  </>;
}

export function RecordsDirectoryPanel({ data }: { data: DirectoryData }) {
  return <div className="directory-grid">{data.contacts.map((c)=><article className="research-card" key={c.id}><span>{c.agency}</span><h3>{c.name}</h3><p>{c.recordTypes.join(' · ')}</p><small>{c.method} · verified {c.verified}</small><div className="contact-links"><a href={c.url} target="_blank" rel="noreferrer">Open source <ExternalLink size={12}/></a>{c.email&&<a href={`mailto:${c.email}`}><Mail size={12}/>{c.email}</a>}{c.phone&&<a href={`tel:${c.phone}`}><Phone size={12}/>{c.phone}</a>}</div></article>)}</div>;
}

export function HumanServicesPanel({ data }: { data: HumanData }) {
  return <>
    <div className="feature-total"><div><span>FY2025-26 · ALL-FUNDS FUNCTION</span><strong>{money(data.meta.functionalTotal)}</strong><small>Budgeted — not actual spending</small></div></div>
    <div className="disclaimer"><FileSearch size={19}/><div><strong>Reconciliation is still open.</strong><span>{data.meta.note}</span></div></div>
    <section className="panel data-table-panel"><table className="research-table"><thead><tr><th>Record</th><th>FY2023 actual</th><th>FY2024 actual</th><th>FY2025 budget</th><th>FY2026 budget</th></tr></thead><tbody>{data.records.map((r)=><tr key={r.id}><td><strong>{r.name}</strong><small>{r.costCenter ?? r.reconciliation}</small></td><td>{r.fy2023Actual == null ? '—' : money(r.fy2023Actual)}</td><td>{r.fy2024Actual == null ? '—' : money(r.fy2024Actual)}</td><td>{r.fy2025Budget == null ? '—' : money(r.fy2025Budget)}</td><td>{r.fy2026Budget == null ? '—' : money(r.fy2026Budget)}</td></tr>)}</tbody></table></section>
    <section className="panel open-research"><div className="panel-head"><div><span className="section-kicker">OPEN RESEARCH</span><h3>What remains unresolved</h3></div></div><ul>{data.openResearch.map((x:string)=><li key={x}>{x}</li>)}</ul></section>
  </>;
}

export function ImpactFeesPanel({ data }: { data: FeeData }) {
  return <>
    <div className="disclaimer"><FileSearch size={19}/><div><strong>Comprehensive fees only.</strong><span>{data.meta.note}</span></div></div>
    <section className="panel data-table-panel"><table className="research-table"><thead><tr><th>Land use</th><th>Charged per</th><th>Oct. 1, 2025</th><th>Oct. 1, 2026</th><th>Change</th></tr></thead><tbody>{data.rates.map((r)=>{const change=r.total2026-r.total2025; const pct=change/r.total2025*100; return <tr key={r.landUse}><td><strong>{r.landUse}</strong></td><td>{r.unit}</td><td>{money(r.total2025)}</td><td>{money(r.total2026)}</td><td className="positive-change">+{money(change)} <small>{pct.toFixed(2)}%</small></td></tr>})}</tbody></table></section>
    <p className="source-footnote">Effective-date schedules: <a href={data.meta.source2025} target="_blank" rel="noreferrer">2025</a> · <a href={data.meta.source2026} target="_blank" rel="noreferrer">2026</a></p>
  </>;
}

export const RESPONSE_STATUS_LABELS: Record<string, string> = {
  response_received_completeness_not_verified: 'Response received — completeness not yet verified',
  fulfilled: 'Fulfilled',
  partially_fulfilled: 'Partially fulfilled',
  open: 'Open',
};

// Compact list of public-records responses received. Driven entirely by the local registry
// (data/records-responses.json); the archive link is an outbound link, never a runtime dependency.
export function RecordsResponsesPanel({ responses }: { responses: RecordsResponse[] }) {
  return (
    <section className="panel records-responses">
      <div className="panel-head"><div><span className="section-kicker">RESPONSES RECEIVED</span><h3>Public-records responses, with the original files</h3></div></div>
      {responses.map((r) => (
        <article key={r.id}>
          <header><strong>{r.requestNumber}</strong><span className="pending-value">{RESPONSE_STATUS_LABELS[r.status] ?? r.status}</span></header>
          <p>{r.subject}</p>
          <dl>
            <div><dt>Produced by</dt><dd>{r.agency}</dd></div>
            <div><dt>Response date</dt><dd>{r.responseDate}</dd></div>
            <div><dt>Files received</dt><dd>{r.originalFile.filesReceived}</dd></div>
            <div><dt>Answered</dt><dd>{r.answers.join(' ')}</dd></div>
            <div><dt>Still missing</dt><dd>{r.unresolvedQuestionIds.length} open research questions (see {r.relatedSectionLabel})</dd></div>
          </dl>
          <p><a href={r.publicArchive.url} target="_blank" rel="noopener noreferrer">{r.publicArchive.label} <ExternalLink size={12} /></a> <small>Maintained by the ClayMoneyTrail researcher, not by Clay County.</small></p>
        </article>
      ))}
    </section>
  );
}
