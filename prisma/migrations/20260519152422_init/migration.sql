-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "genre" TEXT NOT NULL DEFAULT '',
    "targetAudience" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Manuscript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "memo" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Manuscript_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "manuscriptId" TEXT,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "rawJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalysisRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalysisRun_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "Manuscript" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryBeat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "beatOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "involvedCharactersJson" TEXT NOT NULL,
    "conflict" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "sourceChapterTitle" TEXT NOT NULL,
    CONSTRAINT "StoryBeat_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryBeat_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "chronologicalOrder" INTEGER NOT NULL,
    "narrativeOrder" INTEGER NOT NULL,
    "estimatedTimeLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "charactersJson" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    CONSTRAINT "TimelineEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineEvent_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "analysisRunId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "desire" TEXT NOT NULL,
    "weakness" TEXT NOT NULL,
    "conflict" TEXT NOT NULL,
    "relationshipNotes" TEXT NOT NULL,
    "arcSummary" TEXT NOT NULL,
    "firstAppearanceChapter" TEXT NOT NULL,
    "importanceScore" INTEGER NOT NULL,
    CONSTRAINT "CharacterProfile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterProfile_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventWeight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "characterCount" INTEGER NOT NULL,
    "percentage" REAL NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    CONSTRAINT "EventWeight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventWeight_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsistencyIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedChapter" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    CONSTRAINT "ConsistencyIssue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConsistencyIssue_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Manuscript_projectId_chapterNumber_idx" ON "Manuscript"("projectId", "chapterNumber");

-- CreateIndex
CREATE INDEX "AnalysisRun_projectId_createdAt_idx" ON "AnalysisRun"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisRun_manuscriptId_idx" ON "AnalysisRun"("manuscriptId");

-- CreateIndex
CREATE INDEX "StoryBeat_projectId_beatOrder_idx" ON "StoryBeat"("projectId", "beatOrder");

-- CreateIndex
CREATE INDEX "StoryBeat_analysisRunId_idx" ON "StoryBeat"("analysisRunId");

-- CreateIndex
CREATE INDEX "TimelineEvent_projectId_chronologicalOrder_idx" ON "TimelineEvent"("projectId", "chronologicalOrder");

-- CreateIndex
CREATE INDEX "TimelineEvent_analysisRunId_idx" ON "TimelineEvent"("analysisRunId");

-- CreateIndex
CREATE INDEX "CharacterProfile_projectId_name_idx" ON "CharacterProfile"("projectId", "name");

-- CreateIndex
CREATE INDEX "CharacterProfile_analysisRunId_idx" ON "CharacterProfile"("analysisRunId");

-- CreateIndex
CREATE INDEX "EventWeight_projectId_category_idx" ON "EventWeight"("projectId", "category");

-- CreateIndex
CREATE INDEX "EventWeight_analysisRunId_idx" ON "EventWeight"("analysisRunId");

-- CreateIndex
CREATE INDEX "ConsistencyIssue_projectId_severity_idx" ON "ConsistencyIssue"("projectId", "severity");

-- CreateIndex
CREATE INDEX "ConsistencyIssue_analysisRunId_idx" ON "ConsistencyIssue"("analysisRunId");
