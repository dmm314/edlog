-- Edlog: Create all tables
-- Run this in Neon SQL Editor (https://console.neon.tech)

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT,
    "rpiBoardId" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RPIBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RPIBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rpiBoardId" TEXT NOT NULL,
    "adminId" TEXT,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "stream" TEXT,
    "section" TEXT,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "moduleNum" INTEGER,
    "moduleName" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolSubject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "SchoolSubject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LogbookEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" INTEGER,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "objectives" TEXT,
    "signatureData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    CONSTRAINT "LogbookEntry_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");
CREATE UNIQUE INDEX "School_adminId_key" ON "School"("adminId");
CREATE UNIQUE INDEX "Class_schoolId_name_year_key" ON "Class"("schoolId", "name", "year");
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");
CREATE UNIQUE INDEX "Topic_subjectId_name_key" ON "Topic"("subjectId", "name");
CREATE UNIQUE INDEX "SchoolSubject_schoolId_subjectId_key" ON "SchoolSubject"("schoolId", "subjectId");
CREATE INDEX "LogbookEntry_teacherId_date_idx" ON "LogbookEntry"("teacherId", "date");
CREATE INDEX "LogbookEntry_classId_date_idx" ON "LogbookEntry"("classId", "date");

-- Foreign Keys
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_rpiBoardId_fkey" FOREIGN KEY ("rpiBoardId") REFERENCES "RPIBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "School" ADD CONSTRAINT "School_rpiBoardId_fkey" FOREIGN KEY ("rpiBoardId") REFERENCES "RPIBoard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "School" ADD CONSTRAINT "School_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
