'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
export function ExportControls({
  endpoint,
  disabled = false,
}: {
  endpoint: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function download(format: string) {
    if (busy || disabled) return;
    setBusy(format);
    setError('');
    try {
      const response = await fetch(
        endpoint + (endpoint.includes('?') ? '&' : '?') + 'format=' + format,
        { cache: 'no-store' },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Export failed.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        response.headers
          .get('Content-Disposition')
          ?.match(/filename="([^"]+)"/)?.[1] || `report.${format}`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to download.');
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="export-controls">
      <div className="export-buttons" role="group" aria-label="Download report">
        {['csv', 'json'].map((format) => (
          <button
            className="button secondary"
            key={format}
            disabled={!!busy || disabled}
            onClick={() => download(format)}
          >
            <Download size={15} />
            {busy === format
              ? 'Preparing…'
              : `Download ${format.toUpperCase()}`}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="export-error">
          {error}
        </p>
      )}
      <span className="sr-only" role="status">
        {busy ? 'Preparing download…' : ''}
      </span>
    </div>
  );
}
