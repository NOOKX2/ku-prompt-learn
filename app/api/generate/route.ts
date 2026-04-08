import {
  difyChatFileType,
  type DifyUploadedFileRef,
} from "@/lib/dify-files";
import {
  difySseToTextStream,
  difySseToTextStreamWorkflow,
} from "@/lib/dify-chat-stream";
import { parseDifyErrorBody } from "@/lib/dify-errors";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_UPLOAD_FILES = 20;
const MAX_BYTES_PER_FILE = 15 * 1024 * 1024;

/** ต้องให้ตรงกับประเภทแอปใน Dify */
type DifyAppMode = "chat" | "completion" | "workflow";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveAppMode(): DifyAppMode {
  const raw = process.env.DIFY_APP_MODE?.trim().toLowerCase();
  if (raw === "completion") return "completion";
  if (raw === "workflow") return "workflow";
  return "chat";
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function uploadBlobToDify(
  baseUrl: string,
  apiKey: string,
  user: string,
  blob: Blob,
  filename: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("user", user);

  const res = await fetch(`${baseUrl}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    const parsed = parseDifyErrorBody(text);
    throw new Error(parsed.message || `อัปโหลดไฟล์ไม่สำเร็จ (${res.status})`);
  }

  let id: string | undefined;
  try {
    const j = JSON.parse(text) as { id?: string; data?: { id?: string } };
    id = j.id ?? j.data?.id;
  } catch {
    /* ignore */
  }
  if (!id) {
    throw new Error("Dify ไม่ส่งรหัสไฟล์หลังอัปโหลด");
  }
  return id;
}

/** ทดสอบว่า API key กับ base URL ใช้งานได้ — GET /v1/parameters */
export async function GET() {
  const apiKey = process.env.DIFY_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error: "ยังไม่ได้ตั้งค่า DIFY_API_KEY",
      },
      { status: 503 },
    );
  }

  const baseUrl = normalizeBaseUrl(
    process.env.DIFY_API_URL?.trim() || "https://api.dify.ai/v1",
  );

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/parameters`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "เชื่อมต่อ Dify ไม่สำเร็จ";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }

  const text = await res.text();

  if (!res.ok) {
    const parsed = parseDifyErrorBody(text);
    return Response.json(
      {
        ok: false,
        error: parsed.message,
        difyCode: parsed.code,
        hint: parsed.hint,
        endpoint: "GET /parameters",
      },
      { status: res.status },
    );
  }

  let parameters: unknown;
  try {
    parameters = JSON.parse(text) as unknown;
  } catch {
    parameters = text;
  }

  return Response.json({
    ok: true,
    message: "เชื่อมต่อ Dify ได้ — แอปตอบกลับจาก /parameters",
    appMode: resolveAppMode(),
    baseUrl,
    parameters,
  });
}

async function streamFromDify(
  upstream: Response,
  appMode: DifyAppMode,
): Promise<Response> {
  if (!upstream.body) {
    return Response.json({ error: "ไม่มี body จาก Dify" }, { status: 502 });
  }

  const out =
    appMode === "workflow"
      ? difySseToTextStreamWorkflow(upstream.body)
      : difySseToTextStream(upstream.body);

  return new Response(out, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.DIFY_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error:
          "ยังไม่ได้ตั้งค่า DIFY_API_KEY ใน .env.local (ดู .env.example)",
      },
      { status: 503 },
    );
  }

  const baseUrl = normalizeBaseUrl(
    process.env.DIFY_API_URL?.trim() || "https://api.dify.ai/v1",
  );

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return handleMultipartPost(request, apiKey, baseUrl);
  }

  return handleJsonPost(request, apiKey, baseUrl);
}

async function handleJsonPost(
  request: Request,
  apiKey: string,
  baseUrl: string,
): Promise<Response> {
  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return Response.json({ error: "ไม่มีคำสั่ง (prompt)" }, { status: 400 });
  }

  return forwardToDify({
    apiKey,
    baseUrl,
    prompt,
    uploadedFiles: [],
  });
}

type FileMetaItem = { fieldKey: string; name: string };

async function handleMultipartPost(
  request: Request,
  apiKey: string,
  baseUrl: string,
): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "อ่านฟอร์มไม่สำเร็จ" }, { status: 400 });
  }

  const prompt = String(form.get("prompt") ?? "").trim();
  if (!prompt) {
    return Response.json({ error: "ไม่มีคำสั่ง (prompt)" }, { status: 400 });
  }

  const rawFiles = form.getAll("files");
  const blobs = rawFiles.filter((x): x is File => x instanceof File);

  if (blobs.length > MAX_UPLOAD_FILES) {
    return Response.json(
      { error: `แนบได้ไม่เกิน ${MAX_UPLOAD_FILES} ไฟล์` },
      { status: 400 },
    );
  }

  let meta: FileMetaItem[] = [];
  const metaRaw = form.get("fileMeta");
  if (typeof metaRaw === "string" && metaRaw.trim()) {
    try {
      meta = JSON.parse(metaRaw) as FileMetaItem[];
    } catch {
      return Response.json({ error: "fileMeta ไม่ใช่ JSON ที่ถูกต้อง" }, { status: 400 });
    }
  }

  if (meta.length > 0 && meta.length !== blobs.length) {
    return Response.json(
      { error: "จำนวนไฟล์กับ fileMeta ไม่ตรงกัน" },
      { status: 400 },
    );
  }

  for (const f of blobs) {
    if (f.size > MAX_BYTES_PER_FILE) {
      return Response.json(
        {
          error: `ไฟล์ "${f.name}" ใหญ่เกิน ${Math.floor(MAX_BYTES_PER_FILE / (1024 * 1024))} MB`,
        },
        { status: 400 },
      );
    }
  }

  const user = process.env.DIFY_USER?.trim() || "ku-prompt-learn";
  const uploadedFiles: DifyUploadedFileRef[] = [];

  for (let i = 0; i < blobs.length; i++) {
    const file = blobs[i];
    const nameHint = meta[i]?.name ?? file.name;
    try {
      const id = await uploadBlobToDify(
        baseUrl,
        apiKey,
        user,
        file,
        file.name || nameHint,
      );
      const type = difyChatFileType(file.type || "application/octet-stream", file.name || nameHint);
      uploadedFiles.push({
        type,
        transfer_method: "local_file",
        upload_file_id: id,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "อัปโหลดไฟล์ไม่สำเร็จ";
      return Response.json({ error: msg }, { status: 502 });
    }
  }

  return forwardToDify({
    apiKey,
    baseUrl,
    prompt,
    uploadedFiles,
  });
}

type ForwardArgs = {
  apiKey: string;
  baseUrl: string;
  prompt: string;
  uploadedFiles: DifyUploadedFileRef[];
};

async function forwardToDify(args: ForwardArgs): Promise<Response> {
  const { apiKey, baseUrl, prompt, uploadedFiles } = args;

  const user = process.env.DIFY_USER?.trim() || "ku-prompt-learn";
  const appMode = resolveAppMode();

  if (uploadedFiles.length > 0 && appMode === "completion") {
    return Response.json(
      {
        error:
          "โหมด completion ของ Dify ไม่รองรับแนบไฟล์แบบนี้ — เปลี่ยนแอปเป็น Chat หรือตั้ง DIFY_APP_MODE=chat",
      },
      { status: 400 },
    );
  }

  let inputs: Record<string, unknown> = {};
  const inputsRaw = process.env.DIFY_INPUTS_JSON?.trim();
  if (inputsRaw) {
    try {
      inputs = JSON.parse(inputsRaw) as Record<string, unknown>;
    } catch {
      return Response.json(
        { error: "DIFY_INPUTS_JSON ไม่ใช่ JSON ที่ถูกต้อง" },
        { status: 500 },
      );
    }
  }

  const promptInputKey = process.env.DIFY_PROMPT_INPUT_KEY?.trim();

  if (appMode === "workflow") {
    const key = promptInputKey || "query";
    inputs = { ...inputs, [key]: prompt };
  } else if (promptInputKey) {
    inputs = { ...inputs, [promptInputKey]: prompt };
  }

  const wfFileKeys =
    process.env.DIFY_WORKFLOW_FILE_INPUT_KEYS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  if (appMode === "workflow" && uploadedFiles.length > 0) {
    if (wfFileKeys.length === 0) {
      return Response.json(
        {
          error:
            "แนบไฟล์ไป workflow ต้องตั้ง DIFY_WORKFLOW_FILE_INPUT_KEYS",
          hint:
            "รองรับ 2 แบบ: (1) key เดียวเป็น Array[File] เช่น DIFY_WORKFLOW_FILE_INPUT_KEYS=userinput.files หรือ (2) หลาย key ตามจำนวนไฟล์ เช่น เอกสาร1,เอกสาร2",
        },
        { status: 400 },
      );
    }

    // รองรับ workflow input แบบ Array[File] ด้วย key เดียว
    if (wfFileKeys.length === 1) {
      const varName = wfFileKeys[0];
      inputs[varName] = uploadedFiles.map((f) => ({
        type: f.type,
        transfer_method: "local_file",
        upload_file_id: f.upload_file_id,
      }));
    } else if (uploadedFiles.length > wfFileKeys.length) {
      return Response.json(
        {
          error: `แนบ ${uploadedFiles.length} ไฟล์ แต่ DIFY_WORKFLOW_FILE_INPUT_KEYS มีเพียง ${wfFileKeys.length} ชื่อ`,
        },
        { status: 400 },
      );
    } else {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const varName = wfFileKeys[i];
        inputs[varName] = {
          type: uploadedFiles[i].type,
          transfer_method: "local_file",
          upload_file_id: uploadedFiles[i].upload_file_id,
        };
      }
    }
  }

  let path: string;
  if (appMode === "workflow") {
    path = "/workflows/run";
  } else if (appMode === "completion") {
    path = "/completion-messages";
  } else {
    path = "/chat-messages";
  }

  const url = `${baseUrl}${path}`;

  const sendQuery =
    appMode === "workflow"
      ? false
      : promptInputKey
        ? process.env.DIFY_SEND_QUERY === "1"
        : process.env.DIFY_SEND_QUERY !== "0";

  const payload: Record<string, unknown> = {
    inputs,
    response_mode: "streaming",
    user,
  };
  if (sendQuery) {
    payload.query = prompt;
  }

  if (appMode === "chat" && uploadedFiles.length > 0) {
    payload.files = uploadedFiles;
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "เชื่อมต่อ Dify ไม่สำเร็จ";
    return Response.json({ error: message }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text();
    const parsed = parseDifyErrorBody(errText);
    return Response.json(
      {
        error: parsed.message,
        difyCode: parsed.code,
        hint: parsed.hint,
      },
      { status: upstream.status },
    );
  }

  return streamFromDify(upstream, appMode);
}
