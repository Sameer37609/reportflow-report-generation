import { listReports } from '@/lib/source';
import { database } from '@/lib/db';
import { failure, validate, writeGuard } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return Response.json({ data: await listReports() });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    writeGuard(request);
    const data = validate(await request.json(), true);
    return Response.json(
      {
        data: await database().savedReport.create({
          data: data as Parameters<
            ReturnType<typeof database>['savedReport']['create']
          >[0]['data'],
        }),
      },
      { status: 201 },
    );
  } catch (e) {
    return failure(e);
  }
}
