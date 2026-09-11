import { AlertCircle, Search } from 'lucide-react';
import type { ReactNode } from 'react';

export function Kpi({
  icon,
  color,
  label,
  value,
  note,
  muted,
}: {
  icon: ReactNode;
  color: string;
  label: string;
  value: string;
  note: string;
  muted?: boolean;
}) {
  return (
    <div className="kpi">
      <div className={`kpi-icon ${color}`}>{icon}</div>
      <span>{label}</span>
      <strong className={muted ? 'muted-number' : ''}>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

export function Disclaimer({
  title = 'Budgeted does not mean spent.',
  text = 'Budget figures are planned allocations. Actual expenditures will be shown separately when verified records are added.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="disclaimer">
      <AlertCircle size={19} />
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

export function StandardPage({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="page-title">
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </>
  );
}

export interface FilterProps {
  query: string;
  setQuery: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  sourceStatus: string;
  setSourceStatus: (v: string) => void;
  departments: string[];
  categories: string[];
}

export function FilterBar(p: FilterProps) {
  return (
    <div className="filter-bar">
      <label>
        <Search size={16} />
        <input value={p.query} onChange={(e) => p.setQuery(e.target.value)} placeholder="Search records…" />
      </label>
      <select value={p.department} onChange={(e) => p.setDepartment(e.target.value)}>
        {p.departments.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      <select value={p.category} onChange={(e) => p.setCategory(e.target.value)}>
        {p.categories.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      <select value={p.sourceStatus} onChange={(e) => p.setSourceStatus(e.target.value)}>
        <option>All source statuses</option>
        <option value="verified_official">Official</option>
        <option value="official_estimate">Official estimate</option>
        <option value="derived_estimate">Derived</option>
        <option value="rough_estimate">Approximate</option>
        <option value="pending">Pending</option>
      </select>
    </div>
  );
}
