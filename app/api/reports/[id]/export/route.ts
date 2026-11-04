import { failure } from '@/lib/api';
import { exportResponse } from '@/lib/report-export';
export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    return await exportResponse(request, (await ctx.params).id);
  } catch (e) {
    return failure(e);
  }
}
