"use client";

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  pdf,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

let thaiFontRegistered = false;

function ensureThaiFont(): void {
  if (thaiFontRegistered || typeof window === "undefined") return;
  Font.register({
    family: "NotoSansThai",
    src: `${window.location.origin}/fonts/noto-sans-thai-thai-400-normal.woff`,
  });
  thaiFontRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "NotoSansThai",
    fontSize: 10,
    lineHeight: 1.5,
  },
  body: {
    whiteSpace: "pre-wrap",
  },
});

function AnswerPdfDocument({ text }: { text: string }): ReactElement {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.body}>{text}</Text>
      </Page>
    </Document>
  );
}

function defaultFilename(): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `ku-promptlearn-dify-${stamp}.pdf`;
}

function extractJsonCandidate(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (t.startsWith("{") || t.startsWith("[")) return t;
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
  return fenced?.[1]?.trim() || null;
}

function formatForPdf(text: string): string {
  const candidate = extractJsonCandidate(text);
  if (!candidate) return text.trim();
  try {
    const parsed = JSON.parse(candidate) as unknown;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text.trim();
  }
}

export async function downloadDifyAnswerAsPdf(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  ensureThaiFont();
  const pdfText = formatForPdf(trimmed);
  const blob = await pdf(<AnswerPdfDocument text={pdfText} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultFilename();
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
