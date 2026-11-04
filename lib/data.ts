export const categories = [
  'Software',
  'Consulting',
  'Design',
  'Marketing',
] as const;
export type Category = (typeof categories)[number];
export type Transaction = {
  id: string;
  transactionId?: string;
  customer: string;
  category: Category;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Refunded';
};
const customers = [
  'Linear Studio',
  'Acme Corporation',
  'Orbit Labs',
  'Northstar Co.',
  'Vercel Creative',
  'Bloom & Co.',
  'Craftwork',
  'Layers Studio',
];
export const transactions: Transaction[] = Array.from(
  { length: 48 },
  (_, i) => ({
    id: `TX-${String(1001 + i)}`,
    customer: customers[i % 8],
    category: categories[(i + Math.floor(i / 8)) % 4],
    amount: 350 + ((i * 137) % 2200),
    date: `2026-${String(4 + Math.floor(i / 8)).padStart(2, '0')}-${String(3 + (i % 8) * 3).padStart(2, '0')}`,
    status: i % 11 === 0 ? 'Refunded' : i % 7 === 0 ? 'Pending' : 'Completed',
  }),
);
export type Report = {
  id: string;
  title: string;
  type: 'Sales Summary' | 'Category Performance';
  created: string;
  start: string;
  end: string;
  category: string;
  status: 'Ready';
};
export const initialReports: Report[] = [
  {
    id: 'r1',
    title: 'Q3 sales overview',
    type: 'Sales Summary',
    created: '2026-10-01',
    start: '2026-07-01',
    end: '2026-09-30',
    category: 'All categories',
    status: 'Ready',
  },
  {
    id: 'r2',
    title: 'September category insights',
    type: 'Category Performance',
    created: '2026-10-01',
    start: '2026-09-01',
    end: '2026-09-30',
    category: 'All categories',
    status: 'Ready',
  },
  {
    id: 'r3',
    title: 'Software revenue snapshot',
    type: 'Sales Summary',
    created: '2026-09-15',
    start: '2026-04-01',
    end: '2026-09-30',
    category: 'Software',
    status: 'Ready',
  },
];
export function filterTransactions(
  data: Transaction[],
  start: string,
  end: string,
  category = 'All categories',
) {
  return data.filter(
    (t) =>
      t.date >= start &&
      t.date <= end &&
      (category === 'All categories' || t.category === category),
  );
}
export function summarize(data: Transaction[]) {
  const completed = data.filter((t) => t.status === 'Completed');
  const revenue = completed.reduce(
    (sum, t) => sum + Math.round(t.amount * 100),
    0,
  );
  return {
    revenue: revenue / 100,
    total: data.length,
    completed: completed.length,
    average: completed.length ? revenue / 100 / completed.length : 0,
  };
}
export function categoryTotals(data: Transaction[]) {
  return categories.map((name) => ({
    name,
    value: summarize(data.filter((t) => t.category === name)).revenue,
  }));
}
export const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
export const dateLabel = (date: string) =>
  new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
