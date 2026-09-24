# Clay County Money Trail

A local, source-first civic dashboard for exploring where Clay County,
Florida money comes from and where it goes. It is an independent, neutral
civic-data project — not an official Clay County website.

## What's currently in the dashboard

- 106 records across FY2024-25, FY2025-26, and FY2026-27, backed by 7 official
  sources (see **Sources**, or `data/sources.json`)
- Verified FY2025-26 fund, cost-center, and functional-expenditure totals from
  the adopted county budget (all-funds total, General Fund detail, Sheriff /
  detention cost centers, Public Works, ad valorem tax breakdown, etc.)
- The CCSO's own approved-budget presentation, kept separate from the
  county's fund/cost-center figures with an explicit reconciliation notice
- Official stormwater-assessment estimates (revenue and first-year
  regulatory/collection cost) and the derived remainder between them
- Charter-mandated commissioner base salaries ($37,000 each)
- A searchable, filterable record explorer (fiscal year, department,
  category, source status, free-text search) with an expandable
  budget/revenue hierarchy
- A computed data-completeness indicator (not a hardcoded number) and a set
  of "Questions / Flags" that are derived from the dataset itself, not
  written as static copy
- Expandable per-record detail (fiscal year, amount, measurement type,
  source status badge, clickable source link, notes/formula, last-verified
  date) everywhere records are listed
- CSV and JSON downloads of the full dataset (`public/data/`)
- FY2025-26 procurement-notice registry that keeps awards, contract ceilings,
  and actual payments as separate concepts
- Supplier-invoice / accounts-payable records (PRR-2026-1194): 37,845 invoice
  line items with vendor names, invoice dates, PO numbers, and invoice
  amounts, covering 2024-10-01 through 2026-09-17. **Vendor names, invoice
  amounts, and invoice dates are published data, not a gap** — what remains
  unverified is confirmation that any specific invoice was actually
  disbursed ("Approved" is Workday's payment-processing status, not proof of
  payment; see **Payroll and records-response pipeline** and the Vendors &
  Contracts page)
- Primary-document-reviewed mobility-fee-credit agreements for Governor's
  Park ($81,138,270.20 maximum authorized credit) and Cathedral Oak
  (`GOVERNORS_PARK_MOBILITY_FEE_CREDITS.md`), and a reviewed Public Safety
  Complex bid-opening record (4 bids, 2 no-bids, no scores) with the RFP's
  full evaluation-scoring criteria
- Neutral commissioner-email index and Charter §2.2.J human-review workflow;
  no message is characterized as malfeasance
- Verified public-records/contact directory, FY2025-26 Human Services research,
  and October 1, 2025 → October 1, 2026 comprehensive impact-fee comparison
- Scrollable desktop/mobile navigation so every research module remains
  reachable on shorter displays
- County-produced BCC payroll (FY2024-25 and FY2025-26 year to date) from
  public-records response PRR-2026-1195, shown for elected officials and
  senior staff with salary rate, wages paid, and overtime kept in separate
  columns; everyone else appears only in aggregate (see **Payroll and
  records-response pipeline**)

## What remains incomplete

Supplier-invoice records exist (vendor names, amounts, dates — see above),
but **actual payments independently verified: none yet** — no invoice has
been confirmed as actually disbursed from any source outside the county's
own "Approved" status field. This does not mean the county paid nothing; it
means disbursement itself has not yet been independently confirmed. Beyond
that: no payroll for the constitutional offices
(Sheriff, Clerk, Tax Collector, Property Appraiser, Supervisor of Elections)
or other employers, no earnings-by-pay-code detail or position/rate history
for any employee, no capital project-level detail, no bond-level debt
schedules, no actual stormwater collections or spending, and no fiscal years
before FY2024-25 are loaded. Nearly every figure in the dataset is a **budgeted** or **estimated**
amount — almost none of it is confirmed **actual** spending. The in-app
"Questions / Flags" page lists these gaps and updates automatically as
records are added; see also `lib/gaps.ts`.

## Run locally

Requires Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open the address printed in the terminal (normally `http://localhost:3000`).

## Production build

```bash
npm run build
npm run start   # runs the built worker via wrangler
```

## Data audit and export

```bash
npm run data:audit    # validates data/records.json and data/sources.json
npm run data:export   # regenerates public/data/*.json and *.csv from the source data
```

Run `npm run data:audit` after editing `data/records.json` or
`data/sources.json`, and `npm run data:export` before committing so the
downloadable files stay in sync. `npm run lint` runs oxlint.

## Data model

Editable source data lives in `data/records.json` and `data/sources.json`.
Download-ready extracts live in `public/data/` as JSON and CSV. Shared types
live in `lib/types.ts`.

Every record carries a fiscal year, domain, flow (`revenue`/`expense`),
department, category, name, amount (or `null`), measure, source status,
source ID, and notes. Unknown amounts are `null`; the interface renders them
as **Not yet populated**. Every source carries a `lastVerified` date — `null`
when no one has actually re-checked the figure against the document, shown
in the UI as **Not recorded** rather than a fabricated date.

### Source-status definitions

| Status | Badge label | Meaning |
| --- | --- | --- |
| `verified_official` | Official | Reported directly by an official document or record |
| `official_estimate` | Official estimate | An estimate published by the county or another official source |
| `derived_estimate` | Derived | Calculated from verified figures using a formula shown in the record's notes |
| `rough_estimate` | Approximate | Required an assumption or a range — treat as directional, not exact |
| `pending` | Pending | No verified amount is available yet (`amount` is `null`) |

**Budgeted does not equal actual spent.** Budget figures (`measure` values
like `budgeted`, `amended`, `estimated`, `encumbered`) are planned
allocations or estimates. Only a `measure` of `actual` represents confirmed
spending or collected revenue, and almost none is loaded yet — see the
Questions / Flags page for exactly what's missing.

### Adding a verified record

1. Confirm the figure against an official document. Add or reuse an entry in
   `data/sources.json` (include `lastVerified` if you actually checked the
   date; otherwise leave it `null`).
2. Add an object to `data/records.json` with a unique `id`, the correct
   `fiscalYear`, `domain`/`flow`/`department`/`category`, `amount` (or `null`
   if unknown — never a placeholder number), the right `measure`, the
   matching `sourceStatus`, `sourceId`, and `notes`. A derived figure must
   show its formula in `notes`; a rough/approximate figure must be flagged as
   such via `sourceStatus: "rough_estimate"`.
3. Watch for double-counting: many rows in this dataset are subtotals or
   fund-level totals whose notes say "do not add to component rows" — follow
   that convention for new totals too.
4. Run `npm run data:audit`, then `npm run data:export`.

### Using the import templates

`data/templates/` has one documented CSV per incomplete area (vendor
payments, contracts, payroll, capital projects, debt schedules, fund
reserves, historical budget-vs-actual). Each has a header row and one
clearly fictional `example_only` row. See `data/templates/README.md` for
column definitions and the manual CSV → `data/records.json` conversion
steps — there is no automatic importer, so every new record gets human
review before publishing.

## Phase 6 datasets (state funding, capital projects, geographic spending, taxes)

Five additional research-backed datasets live alongside `data/records.json`,
each with its own nav section and rendered by a dedicated component in
`components/dashboard/`:

- **`data/state-funding.json`** — Florida Senate Local Funding Initiative
  Requests (LFIR) for Clay County, FY2026-27. Models the pipeline
  `requested → appropriated → vetoed → received → spent` explicitly per
  request via a `legislativeStatus` field — never collapse these stages into
  one number. Rendered by **State Funding**.
- **`data/public-safety-complex.json`** — the RFP 25/26-085 Public-Private
  Partnership money trail (land, RFP, staff ranking, state-funding
  components, timeline). Rendered by **Public Safety Complex**, and
  cross-linked from **Capital Projects**.
- **`data/geographic-spending.json`** — the "where does the money go"
  classification (countywide/unallocated vs. MSTU vs. district vs. named CIP
  road projects), each entry explicitly marked whether it CAN or CANNOT be
  geographically allocated from public records, plus the CIP Transportation
  project list. Rendered by **Geographic Spending**.
- **`data/taxes-assessments.json`** — Clay County countywide millage
  2018-2026, the 2019-2025 ad valorem series (FL DOR), and a claim-by-claim
  verification table for a community post's statewide numbers. Rendered by
  **Taxes & Assessments**.
- **`data/black-creek.json`** — the SJRWMD Black Creek Water Resource
  Development Project money trail (cost estimates, funding, timeline).
  Rendered as a summary card on **Capital Projects**.
- **`data/payroll-fuel.json`** — payroll-claim verification (including the
  Fire Chief tenure-date and Fire Marshal dual-role investigations) and
  fuel/fleet vendor leads. Not yet wired to its own nav page — read directly
  or added to People/Payroll in a future pass.

These use the same `sourceStatus` vocabulary as `data/records.json` for money
figures, plus `EvidenceStatus` (the Investigations layer's vocabulary) for
investigative claims — many entries mix both, e.g. a `sourceStatus` on the
dollar figure and an `evidenceStatus` on the surrounding claim. `npm run
data:audit` validates unique IDs, status-vocabulary membership, and that
every `photoUrl` on an investigation actually exists under `public/`.

Commissioner official headshots live in `public/images/commissioners/`,
downloaded from each commissioner's official `claycountygov.com` bio page
and referenced via `photoUrl` on their `data/investigations/meta.json`
entry (also carries `photoSourceUrl`, `currentTitle`, and
`areaRepresented`, each independently verified against official material,
never the Facebook graphic that prompted this).

## Investigations

An **Investigations** section (separate nav item, separate data model) adds
historical, evidence-gathering research on top of the money-trail dataset
above. It does not replace or restructure anything above — it's additive.

- **Investigation 001 — Kristen Burke / District 5** is the first
  investigation loaded. It is evidence-gathering, not an accusation: every
  claim carries an explicit status (`verified_fact`, `documented_connection`,
  `possible_connection`, `unverified_lead`, `records_required`,
  `allegation`, `disproven_claim`) and a source.
- Data lives in `data/investigations/` (`leads.json`, `evidence.json`,
  `timeline.json`, `records-requests.json`, `meta.json`), typed in
  `lib/types.ts` and `lib/investigation-status.ts`, rendered by
  `components/dashboard/investigations-panel.tsx` and its children.
- **`LEADS.md`** and **`RECORDS_NEEDED.md`** at the project root are the
  plain-text mirrors of the leads and gaps tracked in the app — update both
  sides together.
- **`npm run data:audit`** validates the investigations data files too (ids
  unique, status values from the fixed vocabulary, cross-references
  resolve) alongside the existing money-trail checks.
- No public-records request is ever sent automatically — suggested requests
  are tracked with `status: "suggested_not_sent"` for human review.

### Cross-link to Cthrew

A separate, more general project — **Cthrew** (`../Cthrew`), the "Clay
County Transparency Graph" — implements a polymorphic entity/relationship
graph with its own source/citation/verification-status model. Rather than
duplicating that engine here, ClayMoneyTrail's Investigations layer
cross-links to it: Investigation 001's real entities (Kristen Burke, Fleming
Island Family Chiropractic, the Gustafson land-use matter, the Sandridge
Road project, and the full verified BCC roster) are also loaded into
Cthrew's database (`packages/database/src/seed/realData.ts`, appended under
an "Investigation 001 additions" block — see that file's comments), where
they can be explored as a visual graph. Run `pnpm dev` in `../Cthrew` and
open `http://localhost:5310` to browse it; the Overview tab of this app's
Investigations section links there directly.

Neither project overwrites the other. ClayMoneyTrail owns the money-trail
records, leads, evidence ledger, and narrative timeline; Cthrew owns entity
resolution and the relationship graph. They're kept in sync by hand for now
— a shared entity-id convention (e.g. `person_burke`) is used on both sides
so the same real-world entity can eventually be linked automatically.

## Payroll and records-response pipeline

Public-records responses follow one repeatable path, so a new response can be
processed by rerunning scripts instead of re-reading files by hand:

```
ORIGINAL ZIP -> hash/provenance -> parse -> normalize -> validate -> sanitize -> public data
```

```bash
npm run records:manifest -- <response.zip>   # hashes + CRC check + duplicate detection; extracts nothing
npm run payroll:build -- <response.zip>      # parses the payroll reports + census straight from the ZIP
npm run data:audit                           # includes payroll integrity checks
npm run sensitive:scan                       # pattern scan + roster leak check (also run after builds)
```

- The original ZIP is never modified or unpacked in place.
  `scripts/lib/zip-reader.mjs` and `scripts/lib/xlsx-reader.mjs` read it in
  memory with Node built-ins only.
- `scripts/build-payroll-dataset.mjs` refuses to run if a report's header row
  changes, uses only fields actually supplied, and never fills a missing value.
  It writes a **private** full dataset (names, gender, employer benefit costs,
  validation detail) to `research-staging/` (gitignored) and a **sanitized
  public** dataset to `data/payroll.json`.
- **Who is named publicly** is controlled by one list, `PUBLIC_TIER`, in the
  build script: elected commissioners, the County Manager, Assistant County
  Managers, and the Fire Chief / Assistant Fire Chief / Fire Marshal roles
  already in the research. Everyone else appears only in aggregate. Gender and
  per-person employer benefit/tax costs are never published.
- `data/payroll-findings.json` is hand-written editorial prose. Every figure it
  cites is checked against `data/payroll.json` by `npm run data:audit`.
- **Provenance registry.** `data/records-responses.json` has one entry per
  public-records response (request number, agency, dates, status, original file
  and SHA-256, files received, covered periods, public archive URL, derived
  datasets, unresolved questions, and the request-to-finding chain). The audit
  cross-checks it against the parser's output, and a request cannot be marked
  fulfilled or partially fulfilled until its original wording has been located
  and compared (`response_received_completeness_not_verified` until then).
- **Public evidence archive.** Original files are preserved unaltered in a
  public Google Drive folder that is maintained by the researcher, **not by Clay
  County**. ClayMoneyTrail only links to it for independent inspection — it is
  never read at runtime, the site works without it, and the audit forbids any
  code from referencing Drive directly. Derived ClayMoneyTrail data is
  sanitized; the archive holds the unaltered originals.
- **Official amount vs comparison figure.** Numbers printed in the county's
  export are OFFICIAL PAYROLL AMOUNTS. Anything this project calculates for
  context is a COMPARISON FIGURE and is labeled as such; a difference between
  them is a research question, never an accusation.
- PRR-2026-1195 covers **Board of County Commissioners employees only**.
  Constitutional offices are separate employers and are never mixed in.
- **Salary rate ≠ wages paid.** The census shows a current annualized rate; the
  payroll reports show a single combined "non-OT wages" figure plus overtime.
  Leave payout, special/acting pay, and allowances cannot be separated, so no
  total-compensation figure is shown.

## Methodology and limitations

This is a public, independent, source-first data project, not an official
Clay County publication. A few things to keep in mind when reading it:

- **Record coverage ≠ budget coverage.** The dashboard shows what percentage
  of *its own loaded records* have a populated amount. That is not the same
  as how much of Clay County's actual budget is represented — the county's
  full budget contains far more funds, cost centers, and transactions than
  this dataset currently tracks.
- **Budgeted ≠ actual.** Nearly every figure here is a planned allocation or
  an official estimate, not confirmed spending or collected revenue.
- **Different accounting views aren't interchangeable.** The CCSO's approved
  budget presentation and the county's fund/cost-center budget describe
  overlapping activity using different structures; they are shown side by
  side, never summed together.
- **Nothing is invented.** No employee salary, vendor payment, contract
  award, or project cost is shown unless it traces to an official source.
  Where data is missing, the interface says so explicitly and explains what
  official record would fill the gap.

## Project status / checkpoint (2026-09-24)

Research is paused at this checkpoint. A future session should be able to
pick up from here without rediscovering project state:

- **Deployed commit:** `7e63d01` (verified live on GitHub Pages).
- **Integrated:** BCC payroll (PRR-2026-1195); supplier-invoice/accounts-payable
  records (PRR-2026-1194); a meeting-transcript verification pass covering
  the Public Safety Complex bid-opening record (4 bids, 2 no-bids, no
  scores — RFP 25/26-085), the Governor's Park and Cathedral Oak
  mobility-fee-credit agreements (see `GOVERNORS_PARK_MOBILITY_FEE_CREDITS.md`),
  and the Avaap AMS Lifeline Support contract/amendment.
- **Private by design:** the underlying meeting transcripts and other raw
  working documents behind that verification pass live only in the
  gitignored `research-staging/` directory and are never published; only
  citation-ready findings derived from them were promoted into the tracked
  data and documentation above.
- **Highest-value open gaps** (see `RECORDS_NEEDED.md` for full detail):
  the actual PSC Evaluation Committee scoresheet/selection record; the
  53-acre PSC site's parcel/acquisition record; confirmation of whether
  Governor's Park's/Cathedral Oak's mobility-fee credit has actually been
  earned or used (as opposed to authorized); and Sunbiz identity
  confirmation for the "Clay Dair Property Holdings" lead in `LEADS.md`.
- No new research, integration, or public-records requests are planned
  while paused.
