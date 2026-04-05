-- ============================================================
-- EDLOG: SEED DATA
-- Run AFTER neon-reset.sql. Safe to rerun (ON CONFLICT DO NOTHING).
--
-- Seeds:
--   1. 10 Cameroon regions + 58 divisions
--   2. 10 regional admin accounts (one per region)
--   3. 1 demo school + admin + 2 teachers
--   4. Subjects & topics (run neon-subjects.sql for full curriculum)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. REGIONS & DIVISIONS (Cameroon's 10 administrative regions)
-- ============================================================

-- Adamawa
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_ad', 'Adamawa', 'AD', 'Ngaoundere')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_ad_1', 'Djerem', 'reg_ad'), ('div_ad_2', 'Faro-et-Deo', 'reg_ad'),
  ('div_ad_3', 'Mayo-Banyo', 'reg_ad'), ('div_ad_4', 'Mbere', 'reg_ad'),
  ('div_ad_5', 'Vina', 'reg_ad')
  ON CONFLICT ("id") DO NOTHING;

-- Centre
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_ce', 'Centre', 'CE', 'Yaounde')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_ce_1', 'Haute-Sanaga', 'reg_ce'), ('div_ce_2', 'Lekie', 'reg_ce'),
  ('div_ce_3', 'Mbam-et-Inoubou', 'reg_ce'), ('div_ce_4', 'Mbam-et-Kim', 'reg_ce'),
  ('div_ce_5', 'Mefou-et-Afamba', 'reg_ce'), ('div_ce_6', 'Mefou-et-Akono', 'reg_ce'),
  ('div_ce_7', 'Mfoundi', 'reg_ce'), ('div_ce_8', 'Nyong-et-Kelle', 'reg_ce'),
  ('div_ce_9', 'Nyong-et-Mfoumou', 'reg_ce'), ('div_ce_10', 'Nyong-et-Soo', 'reg_ce')
  ON CONFLICT ("id") DO NOTHING;

-- East
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_es', 'East', 'ES', 'Bertoua')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_es_1', 'Boumba-et-Ngoko', 'reg_es'), ('div_es_2', 'Haut-Nyong', 'reg_es'),
  ('div_es_3', 'Kadey', 'reg_es'), ('div_es_4', 'Lom-et-Djerem', 'reg_es')
  ON CONFLICT ("id") DO NOTHING;

-- Far North
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_fn', 'Far North', 'FN', 'Maroua')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_fn_1', 'Diamare', 'reg_fn'), ('div_fn_2', 'Logone-et-Chari', 'reg_fn'),
  ('div_fn_3', 'Mayo-Danay', 'reg_fn'), ('div_fn_4', 'Mayo-Kani', 'reg_fn'),
  ('div_fn_5', 'Mayo-Sava', 'reg_fn'), ('div_fn_6', 'Mayo-Tsanaga', 'reg_fn')
  ON CONFLICT ("id") DO NOTHING;

-- Littoral
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_lt', 'Littoral', 'LT', 'Douala')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_lt_1', 'Moungo', 'reg_lt'), ('div_lt_2', 'Nkam', 'reg_lt'),
  ('div_lt_3', 'Sanaga-Maritime', 'reg_lt'), ('div_lt_4', 'Wouri', 'reg_lt')
  ON CONFLICT ("id") DO NOTHING;

-- North
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_no', 'North', 'NO', 'Garoua')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_no_1', 'Benoue', 'reg_no'), ('div_no_2', 'Faro', 'reg_no'),
  ('div_no_3', 'Mayo-Louti', 'reg_no'), ('div_no_4', 'Mayo-Rey', 'reg_no')
  ON CONFLICT ("id") DO NOTHING;

-- Northwest
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_nw', 'Northwest', 'NW', 'Bamenda')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_nw_1', 'Boyo', 'reg_nw'), ('div_nw_2', 'Bui', 'reg_nw'),
  ('div_nw_3', 'Donga-Mantung', 'reg_nw'), ('div_nw_4', 'Menchum', 'reg_nw'),
  ('div_nw_5', 'Mezam', 'reg_nw'), ('div_nw_6', 'Momo', 'reg_nw'),
  ('div_nw_7', 'Ngo-Ketunjia', 'reg_nw')
  ON CONFLICT ("id") DO NOTHING;

-- South
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_su', 'South', 'SU', 'Ebolowa')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_su_1', 'Dja-et-Lobo', 'reg_su'), ('div_su_2', 'Mvila', 'reg_su'),
  ('div_su_3', 'Ocean', 'reg_su'), ('div_su_4', 'Vallee-du-Ntem', 'reg_su')
  ON CONFLICT ("id") DO NOTHING;

-- Southwest
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_sw', 'Southwest', 'SW', 'Buea')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_sw_1', 'Fako', 'reg_sw'), ('div_sw_2', 'Koupe-Manengouba', 'reg_sw'),
  ('div_sw_3', 'Lebialem', 'reg_sw'), ('div_sw_4', 'Manyu', 'reg_sw'),
  ('div_sw_5', 'Meme', 'reg_sw'), ('div_sw_6', 'Ndian', 'reg_sw')
  ON CONFLICT ("id") DO NOTHING;

-- West
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_ou', 'West', 'OU', 'Bafoussam')
  ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Division" ("id", "name", "regionId") VALUES
  ('div_ou_1', 'Bamboutos', 'reg_ou'), ('div_ou_2', 'Haut-Nkam', 'reg_ou'),
  ('div_ou_3', 'Hauts-Plateaux', 'reg_ou'), ('div_ou_4', 'Koung-Khi', 'reg_ou'),
  ('div_ou_5', 'Menoua', 'reg_ou'), ('div_ou_6', 'Mifi', 'reg_ou'),
  ('div_ou_7', 'Nde', 'reg_ou'), ('div_ou_8', 'Noun', 'reg_ou')
  ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 2. REGIONAL ADMIN ACCOUNTS (one per region)
--    Password for ALL: Edlog2026!
--    Hash: $2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m
-- ============================================================

INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "role", "isVerified", "updatedAt", "regionId", "gender") VALUES
  ('usr_ad', 'adamawa@edlog.cm',   '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Aissatou',    'Mohammadou',   'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_ad', 'FEMALE'),
  ('usr_ce', 'centre@edlog.cm',    '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Jean-Pierre', 'Atangana',     'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_ce', 'MALE'),
  ('usr_es', 'east@edlog.cm',      '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Helene',      'Mbassi',       'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_es', 'FEMALE'),
  ('usr_fn', 'farnorth@edlog.cm',  '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Oumarou',     'Boukar',       'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_fn', 'MALE'),
  ('usr_lt', 'littoral@edlog.cm',  '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Christelle',  'Douala-Bell',  'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_lt', 'FEMALE'),
  ('usr_no', 'north@edlog.cm',     '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Abdoulaye',   'Hamadou',      'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_no', 'MALE'),
  ('usr_nw', 'northwest@edlog.cm', '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Comfort',     'Ngwa',         'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_nw', 'FEMALE'),
  ('usr_su', 'south@edlog.cm',     '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Marie-Claire','Oyono',        'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_su', 'FEMALE'),
  ('usr_sw', 'southwest@edlog.cm', '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Peter',       'Enoh Mbi',     'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_sw', 'MALE'),
  ('usr_ou', 'west@edlog.cm',      '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Bernadette',  'Tchouankam',   'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_ou', 'FEMALE')
ON CONFLICT ("id") DO NOTHING;

-- ============================================================
-- 3. DEMO SCHOOL (Lycee Bilingue de Buea)
-- ============================================================

-- Demo School Admin: admin@edlog.cm / Edlog2026!
INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "role", "isVerified", "updatedAt", "gender") VALUES
  ('usr_demo_admin', 'admin@edlog.cm', '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Brayan', 'Lontchi', 'SCHOOL_ADMIN', true, CURRENT_TIMESTAMP, 'MALE')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "School" ("id", "name", "code", "schoolType", "status", "profileComplete", "regionId", "divisionId", "adminId", "updatedAt") VALUES
  ('sch_demo', 'Lycee Bilingue de Buea', 'EDL-LBB01', 'Government', 'ACTIVE', true, 'reg_sw', 'div_sw_1', 'usr_demo_admin', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Link admin to school
UPDATE "User" SET "schoolId" = 'sch_demo' WHERE "id" = 'usr_demo_admin' AND "schoolId" IS NULL;

-- Demo Teachers
INSERT INTO "User" ("id", "email", "teacherCode", "passwordHash", "firstName", "lastName", "role", "isVerified", "updatedAt", "schoolId", "gender") VALUES
  ('usr_demo_t1', 'darren@edlog.cm', 'TCH-DRN001', '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Darren', 'Monyongo', 'TEACHER', true, CURRENT_TIMESTAMP, 'sch_demo', 'MALE'),
  ('usr_demo_t2', 'brayan@edlog.cm', 'TCH-BRY001', '$2b$12$IirM3v89EmpM5Kad0H0sfezQZV7yT6SFK7CnIypuRyyJzSfBg010m', 'Brayan', 'Lontchi Jr', 'TEACHER', true, CURRENT_TIMESTAMP, 'sch_demo', 'MALE')
ON CONFLICT ("id") DO NOTHING;

-- Teacher-School memberships
INSERT INTO "TeacherSchool" ("id", "teacherId", "schoolId", "status", "isPrimary", "joinedAt") VALUES
  ('ts_demo_t1', 'usr_demo_t1', 'sch_demo', 'ACTIVE', true, CURRENT_TIMESTAMP),
  ('ts_demo_t2', 'usr_demo_t2', 'sch_demo', 'ACTIVE', true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Demo Classes (2025)
INSERT INTO "Class" ("id", "name", "abbreviation", "level", "stream", "section", "year", "schoolId") VALUES
  ('cls_f1a', 'Form 1 A',              'F1A',   'Form 1',       'General', 'A', 2025, 'sch_demo'),
  ('cls_f2a', 'Form 2 A',              'F2A',   'Form 2',       'General', 'A', 2025, 'sch_demo'),
  ('cls_f3a', 'Form 3 A',              'F3A',   'Form 3',       'General', 'A', 2025, 'sch_demo'),
  ('cls_f4s', 'Form 4 Science',        'F4S',   'Form 4',       'Science', NULL, 2025, 'sch_demo'),
  ('cls_f4a', 'Form 4 Arts',           'F4A',   'Form 4',       'Arts',    NULL, 2025, 'sch_demo'),
  ('cls_f5s', 'Form 5 Science A',      'F5SA',  'Form 5',       'Science', 'A', 2025, 'sch_demo'),
  ('cls_f5sb','Form 5 Science B',      'F5SB',  'Form 5',       'Science', 'B', 2025, 'sch_demo'),
  ('cls_f5a', 'Form 5 Arts',           'F5A',   'Form 5',       'Arts',    NULL, 2025, 'sch_demo'),
  ('cls_lss', 'Lower Sixth Science',   'LSS',   'Lower Sixth',  'Science', NULL, 2025, 'sch_demo'),
  ('cls_lsa', 'Lower Sixth Arts',      'LSA',   'Lower Sixth',  'Arts',    NULL, 2025, 'sch_demo'),
  ('cls_uss', 'Upper Sixth Science',   'USS',   'Upper Sixth',  'Science', NULL, 2025, 'sch_demo'),
  ('cls_usa', 'Upper Sixth Arts',      'USA',   'Upper Sixth',  'Arts',    NULL, 2025, 'sch_demo')
ON CONFLICT ("id") DO NOTHING;

-- Period Schedule (8-period day)
INSERT INTO "PeriodSchedule" ("id", "schoolId", "periodNum", "label", "startTime", "endTime") VALUES
  ('ps_1', 'sch_demo', 1, 'Period 1', '07:30', '08:30'),
  ('ps_2', 'sch_demo', 2, 'Period 2', '08:30', '09:30'),
  ('ps_3', 'sch_demo', 3, 'Period 3', '09:45', '10:45'),
  ('ps_4', 'sch_demo', 4, 'Period 4', '10:45', '11:45'),
  ('ps_5', 'sch_demo', 5, 'Period 5', '12:30', '13:30'),
  ('ps_6', 'sch_demo', 6, 'Period 6', '13:30', '14:30'),
  ('ps_7', 'sch_demo', 7, 'Period 7', '14:45', '15:45'),
  ('ps_8', 'sch_demo', 8, 'Period 8', '15:45', '16:45')
ON CONFLICT ("id") DO NOTHING;

COMMIT;

-- ============================================================
-- DONE! Base data seeded:
--   10 regions, 58 divisions
--   10 regional admin accounts (password: Edlog2026!)
--   1 demo school + admin + 2 teachers (password: Edlog2026!)
--   12 classes, 8-period schedule
--
-- Regional Admin Accounts:
--   adamawa@edlog.cm    | Edlog2026!
--   centre@edlog.cm     | Edlog2026!
--   east@edlog.cm       | Edlog2026!
--   farnorth@edlog.cm   | Edlog2026!
--   littoral@edlog.cm   | Edlog2026!
--   north@edlog.cm      | Edlog2026!
--   northwest@edlog.cm  | Edlog2026!
--   south@edlog.cm      | Edlog2026!
--   southwest@edlog.cm  | Edlog2026!
--   west@edlog.cm       | Edlog2026!
--
-- Demo Accounts:
--   admin@edlog.cm      | Edlog2026! (School Admin)
--   darren@edlog.cm     | Edlog2026! (Teacher)
--   brayan@edlog.cm     | Edlog2026! (Teacher)
--
-- Next: Run neon-subjects.sql for full curriculum data.
-- ============================================================
