/**
 * Export utility functions for CSV and JSON downloads.
 * Uses native browser APIs — no external dependencies required.
 */

type ExportRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Convert an array of objects to a CSV string.
 * Handles values that contain commas, quotes, or newlines.
 */
export function toCSV(rows: ExportRow[], columns?: string[]): string {
  if (rows.length === 0) return '';

  const headers = columns ?? Object.keys(rows[0]);

  const escape = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Wrap in quotes if the value contains a comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escape).join(',');
  const dataRows = rows.map((row) => headers.map((h) => escape(row[h])).join(','));

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Trigger a file download in the browser.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download data as a CSV file.
 */
export function downloadCSV(rows: ExportRow[], filename: string, columns?: string[]): void {
  const csv = toCSV(rows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Download data as a JSON file.
 */
export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

/**
 * Format a date string for use in export filenames.
 */
export function exportTimestamp(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
