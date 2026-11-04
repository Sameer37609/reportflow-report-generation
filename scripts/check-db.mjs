import { PrismaClient } from '@prisma/client';
if (process.env.REPORTFLOW_MODE !== 'local' || process.env.VERCEL)
  throw Error('Database checks require explicit local mode.');
const url = new URL(process.env.DATABASE_URL);
if (
  !['localhost', '127.0.0.1'].includes(url.hostname) ||
  url.pathname != '/reportflow_dev'
)
  throw Error('Local development database required.');
const db = new PrismaClient();
try {
  await db.$queryRaw`SELECT 1`;
  console.log('PASS: authenticated local database connection.');
  console.log(
    'Transactions:',
    await db.transaction.count(),
    'Saved reports:',
    await db.savedReport.count(),
  );
} catch {
  console.log('FAIL: database connection.');
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
