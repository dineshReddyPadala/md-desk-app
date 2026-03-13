-- AlterTable
ALTER TABLE "messages" ADD COLUMN "admin_reply" TEXT,
ADD COLUMN "replied_at" TIMESTAMP(3);
