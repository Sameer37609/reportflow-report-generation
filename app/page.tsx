'use client';
import { useState } from 'react';
import { CalendarDays, ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useReports } from '@/components/report-provider';
import {
  PageHeading,
  DemoNotice,
  Stats,
  CategoryChart,
  TrendChart,
  ReportsTable,
  PanelHeading,
} from '@/components/ui';
import { filterTransactions } from '@/lib/data';
export default function Dashboard() {
  const { reports, transactions } = useReports();
  const [period, setPeriod] = useState('all');
  const data = filterTransactions(
    transactions,
    period === 'q3'
      ? '2026-07-01'
      : period === 'sep'
        ? '2026-09-01'
        : '0001-01-01',
    period === 'all' ? '9999-12-31' : '2026-09-30',
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR BUSINESS, AT A GLANCE"
        title="Clarity starts here."
        description="A fresh perspective on your sales, performance, and possibilities."
      />
      <DemoNotice />
      <div className="section-toolbar">
        <div>
          <h2>Business overview</h2>
          <span className="muted">Every number tells a story.</span>
        </div>
        <label className="period-control">
          <CalendarDays size={16} />
          <span className="sr-only">Dashboard reporting period</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">All time</option>
            <option value="q3">Q3 · Jul – Sep 2026</option>
            <option value="sep">September 2026</option>
          </select>
        </label>
      </div>
      <Stats data={data} />
      <div className="charts-grid">
        <section className="panel">
          <PanelHeading
            title="Revenue over time"
            description="A clearer view of your sales momentum"
          />
          <div className="chart-topline">
            <span className="chart-key">
              <i />
              Completed revenue
            </span>
            <span className="unit-label">USD</span>
          </div>
          <TrendChart data={data} />
        </section>
        <section className="panel">
          <PanelHeading
            title="Revenue by category"
            description="Where your business makes its impact"
          />
          <CategoryChart data={data} />
        </section>
      </div>
      <section className="insight-strip">
        <span className="insight-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <strong>Your next insight is one report away.</strong>
          <p>
            Turn the numbers into a focused view of what matters to your
            business.
          </p>
        </div>
        <Link href="/reports/new">
          Explore report builder <ArrowUpRight size={17} />
        </Link>
      </section>
      <section className="panel">
        <PanelHeading
          title="Recent reports"
          description="Your latest perspectives, all in one place"
          link
        />
        <ReportsTable reports={reports.slice(0, 3)} />
      </section>
      <p className="data-footnote">
        Revenue includes completed transactions only. Amounts shown in USD.
      </p>
    </>
  );
}
