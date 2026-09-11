import type { CoverageSummary } from '@/lib/coverage';

export function CoveragePanel({ coverage }: { coverage: CoverageSummary }) {
  return (
    <section className="panel coverage-panel">
      <div className="panel-head">
        <div>
          <span className="section-kicker">DATA COMPLETENESS</span>
          <h3>How much of this dataset is populated</h3>
        </div>
      </div>
      <div className="coverage-stats">
        <div>
          <strong>{coverage.total}</strong>
          <span>Total records</span>
        </div>
        <div>
          <strong>{coverage.populated}</strong>
          <span>With a populated amount</span>
        </div>
        <div>
          <strong>{coverage.pending}</strong>
          <span>Pending / not yet populated</span>
        </div>
        <div>
          <strong>{coverage.populatedPct}%</strong>
          <span>Record coverage</span>
        </div>
      </div>
      <div className="coverage-breakdown">
        {coverage.byStatus.map((s) => (
          <div key={s.status} className="coverage-row">
            <span className={`status status-${s.status}`}>{s.label}</span>
            <div className="coverage-bar">
              <i style={{ width: `${s.pct}%` }} />
            </div>
            <small>
              {s.count} · {s.pct}%
            </small>
          </div>
        ))}
      </div>
      <p className="coverage-caveat">
        Record coverage measures how much of <em>this loaded dataset</em> has a source-backed amount — it does not mean
        Clay County&apos;s total budget is 100% represented. The county&apos;s full budget contains far more funds, cost
        centers, and transactions than are captured here.
      </p>
    </section>
  );
}
