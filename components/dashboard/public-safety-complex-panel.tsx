'use client';

import { ExternalLink } from 'lucide-react';
import { money, formatDate } from '@/lib/format';
import type { EvidenceStatus } from '@/lib/types';
import { InvestigationStatusBadge } from './investigation-status-badge';

export interface PublicSafetyComplexData {
  meta: { title: string; asOf: string; summary: string; disclaimer: string };
  rfp: {
    number: string;
    title: string;
    statusAsOf: string;
    siteAcreage: string;
    statutoryAuthority: string;
    releaseDate: string;
    dueDate: string;
    bidOpenDate: string;
    components: string;
    financingStructure: string;
    evaluationProcess: string;
    sourceUrl: string;
    evidenceStatus: EvidenceStatus;
  };
  staffRanking: {
    respondents: { rank: number; entity: string; score: number | null }[];
    evidenceStatus: EvidenceStatus;
    notes: string;
  };
  landAcquisition: { site: string; status: EvidenceStatus; notes: string; sourceUrl: string };
  costRangeOrigin: { claimedRange: string; evidenceStatus: EvidenceStatus; status: string; finding: string };
  stateFundingComponents: {
    components: { lfir: number; title: string; amountRequested: number; totalProjectCost: number }[];
    importantCaveat: string;
  };
  timeline: { date: string; event: string; status: EvidenceStatus; sourceUrl: string }[];
  openQuestions: string[];
}

export function PublicSafetyComplexPanel({ data }: { data: PublicSafetyComplexData }) {
  return (
    <div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">RFP {data.rfp.number}</span>
            <h3>{data.rfp.title}</h3>
          </div>
          <InvestigationStatusBadge value={data.rfp.evidenceStatus} />
        </div>
        <dl className="record-detail">
          <div>
            <dt>Status as of last check</dt>
            <dd>{data.rfp.statusAsOf}</dd>
          </div>
          <div>
            <dt>Site</dt>
            <dd>{data.rfp.siteAcreage}</dd>
          </div>
          <div>
            <dt>Statutory authority</dt>
            <dd>{data.rfp.statutoryAuthority}</dd>
          </div>
          <div>
            <dt>Released / due / bid open</dt>
            <dd>
              {formatDate(data.rfp.releaseDate)} → {formatDate(data.rfp.dueDate)} → {formatDate(data.rfp.bidOpenDate)}
            </dd>
          </div>
          <div className="record-detail-notes">
            <dt>Components</dt>
            <dd>{data.rfp.components}</dd>
          </div>
          <div className="record-detail-notes">
            <dt>Financing structure</dt>
            <dd>{data.rfp.financingStructure}</dd>
          </div>
          <div className="record-detail-notes">
            <dt>Evaluation process</dt>
            <dd>{data.rfp.evaluationProcess}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>
              <a className="source-link" href={data.rfp.sourceUrl} target="_blank" rel="noreferrer">
                Procurement portal <ExternalLink size={12} />
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">EVALUATION COMMITTEE RANKING</span>
            <h3>Respondents (unverified lead)</h3>
          </div>
          <InvestigationStatusBadge value={data.staffRanking.evidenceStatus} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Respondent</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {data.staffRanking.respondents.map((r) => (
                <tr key={r.rank} className="record-row">
                  <td>{r.rank}</td>
                  <td>{r.entity}</td>
                  <td>{r.score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-footnote">{data.staffRanking.notes}</p>
      </section>

      <div className="overview-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">LAND</span>
              <h3>Site acquisition</h3>
            </div>
            <InvestigationStatusBadge value={data.landAcquisition.status} />
          </div>
          <p>{data.landAcquisition.site}</p>
          <p className="panel-footnote">{data.landAcquisition.notes}</p>
          <a className="source-link" href={data.landAcquisition.sourceUrl} target="_blank" rel="noreferrer">
            Source <ExternalLink size={12} />
          </a>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">REPORTED ESTIMATE — NOT AN ESTABLISHED COST</span>
              <h3>{data.costRangeOrigin.claimedRange}</h3>
            </div>
            <InvestigationStatusBadge value={data.costRangeOrigin.evidenceStatus} />
          </div>
          <p className="anomaly-text">{data.costRangeOrigin.status}</p>
          <p>{data.costRangeOrigin.finding}</p>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">STATE FUNDING COMPONENTS</span>
            <h3>FY2026-27 Senate LFIR requests naming this complex</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>LFIR #</th>
                <th>Component</th>
                <th>Requested</th>
                <th>Total project cost</th>
              </tr>
            </thead>
            <tbody>
              {data.stateFundingComponents.components.map((c) => (
                <tr key={c.lfir} className="record-row">
                  <td>#{c.lfir}</td>
                  <td>{c.title}</td>
                  <td>{money(c.amountRequested)}</td>
                  <td>{money(c.totalProjectCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-footnote">{data.stateFundingComponents.importantCaveat}</p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">TIMELINE</span>
            <h3>Land → Funding → RFP → Evaluation → (pending) Award</h3>
          </div>
        </div>
        <div className="inv-timeline">
          {data.timeline.map((ev, i) => (
            <article key={i} className="inv-timeline-item">
              <div className="inv-timeline-head">
                <span className="inv-timeline-date">{formatDate(ev.date)}</span>
                <InvestigationStatusBadge value={ev.status} />
              </div>
              <h4>{ev.event}</h4>
              <a className="source-link" href={ev.sourceUrl} target="_blank" rel="noreferrer">
                Source <ExternalLink size={12} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">OPEN QUESTIONS</span>
            <h3>What isn&apos;t answered yet</h3>
          </div>
        </div>
        <ul className="records-needed-list">
          {data.openQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
