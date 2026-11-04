'use client';
import { useReports } from '@/components/report-provider';
import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCheck,
  ReceiptText,
  Plus,
  Files,
  ArrowRight,
} from 'lucide-react';
import {
  money,
  summarize,
  type Transaction,
  type Report,
  dateLabel,
  categoryTotals,
} from '@/lib/data';
export function PageHeading({
  eyebrow,
  title,
  description,
  action = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: boolean;
}) {
  const { mode } = useReports();
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
      </div>
      {action && (
        <Link href="/reports/new" className="button primary">
          <Plus size={17} />{' '}
          {mode === 'demo' ? 'Explore reports' : 'Create report'}
        </Link>
      )}
    </div>
  );
}
export function DemoNotice() {
  const { mode } = useReports();
  if (mode === 'demo')
    return (
      <div className="demo-notice">
        <span className="notice-dot" />
        <span>
          <strong>Public portfolio demo.</strong> Fictional data only. Browse,
          filter and export reports; changes are disabled.
        </span>
        <span className="sample-tag">READ ONLY</span>
      </div>
    );
  return (
    <div className="demo-notice">
      <span className="notice-dot" />
      <span>
        <strong>Local development workspace.</strong> Data is stored in
        PostgreSQL. Optional seed data is fictional. Reports are saved in your
        local database.
      </span>
      <span className="sample-tag">LOCAL DATABASE</span>
    </div>
  );
}
export function Stats({ data }: { data: Transaction[] }) {
  const s = summarize(data);
  return (
    <div className="stats-grid">
      {[
        {
          label: 'Total revenue',
          value: money(s.revenue),
          icon: Banknote,
          note: 'From completed transactions',
        },
        {
          label: 'Total transactions',
          value: s.total.toString(),
          icon: ReceiptText,
          note: 'Across all transaction statuses',
        },
        {
          label: 'Completed transactions',
          value: s.completed.toString(),
          icon: CheckCheck,
          note: `${s.total ? Math.round((s.completed / s.total) * 100) : 0}% completion rate`,
        },
        {
          label: 'Avg. transaction value',
          value: money(s.average),
          icon: ArrowDownLeft,
          note: 'Per completed transaction',
        },
      ].map(({ label, value, icon: Icon, note }) => (
        <div className="stat-card" key={label}>
          <div className="stat-top">
            <span>{label}</span>
            <Icon size={18} />
          </div>
          <strong>{value}</strong>
          <small>{note}</small>
        </div>
      ))}
    </div>
  );
}
export function CategoryChart({ data }: { data: Transaction[] }) {
  const items = categoryTotals(data);
  const total = items.reduce((a, b) => a + b.value, 0);
  const colors = ['#148c83', '#64ada6', '#92c8c1', '#d0e6e1'];
  let offset = 0;
  const stops = items
    .map((it, i) => {
      const start = offset;
      offset += total ? (it.value / total) * 100 : 0;
      return `${colors[i]} ${start}% ${offset}%`;
    })
    .join(',');
  return (
    <div className="category-content">
      <div
        className="donut"
        role="img"
        aria-label={`Revenue by category: ${items.map((i) => `${i.name} ${money(i.value)}`).join(', ')}`}
        style={{ background: total ? `conic-gradient(${stops})` : '#e9eeed' }}
      >
        <div>
          <small>Total revenue</small>
          <strong>{money(total)}</strong>
        </div>
      </div>
      <div className="chart-legend">
        {items.map((item, i) => (
          <div key={item.name}>
            <span className="legend-name">
              <i style={{ background: colors[i] }} />
              {item.name}
            </span>
            <strong>
              {total ? Math.round((item.value / total) * 100) : 0}%
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function TrendChart({ data }: { data: Transaction[] }) {
  const months = Array.from(
    new Set(data.map((t) => t.date.slice(0, 7))),
  ).sort();
  const values = months.map(
    (m) => summarize(data.filter((t) => t.date.startsWith(m))).revenue,
  );
  const max = Math.max(1, ...values);
  const step = 10 ** Math.floor(Math.log10(max));
  const ceiling = Math.ceil(max / step) * step;
  const points = values
    .map(
      (v, i) =>
        `${60 + (i / Math.max(1, values.length - 1)) * 620},${190 - (v / ceiling) * 160}`,
    )
    .join(' ');
  return (
    <div className="trend-chart">
      <svg
        viewBox="0 0 720 235"
        role="img"
        aria-label={`Monthly completed revenue. ${months.map((m, i) => `${m}: ${money(values[i])}`).join('. ')}`}
      >
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#15978b" stopOpacity=".17" />
            <stop offset="100%" stopColor="#15978b" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="60"
              x2="690"
              y1={30 + i * 40}
              y2={30 + i * 40}
              stroke="#e9eeef"
              strokeDasharray="4 5"
            />
            <text x="0" y={34 + i * 40} fill="#8a96a3" fontSize="11">
              {`$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format((ceiling * (4 - i)) / 4)}`}
            </text>
          </g>
        ))}
        {values.length > 0 && (
          <>
            <polygon
              points={`60,190 ${points} ${values.length === 1 ? 60 : 680},190`}
              fill="url(#fill)"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#168e84"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {values.map((v, i) => (
              <circle
                key={i}
                cx={60 + (i / Math.max(1, values.length - 1)) * 620}
                cy={190 - (v / ceiling) * 160}
                r="4"
                fill="white"
                stroke="#168e84"
                strokeWidth="2"
              >
                <title>{`${months[i]}: ${money(v)}`}</title>
              </circle>
            ))}
          </>
        )}
        {months.map((m, i) => (
          <text
            key={m}
            x={60 + (i / Math.max(1, months.length - 1)) * 620}
            y="222"
            textAnchor="middle"
            fill="#8a96a3"
            fontSize="11"
          >
            {new Date(m + '-01T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
            })}
          </text>
        ))}
      </svg>
      {!data.length && (
        <p className="empty-chart">No transactions in this period.</p>
      )}
    </div>
  );
}
export function ReportsTable({ reports }: { reports: Report[] }) {
  return reports.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Report name</th>
            <th>Type</th>
            <th>Created</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Open report</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>
                <Link className="report-name" href={`/reports/${r.id}`}>
                  <span className="file-icon">
                    <Files size={17} />
                  </span>
                  <span>
                    <strong>{r.title}</strong>
                    <small>
                      {dateLabel(r.start)} – {dateLabel(r.end)}
                    </small>
                  </span>
                </Link>
              </td>
              <td>{r.type}</td>
              <td>{dateLabel(r.created)}</td>
              <td>
                <span className="badge completed">
                  <i />
                  Ready
                </span>
              </td>
              <td>
                <Link
                  className="table-arrow"
                  href={`/reports/${r.id}`}
                  aria-label={`View ${r.title}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <EmptyState
      title="No matching reports"
      description="Try a different search or create a report for a fresh perspective."
    />
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <Files size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function PanelHeading({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link?: boolean;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {link && (
        <Link href="/reports" className="text-link">
          View all reports <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
