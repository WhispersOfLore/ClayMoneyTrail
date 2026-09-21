import { ExternalLink, FileSearch, Mail, Phone } from 'lucide-react';
import { money } from '@/lib/format';
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
    <section className="financial-proof-grid"><article className="award-proof"><span>VERIFIED APPROVED AWARDS</span><strong>{money(inventory.meta.approved_amount_total)}</strong><p>Four approved award amounts. This is not spending and is not an actual-payment total.</p></article><article className="payment-proof"><span>VERIFIED ACTUAL PAYMENTS IDENTIFIED</span><strong>{money(inventory.meta.verified_actual_payments_identified)}</strong><p>No vendor payments have yet been verified from the public sources reviewed.</p></article></section>
    <section className="panel contract-method"><div><span className="section-kicker">PUBLIC METHODOLOGY</span><h3>An evolving document-chain inventory</h3><p>{inventory.meta.methodology}</p></div><a className="source-link" href={data.meta.inventoryCsv} download>Download research CSV</a></section>
    <section className="panel category-summary"><div className="panel-head"><div><span className="section-kicker">CATEGORY COVERAGE</span><h3>Records by research category</h3></div></div><div>{Object.entries(inventory.meta.categories).map(([name,count])=><span key={name}><strong>{count}</strong>{name}</span>)}</div></section>
    <section className="panel data-table-panel"><table className="research-table"><thead><tr><th>Bid</th><th>Notice</th><th>Date</th><th>Vendor / contract</th><th>Approved or ceiling</th><th>Actual paid</th></tr></thead><tbody>{data.records.map((r)=><tr key={r.id}><td><strong>{r.bidNumber}</strong></td><td>{r.title}<small>{r.noticeType.replaceAll('_',' ')}</small></td><td>{r.noticeDate}</td><td>{r.vendor ?? 'Not extracted'}<small>{r.contractNumber ? `Contract ${r.contractNumber}` : 'Contract not yet matched'}</small></td><td>{r.contractCeiling != null ? money(r.contractCeiling) : r.approvedAward != null ? `${money(r.approvedAward)} award` : <span className="pending-value">Not verified</span>}</td><td><span className="pending-value">Not located</span></td></tr>)}</tbody></table></section>
    <section className="panel matched-leads"><div className="panel-head"><div><span className="section-kicker">ADDITIONAL OFFICIAL MATCHES</span><h3>Vendor and award facts found in BCC records</h3></div></div>{data.additionalMatches.map((item)=><article key={item.id}><div><strong>{item.bidNumber} · {item.vendor}</strong><p>{item.amountMeaning}</p></div><div>{item.approvedAward == null ? 'No fixed award' : money(item.approvedAward)}<a href={item.sourceUrl} target="_blank" rel="noreferrer">Official record <ExternalLink size={12}/></a></div></article>)}</section>
    <section className="panel software-sweep"><div className="panel-head"><div><span className="section-kicker">DEDICATED SOFTWARE SWEEP</span><h3>{inventory.meta.software_records} agreements, renewals, and amendments flagged</h3></div></div><div className="software-list">{inventory.softwareRecords.map((item)=><article key={`${item.record_number}-${item.title}`}><div><strong>{item.normalized_vendor ?? item.title}</strong><small>{item.record_number ?? 'Procurement-only record'} · {item.document_type}</small></div><span>{item.payment_status}</span><a href={item.source_url} target="_blank" rel="noreferrer" aria-label={`Open ${item.title}`}><ExternalLink size={14}/></a></article>)}</div></section>
    <section className="panel records-needed-queue"><div className="panel-head"><div><span className="section-kicker">RECORDS NEEDED · DRAFTS ONLY</span><h3>Narrow research items generated from verified gaps</h3><p className="draft-only-note">{data.meta.recordsNeededStatus}</p></div><a className="source-link" href={data.meta.contractSearchUrl} target="_blank" rel="noreferrer">Search contracts <ExternalLink size={12}/></a></div>{data.recordsNeeded.map((item)=><article key={item.id}><div className="records-needed-title"><span className={`priority priority-${item.priority}`}>{item.priority}</span><div><strong>{item.vendor}</strong><small>{item.contract ? `Contract ${item.contract}` : 'Executed contract not yet matched'} · draft research item</small></div></div><p>{item.reason}</p><dl><div><dt>Missing</dt><dd>{item.missing}</dd></div><div><dt>Already searched</dt><dd>{item.searched.join(' · ')}</dd></div><div><dt>Likely custodian</dt><dd>{item.custodian}</dd></div><div><dt>Date range</dt><dd>{item.dateRange}</dd></div></dl></article>)}</section>
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
            <div><dt>Still missing</dt><dd>{r.unresolvedQuestionIds.length} open research questions (see People / Payroll)</dd></div>
          </dl>
          <p><a href={r.publicArchive.url} target="_blank" rel="noopener noreferrer">{r.publicArchive.label} <ExternalLink size={12} /></a> <small>Maintained by the ClayMoneyTrail researcher, not by Clay County.</small></p>
        </article>
      ))}
    </section>
  );
}
