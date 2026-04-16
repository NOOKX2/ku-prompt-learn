import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** รันไทม์: client เก่าหลังเพิ่ม model / HMR อาจไม่มี delegate summary (ไม่ใช้ `"x" in PrismaClient` — TS จะ narrow เป็น never) */
function isMissingSummaryDelegate(client: unknown): boolean {
  return typeof client === "object" && client !== null && !("summary" in client);
}

function createOrRefreshClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && process.env.NODE_ENV !== "production" && isMissingSummaryDelegate(cached)) {
    void (cached as PrismaClient).$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
  }
  const client = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = createOrRefreshClient();
