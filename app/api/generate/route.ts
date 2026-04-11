import {
  ErrorOrigin,
  parseDifyErrorBody,
  withErrorOrigin,
} from "@/lib/dify-errors";
import {
  DifyClient,
  resolveAppMode,
  resolveResponseMode,
} from "@/lib/dify/client";
import { ParseRequestError, parseIncomingRequest } from "@/lib/utils/file-processor";
import { transformDifyStream } from "@/lib/utils/stream-handler";
import { textFromDifyWorkflowBlockingBody } from "@/lib/utils/workflow-blocking-result";

export const runtime = "nodejs";
/** ข้อสอบชุดใหญ่ — ขยายเพดานที่โฮสต์ (เช่น Vercel Pro) */
export const maxDuration = 300;

/** ทดสอบว่ามี DIFY_API_KEY — ลิงก์จากหน้า /studio */
export async function GET() {
  const apiKey = process.env.DIFY_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error: withErrorOrigin(
          ErrorOrigin.serverConfig,
          "ยังไม่ได้ตั้งค่า DIFY_API_KEY",
        ),
      },
      { status: 503 },
    );
  }
  const appMode = resolveAppMode();
  const responseMode = resolveResponseMode(appMode);
  const isBun =
    typeof process !== "undefined" &&
    process.versions != null &&
    "bun" in process.versions;
  return Response.json({
    ok: true,
    message:
      "พร้อมรับ POST JSON { \"prompt\": \"...\" } — เอกสารอ้างอิงใช้ Knowledge/RAG ใน Dify ไม่แนบไฟล์ผ่าน API",
    appMode,
    responseMode,
    runtimeIsBun: isBun,
    responseModeHint:
      responseMode === "blocking" && appMode === "workflow"
        ? isBun && !process.env.DIFY_RESPONSE_MODE?.trim()
          ? "ใช้ blocking อัตโนมัติบน Bun+workflow (ไม่สตรีม SSE) — ต้องการสตรีมให้ตั้ง DIFY_RESPONSE_MODE=streaming"
          : "ใช้ blocking — ไม่สตรีม SSE (ลดปัญหา socket ถูกตัดระหว่างรัน workflow นาน)"
        : "streaming — ถ้า socket ขาดที่ขั้น ⑥ ตั้ง DIFY_RESPONSE_MODE=blocking หรือรันด้วย Node",
    baseUrl: process.env.DIFY_API_URL?.trim() || "https://api.dify.ai/v1",
  });
}

export async function POST(req: Request) {
  const apiKey = process.env.DIFY_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error: withErrorOrigin(
          ErrorOrigin.serverConfig,
          "ยังไม่ได้ตั้งค่า DIFY_API_KEY ใน .env.local",
        ),
      },
      { status: 503 },
    );
  }

  const baseUrl =
    process.env.DIFY_API_URL?.trim() || "https://api.dify.ai/v1";

  try {
    const { prompt } = await parseIncomingRequest(req);
    if (!prompt) {
      return Response.json(
        {
          error: withErrorOrigin(
            ErrorOrigin.serverParseRequest,
            "ไม่มีคำสั่ง (prompt)",
          ),
        },
        { status: 400 },
      );
    }

    const client = new DifyClient(apiKey, baseUrl);
    const upstream = await client.execute(prompt);

    if (!upstream.ok) {
      const errText = await upstream.text();
      const parsed = parseDifyErrorBody(errText);
      const detail =
        parsed.code && parsed.message
          ? `${parsed.message} (รหัส: ${parsed.code})`
          : parsed.message;
      return Response.json(
        {
          error: withErrorOrigin(ErrorOrigin.serverDifyHttpError, detail),
          hint: parsed.hint,
          difyCode: parsed.code,
        },
        { status: upstream.status },
      );
    }

    const appModePost = resolveAppMode();
    if (appModePost === "workflow" && resolveResponseMode(appModePost) === "blocking") {
      let json: unknown;
      try {
        json = await upstream.json();
      } catch {
        return Response.json(
          {
            error: withErrorOrigin(
              ErrorOrigin.serverDifyHttpError,
              "blocking: อ่าน JSON จาก Dify ไม่ได้",
            ),
          },
          { status: 502 },
        );
      }
      const text = textFromDifyWorkflowBlockingBody(json);
      if (!text.trim()) {
        return Response.json(
          {
            error: withErrorOrigin(
              ErrorOrigin.serverDifyHttpError,
              "blocking: ได้ JSON แต่ดึงข้อความจาก outputs ไม่ได้ — ตรวจโครงสร้าง outputs ใน Dify หรือกลับไปใช้ streaming",
            ),
          },
          { status: 502 },
        );
      }
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return transformDifyStream(upstream);
  } catch (err: unknown) {
    if (err instanceof ParseRequestError) {
      return Response.json(
        { error: withErrorOrigin(ErrorOrigin.serverParseRequest, err.message) },
        { status: err.status },
      );
    }
    const message =
      err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
    const labeled =
      message.trimStart().startsWith("[")
        ? message
        : withErrorOrigin(ErrorOrigin.serverRouteCatch, message);
    console.error("[api/generate]", labeled);
    return Response.json({ error: labeled }, { status: 500 });
  }
}
