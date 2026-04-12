import type { DifyUploadedFileRef } from "@/lib/dify/types";

export type AppMode = "chat" | "completion" | "workflow";

export function resolveAppMode(): AppMode {
  const raw = process.env.DIFY_APP_MODE?.trim().toLowerCase();
  if (raw === "completion") return "completion";
  if (raw === "workflow") return "workflow";
  return "chat";
}

/**
 * streaming หรือ blocking
 * - ตั้ง DIFY_RESPONSE_MODE=blocking | streaming ได้ชัดเจน
 * - บน **Bun** + **workflow** ถ้าไม่ได้ตั้ง env จะใช้ **blocking** อัตโนมัติ (ลด socket ตัดระหว่างอ่าน SSE)
 */
export function resolveResponseMode(forAppMode: AppMode): "streaming" | "blocking" {
  const explicit = process.env.DIFY_RESPONSE_MODE?.trim().toLowerCase();
  if (explicit === "blocking") return "blocking";
  if (explicit === "streaming") return "streaming";

  const isBun =
    typeof process !== "undefined" &&
    process.versions != null &&
    "bun" in process.versions;
  if (isBun && forAppMode === "workflow") {
    return "blocking";
  }
  return "streaming";
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * ใส่ค่า [] ให้คีย์ที่ระบุ — ใช้เมื่อ workflow ยังมีฟิลด์ไฟล์บังคับแต่แอปใช้ RAG ไม่ส่งไฟล์จาก API
 * ตัวอย่าง .env: DIFY_WORKFLOW_EMPTY_FILE_INPUT_KEYS=upload_file,userinput.files
 */
function mergeEmptyFileListInputs(inputs: Record<string, unknown>): void {
  const raw = process.env.DIFY_WORKFLOW_EMPTY_FILE_INPUT_KEYS?.trim();
  if (!raw) return;
  for (const key of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (!(key in inputs)) {
      inputs[key] = [];
    }
  }
}

export class DifyClient {
  constructor(
    private apiKey: string,
    baseUrl: string,
  ) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  private baseUrl: string;

  /**
   * ส่งข้อความเข้า workflow/chat — ถ้ามี workflowFiles จะ merge เข้า inputs ตาม DIFY_WORKFLOW_FILE_INPUT_KEY (ส่ง PDF ไป Dify แทนการยัดใน prompt)
   */
  async execute(
    prompt: string,
    modeOverride?: AppMode,
    workflowFiles?: DifyUploadedFileRef[],
  ) {
    const mode = modeOverride ?? resolveAppMode();
    const promptKey = process.env.DIFY_PROMPT_INPUT_KEY?.trim() || "query";

    let inputs: Record<string, unknown> = {};
    const inputsRaw = process.env.DIFY_INPUTS_JSON?.trim();
    if (inputsRaw) {
      try {
        inputs = JSON.parse(inputsRaw) as Record<string, unknown>;
      } catch {
        /* ignore invalid JSON */
      }
    }
    inputs = { ...inputs, [promptKey]: prompt };

    const fileInputKey = process.env.DIFY_WORKFLOW_FILE_INPUT_KEY?.trim() || "upload_file";
    if (workflowFiles && workflowFiles.length > 0 && mode === "workflow") {
      const existing = inputs[fileInputKey];
      const list: unknown[] = Array.isArray(existing) ? [...existing] : [];
      list.push(...workflowFiles);
      inputs[fileInputKey] = list;
    }

    mergeEmptyFileListInputs(inputs);

    const path =
      mode === "workflow"
        ? "/workflows/run"
        : mode === "completion"
          ? "/completion-messages"
          : "/chat-messages";

    const user = process.env.DIFY_USER?.trim() || "ku-prompt-learn";

    const responseMode =
      mode === "workflow" ? resolveResponseMode(mode) : "streaming";

    const payload: Record<string, unknown> = {
      inputs,
      response_mode: responseMode,
      user,
    };

    const sendQuery =
      mode === "workflow"
        ? false
        : process.env.DIFY_PROMPT_INPUT_KEY?.trim()
          ? process.env.DIFY_SEND_QUERY === "1"
          : process.env.DIFY_SEND_QUERY !== "0";
    if (sendQuery) {
      payload.query = prompt;
    }

    return fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
}
