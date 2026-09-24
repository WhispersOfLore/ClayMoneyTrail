import type { RecordItem } from './types';

export interface DataFlag {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'resolved';
}

const EXPECTED_FISCAL_YEARS = [
  'FY2020-21',
  'FY2021-22',
  'FY2022-23',
  'FY2023-24',
  'FY2024-25',
  'FY2025-26',
  'FY2026-27',
];

/**
 * Every flag here is derived from the current records array, not written
 * as static copy. As real data is loaded (vendor payments, individual
 * payroll, capital project detail, bond schedules, stormwater actuals,
 * historical years, budget-vs-actual pairs), the corresponding flag
 * automatically flips from "open" to "resolved" instead of needing to be
 * hand-edited or deleted.
 */
export function computeFlags(records: RecordItem[], supplierInvoicesLoaded = false): DataFlag[] {
  const vendorsLoaded = records.some((r) => r.domain === 'vendors' && r.amount !== null);
  const individualPayrollLoaded = records.some((r) => r.category === 'Individual Payroll');
  const capitalDetailLoaded = records.some((r) => r.domain === 'capital' && r.measure === 'actual');
  const debtBondScheduleLoaded = records.some((r) => r.domain === 'debt' && r.category === 'Bond Schedule');
  const stormwaterActualLoaded = records.some((r) => r.department === 'Stormwater' && r.measure === 'actual');

  const presentYears = new Set(records.map((r) => r.fiscalYear));
  const missingYears = EXPECTED_FISCAL_YEARS.filter((y) => !presentYears.has(y));

  const budgetedKeys = new Set(
    records.filter((r) => r.measure === 'budgeted' && r.amount !== null).map((r) => `${r.department}::${r.category}`),
  );
  const actualKeys = new Set(
    records.filter((r) => r.measure === 'actual' && r.amount !== null).map((r) => `${r.department}::${r.category}`),
  );
  const missingActuals = [...budgetedKeys].filter((k) => !actualKeys.has(k));

  return [
    {
      id: 'budget-vs-actual',
      title: 'Actual vs. budgeted spending',
      status: missingActuals.length === 0 && budgetedKeys.size > 0 ? 'resolved' : 'open',
      description:
        missingActuals.length > 0
          ? `${missingActuals.length} budgeted department/category line${missingActuals.length === 1 ? '' : 's'} have no matching verified actual-expenditure record. Every budgeted figure in this dataset is a planned allocation, not confirmed spending.`
          : 'No budgeted lines are loaded yet, so there is nothing to compare against actual spending.',
    },
    {
      id: 'individual-payroll',
      title: 'Complete individual payroll',
      status: individualPayrollLoaded ? 'resolved' : 'open',
      description: individualPayrollLoaded
        ? 'Individual, non-aggregate payroll records are loaded.'
        : 'Board of County Commissioners payroll for FY2024-25 and FY2025-26 year to date is loaded from the county\'s response to PRR-2026-1195 (see People / Payroll), but it is a separate dataset and not part of this record count. Still missing: earnings detail by pay code, position and rate history, years before FY2024-25, and employee-level payroll for the constitutional offices and other employers. No total-compensation figure is shown, and none will be invented.',
    },
    {
      id: 'vendor-payments',
      title: 'Vendor and check-register payments',
      status: vendorsLoaded ? 'resolved' : 'open',
      description: vendorsLoaded
        ? 'Vendor-level payment records are loaded.'
        : supplierInvoicesLoaded
          ? 'Supplier-invoice records (vendor names, invoice amounts, PO numbers, and invoice dates) are loaded via PRR-2026-1194 — see Vendors & Contracts. What remains missing is a check register or other confirmation that a specific invoice was actually disbursed: "Approved" is Workday\'s payment-processing status, not proof of payment.'
          : 'No verified vendor-level or check-register payment records are loaded. Vendor names, payment amounts, and dates require a public-records request or a published check register.',
    },
    {
      id: 'capital-project-detail',
      title: 'Capital project-level detail',
      status: capitalDetailLoaded ? 'resolved' : 'open',
      description: capitalDetailLoaded
        ? 'Project-level capital spending records are loaded.'
        : 'Only fund-level capital appropriations are loaded. Individual project names, amendments, contract awards, and actual capital spending are not yet populated.',
    },
    {
      id: 'debt-bond-schedule',
      title: 'Debt bond-level schedules',
      status: debtBondScheduleLoaded ? 'resolved' : 'open',
      description: debtBondScheduleLoaded
        ? 'Bond-level debt schedules are loaded.'
        : 'Only a fund-level debt-service appropriation total is loaded. Individual bond issues, maturity dates, interest rates, and payment schedules are not yet populated.',
    },
    {
      id: 'stormwater-actuals',
      title: 'Stormwater actual collections and spending',
      status: stormwaterActualLoaded ? 'resolved' : 'open',
      description: stormwaterActualLoaded
        ? 'Actual stormwater collections and spending are loaded.'
        : 'Stormwater figures currently loaded are official estimates and a derived remainder, not actual collected revenue or actual project spending.',
    },
    {
      id: 'historical-years',
      title: 'Missing historical years',
      status: missingYears.length === 0 ? 'resolved' : 'open',
      description:
        missingYears.length > 0
          ? `No records are loaded for ${missingYears.join(', ')}. Year-over-year comparisons are limited to the fiscal years currently populated.`
          : 'All expected fiscal years have at least one loaded record.',
    },
  ];
}
