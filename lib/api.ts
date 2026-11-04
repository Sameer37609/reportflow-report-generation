import { applicationMode } from './mode.ts';
import { Prisma } from '@prisma/client';
import { categories } from './data.ts';
export class InputError extends Error {}
export class OriginError extends Error {}
export function validate(body: unknown, report = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new InputError('Expected a JSON object.');
  const b = body as Record<string, unknown>;
  const text = (key: string, max = 100) => {
    const v = b[key];
    if (typeof v !== 'string' || !v.trim() || v.trim().length > max)
      throw new InputError(`Invalid ${key}.`);
    return v.trim();
  };
  const date = (key: string) => {
    const v = text(key, 10);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
      v.startsWith('0000-') ||
      !Number.isFinite(Date.parse(v)) ||
      new Date(v).toISOString().slice(0, 10) !== v
    )
      throw new InputError(`Invalid ${key}.`);
    return new Date(v + 'T00:00:00Z');
  };
  const category =
    b.category === null ||
    b.category === 'All categories' ||
    b.category === undefined
      ? null
      : text('category');
  if (category && !categories.includes(category as (typeof categories)[number]))
    throw new InputError('Invalid category.');
  if (report) {
    const startDate = date('start');
    const endDate = date('end');
    const reportType = text('type');
    if (startDate > endDate)
      throw new InputError('End date must follow start date.');
    if (!['Sales Summary', 'Category Performance'].includes(reportType))
      throw new InputError('Invalid report type.');
    return { title: text('title'), reportType, startDate, endDate, category };
  }
  if (typeof b.amount !== 'string' && typeof b.amount !== 'number')
    throw new InputError('Amount must be a decimal string or number.');
  const amount = String(b.amount);
  if (
    !/^\d{1,10}(\.\d{1,2})?$/.test(amount) ||
    new Prisma.Decimal(amount).lte(0)
  )
    throw new InputError(
      'Amount must be positive with at most two decimal places.',
    );
  const status = text('status');
  if (!['Completed', 'Pending', 'Refunded'].includes(status))
    throw new InputError('Invalid status.');
  if (!category) throw new InputError('Category is required.');
  return {
    transactionId: text('transactionId', 40),
    customer: text('customer'),
    category,
    amount: new Prisma.Decimal(amount),
    transactionDate: date('date'),
    status,
  };
}
export function failure(error: unknown) {
  if (error instanceof OriginError)
    return Response.json(
      { error: 'Cross-origin writes are not allowed.' },
      { status: 403 },
    );
  if (error instanceof SyntaxError)
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  if (error instanceof InputError)
    return Response.json({ error: error.message }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025')
      return Response.json({ error: 'Record not found.' }, { status: 404 });
    if (error.code === 'P2002')
      return Response.json(
        { error: 'Transaction ID already exists.' },
        { status: 409 },
      );
  }
  return Response.json(
    { error: 'Database unavailable. Please retry.' },
    { status: 503 },
  );
}
export function writeGuard(request: Request) {
  if (applicationMode() !== 'local') throw new OriginError();
  const origin = request.headers.get('origin');
  if (!origin) return; // CLI clients are supported; this is not authentication.
  try {
    const parsed = new URL(origin);
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.origin !== origin ||
      parsed.host !== request.headers.get('host')
    )
      throw new OriginError();
  } catch {
    throw new OriginError();
  }
}
