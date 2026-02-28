-- ============================================================
-- EDLOG: COMPLETE DATABASE RESET
-- Paste this into Neon SQL Editor (console.neon.tech)
-- ============================================================

-- STEP 1: Drop all existing tables (in dependency order)
DROP TABLE IF EXISTS "_EntryTopics" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "LogbookEntry" CASCADE;
DROP TABLE IF EXISTS "TimetableSlot" CASCADE;
DROP TABLE IF EXISTS "TeacherAssignment" CASCADE;
DROP TABLE IF EXISTS "PeriodSchedule" CASCADE;
DROP TABLE IF EXISTS "ClassSubject" CASCADE;
DROP TABLE IF EXISTS "SchoolSubject" CASCADE;
DROP TABLE IF EXISTS "Topic" CASCADE;
DROP TABLE IF EXISTS "Subject" CASCADE;
DROP TABLE IF EXISTS "Class" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "RegistrationCode" CASCADE;
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

-- ============================================================
-- STEP 2: Create enums
-- ============================================================

CREATE TYPE "Role" AS ENUM ('TEACHER', 'SCHOOL_ADMIN', 'REGIONAL_ADMIN');
CREATE TYPE "CodeType" AS ENUM ('SCHOOL_REGISTRATION');
CREATE TYPE "SchoolStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "EngagementLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "NotificationType" AS ENUM ('LOG_REMINDER', 'WEEKLY_SUMMARY', 'COMPLIANCE_WARNING', 'LOG_REVIEWED', 'NEW_TEACHER', 'CURRICULUM_GAP', 'GENERAL');

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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

CREATE TABLE "TeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TeacherAssignment_teacherId_idx" ON "TeacherAssignment"("teacherId");
CREATE INDEX "TeacherAssignment_schoolId_idx" ON "TeacherAssignment"("schoolId");
CREATE UNIQUE INDEX "TeacherAssignment_teacherId_classId_subjectId_key" ON "TeacherAssignment"("teacherId", "classId", "subjectId");

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
CREATE INDEX "LogbookEntry_teacherId_date_idx" ON "LogbookEntry"("teacherId", "date");
CREATE INDEX "LogbookEntry_classId_date_idx" ON "LogbookEntry"("classId", "date");

CREATE TABLE "Notification" (
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
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

CREATE TABLE "_EntryTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_EntryTopics_AB_unique" ON "_EntryTopics"("A", "B");
CREATE INDEX "_EntryTopics_B_index" ON "_EntryTopics"("B");

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
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeacherAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeacherAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "TimetableSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "_EntryTopics" ADD CONSTRAINT "_EntryTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EntryTopics" ADD CONSTRAINT "_EntryTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
-- ============================================================

INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "role", "isVerified", "updatedAt", "regionId") VALUES
  ('usr_ad', 'adamawa@edlog.cm',   '$2b$12$NR9O8dGCyQaT/9Bem6/QIujECNuyXKmE0HaREkp82Ti4yrJ7wBk9y', 'Regional', 'Admin — Adamawa',   'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_ad'),
  ('usr_ce', 'centre@edlog.cm',    '$2b$12$Hau0b8sxyGJBYHBbw0vBju2YzG.F8vKM28Gvwfei5T0IXa6TUHbB2', 'Regional', 'Admin — Centre',    'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_ce'),
  ('usr_es', 'east@edlog.cm',      '$2b$12$QI2UjIrJnQe1T1bb72L9YOpV0vg2xDa/xzSEl377i8iS7I5zHH59S', 'Regional', 'Admin — East',      'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_es'),
  ('usr_fn', 'farnorth@edlog.cm',  '$2b$12$Q/yKU7KxCx86L0oYhpX./OCWJXE6aXz5qFefDpJnCxbM2qPJd1iYq', 'Regional', 'Admin — Far North', 'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_fn'),
  ('usr_lt', 'littoral@edlog.cm',  '$2b$12$GFtNbyWOY7lvts4TZgIPeOcnYxIpoGZk4N8xZfgqutf.VU0fU8dUu', 'Regional', 'Admin — Littoral',  'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_lt'),
  ('usr_no', 'north@edlog.cm',     '$2b$12$tTisp0ecmqdpmDU.lKdBpeTW/i9PhG6JxFJ2zTaIX8.bCHZM6gCQq', 'Regional', 'Admin — North',     'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_no'),
  ('usr_nw', 'northwest@edlog.cm', '$2b$12$9LuOSbIXOJZXWBkpEywvVu.0.CnYd.GSq9SdRvSxtOxblIMyMALJ2', 'Regional', 'Admin — Northwest', 'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_nw'),
  ('usr_su', 'south@edlog.cm',     '$2b$12$RITUuUs8NdNzNtSvvG47xe1FLCuzPmM7bRiCSiV1k6uaE4/LoOvCy', 'Regional', 'Admin — South',     'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_su'),
  ('usr_sw', 'southwest@edlog.cm', '$2b$12$4TcJrKlrkf3cHHaVLDl7me3aImwmOgL8Y83HgAjN1RjKD/h0FUKTW', 'Regional', 'Admin — Southwest', 'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_sw'),
  ('usr_ou', 'west@edlog.cm',      '$2b$12$4rU/9k8CaW9v03tJk8A/qeDczoRCwgPdy8SUi9NoRAhRlMvzP7hmC', 'Regional', 'Admin — West',      'REGIONAL_ADMIN', true, CURRENT_TIMESTAMP, 'reg_ou');

-- ============================================================
-- DONE! Database is clean with 10 regions and 10 regional admins.
-- Schools register at /register/school
-- Teachers register at /register
-- ============================================================
