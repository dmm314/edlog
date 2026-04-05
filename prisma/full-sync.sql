-- ============================================================
-- EdLog: Complete Database Sync Script — v7.0
--
-- Safe to run multiple times (uses IF NOT EXISTS everywhere).
-- Paste this ENTIRE script into the Neon SQL Editor and run it.
-- Matches prisma/schema.prisma exactly.
--
-- This does NOT delete data. It only ADDS missing tables,
-- columns, indexes, and constraints. Use neon-reset.sql if
-- you want to wipe everything and start fresh.
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
  CREATE TYPE "NotificationType" AS ENUM ('LOG_REMINDER', 'WEEKLY_SUMMARY', 'COMPLIANCE_WARNING', 'LOG_REVIEWED', 'NEW_TEACHER', 'CURRICULUM_GAP', 'GENERAL', 'SCHOOL_INVITATION', 'SCHOOL_ANNOUNCEMENT', 'REGIONAL_ANNOUNCEMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add enum values that may be missing
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SCHOOL_INVITATION'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SCHOOL_ANNOUNCEMENT'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REGIONAL_ANNOUNCEMENT'; EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TeacherSchoolStatus" AS ENUM ('PENDING', 'ACTIVE', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Language" AS ENUM ('EN', 'FR');
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
CREATE UNIQUE INDEX IF NOT EXISTS "Region_name_key" ON "Region"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Region_code_key" ON "Region"("code");

CREATE TABLE IF NOT EXISTS "Division" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Division_regionId_name_key" ON "Division"("regionId", "name");

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "teacherCode" TEXT,
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
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_teacherCode_key" ON "User"("teacherCode");

-- Add columns that may be missing from older schemas
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teacherCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" "Gender";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "regionId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qualifications" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yearsOfExperience" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "matricule" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" "Language" NOT NULL DEFAULT 'EN';
CREATE INDEX IF NOT EXISTS "User_schoolId_role_idx" ON "User"("schoolId", "role");

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");

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
CREATE UNIQUE INDEX IF NOT EXISTS "RegistrationCode_code_key" ON "RegistrationCode"("code");
CREATE INDEX IF NOT EXISTS "RegistrationCode_regionId_idx" ON "RegistrationCode"("regionId");
CREATE INDEX IF NOT EXISTS "RegistrationCode_code_idx" ON "RegistrationCode"("code");

CREATE TABLE IF NOT EXISTS "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "schoolType" TEXT,
    "principalName" TEXT,
    "principalPhone" TEXT,
    "foundingDate" TIMESTAMP(3),
    "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "regionId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "adminId" TEXT,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "School_code_key" ON "School"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "School_adminId_key" ON "School"("adminId");
CREATE INDEX IF NOT EXISTS "School_regionId_divisionId_idx" ON "School"("regionId", "divisionId");

-- Add columns that may be missing from older schemas
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "schoolType" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "principalName" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "principalPhone" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "foundingDate" TIMESTAMP(3);
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "profileComplete" BOOLEAN NOT NULL DEFAULT false;

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
CREATE UNIQUE INDEX IF NOT EXISTS "PeriodSchedule_schoolId_periodNum_key" ON "PeriodSchedule"("schoolId", "periodNum");

CREATE TABLE IF NOT EXISTS "TeacherSchool" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" "TeacherSchoolStatus" NOT NULL DEFAULT 'PENDING',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherSchool_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherSchool_teacherId_schoolId_key" ON "TeacherSchool"("teacherId", "schoolId");
CREATE INDEX IF NOT EXISTS "TeacherSchool_teacherId_idx" ON "TeacherSchool"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherSchool_schoolId_idx" ON "TeacherSchool"("schoolId");

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
CREATE UNIQUE INDEX IF NOT EXISTS "Class_schoolId_name_year_key" ON "Class"("schoolId", "name", "year");

-- Add columns that may be missing from older schemas
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "abbreviation" TEXT;

CREATE TABLE IF NOT EXISTS "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_name_key" ON "Subject"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_code_key" ON "Subject"("code");

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
CREATE INDEX IF NOT EXISTS "Topic_subjectId_classLevel_idx" ON "Topic"("subjectId", "classLevel");
CREATE UNIQUE INDEX IF NOT EXISTS "Topic_subjectId_classLevel_name_key" ON "Topic"("subjectId", "classLevel", "name");

-- Add columns that may be missing from older schemas
ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "classLevel" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "SchoolSubject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "SchoolSubject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SchoolSubject_schoolId_subjectId_key" ON "SchoolSubject"("schoolId", "subjectId");

CREATE TABLE IF NOT EXISTS "ClassSubject" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId", "subjectId");

CREATE TABLE IF NOT EXISTS "SubjectDivision" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubjectDivision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SubjectDivision_schoolId_subjectId_name_key" ON "SubjectDivision"("schoolId", "subjectId", "name");
CREATE INDEX IF NOT EXISTS "SubjectDivision_schoolId_subjectId_idx" ON "SubjectDivision"("schoolId", "subjectId");

CREATE TABLE IF NOT EXISTS "HeadOfDepartment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HeadOfDepartment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HeadOfDepartment_schoolId_subjectId_key" ON "HeadOfDepartment"("schoolId", "subjectId");
CREATE INDEX IF NOT EXISTS "HeadOfDepartment_teacherId_idx" ON "HeadOfDepartment"("teacherId");
CREATE INDEX IF NOT EXISTS "HeadOfDepartment_schoolId_idx" ON "HeadOfDepartment"("schoolId");

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
CREATE INDEX IF NOT EXISTS "TeacherAssignment_teacherId_idx" ON "TeacherAssignment"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherAssignment_schoolId_idx" ON "TeacherAssignment"("schoolId");
CREATE INDEX IF NOT EXISTS "TeacherAssignment_teacherId_schoolId_idx" ON "TeacherAssignment"("teacherId", "schoolId");
CREATE INDEX IF NOT EXISTS "TeacherAssignment_schoolId_classId_idx" ON "TeacherAssignment"("schoolId", "classId");
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherAssignment_teacherId_classId_subjectId_divisionId_key" ON "TeacherAssignment"("teacherId", "classId", "subjectId", "divisionId");

-- Add columns that may be missing from older schemas
ALTER TABLE "TeacherAssignment" ADD COLUMN IF NOT EXISTS "divisionId" TEXT;

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
CREATE INDEX IF NOT EXISTS "TimetableSlot_schoolId_dayOfWeek_idx" ON "TimetableSlot"("schoolId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "TimetableSlot_assignmentId_idx" ON "TimetableSlot"("assignmentId");

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
CREATE INDEX IF NOT EXISTS "LogbookEntry_teacherId_date_idx" ON "LogbookEntry"("teacherId", "date");
CREATE INDEX IF NOT EXISTS "LogbookEntry_classId_date_idx" ON "LogbookEntry"("classId", "date");

-- Add columns that may be missing from older schemas
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "moduleName" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "topicText" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "studentAttendance" INTEGER;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "engagementLevel" "EngagementLevel";
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "assignmentId" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "timetableSlotId" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "academicYearId" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "weekNumber" INTEGER;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "classDidNotHold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "classDidNotHoldReason" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "offlineCreatedAt" TIMESTAMP(3);
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "familyOfSituation" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "bilingualActivity" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "bilingualType" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "bilingualNote" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "integrationActivity" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "integrationLevel" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "integrationStatus" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "lessonMode" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "digitalTools" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "assignmentGiven" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "assignmentDetails" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "assignmentReviewed" BOOLEAN;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "verificationSignature" TEXT;
CREATE INDEX IF NOT EXISTS "LogbookEntry_schoolId_date_status_idx" ON "LogbookEntry"("schoolId", "date", "status");
CREATE INDEX IF NOT EXISTS "LogbookEntry_teacherId_academicYearId_termId_idx" ON "LogbookEntry"("teacherId", "academicYearId", "termId");

-- Add missing Notification columns
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "senderRole" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

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
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "_EntryTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "_EntryTopics_AB_unique" ON "_EntryTopics"("A", "B");
CREATE INDEX IF NOT EXISTS "_EntryTopics_B_index" ON "_EntryTopics"("B");

-- ── FOREIGN KEYS (safe: wrapped in DO blocks) ───────────────

DO $$ BEGIN
  ALTER TABLE "Division" ADD CONSTRAINT "Division_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
  ALTER TABLE "TeacherSchool" ADD CONSTRAINT "TeacherSchool_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "TeacherSchool" ADD CONSTRAINT "TeacherSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
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
  ALTER TABLE "SubjectDivision" ADD CONSTRAINT "SubjectDivision_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SubjectDivision" ADD CONSTRAINT "SubjectDivision_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "HeadOfDepartment" ADD CONSTRAINT "HeadOfDepartment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "HeadOfDepartment" ADD CONSTRAINT "HeadOfDepartment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "HeadOfDepartment" ADD CONSTRAINT "HeadOfDepartment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
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
  ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "SubjectDivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
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

-- ── LEVEL COORDINATOR (Vice Principals) ─────────────────────
CREATE TABLE IF NOT EXISTS "LevelCoordinator" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "schoolId"  TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "levels"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "canVerify" BOOLEAN NOT NULL DEFAULT true,
    "canRemark" BOOLEAN NOT NULL DEFAULT true,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LevelCoordinator_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "LevelCoordinator" ADD CONSTRAINT "LevelCoordinator_userId_schoolId_key" UNIQUE ("userId", "schoolId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "LevelCoordinator_schoolId_idx" ON "LevelCoordinator"("schoolId");
CREATE INDEX IF NOT EXISTS "LevelCoordinator_userId_idx"   ON "LevelCoordinator"("userId");

DO $$ BEGIN
    ALTER TABLE "LevelCoordinator" ADD CONSTRAINT "LevelCoordinator_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "LevelCoordinator" ADD CONSTRAINT "LevelCoordinator_schoolId_fkey"
        FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── LogbookEntry: coordinator verification metadata ──────────
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "verifiedById"    TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "verifiedByName"  TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "verifiedByTitle" TEXT;
ALTER TABLE "LogbookEntry" ADD COLUMN IF NOT EXISTS "verifiedAt"      TIMESTAMP(3);

DO $$ BEGIN
    ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_verifiedById_fkey"
        FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_schoolId_fkey"
        FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── ACADEMIC YEAR & TERMS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AcademicYear" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT false,
    "schoolId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_name_key" UNIQUE ("schoolId", "name"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "AcademicYear_schoolId_isActive_idx" ON "AcademicYear"("schoolId", "isActive");
DO $$ BEGIN ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Term" (
    "id" TEXT NOT NULL, "academicYearId" TEXT NOT NULL, "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL, "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN ALTER TABLE "Term" ADD CONSTRAINT "Term_academicYearId_number_key" UNIQUE ("academicYearId", "number"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "Term_academicYearId_idx" ON "Term"("academicYearId");
DO $$ BEGIN ALTER TABLE "Term" ADD CONSTRAINT "Term_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── AUDIT LOG ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL, "actorId" TEXT NOT NULL, "actorRole" TEXT NOT NULL,
    "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
DO $$ BEGIN ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── DRAFT ENTRIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DraftEntry" (
    "id" TEXT NOT NULL, "teacherId" TEXT NOT NULL, "formData" JSONB NOT NULL,
    "slotId" TEXT, "lastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DraftEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DraftEntry_teacherId_idx" ON "DraftEntry"("teacherId");
CREATE INDEX IF NOT EXISTS "DraftEntry_expiresAt_idx" ON "DraftEntry"("expiresAt");

-- ── ASSESSMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Assessment" (
    "id" TEXT NOT NULL, "teacherId" TEXT NOT NULL, "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL, "schoolId" TEXT NOT NULL, "assignmentId" TEXT,
    "academicYearId" TEXT, "title" TEXT NOT NULL, "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL, "totalMarks" INTEGER NOT NULL, "passMark" INTEGER NOT NULL,
    "topicsNote" TEXT, "corrected" BOOLEAN NOT NULL DEFAULT false, "correctionDate" TIMESTAMP(3),
    "totalStudents" INTEGER, "totalMale" INTEGER, "totalFemale" INTEGER,
    "totalPassed" INTEGER, "malePassed" INTEGER, "femalePassed" INTEGER,
    "highestMark" DOUBLE PRECISION, "lowestMark" DOUBLE PRECISION, "averageMark" DOUBLE PRECISION,
    "passRate" DOUBLE PRECISION, "malePassRate" DOUBLE PRECISION, "femalePassRate" DOUBLE PRECISION,
    "notifiedParents" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Assessment_teacherId_classId_idx" ON "Assessment"("teacherId", "classId");
CREATE INDEX IF NOT EXISTS "Assessment_schoolId_date_idx" ON "Assessment"("schoolId", "date");
CREATE INDEX IF NOT EXISTS "Assessment_classId_subjectId_idx" ON "Assessment"("classId", "subjectId");
CREATE INDEX IF NOT EXISTS "Assessment_schoolId_academicYearId_type_idx" ON "Assessment"("schoolId", "academicYearId", "type");
DO $$ BEGIN ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "_AssessmentTopics" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS "_AssessmentTopics_AB_unique" ON "_AssessmentTopics"("A", "B");
CREATE INDEX IF NOT EXISTS "_AssessmentTopics_B_index" ON "_AssessmentTopics"("B");
DO $$ BEGIN ALTER TABLE "_AssessmentTopics" ADD CONSTRAINT "_AssessmentTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "_AssessmentTopics" ADD CONSTRAINT "_AssessmentTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── ENTRY VIEWS ("Seen" tracking) ─────────────────────────────
CREATE TABLE IF NOT EXISTS "EntryView" (
    "id" TEXT NOT NULL, "entryId" TEXT NOT NULL, "viewerId" TEXT NOT NULL,
    "viewerRole" TEXT NOT NULL, "viewerTitle" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntryView_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN ALTER TABLE "EntryView" ADD CONSTRAINT "EntryView_entryId_viewerId_key" UNIQUE ("entryId", "viewerId"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "EntryView_entryId_idx" ON "EntryView"("entryId");
CREATE INDEX IF NOT EXISTS "EntryView_viewerId_idx" ON "EntryView"("viewerId");
DO $$ BEGIN ALTER TABLE "EntryView" ADD CONSTRAINT "EntryView_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "EntryView" ADD CONSTRAINT "EntryView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── ENTRY REMARKS (feedback & review) ─────────────────────────
CREATE TABLE IF NOT EXISTS "EntryRemark" (
    "id" TEXT NOT NULL, "entryId" TEXT NOT NULL, "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL, "content" TEXT NOT NULL, "remarkType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntryRemark_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EntryRemark_entryId_createdAt_idx" ON "EntryRemark"("entryId", "createdAt");
CREATE INDEX IF NOT EXISTS "EntryRemark_authorId_idx" ON "EntryRemark"("authorId");
DO $$ BEGIN ALTER TABLE "EntryRemark" ADD CONSTRAINT "EntryRemark_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "EntryRemark" ADD CONSTRAINT "EntryRemark_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- DONE! All tables, enums, indexes, and foreign keys are synced.
-- This script is safe to re-run at any time.
-- Matches prisma/schema.prisma v7.0
-- ============================================================
