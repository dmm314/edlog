-- ============================================================
-- Edlog – PostgreSQL Seed Data
-- Updated to match current schema (Region/Division geography)
-- ============================================================

BEGIN;

-- ── Regions (Cameroon) ────────────────────────────────────
INSERT INTO "Region" ("id", "name", "code", "capital", "createdAt")
VALUES
  ('region-centre', 'Centre', 'CE', 'Yaoundé', CURRENT_TIMESTAMP),
  ('region-littoral', 'Littoral', 'LT', 'Douala', CURRENT_TIMESTAMP),
  ('region-west', 'West', 'OU', 'Bafoussam', CURRENT_TIMESTAMP),
  ('region-northwest', 'North-West', 'NW', 'Bamenda', CURRENT_TIMESTAMP),
  ('region-southwest', 'South-West', 'SW', 'Buea', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- ── Divisions ─────────────────────────────────────────────
INSERT INTO "Division" ("id", "name", "regionId", "createdAt")
VALUES
  ('div-mfoundi',   'Mfoundi',   'region-centre',   CURRENT_TIMESTAMP),
  ('div-wouri',     'Wouri',     'region-littoral',  CURRENT_TIMESTAMP),
  ('div-mifi',      'Mifi',      'region-west',      CURRENT_TIMESTAMP),
  ('div-mezam',     'Mezam',     'region-northwest',  CURRENT_TIMESTAMP),
  ('div-fako',      'Fako',      'region-southwest',  CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- ── School ────────────────────────────────────────────────
INSERT INTO "School" ("id", "name", "code", "status", "profileComplete", "createdAt", "updatedAt", "regionId", "divisionId", "adminId")
VALUES (
  'school-lby-001',
  'Lycée Bilingue de Yaoundé',
  'LBY-001',
  'ACTIVE',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'region-centre',
  'div-mfoundi',
  NULL
)
ON CONFLICT ("id") DO NOTHING;

-- ── Admin User ────────────────────────────────────────────
INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "phone", "role", "isVerified", "createdAt", "updatedAt", "schoolId")
VALUES (
  'user-admin-001',
  'admin@edlog.cm',
  '$2b$12$y.uwUXpuvKfQQmTmfQh9KeE/KH4P4x3vXRZhrACIXouF7WBcjqlKS',
  'Brayan',
  'Lontchi',
  NULL,
  'SCHOOL_ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'school-lby-001'
)
ON CONFLICT ("id") DO NOTHING;

-- Link admin to school
UPDATE "School"
SET "adminId" = 'user-admin-001'
WHERE "id" = 'school-lby-001';

-- ── Regional Admin ────────────────────────────────────────
INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "phone", "role", "isVerified", "createdAt", "updatedAt", "regionId")
VALUES (
  'user-regional-001',
  'regional@edlog.cm',
  '$2b$12$y.uwUXpuvKfQQmTmfQh9KeE/KH4P4x3vXRZhrACIXouF7WBcjqlKS',
  'Marie',
  'Nkomo',
  NULL,
  'REGIONAL_ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'region-centre'
)
ON CONFLICT ("id") DO NOTHING;

-- ── Demo Teacher ──────────────────────────────────────────
INSERT INTO "User" ("id", "email", "teacherCode", "passwordHash", "firstName", "lastName", "phone", "role", "isVerified", "createdAt", "updatedAt", "schoolId")
VALUES (
  'user-teacher-001',
  'teacher@edlog.cm',
  'TCH-D3M0T1',
  '$2b$12$y.uwUXpuvKfQQmTmfQh9KeE/KH4P4x3vXRZhrACIXouF7WBcjqlKS',
  'Darren',
  'Monyongo',
  NULL,
  'TEACHER',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'school-lby-001'
)
ON CONFLICT ("id") DO NOTHING;

-- ── TeacherSchool membership ──────────────────────────────
INSERT INTO "TeacherSchool" ("id", "teacherId", "schoolId", "status", "isPrimary", "joinedAt", "createdAt")
VALUES (
  'ts-teacher-001-lby',
  'user-teacher-001',
  'school-lby-001',
  'ACTIVE',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- ── Classes (year 2025) ───────────────────────────────────
INSERT INTO "Class" ("id", "name", "level", "stream", "section", "year", "createdAt", "schoolId") VALUES
  ('class-f5-sci-a',     'Form 5 Science A',     'Form 5',       'Science', 'A',  2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-f5-sci-b',     'Form 5 Science B',     'Form 5',       'Science', 'B',  2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-f5-arts',      'Form 5 Arts',          'Form 5',       'Arts',    NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-ls-sci',       'Lower Sixth Science',  'Lower Sixth',  'Science', NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-ls-arts',      'Lower Sixth Arts',     'Lower Sixth',  'Arts',    NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-us-sci',       'Upper Sixth Science',  'Upper Sixth',  'Science', NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-us-arts',      'Upper Sixth Arts',     'Upper Sixth',  'Arts',    NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001')
ON CONFLICT ("id") DO NOTHING;

-- ── Subjects ──────────────────────────────────────────────
INSERT INTO "Subject" ("id", "name", "code", "category", "createdAt") VALUES
  ('subject-phy', 'Physics',             'PHY', 'Science',  CURRENT_TIMESTAMP),
  ('subject-mat', 'Mathematics',         'MAT', 'Science',  CURRENT_TIMESTAMP),
  ('subject-che', 'Chemistry',           'CHE', 'Science',  CURRENT_TIMESTAMP),
  ('subject-fma', 'Further Mathematics', 'FMA', 'Science',  CURRENT_TIMESTAMP),
  ('subject-csc', 'Computer Science',    'CSC', 'Science',  CURRENT_TIMESTAMP),
  ('subject-eng', 'English Language',    'ENG', 'Language', CURRENT_TIMESTAMP),
  ('subject-fre', 'French',             'FRE', 'Language', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- ── Topics ────────────────────────────────────────────────
-- Now includes classLevel (required field).
-- Topics are scoped to a class level so syllabus differs by Form/Sixth.

INSERT INTO "Topic" ("id", "name", "classLevel", "moduleName", "moduleNum", "orderIndex", "createdAt", "subjectId") VALUES
  -- ── Physics (Form 5) ──
  ('topic-phy-kinematics',       'Kinematics',                   'Form 5', 'Mechanics',            1,  0,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-newton',           'Newton''s Laws of Motion',     'Form 5', 'Mechanics',            1,  1,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-work-energy',      'Work Energy & Power',          'Form 5', 'Mechanics',            1,  2,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-momentum',         'Momentum & Collisions',        'Form 5', 'Mechanics',            1,  3,  CURRENT_TIMESTAMP, 'subject-phy'),
  -- Physics (Lower Sixth)
  ('topic-phy-circular',         'Circular Motion',              'Lower Sixth', 'Rotational Mechanics', 2,  4,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-gravity',          'Gravitational Fields',         'Lower Sixth', 'Fields',               3,  5,  CURRENT_TIMESTAMP, 'subject-phy'),
  -- Physics (Upper Sixth)
  ('topic-phy-elec-fields',      'Electric Fields',              'Upper Sixth', 'Electricity',          4,  6,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-current',          'Current Electricity',          'Upper Sixth', 'Electricity',          4,  7,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-em-induction',     'Electromagnetic Induction',    'Upper Sixth', 'Electricity',          4,  8,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-wave-motion',      'Wave Motion',                  'Form 5', 'Waves & Optics',       5,  9,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-light',            'Light & Optics',               'Form 5', 'Waves & Optics',       5,  10, CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-thermal',          'Thermal Physics',              'Lower Sixth', 'Thermal Physics',      6,  11, CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-nuclear',          'Nuclear Physics',              'Upper Sixth', 'Modern Physics',       7,  12, CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-radioactivity',    'Radioactivity',                'Upper Sixth', 'Modern Physics',       7,  13, CURRENT_TIMESTAMP, 'subject-phy'),

  -- ── Mathematics (Form 5) ──
  ('topic-mat-algebra',          'Algebra & Polynomials',        'Form 5', 'Pure Mathematics',     1,  14, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-trig',             'Trigonometry',                 'Form 5', 'Pure Mathematics',     1,  15, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-coord',            'Coordinate Geometry',          'Form 5', 'Pure Mathematics',     1,  16, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-sequences',        'Sequences & Series',           'Form 5', 'Pure Mathematics',     1,  17, CURRENT_TIMESTAMP, 'subject-mat'),
  -- Mathematics (Lower Sixth)
  ('topic-mat-diff',             'Differentiation',              'Lower Sixth', 'Calculus',             2,  18, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-integ',            'Integration',                  'Lower Sixth', 'Calculus',             2,  19, CURRENT_TIMESTAMP, 'subject-mat'),
  -- Mathematics (Upper Sixth)
  ('topic-mat-vectors',          'Vectors',                      'Upper Sixth', 'Vectors & Mechanics',  3,  20, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-stats',            'Statistics & Probability',     'Upper Sixth', 'Statistics',           4,  21, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-mechanics',        'Mechanics',                    'Upper Sixth', 'Applied Mathematics',  5,  22, CURRENT_TIMESTAMP, 'subject-mat'),

  -- ── Chemistry (Form 5) ──
  ('topic-che-atomic',           'Atomic Structure',             'Form 5', 'Physical Chemistry',   1,  23, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-bonding',          'Chemical Bonding',             'Form 5', 'Physical Chemistry',   1,  24, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-stoich',           'Stoichiometry',                'Form 5', 'Physical Chemistry',   1,  25, CURRENT_TIMESTAMP, 'subject-che'),
  -- Chemistry (Lower Sixth)
  ('topic-che-energetics',       'Energetics & Thermochemistry', 'Lower Sixth', 'Physical Chemistry',   1,  26, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-kinetics',         'Reaction Kinetics',            'Lower Sixth', 'Physical Chemistry',   1,  27, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-equilibrium',      'Chemical Equilibrium',         'Lower Sixth', 'Physical Chemistry',   1,  28, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-electrochem',      'Electrochemistry',             'Lower Sixth', 'Physical Chemistry',   1,  29, CURRENT_TIMESTAMP, 'subject-che'),
  -- Chemistry (Upper Sixth)
  ('topic-che-hydrocarbons',     'Hydrocarbons',                 'Upper Sixth', 'Organic Chemistry',    2,  30, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-functional',       'Functional Groups',            'Upper Sixth', 'Organic Chemistry',    2,  31, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-periodic',         'Periodic Table & Trends',      'Upper Sixth', 'Inorganic Chemistry',  3,  32, CURRENT_TIMESTAMP, 'subject-che'),

  -- ── Further Mathematics (Lower Sixth) ──
  ('topic-fma-complex',          'Complex Numbers',              'Lower Sixth', 'Pure Mathematics',     1,  33, CURRENT_TIMESTAMP, 'subject-fma'),
  ('topic-fma-matrices',         'Matrices & Transformations',   'Lower Sixth', 'Pure Mathematics',     1,  34, CURRENT_TIMESTAMP, 'subject-fma'),
  ('topic-fma-proof',            'Proof & Logic',                'Lower Sixth', 'Pure Mathematics',     1,  35, CURRENT_TIMESTAMP, 'subject-fma'),
  ('topic-fma-hyperbolic',       'Hyperbolic Functions',         'Lower Sixth', 'Pure Mathematics',     1,  36, CURRENT_TIMESTAMP, 'subject-fma'),
  -- Further Mathematics (Upper Sixth)
  ('topic-fma-diffeq',           'Differential Equations',       'Upper Sixth', 'Calculus',             2,  37, CURRENT_TIMESTAMP, 'subject-fma'),
  ('topic-fma-numerical',        'Numerical Methods',            'Upper Sixth', 'Applied',              3,  38, CURRENT_TIMESTAMP, 'subject-fma'),

  -- ── Computer Science (Form 5) ──
  ('topic-csc-data-rep',         'Data Representation',          'Form 5', 'Fundamentals',         1,  39, CURRENT_TIMESTAMP, 'subject-csc'),
  ('topic-csc-programming',      'Programming Concepts',         'Form 5', 'Programming',          2,  40, CURRENT_TIMESTAMP, 'subject-csc'),
  -- Computer Science (Lower Sixth)
  ('topic-csc-algorithms',       'Algorithms & Data Structures', 'Lower Sixth', 'Computer Science',     3,  41, CURRENT_TIMESTAMP, 'subject-csc'),
  ('topic-csc-architecture',     'Computer Architecture',        'Lower Sixth', 'Hardware',             4,  42, CURRENT_TIMESTAMP, 'subject-csc'),
  -- Computer Science (Upper Sixth)
  ('topic-csc-networking',       'Networking',                   'Upper Sixth', 'Networks',             5,  43, CURRENT_TIMESTAMP, 'subject-csc'),
  ('topic-csc-databases',        'Databases',                    'Upper Sixth', 'Data Management',      6,  44, CURRENT_TIMESTAMP, 'subject-csc'),

  -- ── English Language (Form 5) ──
  ('topic-eng-comprehension',    'Comprehension & Summary',      'Form 5', 'Reading',              1,  45, CURRENT_TIMESTAMP, 'subject-eng'),
  ('topic-eng-essay',            'Essay Writing',                'Form 5', 'Writing',              2,  46, CURRENT_TIMESTAMP, 'subject-eng'),
  ('topic-eng-grammar',          'Grammar & Usage',              'Form 5', 'Language',             3,  47, CURRENT_TIMESTAMP, 'subject-eng'),
  -- English Language (Lower/Upper Sixth)
  ('topic-eng-prose',            'Prose',                        'Lower Sixth', 'Literature',           4,  48, CURRENT_TIMESTAMP, 'subject-eng'),
  ('topic-eng-poetry',           'Poetry',                       'Upper Sixth', 'Literature',           4,  49, CURRENT_TIMESTAMP, 'subject-eng'),
  ('topic-eng-drama',            'Drama',                        'Upper Sixth', 'Literature',           4,  50, CURRENT_TIMESTAMP, 'subject-eng'),

  -- ── French (Form 5) ──
  ('topic-fre-comprehension',    'Compréhension écrite',         'Form 5', 'Lecture',              1,  51, CURRENT_TIMESTAMP, 'subject-fre'),
  ('topic-fre-expression',       'Expression écrite',            'Form 5', 'Écriture',             2,  52, CURRENT_TIMESTAMP, 'subject-fre'),
  ('topic-fre-grammaire',        'Grammaire',                    'Form 5', 'Langue',               3,  53, CURRENT_TIMESTAMP, 'subject-fre'),
  -- French (Lower Sixth)
  ('topic-fre-oral',             'Compréhension orale',          'Lower Sixth', 'Oral',                 4,  54, CURRENT_TIMESTAMP, 'subject-fre'),
  -- French (Upper Sixth)
  ('topic-fre-litterature',      'Littérature',                  'Upper Sixth', 'Littérature',          5,  55, CURRENT_TIMESTAMP, 'subject-fre')
ON CONFLICT ("id") DO NOTHING;

-- ── School ↔ Subject links ───────────────────────────────
INSERT INTO "SchoolSubject" ("id", "schoolId", "subjectId") VALUES
  ('ss-phy', 'school-lby-001', 'subject-phy'),
  ('ss-mat', 'school-lby-001', 'subject-mat'),
  ('ss-che', 'school-lby-001', 'subject-che'),
  ('ss-fma', 'school-lby-001', 'subject-fma'),
  ('ss-csc', 'school-lby-001', 'subject-csc'),
  ('ss-eng', 'school-lby-001', 'subject-eng'),
  ('ss-fre', 'school-lby-001', 'subject-fre')
ON CONFLICT ("id") DO NOTHING;

-- ── Sample Logbook Entries ────────────────────────────────
-- All entries are by the demo teacher (user-teacher-001).
-- status = 'SUBMITTED', duration = 60 for all.
-- Dates use NOW() - INTERVAL to stay relative.
-- Note: topics are linked via the _EntryTopics join table (many-to-many).

INSERT INTO "LogbookEntry" ("id", "date", "period", "duration", "notes", "objectives", "signatureData", "status", "createdAt", "updatedAt", "teacherId", "classId") VALUES
(
  'entry-001',
  (NOW() - INTERVAL '1 days')::date + TIME '08:00:00',
  2, 60,
  'Covered equations of motion for uniformly accelerated bodies. Students practiced with numerical examples.',
  'Students can derive and apply the three equations of motion',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-a'
),
(
  'entry-002',
  (NOW() - INTERVAL '2 days')::date + TIME '08:00:00',
  1, 60,
  'Introduced Newton''s three laws. Demonstrated with practical examples using weights and pulleys.',
  'Students understand and can state Newton''s three laws',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-b'
),
(
  'entry-003',
  (NOW() - INTERVAL '3 days')::date + TIME '08:00:00',
  3, 60,
  'Taught differentiation from first principles. Moved to power rule and sum rule.',
  'Students can differentiate polynomial functions',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-ls-sci'
),
(
  'entry-004',
  (NOW() - INTERVAL '4 days')::date + TIME '08:00:00',
  4, 60,
  'Electronic configuration and quantum numbers. Students drew orbital diagrams.',
  'Students can write electronic configurations for elements 1-36',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-a'
),
(
  'entry-005',
  (NOW() - INTERVAL '5 days')::date + TIME '08:00:00',
  2, 60,
  'Work-energy theorem and conservation of mechanical energy. Solved past GCE questions.',
  'Students can apply the work-energy theorem to solve problems',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-us-sci'
),
(
  'entry-006',
  (NOW() - INTERVAL '7 days')::date + TIME '08:00:00',
  5, 60,
  'Trigonometric identities and solving trig equations in a given range.',
  'Students can prove simple trig identities and solve equations',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-a'
),
(
  'entry-007',
  (NOW() - INTERVAL '8 days')::date + TIME '08:00:00',
  1, 60,
  'Introduction to loops and conditional statements. Wrote basic programs in Python.',
  'Students can write programs using for loops and if statements',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-ls-sci'
),
(
  'entry-008',
  (NOW() - INTERVAL '10 days')::date + TIME '08:00:00',
  3, 60,
  'Properties of waves: frequency, wavelength, amplitude. Distinction between transverse and longitudinal.',
  'Students can describe wave properties and classify wave types',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-b'
),
(
  'entry-009',
  (NOW() - INTERVAL '12 days')::date + TIME '08:00:00',
  2, 60,
  'Ionic and covalent bonding. Drew Lewis dot structures for common molecules.',
  'Students can explain ionic and covalent bonding with examples',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-a'
),
(
  'entry-010',
  (NOW() - INTERVAL '13 days')::date + TIME '08:00:00',
  4, 60,
  'Definite integrals and area under curves. Applied to find areas between curves.',
  'Students can evaluate definite integrals and compute areas',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-us-sci'
)
ON CONFLICT ("id") DO NOTHING;

-- ── Link entries to topics (many-to-many) ─────────────────
-- The implicit join table name is "_EntryTopics" with columns "A" (entry) and "B" (topic)
INSERT INTO "_EntryTopics" ("A", "B") VALUES
  ('entry-001', 'topic-phy-kinematics'),
  ('entry-002', 'topic-phy-newton'),
  ('entry-003', 'topic-mat-diff'),
  ('entry-004', 'topic-che-atomic'),
  ('entry-005', 'topic-phy-work-energy'),
  ('entry-006', 'topic-mat-trig'),
  ('entry-007', 'topic-csc-programming'),
  ('entry-008', 'topic-phy-wave-motion'),
  ('entry-009', 'topic-che-bonding'),
  ('entry-010', 'topic-mat-integ')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================
-- DONE! Seed data includes:
--   ✓ 5 Cameroon regions + 5 divisions
--   ✓ 1 school (Lycée Bilingue de Yaoundé)
--   ✓ 1 school admin, 1 regional admin, 1 demo teacher
--   ✓ 7 classes, 7 subjects, 55+ topics (with classLevel)
--   ✓ 10 sample logbook entries with topic links
--   ✓ Teacher-school membership record
--   ✓ All inserts use ON CONFLICT DO NOTHING (safe to rerun)
-- ============================================================
