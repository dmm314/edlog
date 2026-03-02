-- ============================================================
-- EdLog: Complete Database Sync Script (v2)
-- Safe to run multiple times (uses IF NOT EXISTS everywhere)
-- Paste this ENTIRE script into the Neon SQL Editor and run it.
-- ============================================================

-- ── ENUMS (safe: only created if they don't exist) ──────────

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('TEACHER', 'SCHOOL_ADMIN', 'REGIONAL_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CodeType" AS ENUM ('SCHOOL_REGISTRATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SchoolStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EngagementLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('LOG_REMINDER', 'WEEKLY_SUMMARY', 'COMPLIANCE_WARNING', 'LOG_REVIEWED', 'NEW_TEACHER', 'CURRICULUM_GAP', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capital" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Division" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "schoolType" TEXT,
    "principalName" TEXT,
    "principalPhone" TEXT,
    "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "regionId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "adminId" TEXT,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT,
    "regionId" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RegistrationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CodeType" NOT NULL DEFAULT 'SCHOOL_REGISTRATION',
    "regionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "schoolId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistrationCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PeriodSchedule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "periodNum" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeriodSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "level" TEXT NOT NULL,
    "stream" TEXT,
    "section" TEXT,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classLevel" TEXT NOT NULL,
    "moduleNum" INTEGER,
    "moduleName" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SchoolSubject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "SchoolSubject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ClassSubject" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubjectDivision" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubjectDivision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "divisionId" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TimetableSlot" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LogbookEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" INTEGER,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "moduleName" TEXT,
    "topicText" TEXT,
    "notes" TEXT,
    "objectives" TEXT,
    "signatureData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "studentAttendance" INTEGER,
    "engagementLevel" "EngagementLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "timetableSlotId" TEXT,
    CONSTRAINT "LogbookEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "_EntryTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- ── UNIQUE INDEXES ──────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "Region_name_key" ON "Region"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Region_code_key" ON "Region"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Division_regionId_name_key" ON "Division"("regionId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "RegistrationCode_code_key" ON "RegistrationCode"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "School_code_key" ON "School"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "School_adminId_key" ON "School"("adminId");
CREATE UNIQUE INDEX IF NOT EXISTS "PeriodSchedule_schoolId_periodNum_key" ON "PeriodSchedule"("schoolId", "periodNum");
CREATE UNIQUE INDEX IF NOT EXISTS "Class_schoolId_name_year_key" ON "Class"("schoolId", "name", "year");
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_name_key" ON "Subject"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_code_key" ON "Subject"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Topic_subjectId_classLevel_name_key" ON "Topic"("subjectId", "classLevel", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "SchoolSubject_schoolId_subjectId_key" ON "SchoolSubject"("schoolId", "subjectId");
CREATE UNIQUE INDEX IF NOT EXISTS "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId", "subjectId");
CREATE UNIQUE INDEX IF NOT EXISTS "SubjectDivision_schoolId_subjectId_name_key" ON "SubjectDivision"("schoolId", "subjectId", "name");
CREATE INDEX IF NOT EXISTS "SubjectDivision_schoolId_subjectId_idx" ON "SubjectDivision"("schoolId", "subjectId");
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherAssignment_teacherId_classId_subjectId_divisionId_key" ON "TeacherAssignment"("teacherId", "classId", "subjectId", "divisionId");
CREATE UNIQUE INDEX IF NOT EXISTS "_EntryTopics_AB_unique" ON "_EntryTopics"("A", "B");

-- ── REGULAR INDEXES ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "RegistrationCode_regionId_idx" ON "RegistrationCode"("regionId");
CREATE INDEX IF NOT EXISTS "RegistrationCode_code_idx" ON "RegistrationCode"("code");
CREATE INDEX IF NOT EXISTS "Topic_subjectId_classLevel_idx" ON "Topic"("subjectId", "classLevel");
CREATE INDEX IF NOT EXISTS "TeacherAssignment_teacherId_idx" ON "TeacherAssignment"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherAssignment_schoolId_idx" ON "TeacherAssignment"("schoolId");
CREATE INDEX IF NOT EXISTS "TimetableSlot_schoolId_dayOfWeek_idx" ON "TimetableSlot"("schoolId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "TimetableSlot_assignmentId_idx" ON "TimetableSlot"("assignmentId");
CREATE INDEX IF NOT EXISTS "LogbookEntry_teacherId_date_idx" ON "LogbookEntry"("teacherId", "date");
CREATE INDEX IF NOT EXISTS "LogbookEntry_classId_date_idx" ON "LogbookEntry"("classId", "date");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "_EntryTopics_B_index" ON "_EntryTopics"("B");

-- ── FOREIGN KEYS (safe: skip if already exists) ─────────────

DO $$ BEGIN ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Division" ADD CONSTRAINT "Division_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "School" ADD CONSTRAINT "School_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "School" ADD CONSTRAINT "School_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "School" ADD CONSTRAINT "School_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PeriodSchedule" ADD CONSTRAINT "PeriodSchedule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SubjectDivision" ADD CONSTRAINT "SubjectDivision_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SubjectDivision" ADD CONSTRAINT "SubjectDivision_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "SubjectDivision"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeacherAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeacherAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "TimetableSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "_EntryTopics" ADD CONSTRAINT "_EntryTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "_EntryTopics" ADD CONSTRAINT "_EntryTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── NEW COLUMNS (v2 — add to existing tables if missing) ────

-- User: new profile fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" "Gender";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;

-- LogbookEntry: module + free-text topic
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "moduleName" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "topicText" TEXT;

-- Existing missing columns (carried over from v1)
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "schoolType" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "principalName" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "principalPhone" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "foundingDate" TIMESTAMP(3);
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "profileComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "abbreviation" TEXT;
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "stream" TEXT;
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "section" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "objectives" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "signatureData" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "studentAttendance" INTEGER;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "engagementLevel" "EngagementLevel";
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "assignmentId" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "timetableSlotId" TEXT;

-- TeacherAssignment: subject divisions
ALTER TABLE "TeacherAssignment" ADD COLUMN IF NOT EXISTS "divisionId" TEXT;

-- ── SEED SUBJECTS (skip duplicates) ─────────────────────────

INSERT INTO "Subject" ("id", "name", "code", "category", "createdAt")
VALUES
  (gen_random_uuid()::text, 'Mathematics',           'MAT', 'Science',    NOW()),
  (gen_random_uuid()::text, 'Additional Mathematics', 'AMA', 'Science',   NOW()),
  (gen_random_uuid()::text, 'Pure Mathematics',       'PMA', 'Science',   NOW()),
  (gen_random_uuid()::text, 'Further Mathematics',    'FMA', 'Science',   NOW()),
  (gen_random_uuid()::text, 'Statistics',             'STA', 'Science',   NOW()),
  (gen_random_uuid()::text, 'Mechanics',              'MEC', 'Science',   NOW()),
  (gen_random_uuid()::text, 'Physics',                'PHY', 'Science',   NOW()),
  (gen_random_uuid()::text, 'Biology',                'BIO', 'Science',   NOW()),
  (gen_random_uuid()::text, 'Computer Science',       'CSC', 'Science',   NOW()),
  (gen_random_uuid()::text, 'Chemistry',              'CHE', 'Chemistry', NOW()),
  (gen_random_uuid()::text, 'Physical Chemistry',     'PCH', 'Chemistry', NOW()),
  (gen_random_uuid()::text, 'Organic Chemistry',      'OCH', 'Chemistry', NOW()),
  (gen_random_uuid()::text, 'Inorganic Chemistry',    'ICH', 'Chemistry', NOW()),
  (gen_random_uuid()::text, 'English Language',       'ENG', 'Language',  NOW()),
  (gen_random_uuid()::text, 'French',                 'FRE', 'Language',  NOW()),
  (gen_random_uuid()::text, 'Literature in English',  'LIT', 'Language',  NOW()),
  (gen_random_uuid()::text, 'History',                'HIS', 'Humanities',NOW()),
  (gen_random_uuid()::text, 'Geography',              'GEO', 'Humanities',NOW()),
  (gen_random_uuid()::text, 'Economics',              'ECO', 'Humanities',NOW()),
  (gen_random_uuid()::text, 'Religious Studies',      'REL', 'Humanities',NOW()),
  (gen_random_uuid()::text, 'Citizenship',            'CIT', 'General',   NOW()),
  (gen_random_uuid()::text, 'Arts and Crafts',        'ARC', 'General',   NOW()),
  (gen_random_uuid()::text, 'Physical Education',     'PHE', 'General',   NOW()),
  (gen_random_uuid()::text, 'Sports',                 'SPO', 'General',   NOW()),
  (gen_random_uuid()::text, 'Manual Labour',          'MLA', 'General',   NOW()),
  (gen_random_uuid()::text, 'Philosophy',             'PHI', 'Humanities',NOW()),
  (gen_random_uuid()::text, 'Geology',                'GEL', 'Science',   NOW()),
  (gen_random_uuid()::text, 'Food Science',           'FSC', 'Science',   NOW())
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- SEED TOPICS — Cameroon GCE/GCSE & GCE A-Level Curriculum
-- Includes Form 1-5, Lower Sixth, and Upper Sixth
-- ══════════════════════════════════════════════════════════════

-- ── Mathematics (Form 1-5 + A-Level) ────────────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Number Bases',         'Form 1', 1, 'Module 1: Numbers',        1),
  ('Fractions & Decimals', 'Form 1', 1, 'Module 1: Numbers',        2),
  ('Ratios & Proportions', 'Form 1', 1, 'Module 1: Numbers',        3),
  ('Algebraic Expressions','Form 1', 2, 'Module 2: Algebra',        4),
  ('Linear Equations',     'Form 1', 2, 'Module 2: Algebra',        5),
  ('Basic Geometry',       'Form 1', 3, 'Module 3: Geometry',       6),
  ('Angles & Lines',       'Form 1', 3, 'Module 3: Geometry',       7),
  ('Perimeter & Area',     'Form 1', 4, 'Module 4: Mensuration',    8),
  ('Indices & Logarithms', 'Form 2', 1, 'Module 1: Numbers',        1),
  ('Sets & Venn Diagrams', 'Form 2', 1, 'Module 1: Numbers',        2),
  ('Simultaneous Equations','Form 2',2, 'Module 2: Algebra',        3),
  ('Quadratic Equations',  'Form 2', 2, 'Module 2: Algebra',        4),
  ('Polygons & Circles',   'Form 2', 3, 'Module 3: Geometry',       5),
  ('Trigonometry Basics',  'Form 2', 4, 'Module 4: Trigonometry',   6),
  ('Sequences & Series',   'Form 3', 1, 'Module 1: Algebra',        1),
  ('Matrices',             'Form 3', 1, 'Module 1: Algebra',        2),
  ('Vectors in 2D',        'Form 3', 2, 'Module 2: Geometry',       3),
  ('Transformations',      'Form 3', 2, 'Module 2: Geometry',       4),
  ('Statistics & Probability','Form 3',3,'Module 3: Statistics',     5),
  ('Functions & Graphs',   'Form 4', 1, 'Module 1: Algebra',        1),
  ('Calculus Introduction', 'Form 4', 2, 'Module 2: Calculus',      2),
  ('Probability Distributions','Form 4',3,'Module 3: Statistics',   3),
  ('Coordinate Geometry',  'Form 5', 1, 'Module 1: Geometry',       1),
  ('Differentiation',      'Form 5', 2, 'Module 2: Calculus',       2),
  ('Integration',          'Form 5', 2, 'Module 2: Calculus',       3),
  -- Lower Sixth
  ('Pure Mathematics: Algebra & Functions', 'Lower Sixth', 1, 'Module 1: Pure Mathematics', 1),
  ('Coordinate Geometry Advanced',          'Lower Sixth', 1, 'Module 1: Pure Mathematics', 2),
  ('Sequences & Series Advanced',           'Lower Sixth', 1, 'Module 1: Pure Mathematics', 3),
  ('Differentiation Techniques',            'Lower Sixth', 2, 'Module 2: Calculus',         4),
  ('Integration Techniques',                'Lower Sixth', 2, 'Module 2: Calculus',         5),
  ('Trigonometric Functions',               'Lower Sixth', 3, 'Module 3: Trigonometry',     6),
  ('Exponentials & Logarithms',             'Lower Sixth', 3, 'Module 3: Trigonometry',     7),
  ('Probability & Statistics I',            'Lower Sixth', 4, 'Module 4: Statistics',       8),
  ('Mechanics: Forces & Motion',            'Lower Sixth', 5, 'Module 5: Mechanics',        9),
  -- Upper Sixth
  ('Further Differentiation',               'Upper Sixth', 1, 'Module 1: Further Calculus', 1),
  ('Further Integration',                   'Upper Sixth', 1, 'Module 1: Further Calculus', 2),
  ('Differential Equations',                'Upper Sixth', 1, 'Module 1: Further Calculus', 3),
  ('Vectors in 3D',                         'Upper Sixth', 2, 'Module 2: Further Pure',     4),
  ('Complex Numbers',                       'Upper Sixth', 2, 'Module 2: Further Pure',     5),
  ('Matrices & Linear Transformations',     'Upper Sixth', 2, 'Module 2: Further Pure',     6),
  ('Probability & Statistics II',           'Upper Sixth', 3, 'Module 3: Statistics',       7),
  ('Hypothesis Testing',                    'Upper Sixth', 3, 'Module 3: Statistics',       8),
  ('Mechanics: Projectiles & Equilibrium',  'Upper Sixth', 4, 'Module 4: Mechanics',        9),
  ('Numerical Methods',                     'Upper Sixth', 4, 'Module 4: Mechanics',        10)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'MAT'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── Physics (Form 1-5 + A-Level) ────────────────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Measurement & Units',     'Form 1', 1, 'Module 1: Mechanics',    1),
  ('Motion & Speed',          'Form 1', 1, 'Module 1: Mechanics',    2),
  ('Forces',                  'Form 1', 1, 'Module 1: Mechanics',    3),
  ('Density & Pressure',      'Form 1', 2, 'Module 2: Properties',   4),
  ('Heat & Temperature',      'Form 2', 1, 'Module 1: Heat',         1),
  ('Thermal Expansion',       'Form 2', 1, 'Module 1: Heat',         2),
  ('Light & Reflection',      'Form 2', 2, 'Module 2: Optics',       3),
  ('Refraction & Lenses',     'Form 2', 2, 'Module 2: Optics',       4),
  ('Static Electricity',      'Form 3', 1, 'Module 1: Electricity',  1),
  ('Current Electricity',     'Form 3', 1, 'Module 1: Electricity',  2),
  ('Magnetism',               'Form 3', 2, 'Module 2: Magnetism',    3),
  ('Electromagnetic Induction','Form 3',2, 'Module 2: Magnetism',    4),
  ('Waves & Sound',           'Form 4', 1, 'Module 1: Waves',        1),
  ('Electromagnetic Spectrum', 'Form 4', 1, 'Module 1: Waves',       2),
  ('Nuclear Physics',         'Form 5', 1, 'Module 1: Modern Physics',1),
  ('Radioactivity',           'Form 5', 1, 'Module 1: Modern Physics',2),
  -- Lower Sixth
  ('Kinematics',                         'Lower Sixth', 1, 'Module 1: Mechanics',        1),
  ('Dynamics & Newton Laws',             'Lower Sixth', 1, 'Module 1: Mechanics',        2),
  ('Work, Energy & Power',               'Lower Sixth', 1, 'Module 1: Mechanics',        3),
  ('Waves: Properties & Behaviour',      'Lower Sixth', 2, 'Module 2: Waves & Optics',   4),
  ('Superposition & Interference',       'Lower Sixth', 2, 'Module 2: Waves & Optics',   5),
  ('Current Electricity Advanced',       'Lower Sixth', 3, 'Module 3: Electricity',      6),
  ('DC Circuits',                        'Lower Sixth', 3, 'Module 3: Electricity',      7),
  ('Materials & Deformation',            'Lower Sixth', 4, 'Module 4: Materials',        8),
  -- Upper Sixth
  ('Circular Motion',                    'Upper Sixth', 1, 'Module 1: Fields',           1),
  ('Gravitational Fields',               'Upper Sixth', 1, 'Module 1: Fields',           2),
  ('Electric Fields',                    'Upper Sixth', 1, 'Module 1: Fields',           3),
  ('Capacitance',                        'Upper Sixth', 2, 'Module 2: Electromagnetism', 4),
  ('Magnetic Fields & Electromagnetism', 'Upper Sixth', 2, 'Module 2: Electromagnetism', 5),
  ('Quantum Physics',                    'Upper Sixth', 3, 'Module 3: Modern Physics',   6),
  ('Particle Physics',                   'Upper Sixth', 3, 'Module 3: Modern Physics',   7),
  ('Nuclear Energy',                     'Upper Sixth', 3, 'Module 3: Modern Physics',   8),
  ('Medical Physics',                    'Upper Sixth', 4, 'Module 4: Applications',     9),
  ('Astrophysics',                       'Upper Sixth', 4, 'Module 4: Applications',     10)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'PHY'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── Biology (Form 1-5 + A-Level) ────────────────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Cell Structure',          'Form 1', 1, 'Module 1: Cell Biology',  1),
  ('Classification of Living Things','Form 1',1,'Module 1: Cell Biology',2),
  ('Nutrition in Plants',     'Form 1', 2, 'Module 2: Nutrition',     3),
  ('Nutrition in Animals',    'Form 1', 2, 'Module 2: Nutrition',     4),
  ('Transport in Plants',     'Form 2', 1, 'Module 1: Transport',     1),
  ('Circulatory System',      'Form 2', 1, 'Module 1: Transport',     2),
  ('Respiration',             'Form 2', 2, 'Module 2: Respiration',   3),
  ('Excretion',               'Form 2', 2, 'Module 2: Excretion',     4),
  ('Reproduction in Plants',  'Form 3', 1, 'Module 1: Reproduction',  1),
  ('Reproduction in Animals', 'Form 3', 1, 'Module 1: Reproduction',  2),
  ('Genetics & Heredity',     'Form 3', 2, 'Module 2: Genetics',      3),
  ('Ecology',                 'Form 4', 1, 'Module 1: Ecology',       1),
  ('Evolution',               'Form 4', 2, 'Module 2: Evolution',     2),
  ('Nervous System',          'Form 5', 1, 'Module 1: Coordination',  1),
  ('Endocrine System',        'Form 5', 1, 'Module 1: Coordination',  2),
  -- Lower Sixth
  ('Biological Molecules',               'Lower Sixth', 1, 'Module 1: Biochemistry',     1),
  ('Enzymes',                            'Lower Sixth', 1, 'Module 1: Biochemistry',     2),
  ('Cell Membranes & Transport',         'Lower Sixth', 2, 'Module 2: Cell Biology',     3),
  ('Cell Division: Mitosis & Meiosis',   'Lower Sixth', 2, 'Module 2: Cell Biology',     4),
  ('Gas Exchange Systems',               'Lower Sixth', 3, 'Module 3: Exchange',         5),
  ('Mass Transport',                     'Lower Sixth', 3, 'Module 3: Exchange',         6),
  ('DNA & Protein Synthesis',            'Lower Sixth', 4, 'Module 4: Genetics',         7),
  ('Genetic Diversity',                  'Lower Sixth', 4, 'Module 4: Genetics',         8),
  -- Upper Sixth
  ('Photosynthesis',                     'Upper Sixth', 1, 'Module 1: Energy',           1),
  ('Cellular Respiration Advanced',      'Upper Sixth', 1, 'Module 1: Energy',           2),
  ('Homeostasis',                        'Upper Sixth', 2, 'Module 2: Control',          3),
  ('Nervous Communication',             'Upper Sixth', 2, 'Module 2: Control',          4),
  ('Gene Expression & Regulation',      'Upper Sixth', 3, 'Module 3: Genetics',         5),
  ('Inheritance & Selection',           'Upper Sixth', 3, 'Module 3: Genetics',         6),
  ('Populations & Ecosystems',          'Upper Sixth', 4, 'Module 4: Ecology',          7),
  ('Biotechnology',                     'Upper Sixth', 4, 'Module 4: Ecology',          8)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'BIO', 'EcoBio', 'GeBio', 'CooBio'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── Chemistry (Form 1-5 + A-Level) ──────────────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('States of Matter',        'Form 1', 1, 'Module 1: Matter',       1),
  ('Mixtures & Separation',   'Form 1', 1, 'Module 1: Matter',       2),
  ('Atomic Structure',        'Form 1', 2, 'Module 2: Structure',    3),
  ('Chemical Bonding',        'Form 1', 2, 'Module 2: Structure',    4),
  ('Acids, Bases & Salts',    'Form 2', 1, 'Module 1: Reactions',    1),
  ('Metals & Reactivity',     'Form 2', 1, 'Module 1: Reactions',    2),
  ('Oxidation & Reduction',   'Form 2', 2, 'Module 2: Redox',        3),
  ('Periodic Table',          'Form 3', 1, 'Module 1: Periodicity',  1),
  ('Chemical Calculations',   'Form 3', 2, 'Module 2: Stoichiometry',2),
  ('Rate of Reaction',        'Form 4', 1, 'Module 1: Kinetics',     1),
  ('Equilibrium',             'Form 4', 1, 'Module 1: Kinetics',     2),
  ('Organic Chemistry Intro', 'Form 5', 1, 'Module 1: Organic',      1),
  ('Hydrocarbons',            'Form 5', 1, 'Module 1: Organic',      2),
  -- Lower Sixth
  ('Atomic Structure Advanced',          'Lower Sixth', 1, 'Module 1: Physical Chemistry', 1),
  ('Amount of Substance',               'Lower Sixth', 1, 'Module 1: Physical Chemistry', 2),
  ('Bonding & Structure',               'Lower Sixth', 1, 'Module 1: Physical Chemistry', 3),
  ('Energetics',                         'Lower Sixth', 2, 'Module 2: Energetics',        4),
  ('Kinetics Advanced',                  'Lower Sixth', 2, 'Module 2: Energetics',        5),
  ('Chemical Equilibrium Advanced',      'Lower Sixth', 3, 'Module 3: Equilibrium',       6),
  ('Introductory Organic Chemistry',     'Lower Sixth', 4, 'Module 4: Organic',           7),
  ('Alkanes & Alkenes',                  'Lower Sixth', 4, 'Module 4: Organic',           8),
  -- Upper Sixth
  ('Thermodynamics',                     'Upper Sixth', 1, 'Module 1: Physical',          1),
  ('Electrode Potentials',               'Upper Sixth', 1, 'Module 1: Physical',          2),
  ('Acids & Bases Advanced',             'Upper Sixth', 2, 'Module 2: Equilibrium',       3),
  ('Transition Metals',                  'Upper Sixth', 2, 'Module 2: Equilibrium',       4),
  ('Aromatic Chemistry',                 'Upper Sixth', 3, 'Module 3: Organic',           5),
  ('Carbonyl Compounds',                 'Upper Sixth', 3, 'Module 3: Organic',           6),
  ('Amines & Polymers',                  'Upper Sixth', 3, 'Module 3: Organic',           7),
  ('Analytical Techniques',              'Upper Sixth', 4, 'Module 4: Analysis',          8)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'CHE', 'PCH', 'OCH', 'ICH'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── English Language (Form 1-5) ─────────────────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Parts of Speech',         'Form 1', 1, 'Module 1: Grammar',      1),
  ('Sentence Structure',      'Form 1', 1, 'Module 1: Grammar',      2),
  ('Comprehension Skills',    'Form 1', 2, 'Module 2: Comprehension',3),
  ('Narrative Writing',       'Form 1', 3, 'Module 3: Writing',      4),
  ('Tenses & Verb Forms',     'Form 2', 1, 'Module 1: Grammar',      1),
  ('Punctuation & Spelling',  'Form 2', 1, 'Module 1: Grammar',      2),
  ('Descriptive Writing',     'Form 2', 2, 'Module 2: Writing',      3),
  ('Summary Writing',         'Form 2', 3, 'Module 3: Comprehension',4),
  ('Argumentative Writing',   'Form 3', 1, 'Module 1: Writing',      1),
  ('Letter Writing',          'Form 3', 1, 'Module 1: Writing',      2),
  ('Oral Communication',      'Form 3', 2, 'Module 2: Speaking',     3),
  ('Essay Writing',           'Form 4', 1, 'Module 1: Writing',      1),
  ('Précis Writing',          'Form 4', 2, 'Module 2: Comprehension',2),
  ('Report Writing',          'Form 5', 1, 'Module 1: Writing',      1),
  ('Advanced Comprehension',  'Form 5', 2, 'Module 2: Comprehension',2)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'ENG'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── French (Form 1-5) ───────────────────────────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Salutations et Présentations','Form 1',1,'Module 1: Communication',1),
  ('La Famille',              'Form 1', 1, 'Module 1: Communication', 2),
  ('Les Articles et Noms',   'Form 1', 2, 'Module 2: Grammaire',     3),
  ('Les Verbes au Présent',  'Form 1', 2, 'Module 2: Grammaire',     4),
  ('La Description',         'Form 2', 1, 'Module 1: Expression',    1),
  ('Le Passé Composé',       'Form 2', 2, 'Module 2: Grammaire',     2),
  ('La Vie Quotidienne',     'Form 2', 3, 'Module 3: Culture',       3),
  ('La Rédaction',           'Form 3', 1, 'Module 1: Écriture',      1),
  ('Compréhension de Texte', 'Form 3', 2, 'Module 2: Compréhension', 2),
  ('Expression Orale',       'Form 4', 1, 'Module 1: Communication', 1),
  ('Littérature Française',  'Form 5', 1, 'Module 1: Littérature',   1)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'FRE'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── History (Form 1-5) ──────────────────────────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Early Cameroon History',  'Form 1', 1, 'Module 1: Cameroon',     1),
  ('Pre-Colonial Kingdoms',   'Form 1', 1, 'Module 1: Cameroon',     2),
  ('German Colonisation',     'Form 2', 1, 'Module 1: Colonialism',  1),
  ('British & French Mandate','Form 2', 1, 'Module 1: Colonialism',  2),
  ('Independence Movement',   'Form 3', 1, 'Module 1: Independence', 1),
  ('Reunification',           'Form 3', 1, 'Module 1: Independence', 2),
  ('World War I',             'Form 4', 1, 'Module 1: World History', 1),
  ('World War II',            'Form 4', 1, 'Module 1: World History', 2),
  ('Cold War',                'Form 5', 1, 'Module 1: Modern World',  1),
  ('African Unity & AU',      'Form 5', 1, 'Module 1: Modern World',  2)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'HIS'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── Geography (Form 1-5) ────────────────────────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Map Reading',             'Form 1', 1, 'Module 1: Map Skills',   1),
  ('Weather & Climate',       'Form 1', 2, 'Module 2: Atmosphere',   2),
  ('Landforms & Erosion',     'Form 2', 1, 'Module 1: Geomorphology',1),
  ('Rivers & Drainage',       'Form 2', 1, 'Module 1: Geomorphology',2),
  ('Population Studies',      'Form 3', 1, 'Module 1: Human Geography',1),
  ('Urbanisation',            'Form 3', 1, 'Module 1: Human Geography',2),
  ('Agriculture',             'Form 4', 1, 'Module 1: Economic Geography',1),
  ('Industry & Development',  'Form 4', 1, 'Module 1: Economic Geography',2),
  ('Environmental Issues',    'Form 5', 1, 'Module 1: Environment',   1),
  ('Cameroon Geography',      'Form 5', 2, 'Module 2: Regional Study',2)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'GEO'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── Economics (Form 3-5 + A-Level) ──────────────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Basic Economic Concepts', 'Form 3', 1, 'Module 1: Introduction',  1),
  ('Demand & Supply',         'Form 3', 1, 'Module 1: Introduction',  2),
  ('Market Structures',       'Form 3', 2, 'Module 2: Markets',       3),
  ('National Income',         'Form 4', 1, 'Module 1: Macro',         1),
  ('Money & Banking',         'Form 4', 1, 'Module 1: Macro',         2),
  ('International Trade',     'Form 5', 1, 'Module 1: Global',        1),
  ('Economic Development',    'Form 5', 1, 'Module 1: Global',        2),
  -- Lower Sixth
  ('Microeconomics: Consumer Theory',    'Lower Sixth', 1, 'Module 1: Microeconomics',  1),
  ('Production & Costs',                'Lower Sixth', 1, 'Module 1: Microeconomics',  2),
  ('Market Failure & Government',       'Lower Sixth', 2, 'Module 2: Market Failure',  3),
  ('Macroeconomic Objectives',          'Lower Sixth', 3, 'Module 3: Macroeconomics',  4),
  ('Fiscal & Monetary Policy',          'Lower Sixth', 3, 'Module 3: Macroeconomics',  5),
  -- Upper Sixth
  ('Labour Markets',                    'Upper Sixth', 1, 'Module 1: Applied Micro',   1),
  ('Income Distribution & Poverty',     'Upper Sixth', 1, 'Module 1: Applied Micro',   2),
  ('Economic Growth & Development',     'Upper Sixth', 2, 'Module 2: Development',     3),
  ('Global Economy & Trade Policy',     'Upper Sixth', 2, 'Module 2: Development',     4),
  ('Financial Markets',                 'Upper Sixth', 3, 'Module 3: Finance',         5)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'ECO'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── Computer Science (Form 1-5 + A-Level) ───────────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Introduction to Computers','Form 1',1,'Module 1: Fundamentals',  1),
  ('Number Systems',          'Form 1', 1, 'Module 1: Fundamentals', 2),
  ('Computer Hardware',       'Form 1', 2, 'Module 2: Hardware',     3),
  ('Operating Systems',       'Form 2', 1, 'Module 1: Software',     1),
  ('Word Processing',         'Form 2', 2, 'Module 2: Applications', 2),
  ('Spreadsheets',            'Form 2', 2, 'Module 2: Applications', 3),
  ('Introduction to Programming','Form 3',1,'Module 1: Programming', 1),
  ('Algorithms & Flowcharts', 'Form 3', 1, 'Module 1: Programming',  2),
  ('Databases',               'Form 4', 1, 'Module 1: Data',         1),
  ('Networking Basics',       'Form 4', 2, 'Module 2: Networks',     2),
  ('Web Development',         'Form 5', 1, 'Module 1: Web',          1),
  ('Cybersecurity',           'Form 5', 2, 'Module 2: Security',     2),
  -- Lower Sixth
  ('Data Structures',                   'Lower Sixth', 1, 'Module 1: Data Structures',  1),
  ('Algorithms Analysis',              'Lower Sixth', 1, 'Module 1: Data Structures',  2),
  ('Object-Oriented Programming',      'Lower Sixth', 2, 'Module 2: Programming',      3),
  ('Computer Architecture',            'Lower Sixth', 3, 'Module 3: Systems',          4),
  ('Networking & Protocols',           'Lower Sixth', 3, 'Module 3: Systems',          5),
  -- Upper Sixth
  ('Advanced Algorithms',              'Upper Sixth', 1, 'Module 1: Theory',           1),
  ('Computational Thinking',           'Upper Sixth', 1, 'Module 1: Theory',           2),
  ('Database Design & SQL',            'Upper Sixth', 2, 'Module 2: Data',             3),
  ('Software Engineering',             'Upper Sixth', 2, 'Module 2: Data',             4),
  ('Artificial Intelligence Basics',   'Upper Sixth', 3, 'Module 3: Advanced',         5),
  ('Functional Programming',           'Upper Sixth', 3, 'Module 3: Advanced',         6)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'CSC'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── Literature in English (Lower/Upper Sixth) ───────────────

INSERT INTO "Topic" ("id", "name", "classLevel", "subjectId", "moduleNum", "moduleName", "orderIndex", "createdAt")
SELECT gen_random_uuid()::text, t.name, t.level, s."id", t.mnum, t.mname, t.idx, NOW()
FROM "Subject" s,
(VALUES
  ('Introduction to Literary Analysis',  'Lower Sixth', 1, 'Module 1: Prose',           1),
  ('African Prose',                      'Lower Sixth', 1, 'Module 1: Prose',           2),
  ('Poetry Analysis',                    'Lower Sixth', 2, 'Module 2: Poetry',          3),
  ('Drama: Shakespeare',                 'Lower Sixth', 3, 'Module 3: Drama',           4),
  ('African Drama',                      'Lower Sixth', 3, 'Module 3: Drama',           5),
  ('Comparative Literature',             'Upper Sixth', 1, 'Module 1: Comparative',     1),
  ('Literary Criticism',                 'Upper Sixth', 2, 'Module 2: Criticism',       2),
  ('Post-Colonial Literature',           'Upper Sixth', 3, 'Module 3: World Literature',3),
  ('Creative Writing',                   'Upper Sixth', 4, 'Module 4: Writing',         4)
) AS t(name, level, mnum, mname, idx)
WHERE s."code" = 'LIT'
ON CONFLICT ("subjectId", "classLevel", "name") DO NOTHING;

-- ── DONE ────────────────────────────────────────────────────
-- All tables, columns, indexes, foreign keys, Gender enum,
-- seed subjects, and seed topics (Form 1–5 + Lower/Upper Sixth)
-- are now in sync.
