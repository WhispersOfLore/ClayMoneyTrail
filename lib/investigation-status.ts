import type { EvidenceStatus } from './types';

// Vocabulary fixed by the investigation methodology: never rename or
// collapse these categories, and never let code auto-promote a claim from
// one status to a stronger one. Promotion is a human editorial decision.
// `partially_verified` and `conflicting_evidence` were added in the second
// investigation pass to match the mission's reporting vocabulary; the
// original five (plus records_required) are preserved unchanged rather than
// renamed, so existing data keeps its meaning.
export const EVIDENCE_STATUS_ORDER: EvidenceStatus[] = [
  'verified_fact',
  'partially_verified',
  'documented_connection',
  'possible_connection',
  'conflicting_evidence',
  'unverified_lead',
  'records_required',
  'allegation',
  'disproven_claim',
];

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  verified_fact: 'Verified fact',
  partially_verified: 'Partially verified',
  unverified_lead: 'Unverified lead',
  allegation: 'Allegation',
  possible_connection: 'Possible connection',
  documented_connection: 'Documented connection',
  conflicting_evidence: 'Conflicting evidence',
  disproven_claim: 'Disproven claim',
  records_required: 'Records required',
};

export const EVIDENCE_STATUS_DESCRIPTIONS: Record<EvidenceStatus, string> = {
  verified_fact: 'Independently confirmed against a primary official record.',
  partially_verified: 'Some elements confirmed against a primary source; other elements are not yet confirmed.',
  unverified_lead: 'A specific, checkable question worth investigating. Not established either way.',
  allegation: 'A claim of wrongdoing circulating publicly. Not confirmed. Do not repeat as fact.',
  possible_connection: 'Two entities/facts that may relate, based on partial or indirect evidence.',
  documented_connection: 'A real, source-backed relationship between entities exists — this does not by itself imply wrongdoing.',
  conflicting_evidence: 'Two or more sources disagree and have not yet been reconciled against a primary record.',
  disproven_claim: 'Checked against the record and found to be false or unsupported.',
  records_required: 'Cannot be resolved with currently available public information; a specific record is needed.',
};

export function evidenceStatusLabel(status: string): string {
  return EVIDENCE_STATUS_LABELS[status as EvidenceStatus] ?? status;
}
