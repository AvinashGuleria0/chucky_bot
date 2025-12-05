-- AlterTable
ALTER TABLE "projects" ADD COLUMN "shareId" TEXT,
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "projects_shareId_key" ON "projects"("shareId");
