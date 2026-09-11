'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { EvidenceItem } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { InvestigationStatusBadge } from './investigation-status-badge';
import { EmptyState } from './empty-state';

export function EvidenceLedger({ evidence }: { evidence: EvidenceItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!evidence.length) {
    return <EmptyState title="No evidence entries yet" text="Every investigative claim will appear here with a status, source, and confidence level." />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Status</th>
            <th>Confidence</th>
            <th aria-label="Expand" />
          </tr>
        </thead>
        <tbody>
          {evidence.map((ev) => {
            const open = openId === ev.id;
            return (
              <Fragment key={ev.id}>
                <tr className="record-row">
                  <td>
                    <strong>{ev.claim}</strong>
                    <small>{ev.id}</small>
                  </td>
                  <td>
                    <InvestigationStatusBadge value={ev.status} />
                  </td>
                  <td>
                    <span className={`confidence confidence-${ev.confidence}`}>{ev.confidence}</span>
                  </td>
                  <td className="record-expand-toggle">
                    <button
                      type="button"
                      className="record-expand-button"
                      aria-expanded={open}
                      aria-label={`${open ? 'Collapse' : 'Expand'} details for ${ev.id}`}
                      onClick={() => setOpenId(open ? null : ev.id)}
                    >
                      {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="record-detail-row">
                    <td colSpan={4} aria-label={`Details for ${ev.id}`}>
                      <dl className="record-detail">
                        <div>
                          <dt>Entities</dt>
                          <dd>{ev.entities.join(', ') || '—'}</dd>
                        </div>
                        <div>
                          <dt>Date of event</dt>
                          <dd>{formatDate(ev.date)}</dd>
                        </div>
                        <div>
                          <dt>Date accessed</dt>
                          <dd>{formatDate(ev.dateAccessed)}</dd>
                        </div>
                        <div>
                          <dt>Source type</dt>
                          <dd>{ev.sourceType}</dd>
                        </div>
                        <div>
                          <dt>Source</dt>
                          <dd>
                            {ev.url ? (
                              <a className="source-link" href={ev.url} target="_blank" rel="noreferrer">
                                {ev.documentName ?? ev.url}
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="source-link-missing">No source yet — records required</span>
                            )}
                          </dd>
                        </div>
                        <div className="record-detail-notes">
                          <dt>Extract / notes</dt>
                          <dd>{ev.extract}</dd>
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
  );
}
