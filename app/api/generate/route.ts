import {
  difySseToTextStream,
  difySseToTextStreamWorkflow,
} from "@/lib/dify-chat-stream";
import { parseDifyErrorBody } from "@/lib/dify-errors";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  const user = process.env.DIFY_USER?.trim() || "ku-prompt-learn";
  const appMode = resolveAppMode();

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
