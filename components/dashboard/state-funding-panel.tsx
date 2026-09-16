'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { money, formatDate } from '@/lib/format';
import type { StateFundingRequest } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { Kpi, Disclaimer } from './layout';
import { CircleDollarSign, FileQuestion, XCircle } from 'lucide-react';

export interface StateFundingDataset {
  meta: {
    totalRequestedAmount: number;
    totalRequests: number;
    totalVetoed: number;
    sessionContext?: string;
  };
  requests: StateFundingRequest[];
  stillNeeded: string[];
}

const LEGISLATIVE_STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  appropriated: 'Appropriated',
  vetoed: 'Vetoed',
  partially_vetoed: 'Partially vetoed',
  unknown_pending_gaa_review: 'Requested — appropriation status unknown',
  withdrawn: 'Withdrawn',
};

const LEGISLATIVE_STATUS_CLASS: Record<string, string> = {
  requested: 'inv-status-unverified_lead',
  appropriated: 'inv-status-verified_fact',
  vetoed: 'inv-status-allegation',
  partially_vetoed: 'inv-status-conflicting_evidence',
  unknown_pending_gaa_review: 'inv-status-records_required',
  withdrawn: 'inv-status-disproven_claim',
};

function LegislativeStatusBadge({ value }: { value: string }) {
  return <span className={`status inv-status ${LEGISLATIVE_STATUS_CLASS[value] ?? ''}`}>{LEGISLATIVE_STATUS_LABELS[value] ?? value}</span>;
}

export function StateFundingPanel({ dataset }: { dataset: StateFundingDataset }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { meta, requests } = dataset;

  return (
    <div>
      <Disclaimer
        title="Requested ≠ Appropriated ≠ Received ≠ Spent."
        text="A Local Funding Initiative Request (LFIR) is a legislative ask, not a guarantee. This page tracks each request's status through the legislative pipeline explicitly — never collapse these into a single 'funding' number."
      />
      <div className="kpi-grid">
        <Kpi icon={<CircleDollarSign />} color="blue" label="Total requested (FY2026-27)" value={money(meta.totalRequestedAmount, true)} note={`${meta.totalRequests} active Clay County LFIRs`} />
        <Kpi icon={<XCircle />} color="gold" label="Confirmed vetoed" value={money(meta.totalVetoed, true)} note="4 line items, signed 2026-06-29" />
        <Kpi icon={<FileQuestion />} color="gray" label="Appropriation status unknown" value={String(requests.filter((r) => r.legislativeStatus === 'unknown_pending_gaa_review').length)} note="Not on veto list; enacted-GAA inclusion unconfirmed" muted />
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>LFIR #</th>
                <th>Project</th>
                <th>Requesting entity</th>
                <th>Requested</th>
                <th>Legislative status</th>
                <th aria-label="Expand" />
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const open = openId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr className="record-row">
                      <td>#{r.lfir}</td>
                      <td>
                        <strong>{r.title}</strong>
                        {r.publicSafetyComplexComponent && <small> · Public Safety Complex component</small>}
                      </td>
                      <td>{r.requestingEntity}</td>
                      <td>{money(r.amountRequested)}</td>
                      <td>
                        <LegislativeStatusBadge value={r.legislativeStatus} />
                      </td>
                      <td className="record-expand-toggle">
                        <button type="button" className="record-expand-button" aria-expanded={open} onClick={() => setOpenId(open ? null : r.id)}>
                          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="record-detail-row">
                        <td colSpan={6}>
                          <dl className="record-detail">
                            <div className="record-detail-notes">
                              <dt>Description</dt>
                              <dd>{r.description}</dd>
                            </div>
                            <div>
                              <dt>Senate sponsor</dt>
                              <dd>{r.senateSponsor}</dd>
                            </div>
                            <div>
                              <dt>State agency</dt>
                              <dd>{r.stateAgency ?? '—'}</dd>
                            </div>
                            <div>
                              <dt>Total project cost (FY2026-27)</dt>
                              <dd>{r.totalProjectCost != null ? money(r.totalProjectCost) : '—'}</dd>
                            </div>
                            <div>
                              <dt>Date of request</dt>
                              <dd>{formatDate(r.dateOfRequest)}</dd>
                            </div>
                            <div className="record-detail-notes">
                              <dt>Legislative status detail</dt>
                              <dd>{r.legislativeStatusDetail}</dd>
                            </div>
                            {r.priorStateFundingNote && (
                              <div className="record-detail-notes">
                                <dt>Prior state funding</dt>
                                <dd>{r.priorStateFundingNote}</dd>
                              </div>
                            )}
                            <div>
                              <dt>Source</dt>
                              <dd>
                                <a className="source-link" href={r.sourceUrl} target="_blank" rel="noreferrer">
                                  Official LFIR PDF <ExternalLink size={12} />
                                </a>
                              </dd>
                            </div>
                            <div>
                              <dt>Source status</dt>
                              <dd>
                                <StatusBadge value={r.sourceStatus} />
                              </dd>
                            </div>
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">STILL NEEDED</span>
            <h3>What would resolve the open questions</h3>
          </div>
        </div>
        <ul className="records-needed-list">
          {meta.sessionContext && <li>{meta.sessionContext}</li>}
          {dataset.stillNeeded.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
