export type SourceStatus =
  | 'verified_official'
  | 'official_estimate'
  | 'derived_estimate'
  | 'rough_estimate'
  | 'pending'
  // Added for the Phase 6 registry expansion: a source that is a news
  // report rather than a primary government record. Used only in
  // data/sources.json entries that back a lead, never for a money figure
  // that should carry verified_official/official_estimate instead.
  | 'news_report';

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
  // Groups leads into topic tabs in the Investigations UI (e.g. "Land &
  // Development", "Campaign Finance"). Optional and free-form so each
  // investigation can use topic names that fit its own subject matter;
  // leads without a topic only show up in the general "Leads" tab.
  topic?: string;
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
  // District number as a plain string (e.g. "1") and the commissioner's
  // plain name, used only for the district-selector UI label — the
  // narrative subject/scope/disclaimer fields remain the source of truth.
  district?: string;
  commissioner?: string;
  scope: string;
  startDate: string;
  status: string;
  disclaimer: string;
  cthrewRootEntityId?: string;
  // Local, cached copy of the commissioner's official Clay County
  // government headshot (not a remote hotlink) — see PART J. Optional so
  // non-commissioner investigations (e.g. a future project-level
  // investigation) don't need one.
  photoUrl?: string;
  photoSourceUrl?: string;
  currentTitle?: string;
  areaRepresented?: string;
}

// --- State funding / appropriations layer (PART A) ------------------------
// Models the Florida Senate Local Funding Initiative Request (LFIR) pipeline.
// CRITICAL: requested, appropriated, vetoed, and received are tracked as
// distinct fields on purpose — never collapse them into one "funding" number.

export type LegislativeStatus =
  | 'requested'
  | 'appropriated'
  | 'vetoed'
  | 'partially_vetoed'
  | 'unknown_pending_gaa_review'
  | 'withdrawn';

export interface StateFundingRequest {
  id: string;
  lfir: number;
  title: string;
  titleAsFiled?: string;
  fiscalYear: string;
  senateSponsor: string;
  houseSponsor?: string | null;
  houseFormNumber?: string | null;
  dateOfRequest: string | null;
  requestingEntity: string;
  stateAgency?: string | null;
  amountRequested: number | null;
  fundingType?: string | null;
  totalProjectCost?: number | null;
  matchingFunds?: { federal: number; state: number; local: number; other: number } | null;
  description: string;
  priorStateFundingNote?: string | null;
  futureYearFundingLikely?: boolean;
  futureYearAmount?: number | null;
  estimatedStart?: string | null;
  estimatedCompletion?: string | null;
  omFundingPlan?: string | null;
  facilityOwner?: string | null;
  legislativeStatus: LegislativeStatus;
  legislativeStatusDetail: string;
  vetoAmount?: number | null;
  actualFundsReceived: number | null;
  publicSafetyComplexComponent?: boolean;
  sourceUrl: string;
  sourceStatus: SourceStatus;
  dateAccessed: string;
  notes?: string;
}

// --- Public Safety Complex investigation (PART B) --------------------------

export interface PSCTimelineEntry {
  date: string;
  event: string;
  status: EvidenceStatus;
  sourceUrl: string;
}

export interface PublicSafetyComplex {
  rfp: {
    number: string;
    title: string;
    releaseDate: string;
    dueDate: string;
    bidOpenDate: string;
    statusAsOf: string;
    statutoryAuthority: string;
    siteAcreage: string;
    components: string;
    financingStructure: string;
    evaluationProcess: string;
    sourceUrl: string;
    dateAccessed: string;
    evidenceStatus: EvidenceStatus;
  };
  staffRanking: {
    respondents: { rank: number; entity: string; score: number | null }[];
    evidenceStatus: EvidenceStatus;
    notes: string;
  };
  landAcquisition: {
    site: string;
    acreage: string;
    status: EvidenceStatus;
    notes: string;
    sourceUrl: string;
  };
  costRangeOrigin: {
    claimedRange: string;
    evidenceStatus: EvidenceStatus;
    finding: string;
  };
  stateGrant: {
    amount: number;
    purpose: string;
    date: string;
    presenter: string;
    evidenceStatus: EvidenceStatus;
    sourceUrl: string;
  };
  timeline: PSCTimelineEntry[];
  recordsNeeded: string[];
}

// --- Geographic spending (PART C) ------------------------------------------

export interface GeographicClassification {
  id: string;
  category: string;
  canAllocate: boolean | 'unknown';
  reason: string;
  evidenceStatus: EvidenceStatus;
  sourceUrl?: string | null;
  followUp?: string | null;
}

// --- Taxes & assessments (PART D/E) -----------------------------------------

export interface MillageYear {
  fiscalYear: string;
  adoptedMillage: number;
  proposedTrimRate?: number | null;
  rolledBackRate?: number | null;
  note?: string;
}

export interface AdValoremYear {
  taxYear: number;
  totalJustValue: number | null;
  countyTaxableValue: number | null;
  countyAdValoremTaxes: number | null;
  countyAdValoremPctOfTotal: number | null;
  totalTaxesAllAuthorities: number | null;
  schoolAdValoremTaxes?: number | null;
  municipalAdValoremTaxes?: number | null;
  otherAdValoremTaxes?: number | null;
  totalAdValoremTaxes?: number | null;
  totalNonAdValoremTaxes?: number | null;
  parcelCount?: number | null;
}

export interface StatewideClaimCheck {
  claim: string;
  verdict: 'VERIFIED' | 'NOT VERIFIED' | 'PARTIALLY VERIFIED' | 'NOT INDEPENDENTLY RE-VERIFIED';
  detail: string;
  sourceStatus: SourceStatus;
  sourceUrl?: string | null;
}

// --- Black Creek Water Resource Development Project (PART I) ---------------

export interface BlackCreekCostEstimate {
  label: string;
  amount: number;
  asOfDate: string;
  sourceStatus: SourceStatus;
  sourceUrl: string;
  notes?: string;
}

export interface BlackCreekFundingSource {
  source: string;
  amount: number | null;
  measure: string;
  sourceStatus: SourceStatus;
  sourceUrl: string;
  notes?: string;
}

export interface BlackCreekTimelineEntry {
  date: string;
  event: string;
  sourceStatus: SourceStatus;
  sourceUrl: string;
}

// --- Public-records responses (provenance registry) -----------------------
// One entry per public-records request that produced a response. Kept as local
// structured data so the site never depends on the external evidence archive
// at runtime; the archive URL is a link for independent inspection only.
export type RecordsResponseStatus =
  | 'response_received_completeness_not_verified'
  | 'fulfilled'
  | 'partially_fulfilled'
  | 'open';

export interface RecordsResponse {
  id: string;
  sourceType: string;
  requestNumber: string;
  agency: string;
  subject: string;
  requestDate: string | null;
  requestWording: { located: boolean; note: string };
  responseDate: string;
  status: RecordsResponseStatus;
  statusNote: string;
  description: string;
  coveredPeriods: { label: string; start: string; end: string }[];
  employerScope: string;
  originalFile: { name: string; bytes: number; sha256: string; filesReceived: number };
  filesReceived: string[];
  publicArchive: {
    url: string;
    label: string;
    maintainedBy: string;
    explanation: string;
    packageForThisFinding: string;
    verifiedAccessible: string;
    verificationNote: string;
  };
  derivedDatasets: { path: string; kind: string; generator?: string }[];
  privateData: string;
  relatedInvestigations: string[];
  answers: string[];
  unresolvedQuestionIds: string[];
  provenanceChain: { step: string; detail: string }[];
}
