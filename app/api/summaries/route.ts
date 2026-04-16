import { auth } from "@/auth";
import { parseSimplifySummaryJson } from "@/lib/simplify-summary";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Prisma ต้องรันบน Node — ไม่ใช่ Edge */
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
  }

  const summaries = await prisma.summary.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      topic: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ summaries });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const rawAnswer =
    typeof body === "object" && body !== null && "rawAnswer" in body
      ? String((body as { rawAnswer: unknown }).rawAnswer ?? "")
      : "";

  if (!rawAnswer.trim()) {
    return NextResponse.json({ error: "ไม่มี rawAnswer" }, { status: 400 });
  }

  const parsed = parseSimplifySummaryJson(rawAnswer);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const contentJson = JSON.parse(JSON.stringify(parsed.summary));

  try {
    const summary = await prisma.summary.create({
      data: {
        userId: session.user.id,
        topic: parsed.summary.topic,
        content: contentJson,
      },
      select: {
        id: true,
        topic: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ summary });
  } catch (e: unknown) {
    console.error("[api/summaries POST]", e);
    const code =
      e && typeof e === "object" && "code" in e && typeof (e as { code: unknown }).code === "string"
        ? (e as { code: string }).code
        : "";
    if (code === "P2021") {
      return NextResponse.json(
        {
          error:
            "ตาราง Summary ยังไม่มีในฐานข้อมูล — รัน `bunx prisma db push` หรือ `migrate deploy` แล้วรีสตาร์ท dev server",
          prismaCode: code,
        },
        { status: 503 },
      );
    }
    const message = e instanceof Error ? e.message : "บันทึกสรุปไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
