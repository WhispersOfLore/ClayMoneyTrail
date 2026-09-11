import type { DataFlag } from '@/lib/gaps';

export function GapFlagGrid({ flags }: { flags: DataFlag[] }) {
  return (
    <div className="flag-grid">
      {flags.map((f, i) => (
        <article className={`flag-card flag-${f.status}`} key={f.id}>
          <span>QUESTION {String(i + 1).padStart(2, '0')}</span>
          <h3>{f.title}</h3>
          <p>{f.description}</p>
          <small>{f.status === 'open' ? 'Open · Source needed' : 'Resolved · Data loaded'}</small>
        </article>
      ))}
    </div>
  );
}
