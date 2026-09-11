# Records Needed

Gaps discovered during research that this project cannot currently fill
with freely available online information, or that require a specific,
targeted document rather than general search. Suggested public-records
requests (not yet sent — see `data/investigations/records-requests.json`
for status) are marked **[PRR-SUGGESTED-###]**.

This list covers both the core money-trail dataset and Investigation 001
(Kristen Burke / District 5). Update it as gaps are found or filled.

## Money-trail dataset (see README "What remains incomplete")

- No vendor/contract payment records loaded.
- No individual (named or by-position) payroll beyond charter-mandated
  commissioner base salaries.
- No capital-project-level detail beyond what's cited for Investigation 001.
- No bond-level debt schedules.
- No actual (vs. budgeted/estimated) stormwater collections or spending.
- No fiscal years before FY2024-25 loaded. Historical budgets/actuals for
  FY2023-24 and earlier need to be located and ingested (see "Historical
  expansion," below).

## Investigation 001 — Kristen Burke / District 5

### Land & development (LEAD-sandridge, LEAD-gustafson)

- Official June 24, 2025 BCC agenda packet, staff report, and minutes/video
  for the Gustafson land-use decision — needed to confirm or correct a
  vote-attribution detail that appears to be wrong in the only source found.
  **[PRR-SUGGESTED-001]**
- Property Appraiser parcel-ownership history for land along the Sandridge
  Road (CR 739B) corridor and within the Lake Asbury Master Plan area,
  2019-present.
- BCC agenda/minutes for every Lake Asbury Master Plan amendment and
  rezoning case, 2019-present. **[PRR-SUGGESTED-005]**
- Identity and applicant of the withdrawn January 2025 "connectivity" plan.
- Sunbiz search for LLCs acquiring land in the Sandridge corridor.
- General BCC-agenda name search for "Gustafson" beyond the one confirmed
  case.

### Businesses (LEAD-burke-chiropractic)

- Name and ownership record of the reportedly newer chiropractic clinic
  possibly involving a Burke family member — not yet identified by name.
- Sunbiz records for Fleming Island Family Chiropractic and any related
  entity. **[PRR-SUGGESTED-004]**
- County/municipal business-tax-receipt and building-permit records for any
  Burke-family-connected clinic address.

### Campaign money (LEAD-campaign-contributors)

- Itemized contributor detail (name, address, amount, date, employer/
  occupation) for all 14 of Burke's 2020-cycle campaign-finance reports —
  only period totals confirmed so far. **[PRR-SUGGESTED-002]**
- Confirmation of, and detail for, any 2024 re-election cycle filing.
- Once itemized, a cross-reference against vendor/contract data and against
  LEAD-sandridge / LEAD-gustafson applicant names.

### Stormwater (LEAD-stormwater)

- Official BCC meeting video/minutes with timestamps for the stormwater
  assessment-adoption vote and the hardship/veteran-exemption vote.
- Full commissioner-by-commissioner vote record for each stormwater agenda
  item.
- Actual (not budgeted) stormwater collections and expenditures once the
  county publishes them.

### Compensation (LEAD-compensation)

- Official Charter Review Commission agenda/minutes for the compensation
  discussion, with the exact proposed figure and calculation method —
  secondary sources currently disagree ($60,000 vs. "triple" current pay).
  **[PRR-SUGGESTED-003]**
- Confirmation of whether a ballot measure is required and its current
  status.
- Any recorded statement or vote by Burke specifically on this proposal.

### Voting-conflict / ethics layer (not yet started)

- Form 8B voting-conflict disclosures, recusals, and financial disclosures
  for Burke — none located or checked yet.
- Florida Commission on Ethics complaint/ruling search for Burke — not yet
  checked.

## Historical expansion (not yet started)

- Determine the earliest year with reliably obtainable digital county
  budget/BCC records (working backward from FY2024-25, per the existing
  dataset).
- Historical BCC meeting agendas/minutes/votes, FY2023-24 and earlier.
- Historical vendor/contract/procurement records.

## Known access obstacles (not gaps to "work around" — see Cthrew's
`docs/INGESTION-ROADMAP.md` for the full governance note)

- `landmark.clayclerk.com` / `maps.clayclerk.com` (the Clerk's Official
  Records deed/mortgage/lien search) publish a `robots.txt` explicitly
  disallowing AI crawlers, naming ClaudeBot specifically. **Do not build an
  automated connector against these without an explicit arrangement with
  the Clerk's office.** This is a policy statement, not a technical
  obstacle — treat it as a hold.
- `claycountygov.com` runs bot-management (Akamai) that blocked at least one
  direct automated fetch this session (HTTP 403 on the District 5 bio page).
  This is a generic availability obstacle, not a stated policy — retry with
  a real browser session (e.g. via browser automation) rather than treating
  it as off-limits.
