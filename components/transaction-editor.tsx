'use client';
import { useState } from 'react';
import { categories, type Transaction } from '@/lib/data';
import { api } from '@/lib/client-api';
export function TransactionEditor({
  transactions,
  onSaved,
}: {
  transactions: Transaction[];
  onSaved: () => Promise<void>;
}) {
  const [selected, setSelected] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const initial = {
    transactionId: '',
    customer: '',
    category: 'Software',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'Completed',
  };
  const [form, setForm] = useState(initial);
  function edit(id: string) {
    setSelected(id);
    const t = transactions.find((t) => t.id === id);
    setForm(
      t
        ? {
            transactionId: t.transactionId || '',
            customer: t.customer,
            category: t.category,
            amount: String(t.amount),
            date: t.date,
            status: t.status,
          }
        : initial,
    );
    setShow(true);
    setMessage('');
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api('/api/transactions' + (selected ? '/' + selected : ''), {
        method: selected ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      await onSaved();
      setShow(false);
      setMessage('Transaction saved.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!selected || !confirm('Delete this transaction permanently?')) return;
    setBusy(true);
    try {
      await api('/api/transactions/' + selected, { method: 'DELETE' });
      await onSaved();
      setShow(false);
      setMessage('Transaction deleted.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel" style={{ marginBottom: 20 }}>
      <div className="filter-toolbar">
        <button
          className="button primary"
          disabled={busy}
          onClick={() => edit('')}
        >
          Add transaction
        </button>
        <select
          aria-label="Choose transaction to edit"
          value={selected}
          onChange={(e) => edit(e.target.value)}
        >
          <option value="">Edit a transaction…</option>
          {transactions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.transactionId} · {t.customer}
            </option>
          ))}
        </select>
      </div>
      {message && (
        <p role="status" style={{ padding: '0 24px 20px' }}>
          {message}
        </p>
      )}
      {show && (
        <form className="report-form" onSubmit={save}>
          <div className="form-section">
            <h2>{selected ? 'Edit transaction' : 'New transaction'}</h2>
            <div className="date-fields" style={{ marginTop: 20 }}>
              {(['transactionId', 'customer', 'amount', 'date'] as const).map(
                (key) => (
                  <div key={key}>
                    <label htmlFor={'tx-' + key}>
                      {
                        {
                          transactionId: 'Transaction ID',
                          customer: 'Customer',
                          amount: 'Amount (USD)',
                          date: 'Transaction date',
                        }[key]
                      }
                    </label>
                    <input
                      id={'tx-' + key}
                      required
                      maxLength={key === 'customer' ? 100 : 40}
                      type={
                        key === 'date'
                          ? 'date'
                          : key === 'amount'
                            ? 'number'
                            : 'text'
                      }
                      min={key === 'amount' ? '0.01' : undefined}
                      step={key === 'amount' ? '0.01' : undefined}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  </div>
                ),
              )}
            </div>
            {(['category', 'status'] as const).map((key) => (
              <div key={key}>
                <label htmlFor={'tx-' + key}>
                  {key === 'category' ? 'Category' : 'Status'}
                </label>
                <select
                  id={'tx-' + key}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                >
                  {(key === 'category'
                    ? categories
                    : ['Completed', 'Pending', 'Refunded']
                  ).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="form-actions">
            {selected && (
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={remove}
              >
                Delete transaction
              </button>
            )}
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setShow(false)}
            >
              Cancel
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save transaction'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
