-- ============================================================
-- Migration V5: Announcements, Assessments, Entry Remarks
-- Adds: Notification broadcast fields, Assessment table,
--        EntryRemark table, missing LogbookEntry columns
-- Run this in your Neon SQL Editor
-- ============================================================

BEGIN;

-- ── 1. Add new NotificationType enum values ──────────────

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SCHOOL_ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REGIONAL_ANNOUNCEMENT';

COMMIT;

-- NOTE: New enum values require their own transaction before use.
-- Start a new transaction for the rest.

BEGIN;

-- ── 2. Add columns to Notification table ─────────────────

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "senderRole" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

-- ── 3. Add missing LogbookEntry columns ──────────────────

ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "assignmentGiven" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "assignmentDetails" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "assignmentReviewed" BOOLEAN;

-- ── 4. Create Assessment table ───────────────────────────

CREATE TABLE IF NOT EXISTS "Assessment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "passMark" INTEGER NOT NULL,
    "topicsNote" TEXT,
    "corrected" BOOLEAN NOT NULL DEFAULT false,
    "correctionDate" TIMESTAMP(3),
    "totalStudents" INTEGER,
    "totalMale" INTEGER,
    "totalFemale" INTEGER,
    "totalPassed" INTEGER,
    "malePassed" INTEGER,
    "femalePassed" INTEGER,
    "highestMark" DOUBLE PRECISION,
    "lowestMark" DOUBLE PRECISION,
    "averageMark" DOUBLE PRECISION,
    "passRate" DOUBLE PRECISION,
    "malePassRate" DOUBLE PRECISION,
    "femalePassRate" DOUBLE PRECISION,
    "notifiedParents" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Assessment_teacherId_classId_idx" ON "Assessment"("teacherId", "classId");
CREATE INDEX IF NOT EXISTS "Assessment_schoolId_date_idx" ON "Assessment"("schoolId", "date");
CREATE INDEX IF NOT EXISTS "Assessment_classId_subjectId_idx" ON "Assessment"("classId", "subjectId");

-- Assessment foreign keys
DO $$ BEGIN
  ALTER TABLE "Assessment"
    ADD CONSTRAINT "Assessment_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Assessment"
    ADD CONSTRAINT "Assessment_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Assessment"
    ADD CONSTRAINT "Assessment_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Assessment"
    ADD CONSTRAINT "Assessment_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Assessment <-> Topic many-to-many join table
CREATE TABLE IF NOT EXISTS "_AssessmentTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "_AssessmentTopics_AB_unique" ON "_AssessmentTopics"("A", "B");
CREATE INDEX IF NOT EXISTS "_AssessmentTopics_B_index" ON "_AssessmentTopics"("B");

DO $$ BEGIN
  ALTER TABLE "_AssessmentTopics"
    ADD CONSTRAINT "_AssessmentTopics_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_AssessmentTopics"
    ADD CONSTRAINT "_AssessmentTopics_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 5. Create EntryRemark table ──────────────────────────

CREATE TABLE IF NOT EXISTS "EntryRemark" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "remarkType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryRemark_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EntryRemark_entryId_createdAt_idx" ON "EntryRemark"("entryId", "createdAt");
CREATE INDEX IF NOT EXISTS "EntryRemark_authorId_idx" ON "EntryRemark"("authorId");

DO $$ BEGIN
  ALTER TABLE "EntryRemark"
    ADD CONSTRAINT "EntryRemark_entryId_fkey"
    FOREIGN KEY ("entryId") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EntryRemark"
    ADD CONSTRAINT "EntryRemark_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

-- ============================================================
-- DONE! Your database now supports:
--   ✓ School & Regional announcement broadcasts
--   ✓ Assessment tracking with results
--   ✓ Entry remarks (teacher reflections, HOD/admin reviews)
--   ✓ Assignment tracking fields on logbook entries
-- ============================================================
