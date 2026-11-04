'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useReports } from '@/components/report-provider';
import { PageHeading, DemoNotice, ReportsTable } from '@/components/ui';
export default function Reports() {
  const { reports, mode } = useReports();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All types');
  const filtered = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) &&
      (type === 'All types' || type === r.type),
  );
  return (
    <>
      <PageHeading
        eyebrow="FROM NUMBERS TO NARRATIVE"
        title="Your reports, organized."
        description="A home for the insights that move your business forward."
      />
      <DemoNotice />
      <section className="panel">
        <div className="filter-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Search reports"
              placeholder="Search reports…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter report type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>All types</option>
            <option>Sales Summary</option>
            <option>Category Performance</option>
          </select>
          <span className="result-count" aria-live="polite">
            {filtered.length} reports
          </span>
        </div>
        <ReportsTable reports={filtered} />
      </section>
      <p className="data-footnote">
        {mode === 'demo'
          ? 'Browse sample reports or explore filters without saving changes.'
          : 'Saved reports persist in your local database.'}
      </p>
    </>
  );
}
