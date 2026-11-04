import { applicationMode } from './mode.ts';
import { PrismaClient } from '@prisma/client';
const globalDb = globalThis as unknown as { db?: PrismaClient };
export function assertLocalDatabase() {
  const url = new URL(process.env.DATABASE_URL || 'http://missing');
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.pathname !== '/reportflow_dev'
  )
    throw new Error('Only local reportflow_dev is allowed.');
}
export function database() {
  if (applicationMode() !== 'local')
    throw new Error('Database access is disabled in demo mode.');
  assertLocalDatabase();
  return globalDb.db ?? (globalDb.db = new PrismaClient());
}
