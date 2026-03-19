-- Add client_id to projects if missing (column may be absent if migrations were run out of order)
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "client_id" TEXT;

-- Create index if not exists (PostgreSQL 9.5+)
CREATE INDEX IF NOT EXISTS "projects_client_id_idx" ON "projects"("client_id");

-- Add FK to users (skip if constraint already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_client_id_fkey'
  ) THEN
    ALTER TABLE "projects"
    ADD CONSTRAINT "projects_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
