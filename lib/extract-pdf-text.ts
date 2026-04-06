/**
 * ดึงข้อความจาก PDF ในฝั่งเบราว์เซอร์ (ไม่รวม OCR — PDF สแกนอาจได้ข้อความว่าง)
 */
export async function extractTextFromPdfFile(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    pageTexts.push(line);
  }

  return pageTexts.join("\n\n").trim();
}
