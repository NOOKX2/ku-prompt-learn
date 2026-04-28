-- AlterTable (idempotent: ฐานเดิมอาจมีคอลัมน์นี้แล้วจาก db push/แก้มือ)
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;
