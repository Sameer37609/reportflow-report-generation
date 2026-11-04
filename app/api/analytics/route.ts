import { listTransactions } from '@/lib/source';
import { failure } from '@/lib/api';
import { totals } from '@/lib/analytics';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const rows = await listTransactions();
    return Response.json({ data: totals(rows) });
  } catch (e) {
    return failure(e);
  }
}
