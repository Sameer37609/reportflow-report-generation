import { PrismaClient } from '@prisma/client';
import { transactions, initialReports } from '../lib/data.ts';
import { requireLocalWrites } from '../lib/mode.ts';
requireLocalWrites();
const url = new URL(process.env.DATABASE_URL || 'http://missing');
if (
  !['localhost', '127.0.0.1'].includes(url.hostname) ||
  url.pathname != '/reportflow_dev'
)
  throw Error('Only local reportflow_dev may be seeded.');
const db = new PrismaClient();
try {
  await db.$transaction(async (tx) => {
    if ((await tx.transaction.count()) || (await tx.savedReport.count()))
      throw Error('Seed requires empty tables; no records were changed.');
    for (const t of transactions)
      await tx.transaction.create({
        data: {
          transactionId: t.id,
          customer: t.customer,
          category: t.category,
          amount: t.amount.toFixed(2),
          transactionDate: new Date(t.date + 'T00:00:00Z'),
          status: t.status,
        },
      });
    for (const r of initialReports)
      await tx.savedReport.create({
        data: {
          title: r.title,
          reportType: r.type,
          startDate: new Date(r.start + 'T00:00:00Z'),
          endDate: new Date(r.end + 'T00:00:00Z'),
          category: r.category === 'All categories' ? null : r.category,
        },
      });
  });
  console.log(
    'Seeded 48 clearly fictional transactions and 3 sample report definitions.',
  );
} catch {
  console.error(
    'Seed failed: check connection and ensure both tables are empty.',
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
