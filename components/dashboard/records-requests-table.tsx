import type { RecordsRequestItem } from '@/lib/types';
import { EmptyState } from './empty-state';

const STATUS_LABEL: Record<string, string> = {
  suggested_not_sent: 'Suggested — not sent',
  drafted: 'Drafted',
  sent: 'Sent',
  partially_fulfilled: 'Partially fulfilled',
  fulfilled: 'Fulfilled',
  denied: 'Denied',
  no_response: 'No response',
};

export function RecordsRequestsTable({ requests }: { requests: RecordsRequestItem[] }) {
  if (!requests.length) {
    return <EmptyState title="No records requests tracked yet" text="Suggested and filed public-records requests will appear here." />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Request</th>
            <th>Agency</th>
            <th>Status</th>
            <th>Follow-up</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="record-row">
              <td>
                <strong>{r.subject}</strong>
                <small>{r.id}</small>
                <p className="request-text">{r.request}</p>
              </td>
              <td>{r.agency}</td>
              <td>
                <span className={`request-status request-status-${r.status}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
              </td>
              <td>{r.followUpRequired ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
