import { FileQuestion } from 'lucide-react';

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <FileQuestion size={21} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

/**
 * A richer empty/partial-data notice for sections where only some data is
 * loaded (or none at all). Always names the missing piece, the official
 * record that would fill it, and the columns a completed import template
 * needs — never a placeholder number.
 */
export function DataGapNotice({
  title,
  missing,
  recordNeeded,
  templateFile,
  columns,
}: {
  title: string;
  missing: string;
  recordNeeded: string;
  templateFile: string;
  columns: string[];
}) {
  return (
    <div className="gap-notice">
      <div className="gap-notice-head">
        <FileQuestion size={18} />
        <h3>{title}</h3>
      </div>
      <dl>
        <div>
          <dt>What&apos;s missing</dt>
          <dd>{missing}</dd>
        </div>
        <div>
          <dt>Official record needed</dt>
          <dd>{recordNeeded}</dd>
        </div>
        <div>
          <dt>Import path</dt>
          <dd>
            Fill out <code>{templateFile}</code> and merge it into <code>data/records.json</code> following the schema
            documented in the README, then run <code>npm run data:audit</code>.
          </dd>
        </div>
      </dl>
      <div className="gap-columns">
        <span>Expected columns</span>
        <div className="gap-columns-list">
          {columns.map((c) => (
            <code key={c}>{c}</code>
          ))}
        </div>
      </div>
    </div>
  );
}
