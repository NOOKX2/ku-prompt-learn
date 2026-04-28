"use client";

import { PublishButton } from "@/components/publish-button";

export function ExamPublishButton({
  examId,
  initialIsPublic,
}: {
  examId: string;
  initialIsPublic: boolean;
}) {
  return (
    <PublishButton
      patchUrl={`/api/exams/${examId}`}
      sharePath={`/exam/${examId}`}
      initialIsPublic={initialIsPublic}
      showShareLink={false}
    />
  );
}
