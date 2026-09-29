'use client';

import { ExternalLink } from 'lucide-react';
import { money, formatDate } from '@/lib/format';
import type { EvidenceStatus } from '@/lib/types';
import { InvestigationStatusBadge } from './investigation-status-badge';

export interface FireStation24Data {
  meta: { title: string; asOf: string; summary: string; disclaimer: string };
  workOrder: {
    number: string; vendor: string; contractNumber: string;
    contractLabelWrinkle: string; contractLabelEvidenceStatus: EvidenceStatus;
    scope: string; excludesNote: string;
    lumpSum: number; notToExceed: number; totalAuthorized: number;
    signedDate: string; signedBy: string;
    evidenceStatus: EvidenceStatus; sourceNote: string; sourceUrl: string; sourceUrlNote: string;
  };
  fwcPermit: {
    number: string; name: string; owner: string; effectiveDate: string;
    status: string; statusNote: string; consultant: string;
    evidenceStatus: EvidenceStatus; sourceNote: string; sourceUrl: string; sourceUrlNote: string;
  };
  relocation: {
    totalInvoiced: number; adultCount: number; juvenileCount: number;
    sourceProjectAsStated: string; recipientSite: string; recipientSiteLocationNote: string;
    evidenceStatus: EvidenceStatus; sourceNote: string;
  };
  estimateVsActual: { preCaptureEstimate: string; invoicedCount: string; explanation: string; evidenceStatus: EvidenceStatus };
  apesInvoice: {
    vendor: string; invoiceNumber: string; invoiceDate: string; dueDate: string; billedTo: string;
    lineItems: { description: string; qty: number; rate: number; amount: number }[];
    total: number; evidenceStatus: EvidenceStatus; sourceNote: string; sourceUrl: string | null;
  };
  paymentStatus: { wgiWorkOrder: string; apesInvoice: string; doNotCombine: string; evidenceStatus: EvidenceStatus };
  crossProjectQuestion: { question: string; evidenceStatus: EvidenceStatus; finding: string; caveat: string };
  countywideContext: { note: string };
  missingRecords: string[];
}

function StageBadge({ label, kind }: { label: string; kind: 'authorized' | 'invoiced' | 'unknown' }) {
  return <span className={`stage-badge stage-${kind}`}>{label}</span>;
}

export function FireStation24Panel({ data }: { data: FireStation24Data }) {
  const { workOrder, fwcPermit, relocation, estimateVsActual, apesInvoice, paymentStatus, crossProjectQuestion, countywideContext, missingRecords } = data;
  return (
    <>
      <div className="disclaimer">
        <FireStation24Icon />
        <div>
          <strong>Evidence chain, not an allegation.</strong>
          <span>{data.meta.disclaimer}</span>
        </div>
      </div>

      <section className="panel evidence-chain">
        <div className="panel-head"><div><span className="section-kicker">EVIDENCE CHAIN</span><h3>County project → work order → permit → relocation → invoice</h3></div></div>

        <article className="chain-step">
          <header><span className="section-kicker">PROJECT</span><h4>Fire Station 24</h4></header>
          <p>Clay County construction project. The work below covers environmental/gopher-tortoise services connected to this site.</p>
        </article>

        <article className="chain-step">
          <header>
            <span className="section-kicker">WGI WORK ORDER</span>
            <h4>{workOrder.number}</h4>
            <StageBadge label="Authorized, not paid" kind="authorized" />
          </header>
          <p>{workOrder.scope}</p>
          <dl>
            <div><dt>Vendor</dt><dd>{workOrder.vendor}</dd></div>
            <div><dt>Parent contract</dt><dd>{workOrder.contractNumber}</dd></div>
            <div><dt>Signed</dt><dd>{formatDate(workOrder.signedDate)} by {workOrder.signedBy}</dd></div>
            <div><dt>Authorized amount</dt><dd><strong>{money(workOrder.totalAuthorized)}</strong> (Lump Sum {money(workOrder.lumpSum)} + Not-to-Exceed {money(workOrder.notToExceed)})</dd></div>
          </dl>
          <p className="panel-footnote">{workOrder.excludesNote}</p>
          <div className="chain-flag">
            <InvestigationStatusBadge value={workOrder.contractLabelEvidenceStatus} />
            <p>{workOrder.contractLabelWrinkle}</p>
          </div>
          <p className="source-footnote">{workOrder.sourceNote}</p>
          <p className="source-footnote"><a href={workOrder.sourceUrl} target="_blank" rel="noreferrer">Official record <ExternalLink size={12} /></a> · {workOrder.sourceUrlNote}</p>
        </article>

        <article className="chain-step">
          <header><span className="section-kicker">FWC PERMIT</span><h4>Permit {fwcPermit.number}</h4></header>
          <dl>
            <div><dt>Permit name</dt><dd>{fwcPermit.name}</dd></div>
            <div><dt>Effective date</dt><dd>{formatDate(fwcPermit.effectiveDate)}</dd></div>
            <div><dt>Status (as displayed by FWC)</dt><dd>{fwcPermit.status}</dd></div>
            <div><dt>Consultant / authorized agent</dt><dd>{fwcPermit.consultant}</dd></div>
          </dl>
          <p className="panel-footnote">{fwcPermit.statusNote}</p>
          <p className="source-footnote">{fwcPermit.sourceNote}</p>
          <p className="source-footnote"><a href={fwcPermit.sourceUrl} target="_blank" rel="noreferrer">FWC permit lookup <ExternalLink size={12} /></a> · {fwcPermit.sourceUrlNote}</p>
        </article>

        <article className="chain-step">
          <header><span className="section-kicker">RELOCATION</span><h4>{relocation.totalInvoiced} tortoises invoiced as relocated from {relocation.sourceProjectAsStated}</h4></header>
          <dl>
            <div><dt>Adult</dt><dd>{relocation.adultCount}</dd></div>
            <div><dt>Juvenile</dt><dd>{relocation.juvenileCount}</dd></div>
            <div><dt>Recipient site</dt><dd>{relocation.recipientSite}</dd></div>
          </dl>
          <p className="panel-footnote">{relocation.recipientSiteLocationNote}</p>
          <p className="source-footnote">{relocation.sourceNote}</p>
        </article>

        <article className="chain-step">
          <header>
            <span className="section-kicker">APES</span>
            <h4>Invoice #{apesInvoice.invoiceNumber} — All Phase Environmental Solutions</h4>
            <StageBadge label="Invoiced, not confirmed paid" kind="invoiced" />
          </header>
          <p><small>Invoiced {formatDate(apesInvoice.invoiceDate)} · Due {formatDate(apesInvoice.dueDate)} · Billed to {apesInvoice.billedTo}</small></p>
          <table className="research-table">
            <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
            <tbody>
              {apesInvoice.lineItems.map((li) => (
                <tr key={li.description}><td>{li.description}</td><td>{li.qty}</td><td>{money(li.rate)}</td><td>{money(li.amount)}</td></tr>
              ))}
              <tr><td colSpan={3}><strong>Total invoiced</strong></td><td><strong>{money(apesInvoice.total)}</strong></td></tr>
            </tbody>
          </table>
          <p className="source-footnote">{apesInvoice.sourceNote}</p>
        </article>

        <article className="chain-step">
          <header><span className="section-kicker">ESTIMATE VS. ACTUAL</span><h4>Why 15 and 16 both appear in the records</h4></header>
          <dl>
            <div><dt>Pre-capture estimate</dt><dd>{estimateVsActual.preCaptureEstimate}</dd></div>
            <div><dt>Later invoiced count</dt><dd>{estimateVsActual.invoicedCount}</dd></div>
          </dl>
          <p>{estimateVsActual.explanation}</p>
        </article>

        <article className="chain-step payment-status-step">
          <header>
            <span className="section-kicker">PAYMENT STATUS</span>
            <h4>What has and hasn&apos;t been confirmed paid</h4>
            <StageBadge label="Payment not established" kind="unknown" />
          </header>
          <dl>
            <div><dt>WGI work order ({money(workOrder.totalAuthorized)} authorized)</dt><dd>{paymentStatus.wgiWorkOrder}</dd></div>
            <div><dt>APES invoice ({money(apesInvoice.total)} invoiced)</dt><dd>{paymentStatus.apesInvoice}</dd></div>
          </dl>
          <p><strong>{paymentStatus.doNotCombine}</strong></p>
        </article>
      </section>

      <section className="panel ordinance-summary cross-project-question">
        <div className="panel-head"><div><span className="section-kicker">COMMUNITY QUESTION</span><h3>Could tortoises from other projects have been included?</h3></div></div>
        <article>
          <p>{crossProjectQuestion.question}</p>
          <div className="chain-flag">
            <InvestigationStatusBadge value={crossProjectQuestion.evidenceStatus} />
            <p>{crossProjectQuestion.finding}</p>
          </div>
          <p className="panel-footnote">{crossProjectQuestion.caveat}</p>
        </article>
      </section>

      <section className="panel countywide-context-note">
        <p>{countywideContext.note}</p>
      </section>

      <section className="panel ordinance-summary missing-records">
        <div className="panel-head"><div><span className="section-kicker">RECORDS NEEDED</span><h3>What is not yet in the record</h3></div></div>
        <article>
          <ul>
            {missingRecords.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </article>
      </section>
    </>
  );
}

function FireStation24Icon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}
