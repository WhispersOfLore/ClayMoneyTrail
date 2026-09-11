# Burke Campaign Finance — 2023–2024 Election Cycle

Source: Clay County Supervisor of Elections campaign-finance system (VoterFocus),
candidate ID `ca=857`. Fetched and itemized 2026-09-11. This is Burke's
re-election cycle for County Commissioner District 5, covering reports filed
May 2023 through the termination report in September 2024.

## Reports covered

| Report | Period | Contributions | In-Kind | Expenditures |
|---|---|---|---|---|
| M5 | 5/1/2023–5/31/2023 | $16,020.00 | $0.00 | $1,176.07 |
| M6 | 6/1/2023–6/30/2023 | $5,077.02 | $950.00 | $5,152.72 |
| Q3 | 7/1/2023–9/30/2023 | $3,003.78 | $0.00 | $1,974.50 |
| Q4 | 10/1/2023–12/31/2023 | $2,003.81 | $0.00 | $1,782.00 |
| Q1 | 1/1/2024–3/31/2024 | $3.54 (interest only) | $0.00 | $3,550.00 |
| Q2 | 4/1/2024–5/31/2024 | **-$1,498.22** (two self-refunds) | $0.00 | $4,200.00 |
| P1 | 6/1/2024–6/14/2024 | $0.00 | $0.00 | $100.00 |
| TR | 6/15/2024–9/12/2024 (termination) | $0.79 | $0.00 | $6,675.43 |

**Totals: $24,610.72 in net contributions, $950.00 in-kind, and $24,610.72
in itemized expenditures across all 8 reports** — the two totals match to
the penny, which is a coincidence of the underlying numbers (verified by
direct addition, not a copy error) rather than a reporting artifact. Note
Q2's contribution figure is negative (two self-refunds, see below); Q1's
$3.54 and TR's $0.79 are bank interest, not third-party contributions.

Full itemized data: `data/investigations/campaign-contributions-2024.json`.

## Notable items

- **PAC contributions**: three $1,000 checks from PACs sharing the same
  Tallahassee address (115 E Park Ave Suite 1) — Strong Leadership, First
  Coast Conservatives, Women Building the Future — plus a fourth, Clay
  Conservatives ($1,000, Q4 2023, different Tallahassee address). All are
  standard state-level conservative political committees; no further
  investigation of their donor base was done this pass.
- **The Vector Companies Inc** ($1,000, 5/30/2023) — occupation listed as
  "Affordable housing." This is the one contributor in either cycle whose
  stated business is directly development-adjacent. No BCC matter involving
  this company has been found; flagged for follow-up.
- **William & Yoho PA** ($1,000, legal) and **Barry Ansbacher** ($1,000,
  attorney) — law-firm/attorney contributions. Neither has been matched to
  representation in any BCC land-use matter reviewed this pass.
- **Repeat donors from the 2020 cycle**: Robert Kronmiller, Oakleaf Family
  Chiropractic, Fleming Island Chiropractic (Burke's own practice), Tony/
  Anthony Richardson, Doug Spradlin, David Owens, Karen Opp, Coen/Isabelle
  Purvis, Junque in the Trunk, Randy Gillis. Full comparison in
  `CAMPAIGN_REPEAT_DONORS.md`.
- **Geographic cluster**: two more Sandridge Road donors — Stu Opferman
  (2263 Sandridge Rd, $50) and Mike Elliott (2250 Sandridge Rd, $200) —
  joining 2020's Sue Campbell (2429 Sandridge Rd). Also Darrell Crawford
  (286 Lake Asbury Dr, $50). Given Burke's own residence is in Russell
  Landing near Lake Asbury (per her campaign bio), donors from this
  immediate area are consistent with an incumbent's home-neighborhood donor
  base — recorded as a **geographic coincidence**, not a demonstrated
  relationship, same standard applied to Sue Campbell in `CAMPAIGN_CROSSREF.md`.
- **Kronmiller Consulting** continues as Burke's paid campaign
  accountant/treasurer across both cycles — a well-documented, ordinary
  repeat vendor relationship, not a new finding.
- **Two candidate self-refunds** in Q2 2024 (-$500, -$1,000) reconcile
  against a $1,000 self-loan she made in M5 2023 — a normal accounting
  correction, not a third-party transaction.
- **Termination**: TR report shows no new itemized contributions beyond
  bank interest; expenditures include the campaign's usual accounting and
  event vendors. Unlike the 2020 cycle (which ended with a $3,260.67
  donation to Quigley House), this cycle's termination report shows no
  leftover-funds distribution to a charity in the itemized rows pulled —
  not independently confirmed either way for the full report.

## What this cycle does NOT show

No itemized contribution in either the 2020 or 2023–2024 cycle has been
matched to the applicant, agent, or any identified party in the Gustafson
land-use case (Sheryl Gustafson, Danielle Kitchens). No contributor has been
confirmed as a Clay County vendor or contractor — ClayMoneyTrail's
vendor/contract dataset remains empty, so that specific cross-reference
cannot be completed yet.
