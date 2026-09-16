'use client';

import { Check, HelpCircle, X, ExternalLink } from 'lucide-react';
import { money } from '@/lib/format';
import type { EvidenceStatus } from '@/lib/types';
import { InvestigationStatusBadge } from './investigation-status-badge';

function AllocateIcon({ value }: { value: boolean | 'unknown' }) {
  if (value === true) return <Check size={16} className="allocate-yes" aria-label="Can allocate" />;
  if (value === false) return <X size={16} className="allocate-no" aria-label="Cannot allocate" />;
  return <HelpCircle size={16} className="allocate-unknown" aria-label="Unknown" />;
}

export interface GeographicSpendingData {
  meta: { title: string; asOf: string; originQuestion: string; methodologyNote: string };
  methodologyBanner: { cannotCalculate: string; canIdentify: string; doNotImply: string };
  coreQuestion: { question: string; answer: string; reasoning: string[] };
  classification: {
    id: string;
    category: string;
    canAllocate: boolean | 'unknown';
    reason: string;
    evidenceStatus: EvidenceStatus;
    sourceUrl?: string | null;
    conflictFlag?: string;
    followUp?: string | null;
  }[];
  cipTransportationProjects: {
    sourceUrl: string;
    projects: { name: string; fiveYearTotal: number | null; totalProject: number | null; status: string }[];
    section2ProjectNamesSeen: string[];
  };
  systemsFound: { system: string; url: string; status: string; notes?: string }[];
}

export function GeographicSpendingPanel({ data }: { data: GeographicSpendingData }) {
  return (
    <div>
      <div className="methodology-banner">
        <div className="methodology-banner-row methodology-cannot">
          <strong>We CANNOT calculate:</strong> {data.methodologyBanner.cannotCalculate}
        </div>
        <div className="methodology-banner-row methodology-can">
          <strong>We CAN identify:</strong> {data.methodologyBanner.canIdentify}
        </div>
        <div className="methodology-banner-row">{data.methodologyBanner.doNotImply}</div>
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">THE QUESTION</span>
            <h3>{data.coreQuestion.question}</h3>
          </div>
        </div>
        <p className="feature-answer">{data.coreQuestion.answer}</p>
        <ul className="records-needed-list">
          {data.coreQuestion.reasoning.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">GEOGRAPHIC CLASSIFICATION</span>
            <h3>What can and can&apos;t be allocated by area</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th aria-label="Can allocate" />
                <th>Category</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.classification.map((c) => (
                <tr key={c.id} className="record-row geo-row">
                  <td>
                    <AllocateIcon value={c.canAllocate} />
                  </td>
                  <td>
                    <strong>{c.category}</strong>
                    {c.sourceUrl && (
                      <a className="source-link" href={c.sourceUrl} target="_blank" rel="noreferrer">
                        Source <ExternalLink size={11} />
                      </a>
                    )}
                  </td>
                  <td>
                    {c.reason}
                    {c.conflictFlag && <p className="panel-footnote geo-conflict">⚠ {c.conflictFlag}</p>}
                    {c.followUp && <p className="panel-footnote">Follow-up: {c.followUp}</p>}
                  </td>
                  <td>
                    <InvestigationStatusBadge value={c.evidenceStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">{data.cipTransportationProjects.sourceUrl ? 'CURRENT CIP · TRANSPORTATION' : ''}</span>
            <h3>Named road/corridor capital projects</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>5-year total</th>
                <th>Total project</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.cipTransportationProjects.projects.map((p, i) => (
                <tr key={i} className={`record-row ${p.name.startsWith('SUBTOTAL') ? 'record-subtotal' : ''}`}>
                  <td>{p.name}</td>
                  <td>{p.fiveYearTotal != null ? money(p.fiveYearTotal) : '—'}</td>
                  <td>{p.totalProject != null ? money(p.totalProject) : '—'}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-footnote">
          Section II (non-Comprehensive-Plan) drainage/signal projects seen but not dollar-transcribed:{' '}
          {data.cipTransportationProjects.section2ProjectNamesSeen.join(', ')}.
        </p>
        <a className="source-link geo-cip-link" href={data.cipTransportationProjects.sourceUrl} target="_blank" rel="noreferrer">
          Source: Approved CIP, Ordinance 2026-36 <ExternalLink size={12} />
        </a>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">SYSTEMS FOUND</span>
            <h3>GIS / mapping / district systems identified</h3>
          </div>
        </div>
        <ul className="records-needed-list">
          {data.systemsFound.map((s, i) => (
            <li key={i}>
              <strong>{s.system}</strong> — {s.notes ?? s.status}{' '}
              <a className="source-link" href={s.url} target="_blank" rel="noreferrer">
                <ExternalLink size={11} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
