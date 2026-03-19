-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_expires" TIMESTAMP(3);
