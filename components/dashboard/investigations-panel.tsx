'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, GitBranch } from 'lucide-react';
import type { EvidenceItem, InvestigationMeta, LeadItem, RecordsRequestItem, TimelineEvent } from '@/lib/types';
import { EVIDENCE_STATUS_ORDER, evidenceStatusLabel } from '@/lib/investigation-status';
import { Disclaimer } from './layout';
import { LeadsTable } from './leads-table';
import { EvidenceLedger } from './evidence-ledger';
import { InvestigationTimeline } from './investigation-timeline';
import { RecordsRequestsTable } from './records-requests-table';
import { PatternExplorer } from './pattern-explorer';

const CORE_TABS_BEFORE_TOPICS = ['Overview', 'Pattern Explorer', 'Timeline'];
const CORE_TABS_AFTER_TOPICS = ['Leads', 'Evidence Ledger', 'Records Needed'];

function districtSortKey(meta: InvestigationMeta): number {
  const n = Number(meta.district);
  return Number.isFinite(n) ? n : 999;
}

export function InvestigationsPanel({
  investigations,
  leads,
  evidence,
  timeline,
  requests,
}: {
  investigations: InvestigationMeta[];
  leads: LeadItem[];
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  requests: RecordsRequestItem[];
}) {
  const orderedInvestigations = useMemo(
    () => [...investigations].sort((a, b) => districtSortKey(a) - districtSortKey(b)),
    [investigations],
  );

  const [selectedId, setSelectedId] = useState(orderedInvestigations[0]?.id ?? '');
  const meta = orderedInvestigations.find((i) => i.id === selectedId) ?? orderedInvestigations[0];

  const invLeads = useMemo(() => leads.filter((l) => l.investigationId === meta?.id), [leads, meta]);
  const invEvidence = useMemo(() => evidence.filter((e) => e.investigationId === meta?.id), [evidence, meta]);
  const invTimeline = useMemo(() => timeline.filter((t) => t.investigationId === meta?.id), [timeline, meta]);
  const invRequests = useMemo(() => requests.filter((r) => r.relatedInvestigation === meta?.id), [requests, meta]);

  const topics = useMemo(() => {
    const seen: string[] = [];
    for (const l of invLeads) {
      if (l.topic && !seen.includes(l.topic)) seen.push(l.topic);
    }
    return seen;
  }, [invLeads]);

  const tabs = useMemo(
    () => [...CORE_TABS_BEFORE_TOPICS, ...topics, ...CORE_TABS_AFTER_TOPICS],
    [topics],
  );

  const [tab, setTab] = useState(tabs[0]);
  const activeTab = tabs.includes(tab) ? tab : tabs[0];

  const statusCounts = EVIDENCE_STATUS_ORDER.map((status) => ({
    status,
    count: [...invLeads.map((l) => l.status), ...invEvidence.map((e) => e.status)].filter((s) => s === status).length,
  })).filter((s) => s.count > 0);

  if (!meta) {
    return <p>No investigations loaded.</p>;
  }

  return (
    <div className="inv-panel">
      <div className="inv-district-tabs">
        {orderedInvestigations.map((inv) => (
          <button
            key={inv.id}
            type="button"
            className={`inv-district-tab ${inv.id === meta.id ? 'inv-district-tab-active' : ''}`}
            onClick={() => {
              setSelectedId(inv.id);
              setTab('Overview');
            }}
          >
            <span className="inv-district-tab-district">District {inv.district ?? '?'}</span>
            <span className="inv-district-tab-name">{inv.commissioner ?? inv.subject}</span>
          </button>
        ))}
      </div>

      <div className="inv-subject-header">
        {meta.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="inv-subject-photo"
            src={`${import.meta.env.BASE_URL}${meta.photoUrl.replace(/^\//, '')}`}
            alt={`Official portrait of ${meta.commissioner ?? meta.subject}`}
            width={72}
            height={90}
          />
        )}
        <div>
          <h3 className="inv-subject-heading">{meta.subject}</h3>
          {(meta.currentTitle || meta.areaRepresented) && (
            <p className="inv-subject-subhead">
              {meta.currentTitle}
              {meta.currentTitle && meta.areaRepresented ? ' · ' : ''}
              {meta.areaRepresented && <>Represents {meta.areaRepresented}</>}
            </p>
          )}
          {meta.photoSourceUrl && (
            <a className="source-link inv-subject-photo-credit" href={meta.photoSourceUrl} target="_blank" rel="noreferrer">
              Official Clay County government photo
            </a>
          )}
        </div>
      </div>

      <div className="inv-tabs">
        {tabs.map((t) => (
          <button key={t} type="button" className={`inv-tab ${activeTab === t ? 'inv-tab-active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div>
          <Disclaimer title="Evidence-gathering, not an accusation." text={meta.disclaimer} />
          <div className="inv-overview-grid">
            <div className="inv-overview-card">
              <h4>Scope</h4>
              <p>{meta.scope}</p>
              <p className="inv-overview-status">{meta.status}</p>
            </div>
            <div className="inv-overview-card">
              <h4>Status mix so far</h4>
              {statusCounts.length === 0 ? (
                <p className="inv-overview-status">No leads or evidence entries recorded yet for this district.</p>
              ) : (
                <ul className="inv-status-mix">
                  {statusCounts.map(({ status, count }) => (
                    <li key={status}>
                      <span className={`status inv-status inv-status-${status}`}>{evidenceStatusLabel(status)}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="inv-overview-card">
              <h4>
                <GitBranch size={15} /> Relationship graph
              </h4>
              <p>
                Entity and relationship data for this investigation is also loaded into <strong>Cthrew</strong>, a
                companion Clay County transparency graph that visualizes documented connections between people,
                businesses, government bodies, and documents, each traceable to its source.
              </p>
              <a className="source-link" href="http://localhost:5310" target="_blank" rel="noreferrer">
                Open Cthrew graph (run `pnpm dev` in ../Cthrew)
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Pattern Explorer' && <PatternExplorer leads={invLeads} evidence={invEvidence} timeline={invTimeline} />}

      {activeTab === 'Timeline' && <InvestigationTimeline events={invTimeline} />}

      {topics.includes(activeTab) && <LeadsTable leads={invLeads.filter((l) => l.topic === activeTab)} />}

      {activeTab === 'Leads' && <LeadsTable leads={invLeads} />}
      {activeTab === 'Evidence Ledger' && <EvidenceLedger evidence={invEvidence} />}
      {activeTab === 'Records Needed' && <RecordsRequestsTable requests={invRequests} />}
    </div>
  );
}
