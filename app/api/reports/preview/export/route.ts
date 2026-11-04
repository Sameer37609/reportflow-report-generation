import { failure } from '@/lib/api';
import { exportResponse } from '@/lib/report-export';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    return await exportResponse(request);
  } catch (e) {
    return failure(e);
  }
}
