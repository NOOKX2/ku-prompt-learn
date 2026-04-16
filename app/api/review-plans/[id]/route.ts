import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

