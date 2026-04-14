import { auth } from "@/auth";
import { resolveExamFromContent } from "@/lib/exam-stored-content";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
  }

  const { id } = await context.params;
  const row = await prisma.exam.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!row) {
    return NextResponse.json({ error: "ไม่พบข้อสอบ" }, { status: 404 });
  }

  const parsed = resolveExamFromContent(row.content);
  return NextResponse.json({
    exam: row,
    parse: parsed,
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const score =
    typeof body === "object" && body !== null && "score" in body
      ? Number((body as { score: unknown }).score)
      : NaN;

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return NextResponse.json({ error: "score ต้องเป็นตัวเลข 0–100" }, { status: 400 });
  }

  const updated = await prisma.exam.updateMany({
    where: { id, userId: session.user.id },
    data: { score: Math.round(score) },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "ไม่พบข้อสอบ" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
