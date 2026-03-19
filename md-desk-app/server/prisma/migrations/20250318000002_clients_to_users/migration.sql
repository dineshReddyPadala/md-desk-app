-- Drop FK from projects to clients (client_id pointed to clients.id)
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_client_id_fkey";

-- Clear client_id so we can add FK to users (existing values were client cuids, not user ids)
UPDATE "projects" SET "client_id" = NULL WHERE "client_id" IS NOT NULL;

-- Drop clients table
DROP TABLE IF EXISTS "clients";

-- Point projects.client_id to users.id
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
