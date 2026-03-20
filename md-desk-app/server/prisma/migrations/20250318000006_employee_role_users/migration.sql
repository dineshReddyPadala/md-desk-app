-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'EMPLOYEE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "designation" TEXT;

-- Drop legacy employees table (staff are now users with role EMPLOYEE)
DROP TABLE IF EXISTS "employees";
