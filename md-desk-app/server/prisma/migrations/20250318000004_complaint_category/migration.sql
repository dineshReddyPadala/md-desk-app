-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('PRODUCT', 'SERVICE', 'DELIVERY', 'TECHNICAL');

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN "category" "ComplaintCategory" NOT NULL DEFAULT 'PRODUCT';

-- CreateIndex
CREATE INDEX "complaints_category_idx" ON "complaints"("category");
