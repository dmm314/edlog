-- ============================================================
-- Edlog Schema Update – Run this in your Neon SQL Editor
-- Adds: HOD system, multi-school teachers, teacher codes
-- ============================================================

BEGIN;

-- ── 1. Add new enum values ──────────────────────────────────

-- Add SCHOOL_INVITATION to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SCHOOL_INVITATION';

-- Create TeacherSchoolStatus enum
DO $$ BEGIN
  CREATE TYPE "TeacherSchoolStatus" AS ENUM ('PENDING', 'ACTIVE', 'REMOVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Add teacherCode column to User ───────────────────────

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teacherCode" TEXT;

-- Create unique index on teacherCode
CREATE UNIQUE INDEX IF NOT EXISTS "User_teacherCode_key" ON "User"("teacherCode");

-- ── 3. Create HeadOfDepartment table ────────────────────────

CREATE TABLE IF NOT EXISTS "HeadOfDepartment" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HeadOfDepartment_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint (one HOD per subject per school)
CREATE UNIQUE INDEX IF NOT EXISTS "HeadOfDepartment_schoolId_subjectId_key"
  ON "HeadOfDepartment"("schoolId", "subjectId");

-- Add indexes
CREATE INDEX IF NOT EXISTS "HeadOfDepartment_teacherId_idx"
  ON "HeadOfDepartment"("teacherId");
CREATE INDEX IF NOT EXISTS "HeadOfDepartment_schoolId_idx"
  ON "HeadOfDepartment"("schoolId");

-- Add foreign keys
DO $$ BEGIN
  ALTER TABLE "HeadOfDepartment"
    ADD CONSTRAINT "HeadOfDepartment_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "HeadOfDepartment"
    ADD CONSTRAINT "HeadOfDepartment_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "HeadOfDepartment"
    ADD CONSTRAINT "HeadOfDepartment_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. Create TeacherSchool table ───────────────────────────

CREATE TABLE IF NOT EXISTS "TeacherSchool" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "status" "TeacherSchoolStatus" NOT NULL DEFAULT 'PENDING',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "joinedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TeacherSchool_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint (one membership per teacher per school)
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherSchool_teacherId_schoolId_key"
  ON "TeacherSchool"("teacherId", "schoolId");

-- Add indexes
CREATE INDEX IF NOT EXISTS "TeacherSchool_teacherId_idx"
  ON "TeacherSchool"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherSchool_schoolId_idx"
  ON "TeacherSchool"("schoolId");

-- Add foreign keys
DO $$ BEGIN
  ALTER TABLE "TeacherSchool"
    ADD CONSTRAINT "TeacherSchool_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TeacherSchool"
    ADD CONSTRAINT "TeacherSchool_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 5. Generate teacher codes for existing teachers ─────────
-- This gives every existing teacher a unique TCH-XXXXXX code

DO $$
DECLARE
  r RECORD;
  new_code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INT;
  attempts INT;
BEGIN
  FOR r IN SELECT id FROM "User" WHERE role = 'TEACHER' AND "teacherCode" IS NULL LOOP
    attempts := 0;
    LOOP
      new_code := 'TCH-';
      FOR i IN 1..6 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      -- Check uniqueness
      IF NOT EXISTS (SELECT 1 FROM "User" WHERE "teacherCode" = new_code) THEN
        UPDATE "User" SET "teacherCode" = new_code WHERE id = r.id;
        EXIT;
      END IF;
      attempts := attempts + 1;
      IF attempts > 20 THEN
        -- Fallback: use timestamp-based code
        new_code := 'TCH-' || upper(substr(md5(r.id || now()::text), 1, 6));
        UPDATE "User" SET "teacherCode" = new_code WHERE id = r.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ── 6. Create TeacherSchool records for existing teachers ───
-- This ensures all current teacher-school relationships are tracked

INSERT INTO "TeacherSchool" ("id", "teacherId", "schoolId", "status", "isPrimary", "joinedAt", "createdAt")
SELECT
  'ts-' || substr(md5(u.id || u."schoolId"), 1, 20),
  u.id,
  u."schoolId",
  'ACTIVE'::"TeacherSchoolStatus",
  true,
  u."createdAt",
  CURRENT_TIMESTAMP
FROM "User" u
WHERE u.role = 'TEACHER'
  AND u."schoolId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "TeacherSchool" ts
    WHERE ts."teacherId" = u.id AND ts."schoolId" = u."schoolId"
  );

COMMIT;

-- ============================================================
-- DONE! Your database now supports:
--   ✓ Head of Department (HOD) assignments
--   ✓ Multi-school teacher memberships
--   ✓ Teacher invitation system (via teacherCode)
--   ✓ All existing teachers have unique codes
--   ✓ All existing teacher-school links are preserved
-- ============================================================
