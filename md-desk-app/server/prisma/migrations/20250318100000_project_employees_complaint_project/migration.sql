-- AlterTable
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "project_id" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "project_employees" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_employees_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_employees_project_id_employee_id_key" ON "project_employees"("project_id", "employee_id");
CREATE INDEX IF NOT EXISTS "project_employees_employee_id_idx" ON "project_employees"("employee_id");
CREATE INDEX IF NOT EXISTS "complaints_project_id_idx" ON "complaints"("project_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_employees_project_id_fkey') THEN
    ALTER TABLE "project_employees" ADD CONSTRAINT "project_employees_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_employees_employee_id_fkey') THEN
    ALTER TABLE "project_employees" ADD CONSTRAINT "project_employees_employee_id_fkey"
      FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaints_project_id_fkey') THEN
    ALTER TABLE "complaints" ADD CONSTRAINT "complaints_project_id_fkey"
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
