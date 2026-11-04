import type { Transaction, Report } from './data.ts';
export async function api(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    cache: 'no-store',
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (response.status === 204) return null;
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Request failed.');
  return json.data;
}
export const transactionView = (t: Record<string, unknown>): Transaction => ({
  id: String(t.id),
  transactionId: String(t.transactionId),
  customer: String(t.customer),
  category: t.category as Transaction['category'],
  amount: Number(t.amount),
  date: String(t.transactionDate).slice(0, 10),
  status: t.status as Transaction['status'],
});
export const reportView = (r: Record<string, unknown>): Report => ({
  id: String(r.id),
  title: String(r.title),
  type: r.reportType as Report['type'],
  created: String(r.createdAt).slice(0, 10),
  start: String(r.startDate).slice(0, 10),
  end: String(r.endDate).slice(0, 10),
  category: String(r.category || 'All categories'),
  status: 'Ready',
});
