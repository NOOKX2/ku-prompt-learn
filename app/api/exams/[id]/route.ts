import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";
import { resolveExamFromContent } from "@/lib/exam-stored-content";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  const row = await prisma.exam.findFirst({
    where: { id },
    select: { id: true, userId: true, title: true, content: true, score: true, isPublic: true, createdAt: true },
  });

  if (!row) {
    return NextResponse.json({ error: "ไม่พบข้อสอบ" }, { status: 404 });
  }

  const isOwner = session?.user?.id === row.userId;
  if (!row.isPublic && !isOwner) {
    return NextResponse.json({ error: "ไม่พบข้อสอบ" }, { status: 404 });
  }

  const parsed = resolveExamFromContent(row.content);
  return NextResponse.json({ exam: row, parse: parsed });
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

  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const scoreRaw = b.score;
  const titleRaw = b.title;
  const contentRaw = b.content;
  const isPublicRaw = b.isPublic;

  const nextScore = scoreRaw === undefined || scoreRaw === null ? undefined : Number(scoreRaw);
  const nextTitle = titleRaw === undefined || titleRaw === null ? undefined : String(titleRaw).trim();
  const nextIsPublic = isPublicRaw === undefined ? undefined : Boolean(isPublicRaw);

  if (nextScore !== undefined && (!Number.isFinite(nextScore) || nextScore < 0 || nextScore > 100)) {
    return NextResponse.json({ error: "score ต้องเป็นตัวเลข 0–100" }, { status: 400 });
  }
  if (nextTitle !== undefined && !nextTitle) {
    return NextResponse.json({ error: "ชื่อข้อสอบห้ามว่าง" }, { status: 400 });
  }

  const data: { score?: number; title?: string; content?: Prisma.InputJsonValue; isPublic?: boolean } = {};
  if (nextScore !== undefined) data.score = Math.round(nextScore);
  if (nextTitle !== undefined) data.title = nextTitle;
  if (contentRaw !== undefined) data.content = contentRaw as Prisma.InputJsonValue;
  if (nextIsPublic !== undefined) data.isPublic = nextIsPublic;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลสำหรับแก้ไข" }, { status: 400 });
  }

  const updated = await prisma.exam.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "ไม่พบข้อสอบ" }, { status: 404 });
  }

  revalidatePath("/exam");
  revalidatePath(`/exam/${id}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await prisma.exam.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "ไม่พบข้อสอบ" }, { status: 404 });
  }

  revalidatePath("/exam");
  revalidatePath(`/exam/${id}`);
  return NextResponse.json({ ok: true });
}
