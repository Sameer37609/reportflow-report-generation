import { validate, InputError } from './api.ts';
import { findReport, reportTransactions, type ReportRow } from './source.ts';
import { applicationMode } from './mode.ts';
import { reportDocument, reportCsv, exportFilename } from './exports.ts';
export function previewDefinition(request: Request): ReportRow {
  const query = new URL(request.url).searchParams;
  for (const key of query.keys())
    if (
      !['title', 'type', 'start', 'end', 'category', 'format'].includes(key) ||
      query.getAll(key).length !== 1
    )
      throw new InputError('Invalid report query.');
  const parsed = validate(
    {
      title: query.get('title') || 'Custom report',
      type: query.get('type'),
      start: query.get('start'),
      end: query.get('end'),
      category: query.get('category') || null,
    },
    true,
  ) as {
    title: string;
    reportType: string;
    startDate: Date;
    endDate: Date;
    category: string | null;
  };
  return {
    ...parsed,
    id: 'preview',
    startDate: parsed.startDate.toISOString(),
    endDate: parsed.endDate.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
export async function exportResponse(request: Request, id?: string) {
  applicationMode();
  const query = new URL(request.url).searchParams;
  const format = query.get('format');
  if (
    !['csv', 'json'].includes(format || '') ||
    query.getAll('format').length !== 1
  )
    throw new InputError('Choose csv or json format.');
  if (id && [...query.keys()].some((k) => k !== 'format'))
    throw new InputError('Saved exports use the saved report filters.');
  const report = id ? await findReport(id) : previewDefinition(request);
  if (!report)
    return Response.json({ error: 'Report not found.' }, { status: 404 });
  const document = reportDocument(
    report,
    await reportTransactions(report),
    applicationMode(),
  );
  return new Response(
    format === 'csv' ? reportCsv(document) : JSON.stringify(document, null, 2),
    {
      headers: {
        'Content-Type':
          format === 'csv'
            ? 'text/csv; charset=utf-8'
            : 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exportFilename(report, format!)}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
