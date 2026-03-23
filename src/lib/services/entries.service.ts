/**
 * Entry Service — Business logic for logbook entries.
 * All entry-related operations go through this service.
 * API routes should be thin wrappers around these functions.
 */
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface CreateEntryInput {
  teacherId: string;
  schoolId: string;
  date: Date;
  classId: string;
  assignmentId?: string | null;
  timetableSlotId?: string | null;
  period?: number | null;
  duration?: number;
  moduleName?: string | null;
  topicText?: string | null;
  topicIds?: string[];
  notes?: string | null;
  objectives?: Prisma.InputJsonValue;
  signatureData?: string | null;
  status?: string;
  studentAttendance?: number | null;
  engagementLevel?: "LOW" | "MEDIUM" | "HIGH" | null;
  familyOfSituation?: string | null;
  bilingualActivity?: boolean;
  bilingualType?: string | null;
  bilingualNote?: string | null;
  integrationActivity?: string | null;
  integrationLevel?: string | null;
  integrationStatus?: string | null;
  lessonMode?: string | null;
  digitalTools?: string[];
  assignmentGiven?: boolean;
  assignmentDetails?: string | null;
  assignmentReviewed?: boolean | null;
  classDidNotHold?: boolean;
  classDidNotHoldReason?: string | null;
  offlineCreatedAt?: Date | null;
  academicYearId?: string | null;
  termId?: string | null;
}

export interface EntryFilters {
  teacherId?: string;
  schoolId?: string;
  classId?: string;
  subjectId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  academicYearId?: string;
  termId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface VerifyEntryInput {
  entryId: string;
  verifiedById: string;
  verifiedByName: string;
  verifiedByTitle: string;
  verificationSignature?: string | null;
  remark?: string | null;
}

// ── Entry CRUD ───────────────────────────────────────────

export async function createEntry(input: CreateEntryInput) {
  const {
    topicIds,
    ...entryData
  } = input;

  const entry = await db.logbookEntry.create({
    data: {
      ...entryData,
      status: entryData.status || "SUBMITTED",
      duration: entryData.duration || 60,
      bilingualActivity: entryData.bilingualActivity || false,
      assignmentGiven: entryData.assignmentGiven || false,
      classDidNotHold: entryData.classDidNotHold || false,
      digitalTools: entryData.digitalTools || [],
      ...(topicIds && topicIds.length > 0
        ? { topics: { connect: topicIds.map((id) => ({ id })) } }
        : {}),
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
      class: { select: { id: true, name: true, abbreviation: true, level: true } },
      topics: { select: { id: true, name: true, moduleName: true, moduleNum: true } },
      assignment: { include: { subject: { select: { id: true, name: true, code: true } } } },
      timetableSlot: { select: { id: true, periodLabel: true, startTime: true, endTime: true } },
    },
  });

  return entry;
}

export async function getEntries(filters: EntryFilters) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const skip = (page - 1) * pageSize;

  const where: Prisma.LogbookEntryWhereInput = {};

  if (filters.teacherId) where.teacherId = filters.teacherId;
  if (filters.schoolId) where.schoolId = filters.schoolId;
  if (filters.classId) where.classId = filters.classId;
  if (filters.status) where.status = filters.status;
  if (filters.academicYearId) where.academicYearId = filters.academicYearId;
  if (filters.termId) where.termId = filters.termId;

  if (filters.subjectId) {
    where.assignment = { subjectId: filters.subjectId };
  }

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }

  if (filters.search) {
    where.OR = [
      { topicText: { contains: filters.search, mode: "insensitive" } },
      { moduleName: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.LogbookEntryOrderByWithRelationInput = {};
  const sortField = filters.sort || "date";
  const sortOrder = filters.order || "desc";
  if (sortField === "date") orderBy.date = sortOrder;
  else if (sortField === "createdAt") orderBy.createdAt = sortOrder;
  else if (sortField === "status") orderBy.status = sortOrder;

  const [entries, total] = await Promise.all([
    db.logbookEntry.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true } },
        class: { select: { id: true, name: true, abbreviation: true, level: true } },
        topics: { select: { id: true, name: true, moduleName: true, moduleNum: true, subject: { select: { id: true, name: true, code: true } } } },
        assignment: { include: { subject: { select: { id: true, name: true, code: true } } } },
        timetableSlot: { select: { id: true, periodLabel: true, startTime: true, endTime: true } },
        remarks: { select: { id: true, content: true, remarkType: true, authorRole: true, createdAt: true } },
      },
    }),
    db.logbookEntry.count({ where }),
  ]);

  return {
    data: entries,
    meta: { total, page, pageSize },
  };
}

export async function getEntryById(id: string) {
  return db.logbookEntry.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true } },
      class: { select: { id: true, name: true, abbreviation: true, level: true } },
      topics: { select: { id: true, name: true, moduleName: true, moduleNum: true, subject: { select: { id: true, name: true, code: true } } } },
      assignment: { include: { subject: { select: { id: true, name: true, code: true } } } },
      timetableSlot: { select: { id: true, periodLabel: true, startTime: true, endTime: true } },
      remarks: {
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
      views: {
        include: { viewer: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });
}

export async function updateEntry(id: string, data: Partial<CreateEntryInput>) {
  const { topicIds, ...updateData } = data;

  return db.logbookEntry.update({
    where: { id },
    data: {
      ...updateData,
      ...(topicIds !== undefined
        ? { topics: { set: topicIds.map((tid) => ({ id: tid })) } }
        : {}),
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
      class: { select: { id: true, name: true, abbreviation: true, level: true } },
      topics: true,
    },
  });
}

export async function deleteEntry(id: string) {
  return db.logbookEntry.delete({ where: { id } });
}

// ── Verification ─────────────────────────────────────────

export async function verifyEntry(input: VerifyEntryInput) {
  const { entryId, remark, ...verificationData } = input;

  const entry = await db.logbookEntry.update({
    where: { id: entryId },
    data: {
      status: "VERIFIED",
      verifiedById: verificationData.verifiedById,
      verifiedByName: verificationData.verifiedByName,
      verifiedByTitle: verificationData.verifiedByTitle,
      verifiedAt: new Date(),
      verificationSignature: verificationData.verificationSignature,
    },
  });

  if (remark) {
    await db.entryRemark.create({
      data: {
        entryId,
        authorId: verificationData.verifiedById,
        authorRole: "LEVEL_COORDINATOR",
        content: remark,
        remarkType: "admin_verification",
      },
    });
  }

  return entry;
}

export async function flagEntry(
  entryId: string,
  flaggedById: string,
  flaggedByRole: string,
  reason: string
) {
  const entry = await db.logbookEntry.update({
    where: { id: entryId },
    data: { status: "FLAGGED" },
  });

  await db.entryRemark.create({
    data: {
      entryId,
      authorId: flaggedById,
      authorRole: flaggedByRole,
      content: reason,
      remarkType: "admin_verification",
    },
  });

  return entry;
}

// ── Entry Remarks ────────────────────────────────────────

export async function addRemark(
  entryId: string,
  authorId: string,
  authorRole: string,
  content: string,
  remarkType: string
) {
  return db.entryRemark.create({
    data: { entryId, authorId, authorRole, content, remarkType },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ── Entry Views (seen tracking) ──────────────────────────

export async function markEntryViewed(
  entryId: string,
  viewerId: string,
  viewerRole: string,
  viewerTitle?: string
) {
  return db.entryView.upsert({
    where: { entryId_viewerId: { entryId, viewerId } },
    create: { entryId, viewerId, viewerRole, viewerTitle },
    update: { viewedAt: new Date() },
  });
}
