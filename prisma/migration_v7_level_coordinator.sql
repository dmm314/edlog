-- ============================================================
-- Migration v7: Level Coordinator (VP) table
--               + LogbookEntry verified-by fields
-- Safe to re-run (all statements are idempotent)
-- ============================================================

-- 1. Create the LevelCoordinator table
CREATE TABLE IF NOT EXISTS "LevelCoordinator" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "schoolId"  TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "levels"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "canVerify" BOOLEAN NOT NULL DEFAULT true,
    "canRemark" BOOLEAN NOT NULL DEFAULT true,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LevelCoordinator_pkey" PRIMARY KEY ("id")
);

-- 2. Unique constraint: one coordinator record per user per school
DO $$ BEGIN
    ALTER TABLE "LevelCoordinator" ADD CONSTRAINT "LevelCoordinator_userId_schoolId_key" UNIQUE ("userId", "schoolId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS "LevelCoordinator_schoolId_idx" ON "LevelCoordinator"("schoolId");
CREATE INDEX IF NOT EXISTS "LevelCoordinator_userId_idx"   ON "LevelCoordinator"("userId");

-- 4. Foreign keys
DO $$ BEGIN
    ALTER TABLE "LevelCoordinator" ADD CONSTRAINT "LevelCoordinator_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "LevelCoordinator" ADD CONSTRAINT "LevelCoordinator_schoolId_fkey"
        FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Add verified-by fields to LogbookEntry (coordinator verification metadata)
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "verifiedById"    TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "verifiedByName"  TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "verifiedByTitle" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "verifiedAt"      TIMESTAMP(3);

-- 6. Foreign key for verifiedById
DO $$ BEGIN
    ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_verifiedById_fkey"
        FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
