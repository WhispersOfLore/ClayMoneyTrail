import { evidenceStatusLabel } from '@/lib/investigation-status';

export function InvestigationStatusBadge({ value }: { value: string }) {
  return <span className={`status inv-status inv-status-${value}`}>{evidenceStatusLabel(value)}</span>;
}
