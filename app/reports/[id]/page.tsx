'use client';
import { ExportControls } from '@/components/export-controls';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Tag } from 'lucide-react';
import { useReports } from '@/components/report-provider';
import {
  Stats,
  TrendChart,
  CategoryChart,
  PanelHeading,
  EmptyState,
} from '@/components/ui';
import {
  filterTransactions,
  dateLabel,
  categoryTotals,
  money,
} from '@/lib/data';
export default function Preview() {
  const { id } = useParams();
  const { reports, transactions, mode } = useReports();
  const report = reports.find((r) => r.id === id);
  if (!report)
    return (
      <>
        <Link href="/reports" className="back-link">
          <ArrowLeft size={16} />
          Back to reports
        </Link>
        <section className="panel">
          <EmptyState
            title="Report not found"
            description="This saved report does not exist. Return to reports or create a new one."
          />
          <div className="empty-action">
            <Link href="/reports/new" className="button primary">
              Create report
            </Link>
          </div>
        </section>
      </>
    );
  const data = filterTransactions(
    transactions,
    report.start,
    report.end,
    report.category,
  );
  return (
    <>
      <Link href="/reports" className="back-link">
        <ArrowLeft size={16} />
        Back to reports
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            REPORT PREVIEW · {report.type.toUpperCase()}
          </p>
          <h1>{report.title}</h1>
          <p className="subtitle">
            Created {dateLabel(report.created)} ·{' '}
            {mode === 'demo' ? 'Fictional demo data' : 'Local database records'}
          </p>
        </div>
        <span className="badge completed">
          <i />
          Ready
        </span>
      </div>
      <div className="report-filter-summary">
        <span>
          <CalendarDays size={16} />
          {dateLabel(report.start)} – {dateLabel(report.end)}
        </span>
        <span>
          <Tag size={16} />
          {report.category}
        </span>
        <span>USD · Completed revenue</span>
      </div>
      <ExportControls
        endpoint={`/api/reports/${encodeURIComponent(report.id)}/export`}
      />
      <Stats data={data} />
      {!data.length ? (
        <section className="panel">
          <EmptyState
            title="No data for this perspective"
            description="Choose a reporting period and category matching your saved transactions."
          />
        </section>
      ) : (
        <div className="charts-grid">
          <section className="panel">
            <PanelHeading
              title={
                report.type === 'Sales Summary'
                  ? 'Revenue over time'
                  : 'Category performance'
              }
              description="Calculated from your selected reporting period"
            />
            {report.type === 'Sales Summary' ? (
              <TrendChart data={data} />
            ) : (
              <div className="category-bars">
                {categoryTotals(data).map((c) => (
                  <div key={c.name}>
                    <div>
                      <strong>{c.name}</strong>
                      <span>{money(c.value)}</span>
                    </div>
                    <progress
                      aria-label={`${c.name} revenue`}
                      max={Math.max(
                        1,
                        ...categoryTotals(data).map((c) => c.value),
                      )}
                      value={c.value}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="panel">
            <PanelHeading
              title="Revenue mix"
              description="Contribution by business category"
            />
            <CategoryChart data={data} />
          </section>
        </div>
      )}
      <p className="data-footnote">
        Revenue and averages include completed transactions only. Reports are
        {mode === 'demo'
          ? 'based on fictional demo data.'
          : 'saved in your local PostgreSQL database.'}
      </p>
    </>
  );
}
