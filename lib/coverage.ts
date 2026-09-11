import { percent } from './format';
import { STATUS_LABELS, STATUS_ORDER } from './status';
import type { RecordItem, SourceStatus } from './types';

export interface StatusBreakdown {
  status: SourceStatus;
  label: string;
  count: number;
  pct: number;
}

export interface CoverageSummary {
  total: number;
  populated: number;
  pending: number;
  populatedPct: number;
  byStatus: StatusBreakdown[];
}

/**
 * Coverage describes how much of the *loaded dataset* has a populated
 * amount and how each record's status breaks down. It is not a measure
 * of how much of the county's total budget is represented — the county
 * budget contains far more line items, funds, and transactions than this
 * dataset currently tracks.
 */
export function computeCoverage(records: RecordItem[]): CoverageSummary {
  const total = records.length;
  const populated = records.filter((r) => r.amount !== null).length;
  const byStatus = STATUS_ORDER.map((status) => {
    const count = records.filter((r) => r.sourceStatus === status).length;
    return { status, label: STATUS_LABELS[status], count, pct: percent(count, total) };
  });
  return {
    total,
    populated,
    pending: total - populated,
    populatedPct: percent(populated, total),
    byStatus,
  };
}
