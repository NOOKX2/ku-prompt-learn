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

export async function downloadDifyAnswerAsPdf(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  ensureThaiFont();
  const blob = await pdf(<AnswerPdfDocument text={trimmed} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultFilename();
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
