-- ============================================================
-- Edlog Migration v3: Add `levels` column to SubjectDivision
-- Run this in Neon SQL Editor (console.neon.tech)
--
-- WHY: The Prisma schema has `levels String[]` on SubjectDivision
-- but the database table was created without it. This causes:
--   "SubjectDivision.levels does not exist in the current database"
-- when creating or reading divisions.
-- ============================================================

BEGIN;

-- Add the levels column (PostgreSQL text array, defaults to empty)
ALTER TABLE "SubjectDivision"
  ADD COLUMN IF NOT EXISTS "levels" TEXT[] NOT NULL DEFAULT '{}';

COMMIT;

-- ============================================================
-- DONE! Divisions should now work. The `levels` field stores
-- which class levels a division applies to, e.g.:
--   ["Lower Sixth", "Upper Sixth"]  = Second Cycle only
--   ["Form 4", "Form 5"]            = Forms 4-5 only
--   {} (empty)                       = All levels
-- ============================================================
