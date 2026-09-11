'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { money, formatDate } from '@/lib/format';
import type { RecordItem, SourceItem } from '@/lib/types';
import { EmptyState } from './empty-state';
import { StatusBadge } from './status-badge';
import { SourceLink } from './source-link';

export function RecordsTable({ records: rows, sources }: { records: RecordItem[]; sources: SourceItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!rows.length) {
    return <EmptyState title="No matching records" text="Try clearing a filter, or check back as more official records are added." />;
  }
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Record</th>
            <th>Department</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Source status</th>
            <th aria-label="Expand" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const open = openId === r.id;
            const source = sourceById.get(r.sourceId);
            return (
              <Fragment key={r.id}>
                <tr className="record-row">
                  <td>
                    <strong>{r.name}</strong>
                    <small>{r.fiscalYear}</small>
                  </td>
                  <td>{r.department}</td>
                  <td>
                    <span className="measure">{r.measure}</span>
                  </td>
                  <td className={r.amount === null ? 'amount-null' : ''}>{money(r.amount)}</td>
                  <td>
                    <StatusBadge value={r.sourceStatus} />
                  </td>
                  <td className="record-expand-toggle">
                    <button
                      type="button"
                      className="record-expand-button"
                      aria-expanded={open}
                      aria-label={`${open ? 'Collapse' : 'Expand'} details for ${r.name}, ${r.fiscalYear}`}
                      onClick={() => setOpenId(open ? null : r.id)}
                    >
                      {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="record-detail-row">
                    <td colSpan={6} aria-label={`Details for ${r.name}`}>
                      <dl className="record-detail">
                        <div>
                          <dt>Fiscal year</dt>
                          <dd>{r.fiscalYear}</dd>
                        </div>
                        <div>
                          <dt>Amount</dt>
                          <dd>{money(r.amount)}</dd>
                        </div>
                        <div>
                          <dt>Measurement type</dt>
                          <dd className="measure">{r.measure}</dd>
                        </div>
                        <div>
                          <dt>Source status</dt>
                          <dd>
                            <StatusBadge value={r.sourceStatus} />
                          </dd>
                        </div>
                        <div>
                          <dt>Source</dt>
                          <dd>
                            <SourceLink source={source} />
                          </dd>
                        </div>
                        <div>
                          <dt>Last verified</dt>
                          <dd>{formatDate(source?.lastVerified)}</dd>
                        </div>
                        <div className="record-detail-notes">
                          <dt>Notes / assumptions / formula</dt>
                          <dd>{r.notes}</dd>
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
