-- CreateTable
CREATE TABLE "CharacterConcept" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "logline" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "appearance" TEXT NOT NULL DEFAULT '',
    "voice" TEXT NOT NULL DEFAULT '',
    "goal" TEXT NOT NULL DEFAULT '',
    "motivation" TEXT NOT NULL DEFAULT '',
    "desire" TEXT NOT NULL DEFAULT '',
    "fear" TEXT NOT NULL DEFAULT '',
    "wound" TEXT NOT NULL DEFAULT '',
    "secret" TEXT NOT NULL DEFAULT '',
    "strength" TEXT NOT NULL DEFAULT '',
    "weakness" TEXT NOT NULL DEFAULT '',
    "conflict" TEXT NOT NULL DEFAULT '',
    "relationshipNotes" TEXT NOT NULL DEFAULT '',
    "backstory" TEXT NOT NULL DEFAULT '',
    "arcStart" TEXT NOT NULL DEFAULT '',
    "arcTurningPoint" TEXT NOT NULL DEFAULT '',
    "arcEnd" TEXT NOT NULL DEFAULT '',
    "plotFunction" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterConcept_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CharacterConcept_projectId_name_idx" ON "CharacterConcept"("projectId", "name");

-- CreateIndex
CREATE INDEX "CharacterConcept_projectId_updatedAt_idx" ON "CharacterConcept"("projectId", "updatedAt");
