"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamGenerate } from "@/services/generate-service";

/**
 * สถานะการเรียก `/api/generate` แบบสตรีม — แยกจากฟอร์มเทมเพลตเพื่อให้อ่านโค้ดง่าย
 */
export function useGenerateStream() {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const run = useCallback(async (prompt: string) => {
    const p = prompt.trim();
    console.log(p);
    if (!p) return;
    setError(null);
    setAnswer("");
    setLoading(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamGenerate({
        prompt: p,
        signal: ac.signal,
        onChunk: setAnswer,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("หยุดแล้ว");
      } else {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
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
