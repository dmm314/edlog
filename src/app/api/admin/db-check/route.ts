import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: Record<string, string> = {};

    // Test each table individually
    const checks = [
      { name: "User", fn: () => db.user.count() },
      { name: "School", fn: () => db.school.count() },
      { name: "Class", fn: () => db.class.count() },
      { name: "Subject", fn: () => db.subject.count() },
      { name: "SchoolSubject", fn: () => db.schoolSubject.count() },
      { name: "ClassSubject", fn: () => db.classSubject.count() },
      { name: "TeacherAssignment", fn: () => db.teacherAssignment.count() },
      { name: "TimetableSlot", fn: () => db.timetableSlot.count() },
      { name: "PeriodSchedule", fn: () => db.periodSchedule.count() },
      { name: "LogbookEntry", fn: () => db.logbookEntry.count() },
      { name: "Topic", fn: () => db.topic.count() },
      { name: "Notification", fn: () => db.notification.count() },
      { name: "Region", fn: () => db.region.count() },
      { name: "Division", fn: () => db.division.count() },
      { name: "Session", fn: () => db.session.count() },
      { name: "RegistrationCode", fn: () => db.registrationCode.count() },
    ];

    for (const check of checks) {
      try {
        const count = await check.fn();
        results[check.name] = `OK (${count} rows)`;
      } catch (e) {
        results[check.name] = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    // Also check the user's own context
    results["_yourUserId"] = user.id;
    results["_yourSchoolId"] = user.schoolId || "NULL - THIS IS A PROBLEM";
    results["_yourRole"] = user.role;

    // Check if school exists
    if (user.schoolId) {
      try {
        const school = await db.school.findUnique({ where: { id: user.schoolId } });
        results["_yourSchool"] = school ? `${school.name} (${school.status})` : "NOT FOUND - schoolId in your session doesn't match any school";
      } catch (e) {
        results["_yourSchool"] = `QUERY FAILED: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: `DB check failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
