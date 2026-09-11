# Records Needed

Gaps discovered during research that this project cannot currently fill
with freely available online information, or that require a specific,
targeted document rather than general search. Suggested public-records
requests (not yet sent — see `data/investigations/records-requests.json`
for status) are marked **[PRR-SUGGESTED-###]**.

This list covers both the core money-trail dataset and Investigation 001
(Kristen Burke / District 5). Update it as gaps are found or filled.
Updated 2026-09-11 (second investigation pass) — resolved items are marked
**RESOLVED** and left in place rather than deleted, so the record of what
was once a gap is preserved.

## Money-trail dataset (see README "What remains incomplete")

- No vendor/contract payment records loaded.
- No individual (named or by-position) payroll beyond charter-mandated
  commissioner base salaries.
- No capital-project-level detail beyond what's cited for Investigation 001.
- No bond-level debt schedules.
- No actual (vs. budgeted/estimated) stormwater collections or spending.
- FY2023-24 budget document **located and access-confirmed** (see
  "Historical expansion" below) but not yet extracted into `records.json`.
  FY2022-23 and earlier not yet located.

## Investigation 001 — Kristen Burke / District 5

### Land & development (LEAD-sandridge, LEAD-gustafson)

- ~~Official June 24, 2025 BCC agenda packet, staff report, and minutes/video
  for the Gustafson land-use decision~~ **RESOLVED 2026-09-11** — obtained
  directly from Clay County's PrimeGov portal (meetingTemplateId 8164) via
  browser navigation, no formal request needed. See EV-010/EV-011 and
  `SANDRIDGE_PROPERTY_CHAIN.md`. **[PRR-SUGGESTED-001 marked fulfilled]**
- ~~Property Appraiser records for the CR 16A parcel~~ **RESOLVED** — see
  EV-012. Sunbiz confirmation that "G Bar Ranch LLC" (2012 grantor) and
  "G Bar Ranch South, LLC" (Sunbiz-registered Gustafson-area ranching
  entity) are the same entity is **still needed** — same-session automation
  friction prevented a second Sunbiz detail lookup (see "Known access
  obstacles" below).
- Property Appraiser parcel-ownership history for land along the Sandridge
  Road (CR 739B) corridor itself (distinct from the Gustafson/CR 16-A
  parcel — see geography note in `SANDRIDGE_PROPERTY_CHAIN.md`) and within
  the Lake Asbury Master Plan area, 2019-present. **Not yet attempted.**
- BCC agenda/minutes for every Lake Asbury Master Plan amendment and
  rezoning case, 2019-present. **[PRR-SUGGESTED-005]**
- Identity and applicant of the withdrawn January 2025 "connectivity" plan.
- General BCC-agenda name search for "Gustafson" beyond the one confirmed
  case, to establish or rule out a broader family footprint.

### Businesses (LEAD-burke-chiropractic)

- Name and ownership record of the reportedly newer chiropractic clinic
  possibly involving a Burke family member — **still completely
  unidentified.** This is the single most important open item in this
  workstream.
- ~~Sunbiz records for Fleming Island Family Chiropractic~~ **PARTIALLY
  RESOLVED** — entity confirmed active (P00000100632) via Sunbiz, but its
  officer/registered-agent detail was not successfully pulled (the second
  Sunbiz lookup this session hit the same scripted-automation friction as
  the G Bar Ranch lookup — see "Known access obstacles"). **[PRR-SUGGESTED-004
  still open for this reason]**
- Whether "Burke Chiropractic LLC" (Sunbiz L14000055259) is related to
  Kristen Burke — **RESOLVED: it is not** (St. Petersburg, FL; James L. and
  Sarah E. Burke; unrelated family). See EV-016.
- County/municipal business-tax-receipt and building-permit records for any
  Burke-family-connected clinic address — still needed once/if a clinic name
  is identified.
- A primary-source list of Kristen Burke's immediate family members, to
  check 2020 campaign donors Kenneth Burke and Laurie Burke against (see
  EV-017) without assuming a relationship from the shared surname alone.

### Campaign money (LEAD-campaign-contributors)

- ~~Itemized contributor detail for all 14 of Burke's 2020-cycle
  campaign-finance reports~~ **RESOLVED for 9 of 14 (all nonzero reports)**
  2026-09-11 — see `CAMPAIGN_CROSSREF.md`. **[PRR-SUGGESTED-002 marked
  fulfilled — obtained directly from the public VoterFocus report pages, no
  formal request needed]**
- The remaining 4 small 2020 reports (M4 Amended, P4, P5, P6) — each showed
  $0 contributions on the summary page and was not individually opened;
  low priority but not yet formally confirmed empty.
- Confirmation of, and itemized detail for, any 2024 re-election cycle
  filing — **still not located.**
- Owner/officer identification for contributor businesses named only by
  entity (Lin-Mor-5 LLC, RIG Holdings, J&J Dirt Works, American Tree
  Surgeons, Junque in the Trunk, C & E Delivery, JWT Enterprise, River CPA
  LLC, Clay County Port, Gillis Orchards) via Sunbiz.
- Once ClayMoneyTrail's vendor/contract dataset exists, cross-reference this
  contributor list against it.

### Stormwater (LEAD-stormwater)

- Official BCC meeting video/minutes with timestamps for the stormwater
  assessment-adoption vote and the hardship/veteran-exemption vote. **Not
  attempted this pass** — deprioritized in favor of the five primary
  workstreams per this pass's instructions.
- Full commissioner-by-commissioner vote record for each stormwater agenda
  item.
- Actual (not budgeted) stormwater collections and expenditures once the
  county publishes them.

### Compensation (LEAD-compensation)

- Official Charter Review Commission agenda/minutes for the compensation
  discussion, with the exact proposed figure and calculation method —
  secondary sources currently disagree ($60,000 vs. "triple" current pay).
  **[PRR-SUGGESTED-003]** — **not attempted this pass.**
- Confirmation of whether a ballot measure is required and its current
  status.
- Any recorded statement or vote by Burke specifically on this proposal.

### Voting-conflict / ethics layer

- **First pass completed 2026-09-11** — see `CONFLICT_DISCLOSURES.md` for
  the full searched/nothing-found log. General web search found no Form 8B
  filing, recusal, abstention, or Commission on Ethics complaint/opinion for
  Kristen Burke specifically (a same-surname "Ken Burke" ethics record found
  is a different person in a different county — confirmed unrelated).
- **Still needed:** a direct search of the primary Form 8B filing archive
  (not yet identified as a distinct searchable resource — general web search
  is not a substitute for this), and a full-tenure scan of BCC minutes for
  conflict/recusal language beyond the one meeting reviewed so far.

## Historical expansion

- ~~Determine the earliest year with reliably obtainable digital county
  budget records~~ **IN PROGRESS** — FY23-24 Final Budget document located
  and access-confirmed at
  `https://www.claycountygov.com/home/showpublisheddocument/8502/639020109275770000`
  ("FY23-24 Final Budget v. 09-26-23"). FY22-23, FY21-22, FY20-21, and
  FY19-20 Final Budget documents are also listed at
  `claycountygov.com/government/office-of-budget-management/previous-budget-documents`
  and have not yet been checked.
- **Still needed:** actual extraction of FY2023-24 figures into
  `records.json` — the PDF rendered in Chrome's built-in viewer as
  canvas/images rather than extractable text this session; needs either a
  download-and-`pdftotext` pass (as worked for the June 24, 2025 BCC
  minutes) or an alternative extraction method.
- Historical BCC meeting agendas/minutes/votes, FY2023-24 and earlier —
  confirmed feasible via PrimeGov (archive back to June 2009, per Cthrew's
  `docs/PUBLIC-SOURCE-INVENTORY.md` GOV-014/GOV-075).
- Historical vendor/contract/procurement records — not yet located.

## Known access obstacles (not gaps to "work around" — see Cthrew's
`docs/INGESTION-ROADMAP.md` for the full governance note)

- `landmark.clayclerk.com` / `maps.clayclerk.com` (the Clerk's Official
  Records deed/mortgage/lien search) publish a `robots.txt` explicitly
  disallowing AI crawlers, naming ClaudeBot specifically. **Do not build an
  automated connector against these without an explicit arrangement with
  the Clerk's office.** This is a policy statement, not a technical
  obstacle — treat it as a hold.
- `claycountygov.com` and `search.sunbiz.org` both run bot-management that
  blocks non-browser automated fetches (HTTP 403 via `WebFetch`/`curl`).
  This is a generic availability obstacle, not a stated policy — a real
  browser session reaches both successfully.
- **New this pass:** both `claycounty.novusagenda.com`'s date-range search
  form and `search.sunbiz.org`'s entity-name search form are ASP.NET
  postback forms that resisted scripted form-filling (values appeared set
  visually but the server-side postback did not register them, repeatedly,
  across multiple attempts) — matches a friction already documented in
  Cthrew's own research (`docs/PUBLIC-SOURCE-INVENTORY.md`, GOV-074: "a
  scripted attempt to switch to 'Last Year' did not visibly change results
  (likely needs a real postback the automated interaction didn't
  trigger)"). **Workaround that did work:** PrimeGov's `clay.primegov.com`
  portal (React SPA, not ASP.NET postback) accepted the same kind of
  scripted interaction cleanly, and Sunbiz's own entity-name **results
  list** (plain HTML links, not the postback search forms) could be reached
  by first getting a working results-list URL from a web search, then
  clicking the row link directly. Direct-download PDF links on
  `claycountygov.com` sometimes render inline in Chrome's PDF viewer
  (canvas-based, not text-extractable via `get_page_text`) rather than
  downloading to disk — inconsistent behavior between the June 24, 2025 BCC
  minutes (downloaded) and the FY23-24 budget (rendered inline) was
  observed and not root-caused this session.
