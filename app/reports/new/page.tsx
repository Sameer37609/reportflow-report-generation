'use client';
import { ExportControls } from '@/components/export-controls';
import { Stats, TrendChart, CategoryChart } from '@/components/ui';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  FileBarChart,
  ChartPie,
  Info,
  Check,
} from 'lucide-react';
import { useReports } from '@/components/report-provider';
import { PageHeading } from '@/components/ui';
import {
  categories,
  filterTransactions,
  summarize,
  money,
  type Report,
} from '@/lib/data';
export default function CreateReport() {
  const router = useRouter();
  const { addReport, transactions, mode } = useReports();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Report['type']>('Sales Summary');
  const [start, setStart] = useState('2026-04-01');
  const [end, setEnd] = useState('2026-09-30');
  const [category, setCategory] = useState('All categories');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const data = filterTransactions(transactions, start, end, category);
  const summary = summarize(data);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || mode === 'demo') return;
    if (!title.trim()) {
      setError('Enter a report title.');
      return;
    }
    if (!start || !end || start > end) {
      setError(
        'Choose a valid date range. The end date must be on or after the start date.',
      );
      return;
    }
    const id = crypto.randomUUID();
    setSaving(true);
    try {
      const report = {
        id,
        title: title.trim(),
        type,
        start,
        end,
        category,
        created: new Date().toLocaleDateString('en-CA'),
        status: 'Ready' as const,
      };
      await addReport(report);
      router.push(`/reports/${report.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save report.');
    } finally {
      setSaving(false);
    }
  }
  const query = new URLSearchParams({
    title: title.trim() || 'Custom report',
    type,
    start,
    end,
    category,
  }).toString();
  const validRange = !!start && !!end && start <= end;
  return (
    <>
      <Link className="back-link" href="/reports">
        <ArrowLeft size={16} />
        Back to reports
      </Link>
      <PageHeading
        eyebrow="MAKE SPACE FOR YOUR NEXT INSIGHT"
        title="Build a better perspective."
        description="Choose what matters. We’ll bring the numbers together."
        action={false}
      />
      <div className="builder-grid">
        <form className="panel report-form" onSubmit={submit}>
          {mode === 'demo' && (
            <p className="demo-notice">
              Explore a live report below. Filters do not save or change data.
            </p>
          )}
          <div className="form-section">
            <div className="step-title">
              <span>01</span>
              <h2>The essentials</h2>
            </div>
            <label htmlFor="title">
              Report title <span className="required">*</span>
            </label>
            <input
              id="title"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 sales performance"
              required
            />
            <p className="field-help">
              Give your report a name that’s easy to find later.
            </p>
            <fieldset>
              <legend>Report type</legend>
              <div className="report-type-grid">
                {(['Sales Summary', 'Category Performance'] as const).map(
                  (t, i) => (
                    <label
                      className={`type-option ${type === t ? 'selected' : ''}`}
                      key={t}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={type === t}
                        onChange={() => setType(t)}
                      />
                      {i === 0 ? (
                        <FileBarChart size={23} />
                      ) : (
                        <ChartPie size={23} />
                      )}
                      <strong>{t}</strong>
                      <small>
                        {i === 0
                          ? 'The big picture of your sales.'
                          : 'See how each category contributes.'}
                      </small>
                    </label>
                  ),
                )}
              </div>
            </fieldset>
          </div>
          <div className="form-section">
            <div className="step-title">
              <span>02</span>
              <h2>Focus your report</h2>
            </div>
            <div className="date-fields">
              <div>
                <label htmlFor="start">Start date</label>
                <input
                  id="start"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="end">End date</label>
                <input
                  id="end"
                  type="date"
                  value={end}
                  min={start}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </div>
            </div>
            <label htmlFor="category">
              Category <span className="optional">optional</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <p className="field-help">
              Choose dates matching your transactions.
            </p>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Link href="/reports" className="button secondary">
              Cancel
            </Link>
            {mode === 'local' && (
              <button
                className="button primary"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Create report'} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </form>
        <aside className="builder-aside">
          <span className="preview-tag">LIVE SNAPSHOT</span>
          <h2>Your report is taking shape.</h2>
          <p>A quick look at the data included in your selected filters.</p>
          <div className="snapshot-number">
            <small>Completed revenue</small>
            <strong>{money(summary.revenue)}</strong>
          </div>
          <div className="snapshot-row">
            <span>Transactions</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="snapshot-row">
            <span>Completed</span>
            <strong>{summary.completed}</strong>
          </div>
          <div className="snapshot-row">
            <span>Category</span>
            <strong>{category}</strong>
          </div>
          {!data.length && (
            <p className="empty-hint">
              No transactions match this range. Your report will show an empty
              state.
            </p>
          )}
          <div className="builder-note">
            <Info size={18} />
            <p>
              {mode === 'demo'
                ? 'Live preview only. No report is saved in this public demo.'
                : 'Your report is saved locally and stays available when you refresh the page.'}
            </p>
          </div>
          <span className="ready-note">
            <Check size={15} />
            No setup. Just insights.
          </span>
        </aside>
      </div>
      {mode === 'demo' && (
        <section className="live-report-preview">
          <div className="panel-heading">
            <h2>Live report preview</h2>
            <ExportControls
              endpoint={'/api/reports/preview/export?' + query}
              disabled={!validRange}
            />
          </div>
          {validRange ? (
            <>
              <Stats data={data} />
              <div className="charts-grid">
                <section className="panel">
                  {type === 'Sales Summary' ? (
                    <TrendChart data={data} />
                  ) : (
                    <CategoryChart data={data} />
                  )}
                </section>
              </div>
            </>
          ) : (
            <p role="alert">Select a valid date range to preview and export.</p>
          )}
        </section>
      )}
    </>
  );
}
