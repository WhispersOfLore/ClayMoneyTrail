export const NOT_POPULATED = 'Not yet populated';

export function money(value: number | null, short = false): string {
  if (value === null) return NOT_POPULATED;
  if (short && Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${millions.toFixed(value % 1_000_000 ? 2 : 0)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

// Payroll figures are compared to the cent, so they are never rounded to whole dollars.
export function moneyExact(value: number | null): string {
  if (value === null) return NOT_POPULATED;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
}

export function percent(numerator: number, denominator: number): number {
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}
