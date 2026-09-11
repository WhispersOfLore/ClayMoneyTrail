import type { EvidenceStatus } from './types';

// Vocabulary fixed by the investigation methodology: never rename or
// collapse these categories, and never let code auto-promote a claim from
// one status to a stronger one. Promotion is a human editorial decision.
export const EVIDENCE_STATUS_ORDER: EvidenceStatus[] = [
  'verified_fact',
  'documented_connection',
  'possible_connection',
  'unverified_lead',
  'records_required',
  'allegation',
  'disproven_claim',
];

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  verified_fact: 'Verified fact',
  unverified_lead: 'Unverified lead',
  allegation: 'Allegation',
  possible_connection: 'Possible connection',
  documented_connection: 'Documented connection',
  disproven_claim: 'Disproven claim',
  records_required: 'Records required',
};

export const EVIDENCE_STATUS_DESCRIPTIONS: Record<EvidenceStatus, string> = {
  verified_fact: 'Independently confirmed against a primary official record.',
  unverified_lead: 'A specific, checkable question worth investigating. Not established either way.',
  allegation: 'A claim of wrongdoing circulating publicly. Not confirmed. Do not repeat as fact.',
  possible_connection: 'Two entities/facts that may relate, based on partial or indirect evidence.',
  documented_connection: 'A real, source-backed relationship between entities exists — this does not by itself imply wrongdoing.',
  disproven_claim: 'Checked against the record and found to be false or unsupported.',
  records_required: 'Cannot be resolved with currently available public information; a specific record is needed.',
};

export function evidenceStatusLabel(status: string): string {
  return EVIDENCE_STATUS_LABELS[status as EvidenceStatus] ?? status;
}
