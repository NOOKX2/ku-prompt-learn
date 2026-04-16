-- CreateTable
CREATE TABLE "ReviewPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewPlan_userId_createdAt_idx" ON "ReviewPlan"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ReviewPlan" ADD CONSTRAINT "ReviewPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

