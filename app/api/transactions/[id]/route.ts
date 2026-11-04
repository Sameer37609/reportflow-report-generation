import { listTransactions } from '@/lib/source';
import { database } from '@/lib/db';
import { failure, validate, writeGuard } from '@/lib/api';
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const data = (await listTransactions()).find((t) => t.id === id);
    return data
      ? Response.json({ data })
      : Response.json({ error: 'Record not found.' }, { status: 404 });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(request: Request, ctx: Context) {
  try {
    writeGuard(request);
    const { id } = await ctx.params;
    const data = validate(await request.json());
    return Response.json({
      data: await database().transaction.update({
        where: { id },
        data: data as Parameters<
          ReturnType<typeof database>['transaction']['update']
        >[0]['data'],
      }),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request, ctx: Context) {
  try {
    writeGuard(request);
    const { id } = await ctx.params;
    await database().transaction.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return failure(e);
  }
}
