import { findReport, reportTransactions } from '@/lib/source';
import { totals } from '@/lib/analytics';
import { database } from '@/lib/db';
import { failure, writeGuard } from '@/lib/api';
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const report = await findReport(id);
    if (!report)
      return Response.json({ error: 'Report not found.' }, { status: 404 });
    const transactions = await reportTransactions(report);
    return Response.json({
      data: { report, transactions, metrics: totals(transactions) },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request, ctx: Context) {
  try {
    writeGuard(request);
    const { id } = await ctx.params;
    await database().savedReport.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return failure(e);
  }
}
