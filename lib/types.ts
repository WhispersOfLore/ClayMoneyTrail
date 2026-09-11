export type SourceStatus =
  | 'verified_official'
  | 'official_estimate'
  | 'derived_estimate'
  | 'rough_estimate'
  | 'pending';

export interface RecordItem {
  id: string;
  fiscalYear: string;
  domain: string;
  flow: string;
  department: string;
  category: string;
  name: string;
  amount: number | null;
  measure: string;
  sourceStatus: SourceStatus;
  sourceId: string;
  notes: string;
}

export interface SourceItem {
  id: string;
  title: string;
  publisher: string;
  url: string;
  status: SourceStatus;
  notes: string;
  lastVerified: string | null;
}

// --- Investigations layer -------------------------------------------------
// Distinct vocabulary from SourceStatus above: SourceStatus describes how
// solid a *money figure* is; EvidenceStatus describes how solid an
// *investigative claim* is. Never conflate the two, and never let an
// automated pass write "verified_fact" for a claim that hasn't had a human
// re-check the underlying primary document.

export type EvidenceStatus =
  | 'verified_fact'
  | 'partially_verified'
  | 'unverified_lead'
  | 'allegation'
  | 'possible_connection'
  | 'documented_connection'
  | 'conflicting_evidence'
  | 'disproven_claim'
  | 'records_required';

export type LeadPriority = 'high' | 'medium' | 'low';

export interface LeadItem {
  id: string;
  investigationId: string;
  title: string;
  description: string;
  origin: string;
  entitiesInvolved: string[];
  whyItMatters: string;
  evidenceAvailable: string;
  evidenceMissing: string;
  recordsNeeded: string[];
  priority: LeadPriority;
  status: EvidenceStatus;
  cthrewEntityIds?: string[];
}

export interface EvidenceItem {
  id: string;
  investigationId: string;
  claim: string;
  status: EvidenceStatus;
  entities: string[];
  date: string | null;
  sourceType: string;
  url: string | null;
  documentName: string | null;
  page: string | null;
  videoTimestamp: string | null;
  extract: string;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  dateAccessed: string | null;
  relatedLeadIds?: string[];
}

export interface VoteRecord {
  commissioner: string;
  district: string | null;
  vote: 'yes' | 'no' | 'abstain' | 'recused' | 'absent' | 'unknown';
}

export interface TimelineEvent {
  id: string;
  investigationId: string;
  date: string;
  title: string;
  agendaItem?: string;
  motion?: string;
  parcel?: string;
  location?: string;
  applicant?: string;
  developer?: string;
  llc?: string;
  staffRecommendation?: string;
  publicComment?: string;
  votes?: VoteRecord[];
  result?: string;
  amount?: number | null;
  status: EvidenceStatus;
  evidenceIds: string[];
  sourceNote?: string;
}

export interface RecordsRequestItem {
  id: string;
  dateSent: string | null;
  agency: string;
  request: string;
  subject: string;
  status: 'suggested_not_sent' | 'drafted' | 'sent' | 'partially_fulfilled' | 'fulfilled' | 'denied' | 'no_response';
  responseDeadline: string | null;
  fees: string | null;
  filesReceived: string[];
  relatedInvestigation: string;
  relatedEntities: string[];
  followUpRequired: string | null;
}

export interface InvestigationMeta {
  id: string;
  subject: string;
  scope: string;
  startDate: string;
  status: string;
  disclaimer: string;
  cthrewRootEntityId?: string;
}
