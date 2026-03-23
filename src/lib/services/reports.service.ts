/**
 * Reports Service — Unified report generation with role-based scoping.
 * Consolidates the duplicate report logic across admin, coordinator, and regional routes.
 */
import { db } from "@/lib/db";
import type { Role } from "@/types";
import { getStartOfWeek, getStartOfMonth } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────

export interface ReportScope {
  role: Role;
  userId: string;
  schoolId?: string | null;
  regionId?: string | null;
  coordinatorLevels?: string[];
}

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  academicYearId?: string;
  termId?: string;
  subjectId?: string;
  classId?: string;
  teacherId?: string;
}

export interface ActivityReportData {
  entriesByWeek: { week: string; count: number }[];
  entriesBySubject: { subject: string; count: number }[];
  entriesByTeacher: { teacherName: string; count: number }[];
  totalEntries: number;
}

export interface TeacherReportData {
  teachers: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    totalEntries: number;
    entriesThisTerm: number;
    complianceRate: number;
    lastEntry: string | null;
    subjects: string[];
  }[];
}

export interface CoverageReportData {
  subjects: {
    subjectName: string;
    classes: {
      className: string;
      topicsCovered: number;
      totalTopics: number;
      percentage: number;
    }[];
  }[];
}

// ── Scope Resolution ─────────────────────────────────────

function buildSchoolFilter(scope: ReportScope) {
  if (scope.role === "REGIONAL_ADMIN" && scope.regionId) {
    return { school: { regionId: scope.regionId } };
  }
  if (scope.role === "SCHOOL_ADMIN" && scope.schoolId) {
    return { schoolId: scope.schoolId };
  }
  return {};
}

function buildEntryWhereClause(scope: ReportScope, filters: ReportFilters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Role-based scoping
  if (scope.role === "SCHOOL_ADMIN" && scope.schoolId) {
    where.schoolId = scope.schoolId;
  } else if (scope.role === "REGIONAL_ADMIN" && scope.regionId) {
    where.teacher = { school: { regionId: scope.regionId } };
  } else if (scope.role === "TEACHER") {
    where.teacherId = scope.userId;
  }

  // Coordinator: scope to their assigned levels
  if (scope.coordinatorLevels && scope.coordinatorLevels.length > 0) {
    where.class = { level: { in: scope.coordinatorLevels } };
    if (scope.schoolId) where.schoolId = scope.schoolId;
  }

  // Date filters
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }

  if (filters.academicYearId) where.academicYearId = filters.academicYearId;
  if (filters.termId) where.termId = filters.termId;
  if (filters.subjectId) where.assignment = { subjectId: filters.subjectId };
  if (filters.classId) where.classId = filters.classId;
  if (filters.teacherId) where.teacherId = filters.teacherId;

  // Only count submitted and verified entries for reports
  where.status = { in: ["SUBMITTED", "VERIFIED"] };

  return where;
}

// ── Activity Report ──────────────────────────────────────

export async function getActivityReport(
  scope: ReportScope,
  filters: ReportFilters
): Promise<ActivityReportData> {
  const where = buildEntryWhereClause(scope, filters);

  const entries = await db.logbookEntry.findMany({
    where,
    select: {
      date: true,
      assignment: { select: { subject: { select: { name: true } } } },
      teacher: { select: { firstName: true, lastName: true } },
    },
  });

  // Group by week
  const weekMap = new Map<string, number>();
  const subjectMap = new Map<string, number>();
  const teacherMap = new Map<string, number>();

  for (const entry of entries) {
    // Week grouping
    const weekStart = getStartOfWeek(entry.date);
    const weekKey = weekStart.toISOString().slice(0, 10);
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);

    // Subject grouping
    const subjectName = entry.assignment?.subject?.name || "Unknown";
    subjectMap.set(subjectName, (subjectMap.get(subjectName) || 0) + 1);

    // Teacher grouping
    const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
    teacherMap.set(teacherName, (teacherMap.get(teacherName) || 0) + 1);
  }

  return {
    entriesByWeek: Array.from(weekMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week)),
    entriesBySubject: Array.from(subjectMap.entries())
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count),
    entriesByTeacher: Array.from(teacherMap.entries())
      .map(([teacherName, count]) => ({ teacherName, count }))
      .sort((a, b) => b.count - a.count),
    totalEntries: entries.length,
  };
}

// ── Teacher Report ───────────────────────────────────────

export async function getTeacherReport(
  scope: ReportScope,
  filters: ReportFilters
): Promise<TeacherReportData> {
  const schoolFilter = buildSchoolFilter(scope);
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);

  // Get teachers in scope
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacherWhere: any = { role: "TEACHER" };
  if (scope.role === "SCHOOL_ADMIN" && scope.schoolId) {
    teacherWhere.schoolId = scope.schoolId;
  } else if (scope.role === "REGIONAL_ADMIN" && scope.regionId) {
    teacherWhere.school = { regionId: scope.regionId };
  }
  if (scope.coordinatorLevels && scope.coordinatorLevels.length > 0) {
    teacherWhere.assignments = {
      some: { class: { level: { in: scope.coordinatorLevels } }, ...schoolFilter },
    };
  }

  const teachers = await db.user.findMany({
    where: teacherWhere,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      assignments: {
        select: {
          subject: { select: { name: true } },
          periods: true,
        },
      },
      entries: {
        where: { status: { in: ["SUBMITTED", "VERIFIED"] } },
        select: { date: true },
        orderBy: { date: "desc" },
      },
    },
  });

  return {
    teachers: teachers.map((t) => {
      const totalEntries = t.entries.length;
      const entriesThisTerm = t.entries.filter(
        (e) =>
          (!filters.dateFrom || e.date >= filters.dateFrom) &&
          (!filters.dateTo || e.date <= filters.dateTo)
      ).length;
      const periodsPerWeek = t.assignments.reduce(
        (sum, a) => sum + a.periods.length,
        0
      );
      const lastEntry = t.entries[0]?.date?.toISOString() || null;
      const subjects = Array.from(new Set(t.assignments.map((a) => a.subject.name)));

      // Compliance: entries this week / expected periods per week
      const entriesThisWeek = t.entries.filter(
        (e) => e.date >= startOfWeek
      ).length;
      const complianceRate =
        periodsPerWeek > 0
          ? Math.round((entriesThisWeek / periodsPerWeek) * 100)
          : 0;

      return {
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        totalEntries,
        entriesThisTerm,
        complianceRate,
        lastEntry,
        subjects,
      };
    }),
  };
}

// ── Coverage Report ──────────────────────────────────────

export async function getCoverageReport(
  scope: ReportScope,
  filters: ReportFilters
): Promise<CoverageReportData> {
  // Get all subjects taught in scope
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignmentWhere: any = {};
  if (scope.role === "SCHOOL_ADMIN" && scope.schoolId) {
    assignmentWhere.schoolId = scope.schoolId;
  } else if (scope.role === "REGIONAL_ADMIN" && scope.regionId) {
    assignmentWhere.school = { regionId: scope.regionId };
  }
  if (filters.subjectId) assignmentWhere.subjectId = filters.subjectId;

  const assignments = await db.teacherAssignment.findMany({
    where: assignmentWhere,
    select: {
      subject: { select: { id: true, name: true } },
      class: { select: { id: true, name: true, level: true } },
    },
    distinct: ["subjectId", "classId"],
  });

  // Group by subject
  const subjectClassMap = new Map<
    string,
    { subjectName: string; classes: Map<string, { className: string; classLevel: string; classId: string }> }
  >();

  for (const a of assignments) {
    if (!subjectClassMap.has(a.subject.id)) {
      subjectClassMap.set(a.subject.id, {
        subjectName: a.subject.name,
        classes: new Map(),
      });
    }
    subjectClassMap
      .get(a.subject.id)!
      .classes.set(a.class.id, { className: a.class.name, classLevel: a.class.level, classId: a.class.id });
  }

  // For each subject-class pair, compute coverage
  const result: CoverageReportData = { subjects: [] };

  for (const [subjectId, subjectData] of Array.from(subjectClassMap.entries())) {
    const classResults = [];

    for (const [classId, classData] of Array.from(subjectData.classes.entries())) {
      // Total topics for this subject at this class level
      const totalTopics = await db.topic.count({
        where: { subjectId, classLevel: classData.classLevel },
      });

      // Topics covered (entries with topics connected)
      const coveredTopics = await db.topic.count({
        where: {
          subjectId,
          classLevel: classData.classLevel,
          entries: {
            some: {
              classId,
              status: { in: ["SUBMITTED", "VERIFIED"] },
            },
          },
        },
      });

      classResults.push({
        className: classData.className,
        topicsCovered: coveredTopics,
        totalTopics,
        percentage: totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0,
      });
    }

    result.subjects.push({
      subjectName: subjectData.subjectName,
      classes: classResults,
    });
  }

  return result;
}

// ── Dashboard Stats ──────────────────────────────────────

export async function getDashboardStats(scope: ReportScope) {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const startOfMonth = getStartOfMonth(now);

  if (scope.role === "SCHOOL_ADMIN" && scope.schoolId) {
    const [
      totalTeachers,
      totalEntries,
      entriesThisWeek,
      entriesThisMonth,
      pendingEntries,
      flaggedEntries,
      verifiedEntries,
    ] = await Promise.all([
      db.user.count({ where: { schoolId: scope.schoolId, role: "TEACHER" } }),
      db.logbookEntry.count({ where: { schoolId: scope.schoolId, status: { in: ["SUBMITTED", "VERIFIED"] } } }),
      db.logbookEntry.count({ where: { schoolId: scope.schoolId, date: { gte: startOfWeek }, status: { in: ["SUBMITTED", "VERIFIED"] } } }),
      db.logbookEntry.count({ where: { schoolId: scope.schoolId, date: { gte: startOfMonth }, status: { in: ["SUBMITTED", "VERIFIED"] } } }),
      db.logbookEntry.count({ where: { schoolId: scope.schoolId, status: "SUBMITTED" } }),
      db.logbookEntry.count({ where: { schoolId: scope.schoolId, status: "FLAGGED" } }),
      db.logbookEntry.count({ where: { schoolId: scope.schoolId, status: "VERIFIED" } }),
    ]);

    const pendingTeachers = await db.teacherSchool.count({
      where: { schoolId: scope.schoolId, status: "PENDING" },
    });

    const totalSlots = await db.timetableSlot.count({
      where: { schoolId: scope.schoolId },
    });

    const expectedEntriesThisWeek = totalSlots; // One entry per slot per week
    const complianceRate = expectedEntriesThisWeek > 0
      ? Math.round((entriesThisWeek / expectedEntriesThisWeek) * 100)
      : 0;

    const verificationRate = (totalEntries > 0)
      ? Math.round((verifiedEntries / totalEntries) * 100)
      : 0;

    return {
      totalTeachers,
      totalEntries,
      entriesThisWeek,
      entriesThisMonth,
      pendingEntries,
      flaggedEntries,
      verifiedEntries,
      pendingTeachers,
      complianceRate: Math.min(complianceRate, 100),
      verificationRate,
    };
  }

  // Regional admin stats
  if (scope.role === "REGIONAL_ADMIN" && scope.regionId) {
    const [totalSchools, activeSchools, totalTeachers, totalEntries, entriesThisMonth] =
      await Promise.all([
        db.school.count({ where: { regionId: scope.regionId } }),
        db.school.count({
          where: {
            regionId: scope.regionId,
            entries: { some: { date: { gte: startOfWeek } } },
          },
        }),
        db.user.count({ where: { school: { regionId: scope.regionId }, role: "TEACHER" } }),
        db.logbookEntry.count({
          where: { teacher: { school: { regionId: scope.regionId } }, status: { in: ["SUBMITTED", "VERIFIED"] } },
        }),
        db.logbookEntry.count({
          where: { teacher: { school: { regionId: scope.regionId } }, date: { gte: startOfMonth }, status: { in: ["SUBMITTED", "VERIFIED"] } },
        }),
      ]);

    return {
      totalSchools,
      activeSchools,
      totalTeachers,
      totalEntries,
      entriesThisMonth,
    };
  }

  return {};
}
