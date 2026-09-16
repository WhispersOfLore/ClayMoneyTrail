'use client';

import { ExternalLink } from 'lucide-react';
import { money } from '@/lib/format';
import type { SourceStatus } from '@/lib/types';
import { StatusBadge } from './status-badge';

export interface TaxesAssessmentsData {
  countywideMillageHistory: {
    fiscalYear: string;
    adoptedMillage: number;
    proposedTrimRate?: number | null;
    rolledBackRate?: number | null;
    rolledBackRate2025?: number | null;
  }[];
  adValoremSevenYearSeries: {
    byYear: {
      taxYear: number;
      totalJustValue: number | null;
      countyTaxableValue: number | null;
      countyAdValoremTaxes: number | null;
      totalNonAdValoremTaxes?: number | null;
    }[];
    derivedGrowth20192025: {
      countyAdValoremTaxes: { '2019': number; '2025': number; pctChange: number };
      totalJustValue: { '2019': number; '2025': number; pctChange: number };
    };
    nonAdValoremAnomaly: {
      label: string;
      observedValues: Record<string, number>;
      fieldVerification: {
        dorFieldLabel: string;
        units: string;
        measureType: string;
        sameFieldNameAcrossYears: boolean;
        sameFieldNameNote: string;
        oddityFound: string;
      };
      whatIsNotEstablished: string[];
      doNotPresentAs: string;
      recommendedNextStep: string;
    };
  };
  statewideContext: {
    verificationTable: { claim: string; verdict: string; detail: string; sourceStatus: SourceStatus; sourceUrl?: string | null }[];
    accessBlockerNote: string;
    explanatoryComponentsForClayCountyRevenueGrowth: { supportedByEvidence: string[]; notYetInvestigated: string[] };
  };
}

export function TaxesAssessmentsPanel({ data }: { data: TaxesAssessmentsData }) {
  const growth = data.adValoremSevenYearSeries.derivedGrowth20192025;
  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi">
          <span>County ad valorem taxes, 2019 → 2025</span>
          <strong>
            {money(growth.countyAdValoremTaxes['2019'], true)} → {money(growth.countyAdValoremTaxes['2025'], true)}
          </strong>
          <small>+{growth.countyAdValoremTaxes.pctChange}% · verified via FL DOR county profiles</small>
        </div>
        <div className="kpi">
          <span>Total just value, 2019 → 2025</span>
          <strong>+{growth.totalJustValue.pctChange}%</strong>
          <small>Dominant driver of the tax-dollar increase</small>
        </div>
        <div className="kpi">
          <span>Countywide operating millage</span>
          <strong>5.24 → 5.5471</strong>
          <small>+~5.9% — a modest contributor next to value growth</small>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">COUNTYWIDE OPERATING MILLAGE</span>
            <h3>Adopted vs. proposed, by fiscal year</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fiscal year</th>
                <th>Adopted millage</th>
                <th>Proposed (TRIM) rate</th>
                <th>Rolled-back rate</th>
              </tr>
            </thead>
            <tbody>
              {data.countywideMillageHistory.map((m) => (
                <tr key={m.fiscalYear} className="record-row">
                  <td>{m.fiscalYear}</td>
                  <td>{m.adoptedMillage}</td>
                  <td>{m.proposedTrimRate ?? '—'}</td>
                  <td>{m.rolledBackRate ?? m.rolledBackRate2025 ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-footnote">
          FY2025-26 proposed 5.7471 at the August 2025 TRIM stage, then the Board held the final adopted rate flat at 5.5471 — proposed and
          adopted are tracked separately and should never be collapsed into one &ldquo;the rate&rdquo; figure.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">AD VALOREM, 2019-2025</span>
            <h3>Just value, taxable value, and county levy by year</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tax year</th>
                <th>Total just value</th>
                <th>County taxable value</th>
                <th>County ad valorem taxes</th>
                <th>Non-ad-valorem taxes</th>
              </tr>
            </thead>
            <tbody>
              {data.adValoremSevenYearSeries.byYear.map((y) => (
                <tr key={y.taxYear} className="record-row">
                  <td>{y.taxYear}</td>
                  <td>{y.totalJustValue != null ? money(y.totalJustValue, true) : '—'}</td>
                  <td>{y.countyTaxableValue != null ? money(y.countyTaxableValue, true) : '—'}</td>
                  <td>{y.countyAdValoremTaxes != null ? money(y.countyAdValoremTaxes, true) : '—'}</td>
                  <td>{y.totalNonAdValoremTaxes != null ? money(y.totalNonAdValoremTaxes, true) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker anomaly-kicker">{data.adValoremSevenYearSeries.nonAdValoremAnomaly.label}</span>
            <h3>Total non-ad-valorem taxes (DOR levy figure), 2021-2025</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {Object.keys(data.adValoremSevenYearSeries.nonAdValoremAnomaly.observedValues).map((y) => (
                  <th key={y}>{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="record-row">
                {Object.values(data.adValoremSevenYearSeries.nonAdValoremAnomaly.observedValues).map((v, i) => (
                  <td key={i}>{money(v, true)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="panel-footnote">
          <strong>What this is:</strong> {data.adValoremSevenYearSeries.nonAdValoremAnomaly.fieldVerification.dorFieldLabel}.{' '}
          {data.adValoremSevenYearSeries.nonAdValoremAnomaly.fieldVerification.measureType}
        </p>
        <p className="panel-footnote">
          <strong>Data oddity found:</strong> {data.adValoremSevenYearSeries.nonAdValoremAnomaly.fieldVerification.oddityFound}
        </p>
        <p className="panel-footnote">
          <strong>Not yet established:</strong> {data.adValoremSevenYearSeries.nonAdValoremAnomaly.whatIsNotEstablished.join(' · ')}
        </p>
        <p className="panel-footnote anomaly-text">
          <strong>Do not read this as:</strong> {data.adValoremSevenYearSeries.nonAdValoremAnomaly.doNotPresentAs}
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">STATEWIDE CONTEXT — CLAIM VERIFICATION</span>
            <h3>A community post&apos;s Florida-wide numbers, checked against official sources</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Verdict</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.statewideContext.verificationTable.map((v, i) => (
                <tr key={i} className="record-row">
                  <td>{v.claim}</td>
                  <td>
                    <StatusBadge value={v.sourceStatus} />
                    <div className="verdict-text">{v.verdict}</div>
                  </td>
                  <td>
                    {v.detail}
                    {v.sourceUrl && (
                      <a className="source-link" href={v.sourceUrl} target="_blank" rel="noreferrer">
                        Source <ExternalLink size={11} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-footnote">{data.statewideContext.accessBlockerNote}</p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">WHY DID CLAY COUNTY&apos;S REVENUE GROW?</span>
            <h3>Supported explanatory factors, 2019-2025</h3>
          </div>
        </div>
        <ul className="records-needed-list">
          {data.statewideContext.explanatoryComponentsForClayCountyRevenueGrowth.supportedByEvidence.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <p className="panel-footnote">
          Not yet investigated: {data.statewideContext.explanatoryComponentsForClayCountyRevenueGrowth.notYetInvestigated.join(' · ')}
        </p>
      </section>
    </div>
  );
}
