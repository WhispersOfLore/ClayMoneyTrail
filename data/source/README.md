# FY2025-26 Clerk contract-index source rows

These four JSON files preserve the public index metadata collected from the Clay County Clerk/Comptroller County Records search on September 20, 2026.

- Agreement/Contract: October–December 2025 and January–September 2026
- Renewals/Extensions/Amendments: October–December 2025 and January–September 2026

Each row contains the document type, indexed description, indexed date, record number, and the Clerk download identifier exposed by the search result. The files do not assert that a document was paid, that its full value was spent, or that the index description captures every term in the underlying document.

Run `node scripts/build-contract-inventory.mjs` to regenerate the normalized JSON inventory and public CSV. The generated stage fields use only `FOUND`, `MISSING`, `N/A`, or `NEEDS VERIFICATION`.
