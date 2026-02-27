-- ============================================================
-- EdLog: Complete Database Sync Script
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

CREATE TABLE IF NOT EXISTS "TeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
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

-- Many-to-many join table for LogbookEntry <-> Topic
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
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherAssignment_teacherId_classId_subjectId_key" ON "TeacherAssignment"("teacherId", "classId", "subjectId");
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

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Division" ADD CONSTRAINT "Division_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "School" ADD CONSTRAINT "School_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "School" ADD CONSTRAINT "School_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "School" ADD CONSTRAINT "School_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PeriodSchedule" ADD CONSTRAINT "PeriodSchedule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeacherAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeacherAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "TimetableSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_EntryTopics" ADD CONSTRAINT "_EntryTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_EntryTopics" ADD CONSTRAINT "_EntryTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
  (gen_random_uuid()::text, 'Manual Labour',          'MLA', 'General',   NOW())
ON CONFLICT ("code") DO UPDATE SET "category" = EXCLUDED."category";

-- ── DONE ────────────────────────────────────────────────────
-- All tables, indexes, foreign keys, and seed data are now in sync.
