-- ============================================================
-- Migration V6: Convert objectives column from TEXT to JSONB
--
-- WHY: The Prisma schema changed objectives from String? to Json?
-- but no migration was created. This causes all entry queries to
-- fail with "Failed to fetch entries" because Prisma generates
-- JSONB queries against a TEXT column.
--
-- Run this in your Neon SQL Editor (console.neon.tech)
-- ============================================================

-- Safely convert TEXT to JSONB, handling both:
--   - Plain strings (legacy): "Teach addition" → "Teach addition" (JSON string)
--   - JSON arrays (new): [{"text":"...","proportion":"all"}] → kept as-is
ALTER TABLE "LogbookEntry"
  ALTER COLUMN "objectives" TYPE JSONB
  USING CASE
    WHEN objectives IS NULL THEN NULL
    WHEN objectives::text ~ '^\s*\[' THEN objectives::jsonb
    ELSE to_jsonb(objectives::text)
  END;
