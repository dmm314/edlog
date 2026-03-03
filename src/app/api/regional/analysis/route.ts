import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "REGIONAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.regionId) {
      return NextResponse.json(
        { error: "No region assigned" },
        { status: 400 }
      );
    }

    // 1. Module completion across schools
    const moduleEntries = await db.logbookEntry.findMany({
      where: {
        teacher: { school: { regionId: user.regionId } },
        moduleName: { not: null },
      },
      select: {
        moduleName: true,
        teacher: {
          select: {
            school: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Build module → school completion map
    const moduleSchoolMap = new Map<string, Map<string, number>>();
    moduleEntries.forEach((e) => {
      const mod = e.moduleName!;
      const school = e.teacher.school;
      if (!school) return;
      if (!moduleSchoolMap.has(mod)) moduleSchoolMap.set(mod, new Map());
      const schoolMap = moduleSchoolMap.get(mod)!;
      schoolMap.set(school.name, (schoolMap.get(school.name) || 0) + 1);
    });

    const moduleCompletion = Array.from(moduleSchoolMap.entries())
      .map(([module, schools]) => ({
        module,
        schoolCount: schools.size,
        totalEntries: Array.from(schools.values()).reduce((a, b) => a + b, 0),
        schools: Array.from(schools.entries())
          .map(([name, count]) => ({ name, entries: count }))
          .sort((a, b) => b.entries - a.entries),
      }))
      .sort((a, b) => b.totalEntries - a.totalEntries);

    // 2. Teachers per subject per school
    const assignments = await db.teacherAssignment.findMany({
      where: {
        school: { regionId: user.regionId },
      },
      select: {
        teacher: {
          select: { id: true, firstName: true, lastName: true },
        },
        subject: {
          select: { id: true, name: true },
        },
        school: {
          select: { id: true, name: true },
        },
      },
    });

    // Group by subject → school → teachers
    const subjectTeacherMap = new Map<
      string,
      Map<string, { schoolId: string; teachers: Set<string>; teacherNames: string[] }>
    >();

    assignments.forEach((a) => {
      const subjectName = a.subject.name;
      const schoolName = a.school.name;
      const teacherName = `${a.teacher.firstName} ${a.teacher.lastName}`;

      if (!subjectTeacherMap.has(subjectName)) {
        subjectTeacherMap.set(subjectName, new Map());
      }
      const schoolMap = subjectTeacherMap.get(subjectName)!;
      if (!schoolMap.has(schoolName)) {
        schoolMap.set(schoolName, {
          schoolId: a.school.id,
          teachers: new Set(),
          teacherNames: [],
        });
      }
      const schoolData = schoolMap.get(schoolName)!;
      if (!schoolData.teachers.has(a.teacher.id)) {
        schoolData.teachers.add(a.teacher.id);
        schoolData.teacherNames.push(teacherName);
      }
    });

    const teachersBySubject = Array.from(subjectTeacherMap.entries())
      .map(([subject, schools]) => ({
        subject,
        totalTeachers: new Set(
          Array.from(schools.values()).flatMap((s) => Array.from(s.teachers))
        ).size,
        schools: Array.from(schools.entries())
          .map(([name, data]) => ({
            name,
            teacherCount: data.teachers.size,
            teachers: data.teacherNames,
          }))
          .sort((a, b) => b.teacherCount - a.teacherCount),
      }))
      .sort((a, b) => b.totalTeachers - a.totalTeachers);

    // 3. HODs per subject per school
    const hods = await db.headOfDepartment.findMany({
      where: {
        school: { regionId: user.regionId },
      },
      select: {
        teacher: {
          select: { firstName: true, lastName: true, email: true },
        },
        subject: {
          select: { name: true },
        },
        school: {
          select: { name: true },
        },
      },
    });

    // Group by subject → school → hod
    const hodsBySubject = new Map<string, { school: string; teacher: string; email: string }[]>();
    hods.forEach((h) => {
      const subject = h.subject.name;
      if (!hodsBySubject.has(subject)) hodsBySubject.set(subject, []);
      hodsBySubject.get(subject)!.push({
        school: h.school.name,
        teacher: `${h.teacher.firstName} ${h.teacher.lastName}`,
        email: h.teacher.email,
      });
    });

    const hodData = Array.from(hodsBySubject.entries())
      .map(([subject, items]) => ({
        subject,
        hodCount: items.length,
        schools: items.sort((a, b) => a.school.localeCompare(b.school)),
      }))
      .sort((a, b) => b.hodCount - a.hodCount);

    return NextResponse.json({
      moduleCompletion,
      teachersBySubject,
      hodsBySubject: hodData,
    });
  } catch (error) {
    console.error("GET /api/regional/analysis error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
