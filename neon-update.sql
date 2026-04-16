-- ============================================================
-- neon-update.sql  —  Non-destructive updates for Neon database
-- Safe to run anytime. Uses ON CONFLICT / WHERE clauses so it
-- never drops data — only inserts missing rows or patches values.
-- ============================================================

-- ── Fix Regional Admin password hashes ─────────────────────
-- Passwords: {RegionName}@2024  (e.g. SouthWest@2024)
-- All hashes verified with bcryptjs round-trip.

UPDATE "User" SET "passwordHash" = '$2b$12$3Bw9WLAxSeywG.wcjs4AkeFGk2A9X4.28gKdDrsCtD3MhTFdQAJzu' WHERE "id" = 'usr_ad';  -- Adamawa@2024
UPDATE "User" SET "passwordHash" = '$2b$12$XpLoBsEDsld.ZjXM0K.ApeeDkEOVxp7uC9QsWDBjIXp9qo3aJE5lK' WHERE "id" = 'usr_ce';  -- Centre@2024
UPDATE "User" SET "passwordHash" = '$2b$12$DQVC0TdZTMk1fhyFU.MzFudALnR2kMe5y7ZCLzm3wWQDvrhcWsYwW' WHERE "id" = 'usr_es';  -- East@2024
UPDATE "User" SET "passwordHash" = '$2b$12$TdKMORfn245MHgOgSv04BurDr5G1TnAaBfB/hJjpsWVf95sh0janq' WHERE "id" = 'usr_fn';  -- FarNorth@2024
UPDATE "User" SET "passwordHash" = '$2b$12$ELS.GMDA7Ea0tVsIAoLfD.qy.EKRfTduxv6tm8JW8zBRCfM.ip/EK' WHERE "id" = 'usr_lt';  -- Littoral@2024
UPDATE "User" SET "passwordHash" = '$2b$12$c01Tf6luTGBi9V5lrtQ.ne1ktL8pEDKuQjpYEjdyv8ZqmnmkblmnO' WHERE "id" = 'usr_no';  -- North@2024
UPDATE "User" SET "passwordHash" = '$2b$12$9ogdZJ7HEAhIAXyqnsBdcONfJzR4emIGUI1U1J9nnp2T0ABoCxZCq' WHERE "id" = 'usr_nw';  -- NorthWest@2024
UPDATE "User" SET "passwordHash" = '$2b$12$ppQvCgOZHIMuGMFUD1n8M.HnWrcqs1XGMqg1ur9B3Fo1koqpRDesa' WHERE "id" = 'usr_su';  -- South@2024
UPDATE "User" SET "passwordHash" = '$2b$12$rAyxzd06QxwzcmYNOYwXjuuIZxcu6K.XA8mFFrWW52IQFxWi.cEuy' WHERE "id" = 'usr_sw';  -- SouthWest@2024
UPDATE "User" SET "passwordHash" = '$2b$12$hQ3KNDJeQQCIGF2i5003uuGnfyHg.OrgwZl31laek8EnVMHCIgdoW' WHERE "id" = 'usr_ou';  -- West@2024

-- Ensure all regional admins are verified
UPDATE "User" SET "isVerified" = true WHERE "role" = 'REGIONAL_ADMIN';
