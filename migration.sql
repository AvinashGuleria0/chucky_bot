-- Add shareId and isPublic columns to projects table
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "shareId" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- Create unique index on shareId
CREATE UNIQUE INDEX IF NOT EXISTS "projects_shareId_key" ON "projects"("shareId");
