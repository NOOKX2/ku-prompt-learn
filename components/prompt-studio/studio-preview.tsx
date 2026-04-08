type Props = {
  promptText: string;
  answer: string;
  loading: boolean;
  error: string | null;
  copiedPrompt: boolean;
  copiedAnswer: boolean;
  downloadingPdf: boolean;
  pdfExportError: string | null;
  onCopyPrompt: () => void;
  onRun: () => void;
  onStop: () => void;
  onDownloadPdf: () => void;
  onCopyAnswer: () => void;
};

export function StudioPreview(props: Props) {
  const {
    promptText, answer, loading, error, copiedPrompt, copiedAnswer, downloadingPdf, pdfExportError,
    onCopyPrompt, onRun, onStop, onDownloadPdf, onCopyAnswer,
  } = props;
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 xl:sticky xl:top-24 xl:max-w-none">
      <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-black/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-3">
          <span className="font-mono text-xs font-medium uppercase tracking-wide text-neutral-600">คำสั่ง → โมเดล</span>
          <button type="button" onClick={onCopyPrompt} className="rounded-lg border border-black/15 px-2.5 py-1.5 font-mono text-[11px] font-medium text-black hover:bg-neutral-50">
            {copiedPrompt ? "คัดลอกแล้ว" : "คัดลอกคำสั่ง"}
          </button>
        </div>
        <pre className="max-h-[32vh] min-h-[120px] overflow-auto whitespace-pre-wrap wrap-break-word bg-neutral-50 p-4 font-mono text-[11px] leading-relaxed sm:text-xs">{promptText || "—"}</pre>
        <div className="flex flex-wrap gap-2 border-t border-black/10 p-3">
          <button type="button" disabled={loading || !promptText.trim()} onClick={onRun} className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">
            {loading ? "กำลังรัน…" : "รันคำสั่ง"}
          </button>
          {loading ? <button type="button" onClick={onStop} className="rounded-xl border-2 border-black px-4 py-2.5 text-sm font-medium hover:bg-neutral-50">หยุด</button> : null}
        </div>
      </div>

      <div className="flex min-h-[200px] flex-col overflow-hidden rounded-2xl border-2 border-black bg-white">
        <div className="flex flex-col gap-2 border-b border-black px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-medium uppercase tracking-wide text-brand">คำตอบ (Dify)</span>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={!answer || downloadingPdf} onClick={onDownloadPdf} className="rounded-lg border border-black/15 px-2.5 py-1.5 font-mono text-[11px] font-medium hover:bg-neutral-50 disabled:opacity-40">
                {downloadingPdf ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
              </button>
              <button type="button" disabled={!answer} onClick={onCopyAnswer} className="rounded-lg border border-black/15 px-2.5 py-1.5 font-mono text-[11px] font-medium hover:bg-neutral-50 disabled:opacity-40">
                {copiedAnswer ? "คัดลอกแล้ว" : "คัดลอกคำตอบ"}
              </button>
            </div>
          </div>
          {pdfExportError ? <p className="text-xs text-red-700">{pdfExportError}</p> : null}
        </div>
        {error ? (
          <p className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-red-700">{error}</p>
        ) : (
          <pre className="max-h-[min(55vh,520px)] min-h-[180px] flex-1 overflow-auto whitespace-pre-wrap wrap-break-word p-4 font-mono text-[11px] leading-relaxed text-black sm:text-xs">
            {answer || (loading ? "…" : "กด «รันคำสั่ง» เพื่อให้โมเดลตอบในหน้านี้")}
          </pre>
        )}
      </div>
    </div>
  );
}
