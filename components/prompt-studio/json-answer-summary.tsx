"use client";

export type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

function isObject(v: JsonValue): v is { [k: string]: JsonValue } {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function JsonNode({ label, value, depth }: { label?: string; value: JsonValue; depth: number }) {
  const indent = depth > 0 ? "ml-4" : "";

  if (value === null) {
    return (
      <div className={indent}>
        {label ? <span className="font-medium text-neutral-700">{label}: </span> : null}
        <span className="font-mono text-xs text-neutral-500">null</span>
      </div>
    );
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return (
      <div className={indent}>
        {label ? <span className="font-medium text-neutral-700">{label}: </span> : null}
        <span className="text-neutral-900">{String(value)}</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className={`space-y-1 ${indent}`}>
        <p className="text-sm font-medium text-neutral-700">
          {label ? `${label}: ` : ""}อาร์เรย์ {value.length} รายการ
        </p>
        <div className="space-y-2 border-l border-neutral-200 pl-3">
          {value.map((item, idx) => (
            <JsonNode key={`${label ?? "item"}-${idx}`} label={`#${idx + 1}`} value={item} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  if (isObject(value)) {
    const entries = Object.entries(value);
    return (
      <div className={`space-y-1 ${indent}`}>
        {label ? <p className="text-sm font-medium text-neutral-700">{label}</p> : null}
        <div className="space-y-2 border-l border-neutral-200 pl-3">
          {entries.length === 0 ? (
            <span className="font-mono text-xs text-neutral-500">{`{}`}</span>
          ) : (
            entries.map(([k, v]) => <JsonNode key={k} label={k} value={v} depth={depth + 1} />)
          )}
        </div>
      </div>
    );
  }

  return null;
}

export function JsonAnswerSummary({ data }: { data: JsonValue }) {
  const topLevelCount = isObject(data) ? Object.keys(data).length : Array.isArray(data) ? data.length : 1;
  return (
    <div className="space-y-4 border-b border-neutral-100 bg-linear-to-b from-brand-muted/30 to-white px-4 py-4 sm:px-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">สรุปผลลัพธ์ JSON</p>
        <p className="mt-1 text-sm text-neutral-700">
          แสดงโครงสร้างข้อมูลแบบอ่านง่าย ({topLevelCount.toLocaleString("th-TH")} รายการระดับบน)
        </p>
      </div>
      <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm leading-relaxed">
        <JsonNode value={data} depth={0} />
      </div>
    </div>
  );
}
