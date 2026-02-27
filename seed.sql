-- ============================================================
-- Edlog – PostgreSQL Seed Data
-- Generated from prisma/seed.ts
-- ============================================================

BEGIN;

-- ── RPI Board ───────────────────────────────────────────────
INSERT INTO "RPIBoard" ("id", "name", "region", "createdAt")
VALUES (
  'rpi-centre-001',
  'RPI Board — Centre Region',
  'Centre',
  CURRENT_TIMESTAMP
);

-- ── School ──────────────────────────────────────────────────
INSERT INTO "School" ("id", "name", "code", "town", "region", "isActive", "createdAt", "updatedAt", "rpiBoardId", "adminId")
VALUES (
  'school-lby-001',
  'Lycée Bilingue de Yaoundé',
  'LBY-001',
  'Yaoundé',
  'Centre',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'rpi-centre-001',
  NULL
);

-- ── Admin User ──────────────────────────────────────────────
INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "phone", "role", "isVerified", "createdAt", "updatedAt", "schoolId", "rpiBoardId")
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
  'school-lby-001',
  NULL
);

-- Link admin to school
UPDATE "School"
SET "adminId" = 'user-admin-001'
WHERE "id" = 'school-lby-001';

-- ── Demo Teacher ────────────────────────────────────────────
INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "phone", "role", "isVerified", "createdAt", "updatedAt", "schoolId", "rpiBoardId")
VALUES (
  'user-teacher-001',
  'teacher@edlog.cm',
  '$2b$12$y.uwUXpuvKfQQmTmfQh9KeE/KH4P4x3vXRZhrACIXouF7WBcjqlKS',
  'Darren',
  'Monyongo',
  NULL,
  'TEACHER',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'school-lby-001',
  NULL
);

-- ── Classes (year 2025) ─────────────────────────────────────
INSERT INTO "Class" ("id", "name", "level", "stream", "section", "year", "createdAt", "schoolId") VALUES
  ('class-f5-sci-a',     'Form 5 Science A',     'Form 5',       'Science', 'A',  2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-f5-sci-b',     'Form 5 Science B',     'Form 5',       'Science', 'B',  2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-f5-arts',      'Form 5 Arts',          'Form 5',       'Arts',    NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-ls-sci',       'Lower Sixth Science',  'Lower Sixth',  'Science', NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-ls-arts',      'Lower Sixth Arts',     'Lower Sixth',  'Arts',    NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-us-sci',       'Upper Sixth Science',  'Upper Sixth',  'Science', NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001'),
  ('class-us-arts',      'Upper Sixth Arts',     'Upper Sixth',  'Arts',    NULL, 2025, CURRENT_TIMESTAMP, 'school-lby-001');

-- ── Subjects ────────────────────────────────────────────────
INSERT INTO "Subject" ("id", "name", "code", "category", "createdAt") VALUES
  ('subject-phy', 'Physics',             'PHY', 'Science',  CURRENT_TIMESTAMP),
  ('subject-mat', 'Mathematics',         'MAT', 'Science',  CURRENT_TIMESTAMP),
  ('subject-che', 'Chemistry',           'CHE', 'Science',  CURRENT_TIMESTAMP),
  ('subject-fma', 'Further Mathematics', 'FMA', 'Science',  CURRENT_TIMESTAMP),
  ('subject-csc', 'Computer Science',    'CSC', 'Science',  CURRENT_TIMESTAMP),
  ('subject-eng', 'English Language',    'ENG', 'Language', CURRENT_TIMESTAMP),
  ('subject-fre', 'French',             'FRE', 'Language', CURRENT_TIMESTAMP);

-- ── Topics ──────────────────────────────────────────────────
-- orderIndex is a global counter across all subjects (starts at 0).
-- moduleNum resets to 1 for each subject and increments per module.
--
-- Physics (subject-phy): modules 1-7, orderIndex 0-15
-- Mathematics (subject-mat): modules 1-5, orderIndex 16-24
-- Chemistry (subject-che): modules 1-3, orderIndex 25-34
-- Further Mathematics (subject-fma): modules 1-3, orderIndex 35-41
-- Computer Science (subject-csc): modules 1-6, orderIndex 42-47
-- English Language (subject-eng): modules 1-4, orderIndex 48-53
-- French (subject-fre): modules 1-5, orderIndex 54-58

INSERT INTO "Topic" ("id", "name", "moduleName", "moduleNum", "orderIndex", "createdAt", "subjectId") VALUES
  -- ── Physics ──
  -- Module 1: Mechanics (4 topics)
  ('topic-phy-kinematics',       'Kinematics',                   'Mechanics',            1,  0,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-newton',           'Newton''s Laws of Motion',     'Mechanics',            1,  1,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-work-energy',      'Work Energy & Power',          'Mechanics',            1,  2,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-momentum',         'Momentum & Collisions',        'Mechanics',            1,  3,  CURRENT_TIMESTAMP, 'subject-phy'),
  -- Module 2: Rotational Mechanics (1 topic)
  ('topic-phy-circular',         'Circular Motion',              'Rotational Mechanics', 2,  4,  CURRENT_TIMESTAMP, 'subject-phy'),
  -- Module 3: Fields (1 topic)
  ('topic-phy-gravity',          'Gravitational Fields',         'Fields',               3,  5,  CURRENT_TIMESTAMP, 'subject-phy'),
  -- Module 4: Electricity (3 topics)
  ('topic-phy-elec-fields',      'Electric Fields',              'Electricity',          4,  6,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-current',          'Current Electricity',          'Electricity',          4,  7,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-em-induction',     'Electromagnetic Induction',    'Electricity',          4,  8,  CURRENT_TIMESTAMP, 'subject-phy'),
  -- Module 5: Waves & Optics (2 topics)
  ('topic-phy-wave-motion',      'Wave Motion',                  'Waves & Optics',       5,  9,  CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-light',            'Light & Optics',               'Waves & Optics',       5,  10, CURRENT_TIMESTAMP, 'subject-phy'),
  -- Module 6: Thermal Physics (1 topic)
  ('topic-phy-thermal',          'Thermal Physics',              'Thermal Physics',      6,  11, CURRENT_TIMESTAMP, 'subject-phy'),
  -- Module 7: Modern Physics (2 topics)
  ('topic-phy-nuclear',          'Nuclear Physics',              'Modern Physics',       7,  12, CURRENT_TIMESTAMP, 'subject-phy'),
  ('topic-phy-radioactivity',    'Radioactivity',                'Modern Physics',       7,  13, CURRENT_TIMESTAMP, 'subject-phy'),

  -- ── Mathematics ──
  -- Module 1: Pure Mathematics (4 topics)
  ('topic-mat-algebra',          'Algebra & Polynomials',        'Pure Mathematics',     1,  14, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-trig',             'Trigonometry',                 'Pure Mathematics',     1,  15, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-coord',            'Coordinate Geometry',          'Pure Mathematics',     1,  16, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-sequences',        'Sequences & Series',           'Pure Mathematics',     1,  17, CURRENT_TIMESTAMP, 'subject-mat'),
  -- Module 2: Calculus (2 topics)
  ('topic-mat-diff',             'Differentiation',              'Calculus',             2,  18, CURRENT_TIMESTAMP, 'subject-mat'),
  ('topic-mat-integ',            'Integration',                  'Calculus',             2,  19, CURRENT_TIMESTAMP, 'subject-mat'),
  -- Module 3: Vectors & Mechanics (1 topic)
  ('topic-mat-vectors',          'Vectors',                      'Vectors & Mechanics',  3,  20, CURRENT_TIMESTAMP, 'subject-mat'),
  -- Module 4: Statistics (1 topic)
  ('topic-mat-stats',            'Statistics & Probability',     'Statistics',           4,  21, CURRENT_TIMESTAMP, 'subject-mat'),
  -- Module 5: Applied Mathematics (1 topic)
  ('topic-mat-mechanics',        'Mechanics',                    'Applied Mathematics',  5,  22, CURRENT_TIMESTAMP, 'subject-mat'),

  -- ── Chemistry ──
  -- Module 1: Physical Chemistry (7 topics)
  ('topic-che-atomic',           'Atomic Structure',             'Physical Chemistry',   1,  23, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-bonding',          'Chemical Bonding',             'Physical Chemistry',   1,  24, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-stoich',           'Stoichiometry',                'Physical Chemistry',   1,  25, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-energetics',       'Energetics & Thermochemistry', 'Physical Chemistry',   1,  26, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-kinetics',         'Reaction Kinetics',            'Physical Chemistry',   1,  27, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-equilibrium',      'Chemical Equilibrium',         'Physical Chemistry',   1,  28, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-electrochem',      'Electrochemistry',             'Physical Chemistry',   1,  29, CURRENT_TIMESTAMP, 'subject-che'),
  -- Module 2: Organic Chemistry (2 topics)
  ('topic-che-hydrocarbons',     'Hydrocarbons',                 'Organic Chemistry',    2,  30, CURRENT_TIMESTAMP, 'subject-che'),
  ('topic-che-functional',       'Functional Groups',            'Organic Chemistry',    2,  31, CURRENT_TIMESTAMP, 'subject-che'),
  -- Module 3: Inorganic Chemistry (1 topic)
  ('topic-che-periodic',         'Periodic Table & Trends',      'Inorganic Chemistry',  3,  32, CURRENT_TIMESTAMP, 'subject-che'),

  -- ── Further Mathematics ──
  -- Module 1: Pure Mathematics (4 topics)
  ('topic-fma-complex',          'Complex Numbers',              'Pure Mathematics',     1,  33, CURRENT_TIMESTAMP, 'subject-fma'),
  ('topic-fma-matrices',         'Matrices & Transformations',   'Pure Mathematics',     1,  34, CURRENT_TIMESTAMP, 'subject-fma'),
  ('topic-fma-proof',            'Proof & Logic',                'Pure Mathematics',     1,  35, CURRENT_TIMESTAMP, 'subject-fma'),
  ('topic-fma-hyperbolic',       'Hyperbolic Functions',         'Pure Mathematics',     1,  36, CURRENT_TIMESTAMP, 'subject-fma'),
  -- Module 2: Calculus (1 topic)
  ('topic-fma-diffeq',           'Differential Equations',       'Calculus',             2,  37, CURRENT_TIMESTAMP, 'subject-fma'),
  -- Module 3: Applied (1 topic)
  ('topic-fma-numerical',        'Numerical Methods',            'Applied',              3,  38, CURRENT_TIMESTAMP, 'subject-fma'),

  -- ── Computer Science ──
  -- Module 1: Fundamentals (1 topic)
  ('topic-csc-data-rep',         'Data Representation',          'Fundamentals',         1,  39, CURRENT_TIMESTAMP, 'subject-csc'),
  -- Module 2: Programming (1 topic)
  ('topic-csc-programming',      'Programming Concepts',         'Programming',          2,  40, CURRENT_TIMESTAMP, 'subject-csc'),
  -- Module 3: Computer Science (1 topic)
  ('topic-csc-algorithms',       'Algorithms & Data Structures', 'Computer Science',     3,  41, CURRENT_TIMESTAMP, 'subject-csc'),
  -- Module 4: Hardware (1 topic)
  ('topic-csc-architecture',     'Computer Architecture',        'Hardware',             4,  42, CURRENT_TIMESTAMP, 'subject-csc'),
  -- Module 5: Networks (1 topic)
  ('topic-csc-networking',       'Networking',                   'Networks',             5,  43, CURRENT_TIMESTAMP, 'subject-csc'),
  -- Module 6: Data Management (1 topic)
  ('topic-csc-databases',        'Databases',                    'Data Management',      6,  44, CURRENT_TIMESTAMP, 'subject-csc'),

  -- ── English Language ──
  -- Module 1: Reading (1 topic)
  ('topic-eng-comprehension',    'Comprehension & Summary',      'Reading',              1,  45, CURRENT_TIMESTAMP, 'subject-eng'),
  -- Module 2: Writing (1 topic)
  ('topic-eng-essay',            'Essay Writing',                'Writing',              2,  46, CURRENT_TIMESTAMP, 'subject-eng'),
  -- Module 3: Language (1 topic)
  ('topic-eng-grammar',          'Grammar & Usage',              'Language',             3,  47, CURRENT_TIMESTAMP, 'subject-eng'),
  -- Module 4: Literature (3 topics)
  ('topic-eng-prose',            'Prose',                        'Literature',           4,  48, CURRENT_TIMESTAMP, 'subject-eng'),
  ('topic-eng-poetry',           'Poetry',                       'Literature',           4,  49, CURRENT_TIMESTAMP, 'subject-eng'),
  ('topic-eng-drama',            'Drama',                        'Literature',           4,  50, CURRENT_TIMESTAMP, 'subject-eng'),

  -- ── French ──
  -- Module 1: Lecture (1 topic)
  ('topic-fre-comprehension',    'Compréhension écrite',         'Lecture',              1,  51, CURRENT_TIMESTAMP, 'subject-fre'),
  -- Module 2: Écriture (1 topic)
  ('topic-fre-expression',       'Expression écrite',            'Écriture',             2,  52, CURRENT_TIMESTAMP, 'subject-fre'),
  -- Module 3: Langue (1 topic)
  ('topic-fre-grammaire',        'Grammaire',                    'Langue',               3,  53, CURRENT_TIMESTAMP, 'subject-fre'),
  -- Module 4: Oral (1 topic)
  ('topic-fre-oral',             'Compréhension orale',          'Oral',                 4,  54, CURRENT_TIMESTAMP, 'subject-fre'),
  -- Module 5: Littérature (1 topic)
  ('topic-fre-litterature',      'Littérature',                  'Littérature',          5,  55, CURRENT_TIMESTAMP, 'subject-fre');

-- ── School ↔ Subject links ─────────────────────────────────
INSERT INTO "SchoolSubject" ("id", "schoolId", "subjectId") VALUES
  ('ss-phy', 'school-lby-001', 'subject-phy'),
  ('ss-mat', 'school-lby-001', 'subject-mat'),
  ('ss-che', 'school-lby-001', 'subject-che'),
  ('ss-fma', 'school-lby-001', 'subject-fma'),
  ('ss-csc', 'school-lby-001', 'subject-csc'),
  ('ss-eng', 'school-lby-001', 'subject-eng'),
  ('ss-fre', 'school-lby-001', 'subject-fre');

-- ── Sample Logbook Entries ──────────────────────────────────
-- All entries are by the demo teacher (user-teacher-001).
-- status = 'SUBMITTED', duration = 60 for all.
-- Dates use NOW() - INTERVAL to stay relative.

INSERT INTO "LogbookEntry" ("id", "date", "period", "duration", "notes", "objectives", "signatureData", "status", "createdAt", "updatedAt", "teacherId", "classId", "topicId") VALUES
(
  'entry-001',
  (NOW() - INTERVAL '1 days')::date + TIME '08:00:00',
  2, 60,
  'Covered equations of motion for uniformly accelerated bodies. Students practiced with numerical examples.',
  'Students can derive and apply the three equations of motion',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-a', 'topic-phy-kinematics'
),
(
  'entry-002',
  (NOW() - INTERVAL '2 days')::date + TIME '08:00:00',
  1, 60,
  'Introduced Newton''s three laws. Demonstrated with practical examples using weights and pulleys.',
  'Students understand and can state Newton''s three laws',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-b', 'topic-phy-newton'
),
(
  'entry-003',
  (NOW() - INTERVAL '3 days')::date + TIME '08:00:00',
  3, 60,
  'Taught differentiation from first principles. Moved to power rule and sum rule.',
  'Students can differentiate polynomial functions',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-ls-sci', 'topic-mat-diff'
),
(
  'entry-004',
  (NOW() - INTERVAL '4 days')::date + TIME '08:00:00',
  4, 60,
  'Electronic configuration and quantum numbers. Students drew orbital diagrams.',
  'Students can write electronic configurations for elements 1-36',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-a', 'topic-che-atomic'
),
(
  'entry-005',
  (NOW() - INTERVAL '5 days')::date + TIME '08:00:00',
  2, 60,
  'Work-energy theorem and conservation of mechanical energy. Solved past GCE questions.',
  'Students can apply the work-energy theorem to solve problems',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-us-sci', 'topic-phy-work-energy'
),
(
  'entry-006',
  (NOW() - INTERVAL '7 days')::date + TIME '08:00:00',
  5, 60,
  'Trigonometric identities and solving trig equations in a given range.',
  'Students can prove simple trig identities and solve equations',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-a', 'topic-mat-trig'
),
(
  'entry-007',
  (NOW() - INTERVAL '8 days')::date + TIME '08:00:00',
  1, 60,
  'Introduction to loops and conditional statements. Wrote basic programs in Python.',
  'Students can write programs using for loops and if statements',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-ls-sci', 'topic-csc-programming'
),
(
  'entry-008',
  (NOW() - INTERVAL '10 days')::date + TIME '08:00:00',
  3, 60,
  'Properties of waves: frequency, wavelength, amplitude. Distinction between transverse and longitudinal.',
  'Students can describe wave properties and classify wave types',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-b', 'topic-phy-wave-motion'
),
(
  'entry-009',
  (NOW() - INTERVAL '12 days')::date + TIME '08:00:00',
  2, 60,
  'Ionic and covalent bonding. Drew Lewis dot structures for common molecules.',
  'Students can explain ionic and covalent bonding with examples',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-f5-sci-a', 'topic-che-bonding'
),
(
  'entry-010',
  (NOW() - INTERVAL '13 days')::date + TIME '08:00:00',
  4, 60,
  'Definite integrals and area under curves. Applied to find areas between curves.',
  'Students can evaluate definite integrals and compute areas',
  NULL, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  'user-teacher-001', 'class-us-sci', 'topic-mat-integ'
);

COMMIT;
