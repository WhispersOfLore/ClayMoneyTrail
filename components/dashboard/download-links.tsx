import { Download } from 'lucide-react';

export function DownloadLinks() {
  return (
    <div className="download-row">
      <a href="/data/clay-county-money-trail.json" download>
        <Download size={16} /> Download JSON
      </a>
      <a href="/data/clay-county-money-trail.csv" download>
        <Download size={16} /> Download CSV
      </a>
    </div>
  );
}
