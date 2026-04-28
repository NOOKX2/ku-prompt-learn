"use client";

import { useState } from "react";

export function PublishButton({
  patchUrl,
  sharePath,
  initialIsPublic,
  showShareLink = true,
}: {
  patchUrl: string;
  sharePath: string;
  initialIsPublic: boolean;
  showShareLink?: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${sharePath}`
      : sharePath;

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(patchUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (res.ok) setIsPublic((v) => !v);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={loading}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${
          isPublic
            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
        }`}
      >
        <span aria-hidden>🌐</span>
        <span
          className={`inline-block size-2 rounded-full ${isPublic ? "bg-green-500" : "bg-neutral-400"}`}
          aria-hidden
        />
        {loading ? "กำลังบันทึก…" : isPublic ? "Public" : "Publish"}
      </button>

      {isPublic && showShareLink ? (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50/60 px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-green-800">
            {shareUrl}
          </span>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="shrink-0 rounded-lg border border-green-300 bg-white px-2 py-1 text-xs font-medium text-green-700 transition hover:bg-green-50"
          >
            {copied ? "คัดลอกแล้ว ✓" : "คัดลอก"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
