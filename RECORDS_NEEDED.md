# Records Needed

Gaps discovered during research that this project cannot currently fill
with freely available online information, or that require a specific,
targeted document rather than general search. Suggested public-records
requests (not yet sent — see `data/investigations/records-requests.json`
for status) are marked **[PRR-SUGGESTED-###]**.

This list covers both the core money-trail dataset and Investigation 001
(Kristen Burke / District 5). Update it as gaps are found or filled.
Updated 2026-09-11 (third investigation pass — "build the 2020-2026
pattern") — resolved items are marked **RESOLVED** and left in place
rather than deleted, so the record of what was once a gap is preserved.

## Money-trail dataset (see README "What remains incomplete")

- ~~No vendor/contract payment records loaded.~~ **PARTIALLY RESOLVED
  2026-09-23** — supplier-invoice/accounts-payable records are now loaded for
  FY2024-25 through FY2025-26 year-to-date via PRR-2026-1194 (see "Supplier
  invoices / accounts payable" below). Invoice approval does not establish
  disbursement, and PO-to-contract attribution remains incomplete for most
  matched vendors.
- ~~No individual (named or by-position) payroll beyond charter-mandated
  commissioner base salaries.~~ **PARTIALLY RESOLVED 2026-09-21** — BCC
  payroll for FY2024-25 and FY2025-26 (through 2026-09-16) was received via
  PRR-2026-1195; see "Payroll / compensation (PRR-2026-1195)" below. Still
  missing: earnings detail by pay code, position/rate history, years before
  FY2024-25, and the constitutional offices' payrolls.
- No capital-project-level detail beyond what's cited for Investigation 001.
- No bond-level debt schedules.
- No actual (vs. budgeted/estimated) stormwater collections or spending.
- FY2023-24 budget document **located and access-confirmed** (see
  "Historical expansion" below) but not yet extracted into `records.json`.
  FY2022-23 and earlier not yet located.

## Payroll / compensation (PRR-2026-1195 — response received 2026-09-17)

**Request status: `response_received_completeness_not_verified`.** The ZIP
contains the county's cover letter but not the wording of our request, so we
cannot yet say whether it was fulfilled, partially fulfilled, or open. Once the
original request is located: REQUESTED vs PRODUCED vs MISSING (RN-PAY-10).

Response from the **Clay County BCC Personnel and Benefits Department**
(Workday exports), covering 2024-10-01 – 2025-09-30 and 2025-10-01 –
2026-09-16, **BCC employees only** (the county stated it cannot provide the
constitutional offices). Original ZIP
`Records_Request_Download_PRR-2026-1195_2026-09-21--10-47-54.zip`, SHA-256
`94bc2ecc7445db45002df3218ab1f3a08395d9ab42fd12a1548ca7c494499262`, 10 files.
The originals are preserved unaltered in a public, **researcher-maintained**
Google Drive evidence archive (not operated by Clay County) linked from the
People / Payroll page and recorded in `data/records-responses.json`.
Published view: `data/payroll.json` + `data/payroll-findings.json`.

**Resolved**
- A county-issued individual-level payroll file for BCC employees (previously:
  none loaded).
- Title, employer, and hire date for the County Manager, the three Assistant
  County Managers, and the Fire Chief (official records).
- The earlier third-party salary figures now have an official record to be
  compared with. They may measure a different thing (an annualized rate at a
  point in time) from the wages-paid figures in the payroll export.

**Partly resolved**
- Individual payroll — BCC only (constitutional offices are separate custodians).
- Commissioner compensation — reported wages are known; what accounts for the
  differences from the comparison figure is not.

**Still needed — research drafts only, NOTHING has been requested.** These
will be consolidated after all remaining gaps are reviewed, not sent one by
one. Full text, custodians, and potential resolving records are in
`data/payroll-findings.json` (`recordsNeededItems`) and on the People / Payroll
page.

| ID | Question / gap |
|---|---|
| RN-PAY-01 | Earnings by pay code (base, leave payout, special or acting pay, other) for the named group and commissioners |
| RN-PAY-02 | Position and rate history with effective dates |
| RN-PAY-03 | Payroll before FY2024-25 |
| RN-PAY-04 | Constitutional-office payroll (each a separate custodian; never mixed with BCC) |
| RN-PAY-05 | Mock appointment / personnel action for any acting or deputy county-management role, with effective dates |
| RN-PAY-06 | Compensation authorization specifically associated with any additional Mock role, **if one exists** (does not assume one does) |
| RN-PAY-07 | Authorization or basis for the FY2025-26 compensation adjustment (roughly 3% per pay period) |
| RN-PAY-08 | What accounts for the difference between the comparison compensation figure and reported wages for three commissioners (FY2025-26: $525.00, $2,897.00, $1,259.75) |
| RN-PAY-09 | What payroll components account for the difference between the current annualized-rate comparison and reported wages for the County Manager ($21,345.49, FY2025-26 YTD) |
| RN-PAY-10 | Locate the original PRR-2026-1195 request wording (internal task, not a request) |

**Standing corrections preserved**
- The Fire Chief (Lorin Mock) and Fire Marshal (Anthony Roseberry) are
  different people. The acting/deputy county-management compensation question
  is separate and stays **unresolved** (`records_required`); the payroll files
  cannot show whether additional compensation did or did not exist.
- The census lists two different employees named William Latham. The Assistant
  County Manager is "Latham, Charlie" in payroll. They are never merged.
- Differences between reported wages and a comparison figure are research
  questions only and are never characterized beyond what a record establishes.

## Supplier invoices / accounts payable (PRR-2026-1194 — response received 2026-09-23)

**Request status: `response_received_completeness_not_verified`.** The ZIP
contains no cover letter and no copy of the original request wording — just a
raw Workday "Find Supplier Invoices" export. The response date above is
inferred from the file's own embedded timestamp, not a dated county letter.

Response from **Clay County BCC's Workday accounts-payable system**
(producing department not stated), covering supplier-invoice dates
2024-10-01 – 2026-09-17, **BCC only** (constitutional offices appear only as
recipients of BCC-to-constitutional-office budget-draw transfers, not as
vendors). Original ZIP
`Records_Request_Download_PRR-2026-1194_2026-09-23--11-28-17.zip`, SHA-256
`d868c970a5e5b843bdbb710fe5c5112fe79cc4ec55b73555e28566071bb24dc6`, 1 file
(`Find Supplier Invoices 2026-09-18 10_32 EDT.xlsx`, SHA-256
`e33de7c3de2b7b72e41b914f78f5281cea563ba3cfa92ec6152155fe23048a49`). The
original is preserved unaltered in the same researcher-maintained Google
Drive evidence archive used for PRR-2026-1195, linked from the Vendors &
Contracts page and recorded in `data/records-responses.json`. Published view:
`data/supplier-invoices.json` + `public/data/supplier-invoices-fy2024-26.csv`.

**TERMINOLOGY: these are supplier invoices, not payments.** "Approved" means
Workday approved the invoice for payment processing — it does not establish
that funds were disbursed. Canceled, Denied, Draft, and In Progress invoices
are not spending. See `data/supplier-invoices.json`'s `meta.terminologyNote`.

**Resolved**
- 37,845 supplier-invoice records now loaded (previously: none). Status
  totals: Approved $648,014,284 · In Progress $8,781,897.77 · Canceled
  $22,676,008.68 · Denied $1,653,765.13 · Draft $93,968.58.
- Government/constitutional-office transfers (Sheriff, Clerk, Property
  Appraiser, Supervisor of Elections, Tax Collector, and others) are now kept
  structurally separate from external-vendor rankings.

**Partly resolved — 5 of the 8 open `*-payments`/`*-chain` gaps below now
have real invoice-level data, but PO-to-contract attribution is still
missing for most of them.** See `data/contracts-vendors.json`
(`recordsNeeded`) for the updated per-vendor detail; summary:

| Vendor | Invoices found | Approved invoice value | Status |
|---|---|---|---|
| Vector Disease Control International | 3 | $71,313 | Best-attributed match (no other identified county contract) |
| Fly'n Bryan Trailer Sales / FB Trailers | 8 | $33,632.24 | Below the $75,196 ceiling — not "savings"; as-needed contract |
| Eisman & Russo, Inc. | 11 | $75,762.22 | PO-to-contract attribution required (SUN Trail not confirmed) |
| H&H Land and Marine, LLC | 7 | $167,759.10 | PO-to-contract attribution required before comparing to the $156,770.20 award |
| Kirby Development, Inc. | 35 | $12,243,295.21 | **Countywide vendor total — not the Carl Pugh Park contract's cost** |
| Firetrol Protection Systems, Inc. | 0 | — | No match found; still fully unresolved |
| EMS supplies (10 awarded vendors) | — | — | Not cross-referenced; the 10 vendor names are still unidentified |
| FY25/26 software/subscription vendors (31 named) | 16 matched | ~12 verified, 2 mixed-purpose | 15 vendors still unmatched |

**Still needed**
- PO-to-contract attribution documentation for every matched vendor above.
- Actual-disbursement / payment confirmation (Approved ≠ paid).
- Firetrol Protection Systems invoice data (no custodian response yet located).
- The ten EMS-supplies award vendor names.
- The 15 unmatched software/subscription vendor names' invoice data.

**Standing corrections preserved**
- Government/constitutional-office budget-draw transfers are never ranked
  as, or described as, external vendor spending.
- Kirby Development's countywide invoice total must never be presented as
  the cost of contract 2025/2026-0193 (Carl Pugh Park).
- Motorola Solutions and Butterfly Network invoice activity is not described
  as entirely software spending (mixed hardware/service/device purpose).
- Bound Tree Medical is excluded from the software/SaaS category entirely
  (EMS/medical supply vendor; an earlier fuzzy name match was a false
  positive).
- Two review flags — DB Civil Construction (PO-1012684, multiple
  canceled/denied records) and WGI Inc (canceled-invoice value exceeding
  approved-invoice value) — are neutral "context required" flags, not
  findings of anything improper.

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
- **NEW 2026-09-11:** the **January 28, 2025 BCC meeting minutes** —
  disposition of three linked District 5 industrial-rezoning applications
  (~76 acres, continued from Oct 22, 2024). This is the single highest
  priority land-use follow-up identified this pass. See
  `DISTRICT5_DEVELOPMENT_2020_2026.md`, Matter 2.
- **NEW:** the applicant/owner name and parcel numbers for that same
  76-acre matter — not stated in the Oct 22, 2024 minutes text pulled;
  likely in the attached staff report/case file.
- **NEW:** a systematic PrimeGov sweep of Burke's first term (2020-2023)
  for Planning & Zoning items — zero meetings from this period have been
  reviewed in any pass so far. See coverage map in
  `BURKE_DECISION_TIMELINE_2020_2026.md`.

### Businesses (LEAD-burke-chiropractic)

- ~~Name and ownership record of the reportedly newer chiropractic clinic~~
  **MAJOR PROGRESS 2026-09-11** — Burke's own bio now names the business
  ("Oakleaf Family Chiropractic," opened 2009 "for her brother"), but the
  matching Sunbiz corporate record shows officers surnamed **Thompson**,
  not Burke. See EV-022, `PATTERN_MATRIX.md`.
- **NEW top-priority item:** confirmation of **Kristen Burke's maiden
  name** from a primary source (this would directly test whether "Jeremy
  Thompson" is her brother).
- Sunbiz officer detail for the second, currently-**active** Oakleaf
  Family Chiropractic, Inc. entity (P12000019233, filed 2012) — not yet
  pulled.
- ~~Sunbiz records for Fleming Island Family Chiropractic~~ **PARTIALLY
  RESOLVED** — entity confirmed active (P00000100632) via Sunbiz, but its
  officer/registered-agent detail was not successfully pulled.
  **[PRR-SUGGESTED-004 still open for this reason]**
- Whether "Burke Chiropractic LLC" (Sunbiz L14000055259) is related to
  Kristen Burke — **RESOLVED: it is not** (St. Petersburg, FL; James L. and
  Sarah E. Burke; unrelated family). See EV-016.
- County/municipal business-tax-receipt and building-permit records for
  either chiropractic business.
- ~~A primary-source list of Kristen Burke's immediate family members~~
  **PARTIALLY RESOLVED** — her bio names her four children (Kenneth, Kiley,
  Kenzie, Khloe), making 2020 donor "Kenneth Burke" very likely her son
  (see EV-023). "Laurie Burke" remains unmatched to any named family
  member.

### Campaign money (LEAD-campaign-contributors)

- ~~Itemized contributor detail for all 14 of Burke's 2020-cycle
  campaign-finance reports~~ **RESOLVED for 9 of 14 (all nonzero reports)**
  2026-09-11 — see `CAMPAIGN_CROSSREF.md`. **[PRR-SUGGESTED-002 marked
  fulfilled — obtained directly from the public VoterFocus report pages, no
  formal request needed]**
- The remaining 4 small 2020 reports (M4 Amended, P4, P5, P6) — each showed
  $0 contributions on the summary page and was not individually opened;
  low priority but not yet formally confirmed empty.
- ~~Confirmation of, and itemized detail for, any 2024 re-election cycle
  filing~~ **RESOLVED 2026-09-11** — see `BURKE_CAMPAIGN_2024.md` (7 of 8
  reports itemized).
- Owner/officer identification for contributor businesses named only by
  entity (Lin-Mor-5 LLC, RIG Holdings, J&J Dirt Works, American Tree
  Surgeons, Junque in the Trunk, C & E Delivery, JWT Enterprise, River CPA
  LLC, Clay County Port, Gillis Orchards, and 2024-cycle addition **The
  Vector Companies Inc**) via Sunbiz.
- Once ClayMoneyTrail's vendor/contract dataset exists, cross-reference this
  contributor list against it.
- The remaining 4-5 near-zero reports across both cycles not individually
  opened (2020: M4 Amended, P4, P5, P6; 2024: P1).

### Stormwater (LEAD-stormwater)

- ~~Official BCC meeting video/minutes with timestamps for the stormwater
  assessment-adoption vote~~ **RESOLVED 2026-09-11** — see
  `STORMWATER_MASTER_TIMELINE.md` (July 28, 2026, unanimous 5-0).
- **Still needed:** the earlier, separate hearing(s) where public
  opposition and the hardship/veteran-exemption debate actually occurred
  (referenced by Action News Jax/WOKV but not yet dated/pulled).
- Initial consultant contracts and staff studies preceding the ordinance.
- Actual (not budgeted) stormwater collections and expenditures — not yet
  possible; the fee only took effect 2026-10-01.

### Compensation (LEAD-compensation)

- ~~Official Charter Review Commission agenda/minutes for the compensation
  discussion~~ **PARTIALLY RESOLVED 2026-09-11** — final ballot language
  and a specific vote date (2026-03-16) confirmed via secondary source (Clay
  Views); see `COMMISSIONER_COMPENSATION_TIMELINE.md`. The **primary** CRC
  minutes/video for that vote and the three public hearings have not been
  directly opened — agenda URLs located (NovusAgenda MeetingID 2161, 2166)
  but not fetched.
- Confirmation of whether the BCC took any recorded vote to forward the
  ballot language, or whether it is purely ministerial.
- Any recorded statement or vote by Burke specifically on this proposal —
  **still not found.**

### Voting-conflict / ethics layer

- **Second, more rigorous pass completed 2026-09-11** — see
  `CONFLICT_DISCLOSURES.md`. This time including a direct full-text search
  of Clay County's own primary meeting-records index (PrimeGov), not just
  general web search: 21 hits for "8B" and ~28 hits for "Recuse" across
  Burke's tenure. **A spot-check of the most likely candidate (Oct 22, 2024)
  found no actual recusal language in the minutes** — the search index
  appears to match boilerplate/attachment text, not real disclosure events.
  This means the ~48 remaining hits are unresolved, not confirmed
  disclosures.
- **[PRR-SUGGESTED-006 — NEW]** Draft request (not sent): *"All Form 8B
  Memoranda of Voting Conflict filed by Commissioner Kristen Burke from
  commencement of service (November 2020) through present."* Directed to
  the Clay County Clerk of Court (the statutory recipient of Form 8B filings
  under FS 112.3143) — this is now the recommended path forward instead of
  opening all ~48 remaining PrimeGov hits individually, since the spot-check
  suggests most are false positives.
- Clay County's own financial-disclosure filings (Form 1/Form 6) — not yet
  searched.

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
- both `claycounty.novusagenda.com`'s date-range search form and
  `search.sunbiz.org`'s entity-name search form are ASP.NET postback forms
  that resist scripted form-filling (values appear set visually but the
  server-side postback does not register them) — matches a friction
  already documented in Cthrew's own research (`docs/PUBLIC-SOURCE-INVENTORY.md`,
  GOV-074). **Workaround:** PrimeGov's `clay.primegov.com` portal (React
  SPA) accepts scripted interaction, though even it needed several retries
  in a third-pass session (see below); Sunbiz's own entity-name **results
  list** (plain HTML links, not the postback search forms) can be reached
  by getting a working results-list URL from a web search, then clicking
  the row link directly. Direct-download PDF links on `claycountygov.com`
  sometimes render inline in Chrome's PDF viewer (canvas-based, not
  text-extractable via `get_page_text`) rather than downloading to disk —
  inconsistent, not root-caused.
- **NEW, high-value discovery this pass: `clay.primegov.com`'s API and
  document endpoints are directly reachable via plain `curl`** (HTTP 200,
  no browser needed) — this contradicts Cthrew's own prior note that
  "naive curl/WebFetch is blocked" for this domain; that may have changed,
  or the specific endpoints tested differ. **Use `curl` first for any
  further PrimeGov work** (`/api/v2/PublicPortal/ListArchivedMeetings?year=YYYY`
  and `/Public/CompiledDocument?meetingTemplateId=N&compileOutputType=1`)
  — it is far more reliable than the browser-automated portal search UI,
  which required 3-6 retries per query this session and sometimes never
  succeeded (multi-word search terms like "voting conflict" or "Stormwater
  Assessment" consistently failed to trigger; single words worked
  eventually). `claycountygov.com` and `search.sunbiz.org` remain
  curl-blocked (HTTP 403) — only PrimeGov's endpoints were retested and
  found open this pass.
