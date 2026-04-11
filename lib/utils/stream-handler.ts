import {
  difySseToTextStream,
  difySseToTextStreamWorkflow,
} from "@/lib/dify/chat-stream";
import { ErrorOrigin, withErrorOrigin } from "@/lib/dify-errors";
import { resolveAppMode } from "@/lib/dify/client";

export function transformDifyStream(upstream: Response) {
  if (!upstream.body) {
    throw new Error(
      withErrorOrigin(
        ErrorOrigin.serverStreamSetup,
        "ไม่มี body จาก Dify — อาจได้คำตอบแบบไม่สตรีมหรือ response_mode ไม่ใช่ streaming",
      ),
    );
  }

  const mode = resolveAppMode();
  const rawStream = upstream.body;
  const out =
    mode === "workflow"
      ? difySseToTextStreamWorkflow(rawStream)
      : difySseToTextStream(rawStream);

  return new Response(out, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
