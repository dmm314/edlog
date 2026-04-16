-- ============================================================
-- Edlog Migration v5: Fix Notification table for announcements
-- Run this in Neon SQL Editor (console.neon.tech)
--
-- WHY: The Prisma schema added SCHOOL_ANNOUNCEMENT and
-- REGIONAL_ANNOUNCEMENT enum values plus senderRole/schoolId
-- columns, but no migration was created. This causes all
-- announcement broadcast endpoints to fail with:
--   "Failed to send announcement"
-- ============================================================

BEGIN;

-- ── 1. Add missing NotificationType enum values ───────────

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SCHOOL_ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REGIONAL_ANNOUNCEMENT';

COMMIT;

-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction
-- in older PostgreSQL versions. If the above fails, run each
-- ALTER TYPE statement separately outside a transaction block.

-- ── 2. Add missing columns to Notification table ──────────

ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "senderRole" TEXT;

ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

-- ============================================================
-- DONE! Announcements should now work for all roles:
--   ✓ Admin broadcasts (SCHOOL_ANNOUNCEMENT type)
--   ✓ Regional broadcasts (REGIONAL_ANNOUNCEMENT type)
--   ✓ HOD broadcasts (GENERAL type - already worked)
-- ============================================================
