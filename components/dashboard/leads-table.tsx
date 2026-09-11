'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LeadItem } from '@/lib/types';
import { InvestigationStatusBadge } from './investigation-status-badge';
import { EmptyState } from './empty-state';

const PRIORITY_LABEL: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' };

export function LeadsTable({ leads }: { leads: LeadItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!leads.length) {
    return <EmptyState title="No leads recorded" text="Leads will appear here as the investigation identifies them." />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Lead</th>
            <th>Priority</th>
            <th>Status</th>
            <th aria-label="Expand" />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const open = openId === lead.id;
            return (
              <Fragment key={lead.id}>
                <tr className="record-row">
                  <td>
                    <strong>{lead.title}</strong>
                    <small>{lead.id}</small>
                  </td>
                  <td className={`priority priority-${lead.priority}`}>{PRIORITY_LABEL[lead.priority] ?? lead.priority}</td>
                  <td>
                    <InvestigationStatusBadge value={lead.status} />
                  </td>
                  <td className="record-expand-toggle">
                    <button
                      type="button"
                      className="record-expand-button"
                      aria-expanded={open}
                      aria-label={`${open ? 'Collapse' : 'Expand'} details for ${lead.title}`}
                      onClick={() => setOpenId(open ? null : lead.id)}
                    >
                      {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="record-detail-row">
                    <td colSpan={4} aria-label={`Details for ${lead.title}`}>
                      <dl className="record-detail">
                        <div className="record-detail-notes">
                          <dt>Description</dt>
                          <dd>{lead.description}</dd>
                        </div>
                        <div>
                          <dt>Origin</dt>
                          <dd>{lead.origin}</dd>
                        </div>
                        <div>
                          <dt>Entities involved</dt>
                          <dd>{lead.entitiesInvolved.join(', ') || '—'}</dd>
                        </div>
                        <div className="record-detail-notes">
                          <dt>Why it matters</dt>
                          <dd>{lead.whyItMatters}</dd>
                        </div>
                        <div className="record-detail-notes">
                          <dt>Evidence available</dt>
                          <dd>{lead.evidenceAvailable}</dd>
                        </div>
                        <div className="record-detail-notes">
                          <dt>Evidence missing</dt>
                          <dd>{lead.evidenceMissing}</dd>
                        </div>
                        <div className="record-detail-notes">
                          <dt>Records needed</dt>
                          <dd>
                            <ul className="records-needed-list">
                              {lead.recordsNeeded.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
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
  );
}
