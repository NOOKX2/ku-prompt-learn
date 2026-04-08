import type { PromptTemplate } from "@/lib/prompt-templates";
import {
  appendAttachmentNoticeToPrompt,
  collectAttachmentsInFieldOrder,
} from "./helpers";

type GenerateArgs = {
  prompt: string;
  template: PromptTemplate;
  fieldAttachments: Record<string, File[]>;
  signal: AbortSignal;
  onChunk: (text: string) => void;
};

type DifyErr = { error?: string; hint?: string; difyCode?: string };

export async function streamGenerate(args: GenerateArgs): Promise<void> {
  const { prompt, template, fieldAttachments, signal, onChunk } = args;
  const { files, meta } = collectAttachmentsInFieldOrder(template, fieldAttachments);
  const promptToSend = appendAttachmentNoticeToPrompt(prompt, meta);
  const res = files.length
    ? await postForm(promptToSend, files, meta, signal)
    : await postJson(promptToSend, signal);

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as DifyErr;
    const parts = [
      data.error && data.difyCode ? `${data.error} (${data.difyCode})` : data.error,
      data.hint,
    ].filter(Boolean);
    throw new Error(parts.join("\n\n") || `ขอล้มเหลว (${res.status})`);
  }
  if (!res.body) throw new Error("ไม่ได้รับสตรีมจากเซิร์ฟเวอร์");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }
}

async function postJson(prompt: string, signal: AbortSignal): Promise<Response> {
  return fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
}

async function postForm(
  prompt: string,
  files: File[],
  meta: { fieldKey: string; name: string }[],
  signal: AbortSignal,
): Promise<Response> {
  const fd = new FormData();
  fd.append("prompt", prompt);
  fd.append("fileMeta", JSON.stringify(meta));
  for (const file of files) fd.append("files", file);
  return fetch("/api/generate", { method: "POST", body: fd, signal });
}
