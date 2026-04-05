-- ============================================================
-- EDLOG: COMPLETE DATABASE RESET — v7.0
--
-- HOW TO USE:
-- 1. Go to console.neon.tech → your project → SQL Editor
-- 2. Paste this ENTIRE file
-- 3. Click "Run"
-- 4. Done. Database is wiped clean and seeded with:
--    • 10 Cameroon regions + 58 divisions
--    • 10 Regional admin accounts (password: Edlog2026!)
--    • Full schema matching prisma/schema.prisma
--
-- WARNING: This DROPS all tables. All existing data is lost.
-- ============================================================

-- STEP 1: Drop all existing tables (in dependency order)
DROP TABLE IF EXISTS "_AssessmentTopics" CASCADE;
DROP TABLE IF EXISTS "_EntryTopics" CASCADE;
DROP TABLE IF EXISTS "EntryRemark" CASCADE;
DROP TABLE IF EXISTS "EntryView" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "DraftEntry" CASCADE;
DROP TABLE IF EXISTS "Assessment" CASCADE;
DROP TABLE IF EXISTS "LevelCoordinator" CASCADE;
DROP TABLE IF EXISTS "Term" CASCADE;
DROP TABLE IF EXISTS "AcademicYear" CASCADE;
DROP TABLE IF EXISTS "LogbookEntry" CASCADE;
DROP TABLE IF EXISTS "TimetableSlot" CASCADE;
DROP TABLE IF EXISTS "TeacherAssignment" CASCADE;
DROP TABLE IF EXISTS "HeadOfDepartment" CASCADE;
DROP TABLE IF EXISTS "SubjectDivision" CASCADE;
DROP TABLE IF EXISTS "TeacherSchool" CASCADE;
DROP TABLE IF EXISTS "PeriodSchedule" CASCADE;
DROP TABLE IF EXISTS "ClassSubject" CASCADE;
DROP TABLE IF EXISTS "SchoolSubject" CASCADE;
DROP TABLE IF EXISTS "Topic" CASCADE;
DROP TABLE IF EXISTS "Subject" CASCADE;
DROP TABLE IF EXISTS "Class" CASCADE;
DROP TABLE IF EXISTS "RegistrationCode" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "School" CASCADE;
DROP TABLE IF EXISTS "Division" CASCADE;
DROP TABLE IF EXISTS "Region" CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "CodeType" CASCADE;
DROP TYPE IF EXISTS "SchoolStatus" CASCADE;
DROP TYPE IF EXISTS "EngagementLevel" CASCADE;
DROP TYPE IF EXISTS "Gender" CASCADE;
DROP TYPE IF EXISTS "NotificationType" CASCADE;
DROP TYPE IF EXISTS "TeacherSchoolStatus" CASCADE;
DROP TYPE IF EXISTS "Language" CASCADE;

-- ============================================================
-- STEP 2: Create enums
-- ============================================================

CREATE TYPE "Role" AS ENUM ('TEACHER', 'SCHOOL_ADMIN', 'REGIONAL_ADMIN');
CREATE TYPE "CodeType" AS ENUM ('SCHOOL_REGISTRATION');
CREATE TYPE "SchoolStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "EngagementLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "Language" AS ENUM ('EN', 'FR');
CREATE TYPE "NotificationType" AS ENUM ('LOG_REMINDER', 'WEEKLY_SUMMARY', 'COMPLIANCE_WARNING', 'LOG_REVIEWED', 'NEW_TEACHER', 'CURRICULUM_GAP', 'GENERAL', 'SCHOOL_INVITATION', 'SCHOOL_ANNOUNCEMENT', 'REGIONAL_ANNOUNCEMENT');
CREATE TYPE "TeacherSchoolStatus" AS ENUM ('PENDING', 'ACTIVE', 'REMOVED');

-- ============================================================
-- STEP 3: Create tables
-- ============================================================

CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capital" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Division_regionId_name_key" ON "Division"("regionId", "name");

CREATE TABLE "User" (
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
    "qualifications" TEXT[] NOT NULL DEFAULT '{}',
    "yearsOfExperience" INTEGER,
    "matricule" TEXT,
    "preferredLanguage" "Language" NOT NULL DEFAULT 'EN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT,
    "regionId" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_teacherCode_key" ON "User"("teacherCode");
CREATE INDEX "User_schoolId_role_idx" ON "User"("schoolId", "role");

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

CREATE TABLE "RegistrationCode" (
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
CREATE UNIQUE INDEX "RegistrationCode_code_key" ON "RegistrationCode"("code");
CREATE INDEX "RegistrationCode_regionId_idx" ON "RegistrationCode"("regionId");
CREATE INDEX "RegistrationCode_code_idx" ON "RegistrationCode"("code");

CREATE TABLE "School" (
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
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");
CREATE UNIQUE INDEX "School_adminId_key" ON "School"("adminId");
CREATE INDEX "School_regionId_divisionId_idx" ON "School"("regionId", "divisionId");

CREATE TABLE "PeriodSchedule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "periodNum" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeriodSchedule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PeriodSchedule_schoolId_periodNum_key" ON "PeriodSchedule"("schoolId", "periodNum");

CREATE TABLE "TeacherSchool" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" "TeacherSchoolStatus" NOT NULL DEFAULT 'PENDING',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherSchool_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeacherSchool_teacherId_schoolId_key" ON "TeacherSchool"("teacherId", "schoolId");
CREATE INDEX "TeacherSchool_teacherId_idx" ON "TeacherSchool"("teacherId");
CREATE INDEX "TeacherSchool_schoolId_idx" ON "TeacherSchool"("schoolId");

CREATE TABLE "Class" (
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
CREATE UNIQUE INDEX "Class_schoolId_name_year_key" ON "Class"("schoolId", "name", "year");

CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

CREATE TABLE "Topic" (
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
CREATE INDEX "Topic_subjectId_classLevel_idx" ON "Topic"("subjectId", "classLevel");
CREATE UNIQUE INDEX "Topic_subjectId_classLevel_name_key" ON "Topic"("subjectId", "classLevel", "name");

CREATE TABLE "SchoolSubject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "SchoolSubject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SchoolSubject_schoolId_subjectId_key" ON "SchoolSubject"("schoolId", "subjectId");

CREATE TABLE "ClassSubject" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId", "subjectId");

CREATE TABLE "SubjectDivision" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "levels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubjectDivision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SubjectDivision_schoolId_subjectId_name_key" ON "SubjectDivision"("schoolId", "subjectId", "name");
CREATE INDEX "SubjectDivision_schoolId_subjectId_idx" ON "SubjectDivision"("schoolId", "subjectId");

CREATE TABLE "HeadOfDepartment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HeadOfDepartment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HeadOfDepartment_schoolId_subjectId_key" ON "HeadOfDepartment"("schoolId", "subjectId");
CREATE INDEX "HeadOfDepartment_teacherId_idx" ON "HeadOfDepartment"("teacherId");
CREATE INDEX "HeadOfDepartment_schoolId_idx" ON "HeadOfDepartment"("schoolId");

CREATE TABLE "TeacherAssignment" (
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
CREATE INDEX "TeacherAssignment_teacherId_idx" ON "TeacherAssignment"("teacherId");
CREATE INDEX "TeacherAssignment_schoolId_idx" ON "TeacherAssignment"("schoolId");
CREATE INDEX "TeacherAssignment_teacherId_schoolId_idx" ON "TeacherAssignment"("teacherId", "schoolId");
CREATE INDEX "TeacherAssignment_schoolId_classId_idx" ON "TeacherAssignment"("schoolId", "classId");
CREATE UNIQUE INDEX "TeacherAssignment_teacherId_classId_subjectId_divisionId_key" ON "TeacherAssignment"("teacherId", "classId", "subjectId", "divisionId");

CREATE TABLE "TimetableSlot" (
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
CREATE INDEX "TimetableSlot_schoolId_dayOfWeek_idx" ON "TimetableSlot"("schoolId", "dayOfWeek");
CREATE INDEX "TimetableSlot_assignmentId_idx" ON "TimetableSlot"("assignmentId");

CREATE TABLE "LogbookEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" INTEGER,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "moduleName" TEXT,
    "topicText" TEXT,
    "notes" TEXT,
    "objectives" JSONB,
    "signatureData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "studentAttendance" INTEGER,
    "engagementLevel" "EngagementLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "academicYearId" TEXT,
    "termId" TEXT,
    "weekNumber" INTEGER,
    "classDidNotHold" BOOLEAN NOT NULL DEFAULT false,
    "classDidNotHoldReason" TEXT,
    "offlineCreatedAt" TIMESTAMP(3),
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "schoolId" TEXT,
    "assignmentId" TEXT,
    "timetableSlotId" TEXT,
    "familyOfSituation" TEXT,
    "bilingualActivity" BOOLEAN NOT NULL DEFAULT false,
    "bilingualType" TEXT,
    "bilingualNote" TEXT,
    "integrationActivity" TEXT,
    "integrationLevel" TEXT,
    "integrationStatus" TEXT,
    "lessonMode" TEXT,
    "digitalTools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "assignmentGiven" BOOLEAN NOT NULL DEFAULT false,
    "assignmentDetails" TEXT,
    "assignmentReviewed" BOOLEAN,
    "verifiedById" TEXT,
    "verifiedByName" TEXT,
    "verifiedByTitle" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationSignature" TEXT,
    CONSTRAINT "LogbookEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LogbookEntry_teacherId_date_idx" ON "LogbookEntry"("teacherId", "date");
CREATE INDEX "LogbookEntry_classId_date_idx" ON "LogbookEntry"("classId", "date");
CREATE INDEX "LogbookEntry_schoolId_date_status_idx" ON "LogbookEntry"("schoolId", "date", "status");
CREATE INDEX "LogbookEntry_teacherId_academicYearId_termId_idx" ON "LogbookEntry"("teacherId", "academicYearId", "termId");

-- Academic Year & Terms
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AcademicYear_schoolId_name_key" ON "AcademicYear"("schoolId", "name");
CREATE INDEX "AcademicYear_schoolId_isActive_idx" ON "AcademicYear"("schoolId", "isActive");

CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Term_academicYearId_number_key" ON "Term"("academicYearId", "number");
CREATE INDEX "Term_academicYearId_idx" ON "Term"("academicYearId");

-- Audit Log
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Draft Entries (auto-save)
CREATE TABLE "DraftEntry" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "slotId" TEXT,
    "lastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DraftEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DraftEntry_teacherId_idx" ON "DraftEntry"("teacherId");
CREATE INDEX "DraftEntry_expiresAt_idx" ON "DraftEntry"("expiresAt");

-- Assessments
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "academicYearId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "passMark" INTEGER NOT NULL,
    "topicsNote" TEXT,
    "corrected" BOOLEAN NOT NULL DEFAULT false,
    "correctionDate" TIMESTAMP(3),
    "totalStudents" INTEGER,
    "totalMale" INTEGER,
    "totalFemale" INTEGER,
    "totalPassed" INTEGER,
    "malePassed" INTEGER,
    "femalePassed" INTEGER,
    "highestMark" DOUBLE PRECISION,
    "lowestMark" DOUBLE PRECISION,
    "averageMark" DOUBLE PRECISION,
    "passRate" DOUBLE PRECISION,
    "malePassRate" DOUBLE PRECISION,
    "femalePassRate" DOUBLE PRECISION,
    "notifiedParents" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Assessment_teacherId_classId_idx" ON "Assessment"("teacherId", "classId");
CREATE INDEX "Assessment_schoolId_date_idx" ON "Assessment"("schoolId", "date");
CREATE INDEX "Assessment_classId_subjectId_idx" ON "Assessment"("classId", "subjectId");
CREATE INDEX "Assessment_schoolId_academicYearId_type_idx" ON "Assessment"("schoolId", "academicYearId", "type");

-- Level Coordinators (Vice Principals)
CREATE TABLE "LevelCoordinator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "levels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "canVerify" BOOLEAN NOT NULL DEFAULT true,
    "canRemark" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LevelCoordinator_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LevelCoordinator_userId_schoolId_key" ON "LevelCoordinator"("userId", "schoolId");
CREATE INDEX "LevelCoordinator_schoolId_idx" ON "LevelCoordinator"("schoolId");
CREATE INDEX "LevelCoordinator_userId_idx" ON "LevelCoordinator"("userId");

-- Entry Views ("Seen" tracking)
CREATE TABLE "EntryView" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewerRole" TEXT NOT NULL,
    "viewerTitle" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntryView_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EntryView_entryId_viewerId_key" ON "EntryView"("entryId", "viewerId");
CREATE INDEX "EntryView_entryId_idx" ON "EntryView"("entryId");
CREATE INDEX "EntryView_viewerId_idx" ON "EntryView"("viewerId");

-- Entry Remarks (feedback & review)
CREATE TABLE "EntryRemark" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "remarkType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntryRemark_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EntryRemark_entryId_createdAt_idx" ON "EntryRemark"("entryId", "createdAt");
CREATE INDEX "EntryRemark_authorId_idx" ON "EntryRemark"("authorId");

-- Notifications
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "senderRole" TEXT,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- Join tables
CREATE TABLE "_EntryTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_EntryTopics_AB_unique" ON "_EntryTopics"("A", "B");
CREATE INDEX "_EntryTopics_B_index" ON "_EntryTopics"("B");

CREATE TABLE "_AssessmentTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_AssessmentTopics_AB_unique" ON "_AssessmentTopics"("A", "B");
CREATE INDEX "_AssessmentTopics_B_index" ON "_AssessmentTopics"("B");

-- ============================================================
-- STEP 4: Foreign keys
-- ============================================================

ALTER TABLE "Division" ADD CONSTRAINT "Division_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegistrationCode" ADD CONSTRAINT "RegistrationCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "School" ADD CONSTRAINT "School_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "School" ADD CONSTRAINT "School_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "School" ADD CONSTRAINT "School_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PeriodSchedule" ADD CONSTRAINT "PeriodSchedule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherSchool" ADD CONSTRAINT "TeacherSchool_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherSchool" ADD CONSTRAINT "TeacherSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubjectDivision" ADD CONSTRAINT "SubjectDivision_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubjectDivision" ADD CONSTRAINT "SubjectDivision_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HeadOfDepartment" ADD CONSTRAINT "HeadOfDepartment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HeadOfDepartment" ADD CONSTRAINT "HeadOfDepartment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HeadOfDepartment" ADD CONSTRAINT "HeadOfDepartment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "SubjectDivision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeacherAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeacherAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "TimetableSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Term" ADD CONSTRAINT "Term_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LevelCoordinator" ADD CONSTRAINT "LevelCoordinator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LevelCoordinator" ADD CONSTRAINT "LevelCoordinator_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EntryView" ADD CONSTRAINT "EntryView_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntryView" ADD CONSTRAINT "EntryView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EntryRemark" ADD CONSTRAINT "EntryRemark_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntryRemark" ADD CONSTRAINT "EntryRemark_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "_EntryTopics" ADD CONSTRAINT "_EntryTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EntryTopics" ADD CONSTRAINT "_EntryTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_AssessmentTopics" ADD CONSTRAINT "_AssessmentTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_AssessmentTopics" ADD CONSTRAINT "_AssessmentTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- STEP 5: Seed 10 Regions + Divisions
-- ============================================================

-- Adamawa
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_ad', 'Adamawa', 'AD', 'Ngaoundere');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_ad_1', 'Djerem', 'reg_ad'), ('div_ad_2', 'Faro-et-Deo', 'reg_ad'), ('div_ad_3', 'Mayo-Banyo', 'reg_ad'), ('div_ad_4', 'Mbere', 'reg_ad'), ('div_ad_5', 'Vina', 'reg_ad');

-- Centre
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_ce', 'Centre', 'CE', 'Yaounde');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_ce_1', 'Haute-Sanaga', 'reg_ce'), ('div_ce_2', 'Lekie', 'reg_ce'), ('div_ce_3', 'Mbam-et-Inoubou', 'reg_ce'), ('div_ce_4', 'Mbam-et-Kim', 'reg_ce'), ('div_ce_5', 'Mefou-et-Afamba', 'reg_ce'), ('div_ce_6', 'Mefou-et-Akono', 'reg_ce'), ('div_ce_7', 'Mfoundi', 'reg_ce'), ('div_ce_8', 'Nyong-et-Kelle', 'reg_ce'), ('div_ce_9', 'Nyong-et-Mfoumou', 'reg_ce'), ('div_ce_10', 'Nyong-et-Soo', 'reg_ce');

-- East
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_es', 'East', 'ES', 'Bertoua');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_es_1', 'Boumba-et-Ngoko', 'reg_es'), ('div_es_2', 'Haut-Nyong', 'reg_es'), ('div_es_3', 'Kadey', 'reg_es'), ('div_es_4', 'Lom-et-Djerem', 'reg_es');

-- Far North
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_fn', 'Far North', 'FN', 'Maroua');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_fn_1', 'Diamare', 'reg_fn'), ('div_fn_2', 'Logone-et-Chari', 'reg_fn'), ('div_fn_3', 'Mayo-Danay', 'reg_fn'), ('div_fn_4', 'Mayo-Kani', 'reg_fn'), ('div_fn_5', 'Mayo-Sava', 'reg_fn'), ('div_fn_6', 'Mayo-Tsanaga', 'reg_fn');

-- Littoral
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_lt', 'Littoral', 'LT', 'Douala');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_lt_1', 'Moungo', 'reg_lt'), ('div_lt_2', 'Nkam', 'reg_lt'), ('div_lt_3', 'Sanaga-Maritime', 'reg_lt'), ('div_lt_4', 'Wouri', 'reg_lt');

-- North
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_no', 'North', 'NO', 'Garoua');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_no_1', 'Benoue', 'reg_no'), ('div_no_2', 'Faro', 'reg_no'), ('div_no_3', 'Mayo-Louti', 'reg_no'), ('div_no_4', 'Mayo-Rey', 'reg_no');

-- Northwest
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_nw', 'Northwest', 'NW', 'Bamenda');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_nw_1', 'Boyo', 'reg_nw'), ('div_nw_2', 'Bui', 'reg_nw'), ('div_nw_3', 'Donga-Mantung', 'reg_nw'), ('div_nw_4', 'Menchum', 'reg_nw'), ('div_nw_5', 'Mezam', 'reg_nw'), ('div_nw_6', 'Momo', 'reg_nw'), ('div_nw_7', 'Ngo-Ketunjia', 'reg_nw');

-- South
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_su', 'South', 'SU', 'Ebolowa');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_su_1', 'Dja-et-Lobo', 'reg_su'), ('div_su_2', 'Mvila', 'reg_su'), ('div_su_3', 'Ocean', 'reg_su'), ('div_su_4', 'Vallee-du-Ntem', 'reg_su');

-- Southwest
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_sw', 'Southwest', 'SW', 'Buea');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_sw_1', 'Fako', 'reg_sw'), ('div_sw_2', 'Koupe-Manengouba', 'reg_sw'), ('div_sw_3', 'Lebialem', 'reg_sw'), ('div_sw_4', 'Manyu', 'reg_sw'), ('div_sw_5', 'Meme', 'reg_sw'), ('div_sw_6', 'Ndian', 'reg_sw');

-- West
INSERT INTO "Region" ("id", "name", "code", "capital") VALUES ('reg_ou', 'West', 'OU', 'Bafoussam');
INSERT INTO "Division" ("id", "name", "regionId") VALUES ('div_ou_1', 'Bamboutos', 'reg_ou'), ('div_ou_2', 'Haut-Nkam', 'reg_ou'), ('div_ou_3', 'Hauts-Plateaux', 'reg_ou'), ('div_ou_4', 'Koung-Khi', 'reg_ou'), ('div_ou_5', 'Menoua', 'reg_ou'), ('div_ou_6', 'Mifi', 'reg_ou'), ('div_ou_7', 'Nde', 'reg_ou'), ('div_ou_8', 'Noun', 'reg_ou');

-- ============================================================
-- STEP 6: Seed 10 Regional Admin accounts
-- Password for ALL accounts: Edlog2026!
-- Hash: bcryptjs, 12 rounds — verified with round-trip test
-- ============================================================

INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "role", "isVerified", "updatedAt", "regionId") VALUES
  ('usr_ad', 'adamawa@edlog.cm',   '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Aissatou',      'Mohammadou',    'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_ad'),
  ('usr_ce', 'centre@edlog.cm',    '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Jean-Pierre',   'Atangana',      'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_ce'),
  ('usr_es', 'east@edlog.cm',      '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Helene',        'Mbassi',        'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_es'),
  ('usr_fn', 'farnorth@edlog.cm',  '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Oumarou',       'Boukar',        'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_fn'),
  ('usr_lt', 'littoral@edlog.cm',  '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Christelle',    'Douala-Bell',   'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_lt'),
  ('usr_no', 'north@edlog.cm',     '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Abdoulaye',     'Hamadou',       'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_no'),
  ('usr_nw', 'northwest@edlog.cm', '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Comfort',       'Ngwa',          'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_nw'),
  ('usr_su', 'south@edlog.cm',     '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Marie-Claire',  'Oyono',         'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_su'),
  ('usr_sw', 'southwest@edlog.cm', '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Peter',         'Enoh Mbi',      'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_sw'),
  ('usr_ou', 'west@edlog.cm',      '$2b$12$YULpenRyYHuaYRvht1Qp..zmUhts2g6aek3AfyHZy.IuGienG18wu', 'Bernadette',    'Tchouankam',    'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_ou');

-- ============================================================
-- DONE! Database is clean and production-ready.
--
-- 10 Regions + 58 Divisions (all Cameroon)
-- 10 Regional Admin accounts (real Cameroonian names)
--
-- Login credentials (same password for all):
--   adamawa@edlog.cm    / Edlog2026!
--   centre@edlog.cm     / Edlog2026!
--   east@edlog.cm       / Edlog2026!
--   farnorth@edlog.cm   / Edlog2026!
--   littoral@edlog.cm   / Edlog2026!
--   north@edlog.cm      / Edlog2026!
--   northwest@edlog.cm  / Edlog2026!
--   south@edlog.cm      / Edlog2026!
--   southwest@edlog.cm  / Edlog2026!
--   west@edlog.cm       / Edlog2026!
--
-- No demo schools or teachers — those are created through
-- the regional admin registration flow at /register/school
-- ============================================================
