import { ChevronDown, ChevronRight } from 'lucide-react';
import { money } from '@/lib/format';
import type { RecordItem, SourceItem } from '@/lib/types';
import { FilterBar, StandardPage, type FilterProps } from './layout';
import { RecordsTable } from './records-table';
import { StatusBadge } from './status-badge';

export function Explorer({
  kind,
  records: list,
  sources,
  expanded,
  setExpanded,
  filters,
}: {
  kind: 'revenue' | 'expense';
  records: RecordItem[];
  sources: SourceItem[];
  expanded: Record<string, boolean>;
  setExpanded: (v: Record<string, boolean>) => void;
  filters: FilterProps;
}) {
  const relevant = list.filter((r) => r.flow === kind);
  const groups = Array.from(new Set(relevant.map((r) => r.department)));
  const toggle = (k: string) => setExpanded({ ...expanded, [k]: !expanded[k] });

  return (
    <StandardPage
      kicker={kind === 'revenue' ? 'REVENUE' : 'EXPENDITURES'}
      title={kind === 'revenue' ? 'Where does the money come from?' : 'Where is the money going?'}
      description={
        kind === 'revenue'
          ? 'Revenue sources, assessments, grants, transfers, and borrowing—separated by status.'
          : 'Expandable cost centers with budgeted and actual amounts kept distinct.'
      }
    >
      <FilterBar {...filters} />
      <div className="explorer-layout">
        <section className="panel tree-panel">
          <div className="tree-root">
            <button onClick={() => toggle(kind)}>
              {expanded[kind] ? <ChevronDown /> : <ChevronRight />}
              <span>Clay County · selected fiscal year</span>
            </button>
            <strong>Multiple accounting levels</strong>
          </div>
          {expanded[kind] &&
            groups.map((group) => {
              const items = relevant.filter((r) => r.department === group);
              const key = group.toLowerCase();
              const total = items.reduce((s, r) => s + (r.amount ?? 0), 0);
              const hasLayers = items.some(
                (r) => r.notes.toLowerCase().includes('do not add') || r.category.includes('Summary'),
              );
              return (
                <div className="tree-group" key={group}>
                  <button onClick={() => toggle(key)}>
                    {expanded[key] ? <ChevronDown /> : <ChevronRight />}
                    <span>{group}</span>
                    <strong>{hasLayers ? 'Multiple levels' : total ? money(total) : 'Not yet populated'}</strong>
                  </button>
                  {expanded[key] &&
                    items.map((item) => (
                      <div className="tree-leaf" key={item.id}>
                        <span>
                          {item.name}
                          <StatusBadge value={item.sourceStatus} />
                        </span>
                        <strong>{money(item.amount)}</strong>
                      </div>
                    ))}
                </div>
              );
            })}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">RECORDS</span>
              <h3>{relevant.length} matching entries</h3>
            </div>
          </div>
          <RecordsTable records={relevant} sources={sources} />
        </section>
      </div>
    </StandardPage>
  );
}
