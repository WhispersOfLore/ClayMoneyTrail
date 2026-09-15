import { Download } from 'lucide-react';

export function DownloadLinks() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="download-row">
      <a href={`${base}data/clay-county-money-trail.json`} download>
        <Download size={16} /> Download JSON
      </a>
      <a href={`${base}data/clay-county-money-trail.csv`} download>
        <Download size={16} /> Download CSV
      </a>
    </div>
  );
}
