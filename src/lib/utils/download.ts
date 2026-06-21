/**
 * Triggers a client-side JSON file download. The DOM and URL APIs are
 * injectable so the behaviour can be unit-tested without a real browser.
 */

interface UrlApi {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

export function downloadJson(
  filename: string,
  content: string,
  doc: Document = document,
  urlApi: UrlApi = URL,
): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = urlApi.createObjectURL(blob);
  const anchor = doc.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  doc.body.appendChild(anchor);
  anchor.click();
  doc.body.removeChild(anchor);
  urlApi.revokeObjectURL(url);
}
