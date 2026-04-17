import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/** Prisma ต้องรันบน Node — ไม่ใช่ Edge */
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
  }

  const { id } = await context.params;

  const row = await prisma.reviewPlan.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
    },
  });

  if (!row) {
    return NextResponse.json({ error: "ไม่พบแผนทบทวน" }, { status: 404 });
  }

  return NextResponse.json({ reviewPlan: row });
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

  const hasTitle = typeof body === "object" && body !== null && "title" in body;
  const title = hasTitle
    ? String((body as { title: unknown }).title ?? "").trim()
    : "";
  const contentRaw =
    typeof body === "object" && body !== null && "content" in body
      ? (body as { content: unknown }).content
      : undefined;

  if (title === "" && contentRaw === undefined) {
    return NextResponse.json({ error: "ไม่มีข้อมูลสำหรับแก้ไข" }, { status: 400 });
  }
  if (title === "" && hasTitle) {
    return NextResponse.json({ error: "ชื่อห้ามว่าง" }, { status: 400 });
  }

  const data: { title?: string; content?: Prisma.InputJsonValue } = {};
  if (title) data.title = title;
  if (contentRaw !== undefined) data.content = contentRaw as Prisma.InputJsonValue;

  const updated = await prisma.reviewPlan.updateMany({
    where: { id, userId: session.user.id },
    data,
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "ไม่พบแผนทบทวน" }, { status: 404 });
  }

  revalidatePath("/review");
  revalidatePath(`/review/${id}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await prisma.reviewPlan.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "ไม่พบแผนทบทวน" }, { status: 404 });
  }

  revalidatePath("/review");
  revalidatePath(`/review/${id}`);
  return NextResponse.json({ ok: true });
}

