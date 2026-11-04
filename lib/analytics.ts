import { Prisma } from '@prisma/client';
export function totals(
  rows: { amount: Prisma.Decimal | string; status: string }[],
) {
  const completed = rows.filter((r) => r.status === 'Completed');
  const revenue = completed.reduce(
    (sum, r) => sum.plus(r.amount),
    new Prisma.Decimal(0),
  );
  return {
    revenue: revenue.toFixed(2),
    total: rows.length,
    completed: completed.length,
    average: completed.length
      ? revenue.div(completed.length).toFixed(2)
      : '0.00',
  };
}
