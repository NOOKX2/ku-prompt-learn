"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortLike } from "@/lib/dify-errors";
import type { DifyUploadedFileRef } from "@/lib/dify/types";
import { streamGenerate } from "@/services/generate-service";

/**
 * สถานะการเรียก `/api/generate` แบบสตรีม — แยกจากฟอร์มเทมเพลตเพื่อให้อ่านโค้ดง่าย
 */

export function useGenerateStream() {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** กันคลิกรันซ้ำ / unmount: finally ของรันเก่าอย่า setLoading หรือล้าง abortRef ของรันใหม่ */
  const generationRef = useRef(0);

  useEffect(
    () => () => {
      generationRef.current += 1;
      abortRef.current?.abort();
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const run = useCallback(async (prompt: string, workflowFiles?: DifyUploadedFileRef[]) => {
    const p = prompt.trim();
    if (!p) return undefined;
    const gen = ++generationRef.current;
    setError(null);
    setAnswer("");
    setLoading(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const text = await streamGenerate({
        prompt: p,
        signal: ac.signal,
        onChunk: setAnswer,
        workflowFiles,
      });
      return text;
    } catch (e) {
      if (generationRef.current !== gen) return undefined;
      if (isAbortLike(e)) {
        setError("หยุดแล้ว");
      } else {
        const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
        console.error("[useGenerateStream] run ล้ม — ดู [generate-client] ด้านบนในคอนโซลว่าขั้นไหน", {
          message: msg,
          error: e,
        });
        setError(msg);
      }
      return undefined;
    } finally {
      if (generationRef.current === gen) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }, []);

  return {
    answer,
    setAnswer,
    loading,
    error,
    setError,
    run,
    stop,
  };
}
