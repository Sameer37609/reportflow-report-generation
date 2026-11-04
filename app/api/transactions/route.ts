import { listTransactions } from '@/lib/source';
import { database } from '@/lib/db';
import { failure, validate, writeGuard } from '@/lib/api';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return Response.json({ data: await listTransactions() });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    writeGuard(request);
    const data = validate(await request.json());
    return Response.json(
      {
        data: await database().transaction.create({
          data: data as Parameters<
            ReturnType<typeof database>['transaction']['create']
          >[0]['data'],
        }),
      },
      { status: 201 },
    );
  } catch (e) {
    return failure(e);
  }
}
