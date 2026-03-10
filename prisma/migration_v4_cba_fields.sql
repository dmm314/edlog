-- Migration: Add CBA (Competency-Based Approach) fields to LogbookEntry
-- Run this against your production database to fix entry creation failures.

ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "familyOfSituation" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "bilingualActivity" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "bilingualType" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "bilingualNote" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "integrationActivity" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "integrationLevel" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "integrationStatus" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "lessonMode" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "digitalTools" TEXT[] DEFAULT '{}';
