# Stormwater Master Timeline

Consolidates everything documented about Clay County's stormwater
utility/assessment across both investigation passes. Dollar figures for the
program are tracked separately in ClayMoneyTrail's main money-trail dataset
(`sourceId: stormwater-impact`) — this file is the decision-making
chronology.

## Chronology

| Date | Event | Status | Source |
|---|---|---|---|
| Undated (2025, exact date not found) | Public hearings on the proposed stormwater fee draw large, contentious crowds; residents in Middleburg and rural areas speak against it for hours. Board Chair Kristen Burke reportedly grows frustrated with attendees and threatens ejection for clapping/speaking out of turn. | documented_connection (secondary source) | Action News Jax, WOKV — see `data/investigations/evidence.json` EV-007 |
| Undated (2025) | Board considers hardship and disabled-veteran exemptions; a 100% hardship exemption (poverty-level income) and 50% disabled-veteran exemption discussed. | documented_connection (secondary source) | Action News Jax |
| **2026-07-28** | **Public Hearing to consider adoption of the Stormwater Utility and Assessment Ordinance, and thereafter the Initial Stormwater Assessment Resolution.** Assistant County Manager Troy Nagle presented. Chairman **Kristen Burke** opened the public hearing at 7:53pm. One speaker, Noel Saubers (417 River Birch Lane, Fleming Island), requested cost information; staff answered **$85.00 per homeowner per year**. Burke closed the hearing at 7:55pm. **Vice-Chairman John Sgromolo moved to approve adoption of the Ordinance, seconded by Commissioner Jim Renninger — carried 5-0.** Sgromolo then moved approval of the Resolution, seconded by Renninger — **carried 5-0.** | **verified_fact** (primary source) | Official BCC minutes, PrimeGov meetingTemplateId 8756 (meeting id 1953), video 3:51:34–3:56:08. See `data/investigations/evidence.json` EV-020. |
| 2026-10-01 | Stormwater fee takes effect (per official FAQ page). | official_estimate | claycountygov.com stormwater-fee-frequently-asked-questions page (not independently re-fetched this session) |

## Important correction / nuance

The "contentious hearing" described in 2025 secondary-news coverage and the
**unanimous, low-turnout July 28, 2026 final adoption vote** are two
different events, months apart. **Only one speaker addressed the Board at
the actual ordinance-adoption hearing**, and the vote was unanimous 5-0 with
no recorded dissent or notable public opposition at that specific meeting.
Do not read the earlier "citizens were furious" reporting as describing the
same meeting where the ordinance was actually adopted — the record shows
the final vote was calm and unanimous, whatever earlier hearings looked
like. This is exactly the kind of nuance `COUNTER_EVIDENCE.md` is meant to
capture: a headline narrative ("Burke pushed through an unpopular fee
against angry opposition") does not fully match the primary record of the
vote that actually enacted it.

## What is confirmed vs. still needed

**Confirmed (primary source):** the exact adoption date, mover/seconder,
unanimous vote, and per-homeowner cost ($85/year) for the final ordinance
and resolution.

**Still needed:**
- The specific date(s) and primary-source minutes for the earlier,
  contentious hearing(s) described by Action News Jax/WOKV — not yet
  identified precisely enough to pull minutes.
- Initial consultant contracts, studies, and staff reports that preceded
  the ordinance (referenced generically in secondary coverage, not sourced
  to a specific agenda item yet).
- The exact hardship/veteran exemption vote and its outcome — not found in
  the July 28, 2026 minutes, so it likely happened at an earlier meeting.
- Actual (not budgeted) stormwater collections and expenditures — the fee
  only took effect October 1, 2026, so no actual revenue/spending data
  exists yet to connect to ClayMoneyTrail's financial dataset.
