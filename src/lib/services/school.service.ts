/**
 * School Service — Business logic for school management.
 */
import { db } from "@/lib/db";

export async function getSchoolById(id: string) {
  return db.school.findUnique({
    where: { id },
    include: {
      region: { select: { id: true, name: true, code: true } },
      division: { select: { id: true, name: true } },
      admin: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: {
        select: {
          teachers: true,
          classes: true,
          entries: true,
        },
      },
    },
  });
}

export async function getSchoolTeachers(
  schoolId: string,
  options?: { status?: string; page?: number; pageSize?: number }
) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 25;

  const where = {
    schoolId,
    ...(options?.status ? { status: options.status as "PENDING" | "ACTIVE" | "REMOVED" } : {}),
  };

  const [memberships, total] = await Promise.all([
    db.teacherSchool.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            gender: true,
            photoUrl: true,
            isVerified: true,
            teacherCode: true,
            qualifications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.teacherSchool.count({ where }),
  ]);

  return { data: memberships, meta: { total, page, pageSize } };
}

export async function approveTeacher(teacherId: string, schoolId: string) {
  return db.teacherSchool.update({
    where: { teacherId_schoolId: { teacherId, schoolId } },
    data: { status: "ACTIVE", joinedAt: new Date() },
  });
}

export async function removeTeacher(teacherId: string, schoolId: string) {
  return db.teacherSchool.update({
    where: { teacherId_schoolId: { teacherId, schoolId } },
    data: { status: "REMOVED" },
  });
}

// ── Academic Year Management ─────────────────────────────

export async function createAcademicYear(
  schoolId: string,
  data: { name: string; startDate: Date; endDate: Date; isActive?: boolean }
) {
  // If setting as active, deactivate all others for this school
  if (data.isActive) {
    await db.academicYear.updateMany({
      where: { schoolId, isActive: true },
      data: { isActive: false },
    });
  }

  return db.academicYear.create({
    data: {
      schoolId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive ?? false,
    },
  });
}

export async function getActiveAcademicYear(schoolId: string) {
  return db.academicYear.findFirst({
    where: { schoolId, isActive: true },
    include: { terms: { orderBy: { number: "asc" } } },
  });
}

export async function createTerm(
  academicYearId: string,
  data: { name: string; number: number; startDate: Date; endDate: Date }
) {
  return db.term.create({
    data: {
      academicYearId,
      name: data.name,
      number: data.number,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });
}

export async function getCurrentTerm(schoolId: string) {
  const now = new Date();
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  return db.term.findFirst({
    where: {
      academicYearId: activeYear.id,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });
}
