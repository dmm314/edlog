export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        dateOfBirth: true,
        gender: true,
        photoUrl: true,
        createdAt: true,
        schoolId: true,
        teacherCode: true,
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            schoolType: true,
            principalName: true,
            principalPhone: true,
            status: true,
            foundingDate: true,
            region: { select: { name: true, code: true } },
            division: { select: { name: true } },
          },
        },
        teacherSchools: {
          where: { status: { in: ["PENDING", "ACTIVE"] } },
          include: {
            school: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        regionAdmin: user.role === "REGIONAL_ADMIN"
          ? { select: { id: true, name: true, code: true, capital: true } }
          : false,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build role-specific extra data
    const extras: Record<string, unknown> = {};

    if (user.role === "TEACHER") {
      // Teacher stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalEntries, entriesThisMonth, verifiedEntries, assignments] = await Promise.all([
        db.logbookEntry.count({ where: { teacherId: user.id } }),
        db.logbookEntry.count({ where: { teacherId: user.id, date: { gte: startOfMonth } } }),
        db.logbookEntry.count({ where: { teacherId: user.id, status: "VERIFIED" } }),
        db.teacherAssignment.findMany({
          where: { teacherId: user.id },
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true, level: true } },
            division: { select: { name: true } },
          },
        }),
      ]);

      // Logging streak: count consecutive days with entries going backward from today
      const recentEntries = await db.logbookEntry.findMany({
        where: { teacherId: user.id },
        select: { date: true },
        orderBy: { date: "desc" },
        take: 60,
      });

      let streak = 0;
      if (recentEntries.length > 0) {
        const uniqueDates = Array.from(new Set(recentEntries.map(e => {
          const d = new Date(e.date);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(today);

        for (let i = 0; i < uniqueDates.length; i++) {
          const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
          if (uniqueDates.includes(dateKey)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Top subject
      const subjectCounts = await db.logbookEntry.groupBy({
        by: ["assignmentId"],
        where: { teacherId: user.id, assignmentId: { not: null } },
        _count: true,
        orderBy: { _count: { assignmentId: "desc" } },
        take: 1,
      });

      let topSubject: string | null = null;
      if (subjectCounts.length > 0 && subjectCounts[0].assignmentId) {
        const topAssignment = await db.teacherAssignment.findUnique({
          where: { id: subjectCounts[0].assignmentId },
          include: { subject: { select: { name: true } } },
        });
        topSubject = topAssignment?.subject.name ?? null;
      }

      // Syllabus coverage - approximate: unique topics covered / total topics for assigned subjects
      const assignedSubjectIds = Array.from(new Set(assignments.map(a => a.subjectId)));
      const [coveredTopicCount, totalTopicCount] = await Promise.all([
        db.logbookEntry.findMany({
          where: { teacherId: user.id },
          select: { topics: { select: { id: true } } },
        }).then(entries => {
          const topicIds = new Set<string>();
          entries.forEach(e => e.topics.forEach(t => topicIds.add(t.id)));
          return topicIds.size;
        }),
        assignedSubjectIds.length > 0
          ? db.topic.count({ where: { subjectId: { in: assignedSubjectIds } } })
          : Promise.resolve(0),
      ]);

      extras.teacherStats = {
        streak,
        totalEntries,
        entriesThisMonth,
        verificationRate: totalEntries > 0 ? Math.round((verifiedEntries / totalEntries) * 100) : 0,
        topSubject,
        syllabusCoverage: totalTopicCount > 0 ? Math.round((coveredTopicCount / totalTopicCount) * 100) : 0,
      };
      extras.assignments = assignments;

    } else if (user.role === "SCHOOL_ADMIN" && user.schoolId) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [activeTeachers, entriesThisMonth, totalEntries, subjectCount, classCount] = await Promise.all([
        db.teacherSchool.count({ where: { schoolId: user.schoolId, status: "ACTIVE" } }),
        db.logbookEntry.count({
          where: {
            assignment: { schoolId: user.schoolId },
            date: { gte: startOfMonth },
          },
        }),
        db.logbookEntry.count({
          where: { assignment: { schoolId: user.schoolId } },
        }),
        db.schoolSubject.count({ where: { schoolId: user.schoolId } }),
        db.class.count({ where: { schoolId: user.schoolId } }),
      ]);

      const verifiedEntries = await db.logbookEntry.count({
        where: { assignment: { schoolId: user.schoolId }, status: "VERIFIED" },
      });

      extras.schoolStats = {
        totalTeachers: activeTeachers,
        entriesThisMonth,
        complianceRate: totalEntries > 0 ? Math.round((verifiedEntries / totalEntries) * 100) : 0,
        subjectCount,
        classCount,
      };

    } else if (user.role === "REGIONAL_ADMIN" && user.regionId) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [activeSchools, totalTeachers, entriesThisMonth, totalEntries, verifiedEntries, codesIssued, codesUsed] = await Promise.all([
        db.school.count({ where: { regionId: user.regionId, status: "ACTIVE" } }),
        db.teacherSchool.count({
          where: { school: { regionId: user.regionId }, status: "ACTIVE" },
        }),
        db.logbookEntry.count({
          where: {
            assignment: { school: { regionId: user.regionId } },
            date: { gte: startOfMonth },
          },
        }),
        db.logbookEntry.count({
          where: { assignment: { school: { regionId: user.regionId } } },
        }),
        db.logbookEntry.count({
          where: { assignment: { school: { regionId: user.regionId } }, status: "VERIFIED" },
        }),
        db.registrationCode.count({ where: { regionId: user.regionId } }),
        db.registrationCode.count({ where: { regionId: user.regionId, usedAt: { not: null } } }),
      ]);

      extras.regionStats = {
        totalSchools: activeSchools,
        totalTeachers,
        entriesThisMonth,
        complianceRate: totalEntries > 0 ? Math.round((verifiedEntries / totalEntries) * 100) : 0,
        codesIssued,
        codesUsed,
      };
    }

    return NextResponse.json({ ...dbUser, ...extras });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { dateOfBirth, gender, photoUrl, phone, foundingDate, principalName, principalPhone } = body;

    // Update user fields
    const updateData: Record<string, unknown> = {};
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (gender !== undefined) {
      updateData.gender = gender || null;
    }
    if (photoUrl !== undefined) {
      updateData.photoUrl = photoUrl || null;
    }
    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        dateOfBirth: true,
        gender: true,
        photoUrl: true,
        schoolId: true,
      },
    });

    // If school admin, update school fields
    let schoolData = null;
    if (user.role === "SCHOOL_ADMIN" && user.schoolId) {
      const schoolUpdate: Record<string, unknown> = {};
      if (foundingDate !== undefined) {
        schoolUpdate.foundingDate = foundingDate ? new Date(foundingDate) : null;
      }
      if (principalName !== undefined) {
        schoolUpdate.principalName = principalName || null;
      }
      if (principalPhone !== undefined) {
        schoolUpdate.principalPhone = principalPhone || null;
      }
      if (Object.keys(schoolUpdate).length > 0) {
        const updatedSchool = await db.school.update({
          where: { id: user.schoolId },
          data: schoolUpdate,
          select: {
            name: true,
            code: true,
            foundingDate: true,
            principalName: true,
            principalPhone: true,
          },
        });
        schoolData = updatedSchool;
      }
    }

    return NextResponse.json({
      ...updated,
      school: schoolData,
    });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
