"use client";

import { JsonAnswerSummary, type JsonValue } from "@/components/prompt-studio/json-answer-summary";

export function JsonAnswerFallback({ data }: { data: JsonValue }) {
  return <JsonAnswerSummary data={data} />;
}
