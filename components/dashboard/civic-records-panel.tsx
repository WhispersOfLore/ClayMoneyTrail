import { ExternalLink, FileSearch, Mail, Phone } from 'lucide-react';
import { money } from '@/lib/format';

type ContractData = { meta: { disclaimer: string }; records: Array<{ id:string; bidNumber:string; title:string; noticeType:string; noticeDate:string; vendor:string|null }> };
type EmailData = { meta:{ disclaimer:string; sourceUrl:string }; mailboxes:Array<{district:string; commissioner:string; reviewedMessages:number}>; reviewStates:Array<{id:string;label:string;meaning:string}> };
type DirectoryData = { contacts:Array<{id:string;agency:string;name:string;recordTypes:string[];method:string;url:string;email:string|null;phone:string|null;verified:string}> };
type HumanData = { meta:{functionalTotal:number;note:string}; records:Array<{id:string;name:string;costCenter:string|null;reconciliation:string;fy2023Actual:number|null;fy2024Actual:number|null;fy2025Budget:number|null;fy2026Budget:number|null}>; openResearch:string[] };
type FeeData = { meta:{note:string;source2025:string;source2026:string}; rates:Array<{landUse:string;unit:string;total2025:number;total2026:number}> };

export function ContractsPanel({ data }: { data: ContractData }) {
  return <>
    <div className="disclaimer"><FileSearch size={19}/><div><strong>A registry is not a payment ledger.</strong><span>{data.meta.disclaimer}</span></div></div>
    <section className="panel data-table-panel"><table className="research-table"><thead><tr><th>Bid</th><th>Notice</th><th>Date</th><th>Vendor</th><th>Award / ceiling / paid</th></tr></thead><tbody>{data.records.map((r)=><tr key={r.id}><td><strong>{r.bidNumber}</strong></td><td>{r.title}<small>{r.noticeType.replaceAll('_',' ')}</small></td><td>{r.noticeDate}</td><td>{r.vendor ?? 'Not extracted'}</td><td><span className="pending-value">Not verified</span></td></tr>)}</tbody></table></section>
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
