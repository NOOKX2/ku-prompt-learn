function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** ค่า `data` ตาม API create-by-file — ต้องมี indexing_technique + process_rule */
const DEFAULT_CREATE_BY_FILE_DATA = {
  indexing_technique: "high_quality" as const,
  process_rule: { mode: "automatic" as const },
  doc_form: "text_model" as const,
};

export type KnowledgeDocumentResult = {
  documentId: string;
  batch: string;
};

/**
 * เพิ่มเอกสารเข้า Knowledge base ผ่าน `POST /datasets/{dataset_id}/document/create-by-file`
 * ใช้ **Knowledge API key** (รูปแบบ `dataset-...`) ไม่ใช่ App key ของ workflow/chat
 */
function resolveCreateByFileDataJson(dataJsonOverride?: string): string {
  const full = process.env.DIFY_KNOWLEDGE_CREATE_DATA_JSON?.trim();
  if (full) return full;
  if (dataJsonOverride?.trim()) return dataJsonOverride.trim();
  return JSON.stringify({
    ...DEFAULT_CREATE_BY_FILE_DATA,
    ...(process.env.DIFY_KNOWLEDGE_DOC_LANGUAGE?.trim()
      ? { doc_language: process.env.DIFY_KNOWLEDGE_DOC_LANGUAGE.trim() }
      : {}),
  });
}

export async function createKnowledgeDocumentFromFile(args: {
  datasetApiKey: string;
  baseUrl: string;
  datasetId: string;
  blob: Blob;
  filename: string;
  /** JSON string สำหรับฟิลด์ `data` — ถ้าไม่ส่งจะใช้ค่าเริ่มต้น (หรือ `DIFY_KNOWLEDGE_CREATE_DATA_JSON`) */
  dataJsonOverride?: string;
}): Promise<KnowledgeDocumentResult> {
  const { datasetApiKey, baseUrl, datasetId, blob, filename, dataJsonOverride } =
    args;
  const root = normalizeBaseUrl(baseUrl);

  const dataStr = resolveCreateByFileDataJson(dataJsonOverride);

  const form = new FormData();
  form.append("file", blob, filename);
  form.append("data", dataStr);

  const res = await fetch(
    `${root}/datasets/${encodeURIComponent(datasetId)}/document/create-by-file`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${datasetApiKey}` },
      body: form,
    },
  );

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(
      `เพิ่มเอกสารเข้า Knowledge ไม่สำเร็จ (${res.status}): ${raw.slice(0, 600)}`,
    );
  }

  let parsed: { document?: { id?: string }; batch?: string };
  try {
    parsed = JSON.parse(raw) as { document?: { id?: string }; batch?: string };
  } catch {
    throw new Error("Knowledge API ตอบกลับที่ไม่ใช่ JSON");
  }

  const documentId = parsed.document?.id;
  const batch = parsed.batch;
  if (!documentId || typeof documentId !== "string") {
    throw new Error("Knowledge API ตอบกลับไม่มี document.id");
  }
  if (!batch || typeof batch !== "string") {
    throw new Error("Knowledge API ตอบกลับไม่มี batch");
  }

  return { documentId, batch };
}
