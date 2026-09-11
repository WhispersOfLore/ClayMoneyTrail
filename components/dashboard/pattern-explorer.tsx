'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { EvidenceItem, LeadItem, TimelineEvent } from '@/lib/types';
import { EVIDENCE_STATUS_ORDER, evidenceStatusLabel } from '@/lib/investigation-status';
import { formatDate } from '@/lib/format';
import { InvestigationStatusBadge } from './investigation-status-badge';
import { EmptyState } from './empty-state';

interface PatternRow {
  id: string;
  date: string | null;
  title: string;
  kind: 'Vote / Meeting' | 'Evidence';
  status: string;
  entities: string[];
  url: string | null;
  documentName: string | null;
  extract: string;
  confidence?: string;
}

function buildRows(timeline: TimelineEvent[], evidence: EvidenceItem[]): PatternRow[] {
  const rows: PatternRow[] = [];
  for (const t of timeline) {
    rows.push({
      id: t.id,
      date: t.date,
      title: t.title,
      kind: 'Vote / Meeting',
      status: t.status,
      entities: [t.applicant, t.developer, t.llc, ...(t.votes ?? []).map((v) => v.commissioner)].filter((x): x is string => Boolean(x)),
      url: null,
      documentName: t.agendaItem ?? null,
      extract: t.result ?? t.sourceNote ?? '',
    });
  }
  for (const e of evidence) {
    rows.push({
      id: e.id,
      date: e.date,
      title: e.claim,
      kind: 'Evidence',
      status: e.status,
      entities: e.entities,
      url: e.url,
      documentName: e.documentName,
      extract: e.extract,
      confidence: e.confidence,
    });
  }
  return rows.sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
}

export function PatternExplorer({ leads, evidence, timeline }: { leads: LeadItem[]; evidence: EvidenceItem[]; timeline: TimelineEvent[] }) {
  const allRows = useMemo(() => buildRows(timeline, evidence), [timeline, evidence]);

  const years = useMemo(() => {
    const ys = new Set<string>();
    for (const r of allRows) if (r.date) ys.add(r.date.slice(0, 4));
    return ['All years', ...Array.from(ys).sort()];
  }, [allRows]);

  const statuses = useMemo(
    () => ['All statuses', ...EVIDENCE_STATUS_ORDER.filter((s) => allRows.some((r) => r.status === s))],
    [allRows],
  );

  const [year, setYear] = useState('All years');
  const [status, setStatus] = useState('All statuses');
  const [entityQuery, setEntityQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = allRows.filter((r) => {
    const q = entityQuery.toLowerCase();
    return (
      (year === 'All years' || r.date?.startsWith(year)) &&
      (status === 'All statuses' || r.status === status) &&
      (!q || r.title.toLowerCase().includes(q) || r.entities.some((e) => e.toLowerCase().includes(q)))
    );
  });

  return (
    <div>
      <p className="pattern-explorer-intro">
        Every vote and evidence-ledger entry for this investigation, in one chronological, filterable view. Status
        colors never imply a relationship is confirmed unless the badge itself says so — click a row for its source.
      </p>
      <div className="pattern-filter-bar">
        <label>
          Year
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label>
          Evidence status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'All statuses' ? s : evidenceStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="pattern-filter-search">
          Entity, project, or donor
          <input
            type="text"
            value={entityQuery}
            onChange={(e) => setEntityQuery(e.target.value)}
            placeholder="e.g. Gustafson, Oakleaf, Sandridge…"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matching events" text="Try clearing a filter." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Event / claim</th>
                <th>Kind</th>
                <th>Status</th>
                <th aria-label="Expand" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const open = openId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr className="record-row">
                      <td>{formatDate(r.date)}</td>
                      <td>
                        <strong>{r.title}</strong>
                        {r.entities.length > 0 && <small>{r.entities.join(', ')}</small>}
                      </td>
                      <td>{r.kind}</td>
                      <td>
                        <InvestigationStatusBadge value={r.status} />
                      </td>
                      <td className="record-expand-toggle">
                        <button
                          type="button"
                          className="record-expand-button"
                          aria-expanded={open}
                          aria-label={`${open ? 'Collapse' : 'Expand'} details for ${r.title}`}
                          onClick={() => setOpenId(open ? null : r.id)}
                        >
                          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="record-detail-row">
                        <td colSpan={5} aria-label={`Details for ${r.title}`}>
                          <dl className="record-detail">
                            <div>
                              <dt>Entities</dt>
                              <dd>{r.entities.join(', ') || '—'}</dd>
                            </div>
                            {r.confidence && (
                              <div>
                                <dt>Confidence</dt>
                                <dd>{r.confidence}</dd>
                              </div>
                            )}
                            <div>
                              <dt>Source</dt>
                              <dd>
                                {r.url ? (
                                  <a className="source-link" href={r.url} target="_blank" rel="noreferrer">
                                    {r.documentName ?? r.url}
                                    <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  r.documentName ?? 'See related lead/evidence entry'
                                )}
                              </dd>
                            </div>
                            <div className="record-detail-notes">
                              <dt>Extract / result</dt>
                              <dd>{r.extract || '—'}</dd>
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
      )}

      <p className="pattern-explorer-footnote">
        {leads.length} tracked leads feed this view indirectly (via their linked evidence). See the Leads tab for
        lead-level status and records still needed.
      </p>
    </div>
  );
}
