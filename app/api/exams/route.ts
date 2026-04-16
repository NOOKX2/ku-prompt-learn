import { auth } from "@/auth";
import { buildExamStoredContent } from "@/lib/exam-stored-content";
import { parseExamJson } from "@/lib/exam-json";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 });
  }

  const exams = await prisma.exam.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      score: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ exams });
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

  const parsed = parseExamJson(rawAnswer);
  const title = parsed.ok
    ? parsed.exam.title
    : `ข้อสอบจาก Dify (${new Date().toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })})`;

  const content = buildExamStoredContent(rawAnswer, parsed.ok ? parsed.exam : undefined);

  const exam = await prisma.exam.create({
    data: {
      userId: session.user.id,
      title,
      content,
    },
    select: { id: true, title: true, createdAt: true },
  });

  revalidatePath("/exam");
  revalidatePath(`/exam/${exam.id}`);


  return NextResponse.json({ exam });
}
