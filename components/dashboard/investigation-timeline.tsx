import type { TimelineEvent } from '@/lib/types';
import { formatDate, money } from '@/lib/format';
import { InvestigationStatusBadge } from './investigation-status-badge';
import { EmptyState } from './empty-state';

export function InvestigationTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return <EmptyState title="No timeline events yet" text="Meeting-level actions will appear here as they're confirmed against agendas and minutes." />;
  }
  return (
    <div className="inv-timeline">
      {events.map((ev) => (
        <article key={ev.id} className="inv-timeline-item">
          <div className="inv-timeline-head">
            <span className="inv-timeline-date">{formatDate(ev.date)}</span>
            <InvestigationStatusBadge value={ev.status} />
          </div>
          <h4>{ev.title}</h4>
          <dl className="record-detail">
            {ev.agendaItem && (
              <div className="record-detail-notes">
                <dt>Agenda item</dt>
                <dd>{ev.agendaItem}</dd>
              </div>
            )}
            {ev.parcel && (
              <div>
                <dt>Parcel</dt>
                <dd>{ev.parcel}</dd>
              </div>
            )}
            {ev.location && (
              <div>
                <dt>Location</dt>
                <dd>{ev.location}</dd>
              </div>
            )}
            {ev.applicant && (
              <div>
                <dt>Applicant</dt>
                <dd>{ev.applicant}</dd>
              </div>
            )}
            {ev.staffRecommendation && (
              <div>
                <dt>Staff recommendation</dt>
                <dd>{ev.staffRecommendation}</dd>
              </div>
            )}
            {ev.publicComment && (
              <div className="record-detail-notes">
                <dt>Public comment</dt>
                <dd>{ev.publicComment}</dd>
              </div>
            )}
            {ev.result && (
              <div>
                <dt>Result</dt>
                <dd>{ev.result}</dd>
              </div>
            )}
            {ev.amount != null && (
              <div>
                <dt>Amount</dt>
                <dd>{money(ev.amount)}</dd>
              </div>
            )}
            {ev.votes && ev.votes.length > 0 && (
              <div className="record-detail-notes">
                <dt>Votes</dt>
                <dd>
                  <ul className="records-needed-list">
                    {ev.votes.map((v) => (
                      <li key={v.commissioner}>
                        {v.commissioner} ({v.district ?? 'district unknown'}) — {v.vote}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {ev.sourceNote && (
              <div className="record-detail-notes">
                <dt>Source note</dt>
                <dd>{ev.sourceNote}</dd>
              </div>
            )}
          </dl>
        </article>
      ))}
    </div>
  );
}
