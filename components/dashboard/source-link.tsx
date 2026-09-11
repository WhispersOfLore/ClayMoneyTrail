import { ExternalLink } from 'lucide-react';
import type { SourceItem } from '@/lib/types';

export function SourceLink({ source }: { source: SourceItem | undefined }) {
  if (!source) return <span className="source-link-missing">Source not found</span>;
  return (
    <a className="source-link" href={source.url} target="_blank" rel="noreferrer">
      {source.title}
      <ExternalLink size={12} />
    </a>
  );
}
