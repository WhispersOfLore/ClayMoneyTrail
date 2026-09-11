# Import templates

Each CSV here documents the columns needed to add a new category of verified
data to the dashboard. Every file has exactly one example row, marked
`example_only=true` with a name containing `(FICTIONAL)` or
`(FICTIONAL EXAMPLE)`. That row exists only to show the expected shape of the
data — it is never real Clay County data and must never be imported as-is.

## Files

| File | Covers |
| --- | --- |
| `vendor-payments.csv` | Vendor / check-register payments |
| `contracts.csv` | Contract awards |
| `payroll.csv` | Individual payroll, by position/title (never by employee name) |
| `capital-projects.csv` | Capital project-level detail |
| `debt-schedules.csv` | Bond-level debt schedules |
| `fund-reserves.csv` | Actual (not budgeted) fund reserve balances |
| `historical-budget-vs-actual.csv` | Adopted vs. amended budget vs. actual, by year |

## Common columns

Every template shares this core, matching `data/records.json`:

- `record_id` — unique, kebab-case, stable across re-imports
- `fiscal_year` — e.g. `FY2025-26`
- `department`, `category` — should match existing values in `data/records.json` where the item belongs to an existing group, or introduce a new one deliberately
- `name` — human-readable label for the record
- `amount` — a plain number, or leave blank/`null` if not yet known (never guess)
- `measure` — one of `budgeted`, `amended`, `estimated`, `encumbered`, `actual`, `base salary`, or `derived calculation`
- `source_status` — one of `verified_official`, `official_estimate`, `derived_estimate`, `rough_estimate`, `pending`
- `source_url`, `source_title` — the official document the figure comes from
- `notes` — required for any derived or approximate figure: show the formula or the assumption
- `last_verified` — the date (YYYY-MM-DD) someone actually checked the figure against the source; leave blank if unknown

Dataset-specific columns (`vendor_name`, `payment_date`, `contract_number`,
`employee_title`, `project_status`, `maturity_date`, `interest_rate`,
`fund_name`, `adopted_budget`, `amended_budget`, `actual_amount`) are added
per template as needed.

## Removing the example row and importing

1. Open the template and delete the `example_only=true` row — keep the header.
2. Fill in one row per real, source-backed figure. Leave `amount` blank rather
   than guessing.
3. Convert each row into a JSON object matching the shape used in
   `data/records.json` (`id`, `fiscalYear`, `domain`, `flow`, `department`,
   `category`, `name`, `amount`, `measure`, `sourceStatus`, `sourceId`,
   `notes`) and append it to that file's array. The CSV's `source_url` /
   `source_title` should become (or match) an entry in `data/sources.json`
   with a stable `id` — reuse an existing source if the document already has
   one, and add `lastVerified` if you have a real date.
4. Pick a `domain` that matches the template: `vendors`, `capital`, `debt`,
   `reserves`, or `people` for payroll (see `lib/types.ts` for the record
   shape and `app/page.tsx` for how each domain is filtered into a section).
5. Run `npm run data:audit` to check for duplicate IDs, missing sources, and
   status/amount mismatches, then `npm run data:export` to refresh the
   downloadable JSON/CSV in `public/data/`.

There is no automatic CSV→JSON importer yet — conversion is manual so every
new record gets a human review before it's published.
