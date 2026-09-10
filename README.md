# Clay County Money Trail

A local, source-first civic dashboard for exploring where Clay County, Florida money comes from and where it goes.

## Run locally

Requires Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open the address printed in the terminal (normally `http://localhost:3000`). To verify a production build, run `npm run build`.

## Data model

Editable source data lives in `data/records.json` and `data/sources.json`. Download-ready extracts live in `public/data/` as JSON and CSV.

Every record carries a fiscal year, department, category, measure (`budgeted`, `actual`, `estimated`, or `base salary`), source status, source ID, and notes. Unknown amounts are `null`; the interface renders them as **Not yet populated**. The schema is ready for complete payroll, contracts/vendors, capital projects, debt, reserves, revenues, and FY2021–FY2027 comparisons.

## Important disclaimer

Budgeted does not equal actual spent. Budget figures are planned allocations; actual expenditures must be sourced and displayed separately. Official estimates are separately labeled. This is an independent, neutral civic data project and is not an official Clay County website.
