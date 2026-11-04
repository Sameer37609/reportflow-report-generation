'use client';
import { TransactionEditor } from '@/components/transaction-editor';
import { useReports } from '@/components/report-provider';
import { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { PageHeading, DemoNotice, EmptyState } from '@/components/ui';
import { categories, money, dateLabel } from '@/lib/data';
export default function Data() {
  const { transactions, reload, mode } = useReports();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('All statuses');
  const rows = transactions
    .filter(
      (t) =>
        `${t.transactionId} ${t.customer}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (category === 'All categories' || t.category === category) &&
        (status === 'All statuses' || t.status === status),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeading
        eyebrow="THE NUMBERS BEHIND THE STORY"
        title="Every transaction. In view."
        description="Manage the transactions that power your workspace."
      />
      <DemoNotice />
      {mode === 'local' && (
        <TransactionEditor transactions={transactions} onSaved={reload} />
      )}
      <section className="panel">
        <div className="filter-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Search transactions"
              placeholder="Search customer or transaction…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Filter status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>All statuses</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Refunded</option>
          </select>
          <button
            className="button secondary compact"
            onClick={() => {
              setSearch('');
              setCategory('All categories');
              setStatus('All statuses');
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="transaction-id">{t.transactionId}</td>
                    <td>
                      <strong>{t.customer}</strong>
                    </td>
                    <td>{t.category}</td>
                    <td className="amount">{money(t.amount)}</td>
                    <td>{dateLabel(t.date)}</td>
                    <td>
                      <span className={`badge ${t.status.toLowerCase()}`}>
                        <i />
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No transactions found"
            description="Adjust your search or reset the filters to see the sample data."
          />
        )}
        <div className="table-footer" aria-live="polite">
          Showing {rows.length} of {transactions.length} transactions{' '}
          <span>Local database · USD</span>
        </div>
      </section>
    </>
  );
}
