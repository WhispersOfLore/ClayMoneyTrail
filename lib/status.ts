import type { SourceStatus } from './types';

export const STATUS_ORDER: SourceStatus[] = [
  'verified_official',
  'official_estimate',
  'derived_estimate',
  'rough_estimate',
  'pending',
];

// Labels match the badge vocabulary requested for the dashboard: Official,
// Official estimate, Derived, Approximate, Pending. "Approximate" is used
// deliberately (not "rough estimate") so unsourced-magnitude figures are
// conspicuously flagged wherever they appear.
export const STATUS_LABELS: Record<SourceStatus, string> = {
  verified_official: 'Official',
  official_estimate: 'Official estimate',
  derived_estimate: 'Derived',
  rough_estimate: 'Approximate',
  pending: 'Pending',
};

export const STATUS_DESCRIPTIONS: Record<SourceStatus, string> = {
  verified_official: 'Reported directly by an official document or record.',
  official_estimate: 'An estimate published by the county or another official source.',
  derived_estimate: 'Calculated from verified figures using a formula shown in the notes.',
  rough_estimate: 'An approximate figure that required an assumption or a range. Treat as directional, not exact.',
  pending: 'No verified amount is available yet.',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as SourceStatus] ?? status;
}
