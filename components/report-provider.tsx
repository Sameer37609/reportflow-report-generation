'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  Files,
  Database,
  ArrowUpRight,
  Menu,
  X,
  FlaskConical,
  ChevronRight,
} from 'lucide-react';
import { type Transaction, type Report } from '@/lib/data';
import { api, reportView, transactionView } from '@/lib/client-api';
const Context = createContext<{
  mode: 'local' | 'demo';
  reports: Report[];
  transactions: Transaction[];
  reload: () => Promise<void>;
  addReport: (report: Report) => Promise<void>;
}>({
  mode: 'demo',
  reports: [],
  transactions: [],
  reload: async () => {},
  addReport: async () => {},
});
export const useReports = () => useContext(Context);
export function ReportProvider({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: 'local' | 'demo';
}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function reload() {
    const [ts, rs] = await Promise.all([
      api('/api/transactions'),
      api('/api/reports'),
    ]);
    setTransactions(ts.map(transactionView));
    setReports(rs.map(reportView));
  }
  useEffect(() => {
    Promise.resolve()
      .then(reload)
      .catch(() => setError('Unable to load the workspace. Please retry.'))
      .finally(() => setLoading(false));
  }, []);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const links = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/reports', label: 'Reports', icon: Files },
    { href: '/data', label: 'Transactions', icon: Database },
  ];
  return (
    <Context.Provider
      value={{
        mode,
        reports,
        transactions,
        reload,
        addReport: async (r) => {
          if (mode === 'demo') throw new Error('Public demo is read-only.');
          const saved = await api('/api/reports', {
            method: 'POST',
            body: JSON.stringify(r),
          });
          setReports((p) => [reportView(saved), ...p]);
          r.id = saved.id;
        },
      }}
    >
      <div className="app-shell">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <aside className={`sidebar ${open ? 'is-open' : ''}`}>
          <Link className="brand" href="/" onClick={() => setOpen(false)}>
            <span className="brand-icon">
              <BarChart3 size={22} />
            </span>
            ReportFlow<span className="brand-dot">.</span>
          </Link>
          <button
            className="mobile-close icon-button"
            ref={closeButton}
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
          <div className="workspace">
            <span className="workspace-avatar">S</span>
            <div>
              <strong>Studio workspace</strong>
              <small>Portfolio demo</small>
            </div>
            <ChevronRight size={15} />
          </div>
          <p className="nav-label">WORKSPACE</p>
          <nav aria-label="Main navigation">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`nav-link ${(href === '/' ? path === '/' : path.startsWith(href)) ? 'active' : ''}`}
                aria-current={
                  (href === '/' ? path === '/' : path.startsWith(href))
                    ? 'page'
                    : undefined
                }
              >
                <Icon size={19} />
                {label}
                {label === 'Reports' && (
                  <span className="nav-count">{reports.length}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="sidebar-note">
            <span className="note-icon">
              <FlaskConical size={20} />
            </span>
            <strong>A little data. A lot of clarity.</strong>
            <p>Explore your numbers and turn insights into your next move.</p>
            <Link href="/reports/new">
              {mode === 'demo'
                ? 'Explore report filters'
                : 'Create your first report'}{' '}
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="profile">
            <span className="profile-avatar">JD</span>
            <div>
              <strong>Jamie Davis</strong>
              <small>Demo workspace</small>
            </div>
            <span className="online-dot" />
          </div>
        </aside>
        {open && (
          <button
            className="scrim"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
        )}
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                ref={menuButton}
                aria-expanded={open}
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
              >
                <Menu />
              </button>
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>
                {path === '/data'
                  ? 'Transactions'
                  : path.startsWith('/reports')
                    ? 'Reports'
                    : 'Overview'}
              </strong>
            </div>
            <div className="topbar-right">
              <span className="demo-pill">
                <span />{' '}
                {mode === 'demo' ? 'Read-only demo' : 'Local workspace'}
              </span>
              <span className="topbar-divider" />
              <span className="top-avatar">JD</span>
            </div>
          </header>
          <main id="main-content">
            {loading ? (
              <p role="status">Loading your workspace…</p>
            ) : error ? (
              <div role="alert">
                {error}{' '}
                <button
                  className="button secondary"
                  onClick={() => {
                    setLoading(true);
                    Promise.resolve()
                      .then(reload)
                      .then(() => setError(''))
                      .catch(() =>
                        setError('Workspace unavailable. Please retry.'),
                      )
                      .finally(() => setLoading(false));
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              children
            )}
          </main>
          <footer>
            ReportFlow <span>Thoughtful reports. Confident decisions.</span>
            <span>
              {mode === 'demo'
                ? 'Read-only demo · Fictional data'
                : 'Local development · PostgreSQL'}
            </span>
          </footer>
        </div>
      </div>
    </Context.Provider>
  );
}
