import { failure } from '@/lib/api';
import { previewDefinition } from '@/lib/report-export';
import { applicationMode } from '@/lib/mode';
import { reportTransactions } from '@/lib/source';
import { totals } from '@/lib/analytics';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    applicationMode();
    const report = previewDefinition(request);
    const transactions = await reportTransactions(report);
    return Response.json({
      data: { report, transactions, metrics: totals(transactions) },
    });
  } catch (e) {
    return failure(e);
  }
}
