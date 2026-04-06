/**
 * อ่านสตรีม SSE จาก Dify
 * - chat: chat-messages / completion-messages (event message / agent_message + answer)
 * - workflow: workflows/run (event text_chunk + data.text และ message เมื่อมี)
 */

type DifyStreamEvent = {
  event?: string;
  answer?: string;
  message?: string;
  data?: unknown;
};

function extractChunk(
  parsed: DifyStreamEvent,
  mode: "chat" | "workflow",
): string | null {
  const ev = parsed.event;

  if (ev === "error") {
    return null;
  }

  if (mode === "workflow" && ev === "text_chunk" && parsed.data != null) {
    const d = parsed.data as Record<string, unknown>;
    if (typeof d.text === "string" && d.text.length > 0) {
      return d.text;
    }
  }

  if (
    (ev === "message" || ev === "agent_message") &&
    typeof parsed.answer === "string" &&
    parsed.answer.length > 0
  ) {
    return parsed.answer;
  }

  return null;
}

function createSseParser(
  mode: "chat" | "workflow",
): (body: ReadableStream<Uint8Array>) => ReadableStream<Uint8Array> {
  return (body: ReadableStream<Uint8Array>) => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream({
      async start(controller) {
        const reader = body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const parts = buffer.split("\n");
            buffer = parts.pop() ?? "";

            for (const rawLine of parts) {
              const trimmed = rawLine.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;

              let parsed: DifyStreamEvent;
              try {
                parsed = JSON.parse(payload) as DifyStreamEvent;
              } catch {
                continue;
              }

              if (parsed.event === "error") {
                const msg =
                  typeof parsed.message === "string"
                    ? parsed.message
                    : JSON.stringify(parsed.data ?? parsed);
                controller.enqueue(
                  encoder.encode(`\n\n[ข้อผิดพลาดจาก Dify] ${msg}`),
                );
                controller.close();
                return;
              }

              const chunk = extractChunk(parsed, mode);
              if (chunk) {
                controller.enqueue(encoder.encode(chunk));
              }
            }
          }

          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data:")) {
              const payload = trimmed.slice(5).trim();
              if (payload && payload !== "[DONE]") {
                try {
                  const parsed = JSON.parse(payload) as DifyStreamEvent;
                  const chunk = extractChunk(parsed, mode);
                  if (chunk) {
                    controller.enqueue(encoder.encode(chunk));
                  }
                } catch {
                  /* ignore */
                }
              }
            }
          }

          controller.close();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          controller.enqueue(encoder.encode(`\n\n[ข้อผิดพลาด] ${msg}`));
          controller.close();
        }
      },
    });
  };
}

/** Chat / Completion API */
export function difySseToTextStream(
  body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  return createSseParser("chat")(body);
}

/** Workflow API (/workflows/run) — รวม text_chunk */
export function difySseToTextStreamWorkflow(
  body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  return createSseParser("workflow")(body);
}
