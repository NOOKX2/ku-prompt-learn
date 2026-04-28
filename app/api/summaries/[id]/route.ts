import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const { id } = await context.params;
  const row = await prisma.summary.findFirst({
    where: { id },
    select: {
      id: true,
      topic: true,
      content: true,
      isPublic: true,
      userId: true,
      createdAt: true,
    },
  });

  if (!row) {
    return NextResponse.json({ error: "ไม่พบสรุป" }, { status: 404 });
  }

  const isOwner = userId === row.userId;
  if (!row.isPublic && !isOwner) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงสรุปนี้" }, { status: 403 });
  }

  const { userId: _uid, ...rest } = row;
  return NextResponse.json({ summary: rest, isOwner });
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

  const hasTopic = typeof body === "object" && body !== null && "topic" in body;
  const topic = hasTopic
    ? String((body as { topic: unknown }).topic ?? "").trim()
    : "";
  const contentRaw =
    typeof body === "object" && body !== null && "content" in body
      ? (body as { content: unknown }).content
      : undefined;
  const isPublicRaw =
    typeof body === "object" && body !== null && "isPublic" in body
      ? (body as { isPublic: unknown }).isPublic
      : undefined;

  if (topic === "" && contentRaw === undefined && isPublicRaw === undefined) {
    return NextResponse.json({ error: "ไม่มีข้อมูลสำหรับแก้ไข" }, { status: 400 });
  }
  if (topic === "" && hasTopic) {
    return NextResponse.json({ error: "หัวข้อห้ามว่าง" }, { status: 400 });
  }

  const data: { topic?: string; content?: Prisma.InputJsonValue; isPublic?: boolean } = {};
  if (topic) data.topic = topic;
  if (contentRaw !== undefined) data.content = contentRaw as Prisma.InputJsonValue;
  if (typeof isPublicRaw === "boolean") data.isPublic = isPublicRaw;

  const updated = await prisma.summary.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "ไม่พบสรุป" }, { status: 404 });
  }

  revalidatePath("/summary");
  revalidatePath(`/summary/${id}`);
  revalidatePath("/community");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await prisma.summary.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "ไม่พบสรุป" }, { status: 404 });
  }

  revalidatePath("/summary");
  revalidatePath(`/summary/${id}`);
  revalidatePath("/community");
  return NextResponse.json({ ok: true });
}
