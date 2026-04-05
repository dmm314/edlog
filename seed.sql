-- ============================================================
-- Edlog – Legacy Seed Data (use neon-seed.sql for production)
-- This file is kept for backwards compatibility.
-- For a full reset: run neon-reset.sql then neon-seed.sql
-- ============================================================

-- Redirect to the canonical seed file
\echo 'NOTE: This file is deprecated. Use neon-seed.sql instead.'
\echo 'Run: neon-reset.sql (schema) then neon-seed.sql (data)'
\i neon-seed.sql
