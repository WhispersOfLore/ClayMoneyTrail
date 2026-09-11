'use client';

import { useState } from 'react';
import { ExternalLink, GitBranch } from 'lucide-react';
import type { EvidenceItem, InvestigationMeta, LeadItem, RecordsRequestItem, TimelineEvent } from '@/lib/types';
import { EVIDENCE_STATUS_ORDER, evidenceStatusLabel } from '@/lib/investigation-status';
import { Disclaimer } from './layout';
import { LeadsTable } from './leads-table';
import { EvidenceLedger } from './evidence-ledger';
import { InvestigationTimeline } from './investigation-timeline';
import { RecordsRequestsTable } from './records-requests-table';
import { PatternExplorer } from './pattern-explorer';

type InvTab = 'Overview' | 'Pattern Explorer' | 'Timeline' | 'Land & Development' | 'Businesses' | 'Campaign Money' | 'Stormwater' | 'Compensation' | 'Leads' | 'Evidence Ledger' | 'Records Needed';

const TABS: InvTab[] = [
  'Overview', 'Pattern Explorer', 'Timeline', 'Land & Development', 'Businesses', 'Campaign Money',
  'Stormwater', 'Compensation', 'Leads', 'Evidence Ledger', 'Records Needed',
];

const TOPIC_LEAD_IDS: Record<string, string[]> = {
  'Land & Development': ['LEAD-sandridge', 'LEAD-gustafson'],
  Businesses: ['LEAD-burke-chiropractic'],
  'Campaign Money': ['LEAD-campaign-contributors'],
  Stormwater: ['LEAD-stormwater'],
  Compensation: ['LEAD-compensation'],
};

export function InvestigationsPanel({
  meta,
  leads,
  evidence,
  timeline,
  requests,
}: {
  meta: InvestigationMeta;
  leads: LeadItem[];
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  requests: RecordsRequestItem[];
}) {
  const [tab, setTab] = useState<InvTab>('Overview');

  const statusCounts = EVIDENCE_STATUS_ORDER.map((status) => ({
    status,
    count: [...leads.map((l) => l.status), ...evidence.map((e) => e.status)].filter((s) => s === status).length,
  })).filter((s) => s.count > 0);

  return (
    <div className="inv-panel">
      <div className="inv-tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={`inv-tab ${tab === t ? 'inv-tab-active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
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
              <ul className="inv-status-mix">
                {statusCounts.map(({ status, count }) => (
                  <li key={status}>
                    <span className={`status inv-status inv-status-${status}`}>{evidenceStatusLabel(status)}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
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

      {tab === 'Pattern Explorer' && <PatternExplorer leads={leads} evidence={evidence} timeline={timeline} />}

      {tab === 'Timeline' && <InvestigationTimeline events={timeline} />}

      {(tab === 'Land & Development' || tab === 'Businesses' || tab === 'Campaign Money' || tab === 'Stormwater' || tab === 'Compensation') && (
        <LeadsTable leads={leads.filter((l) => TOPIC_LEAD_IDS[tab]?.includes(l.id))} />
      )}

      {tab === 'Leads' && <LeadsTable leads={leads} />}
      {tab === 'Evidence Ledger' && <EvidenceLedger evidence={evidence} />}
      {tab === 'Records Needed' && <RecordsRequestsTable requests={requests} />}
    </div>
  );
}
