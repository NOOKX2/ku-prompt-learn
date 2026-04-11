/**
 * ดึงข้อความจาก PDF ในเบราว์เซอร์ (pdf.js) — ใช้จาก client เท่านั้น
 * PDF สแกนเป็นภาพอาจได้ข้อความว่าง
 */

export type ExtractPdfTextResult = {
  text: string;
  truncated: boolean;
  pageCount: number;
};

let workerSrcConfigured = false;

function configureWorker(pdfjs: typeof import("pdfjs-dist")) {
  if (workerSrcConfigured) return;
  const v = pdfjs.version;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${v}/build/pdf.worker.min.mjs`;
  workerSrcConfigured = true;
}

function normalizePdfWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

export async function extractPdfTextFromArrayBuffer(
  buffer: ArrayBuffer,
  options: { maxChars: number },
): Promise<ExtractPdfTextResult> {
  if (typeof window === "undefined") {
    throw new Error("extractPdfTextFromArrayBuffer ใช้ได้เฉพาะในเบราว์เซอร์");
  }

  const pdfjs = await import("pdfjs-dist");
  configureWorker(pdfjs);

  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const parts: string[] = [];
  let total = 0;
  let truncated = false;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    if (total >= options.maxChars) {
      truncated = true;
      break;
    }
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const line = textContent.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ");
    const normalized = normalizePdfWhitespace(line);
    const header = `--- หน้า ${pageNum} ---`;
    const budget = options.maxChars - total - header.length - 2;
    if (budget <= 0) {
      truncated = true;
      break;
    }
    let body = normalized;
    if (body.length > budget) {
      body = `${body.slice(0, budget)}…`;
      truncated = true;
    }
    const block = body ? `${header}\n${body}` : header;
    parts.push(block);
    total += block.length + 2;
    if (truncated) break;
  }

  const cleanup = pdf.destroy as (() => void | Promise<void>) | undefined;
  if (typeof cleanup === "function") {
    await Promise.resolve(cleanup.call(pdf));
  }

  return {
    text: parts.join("\n\n").trim(),
    truncated,
    pageCount,
  };
}
