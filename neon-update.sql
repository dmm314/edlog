-- ============================================================
-- neon-update.sql  —  Non-destructive updates for Neon database
-- Safe to run anytime. Uses WHERE clauses so it never drops data.
-- ============================================================

-- ── Update Regional Admin passwords to Edlog2026! ──────────
-- Hash: $2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m

UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_ad';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_ce';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_es';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_fn';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_lt';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_no';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_nw';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_su';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_sw';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_ou';

-- Also update demo accounts
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_demo_admin';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_demo_t1';
UPDATE "User" SET "passwordHash" = '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m' WHERE "id" = 'usr_demo_t2';

-- Ensure all regional admins are verified
UPDATE "User" SET "isVerified" = true WHERE "role" = 'REGIONAL_ADMIN';
