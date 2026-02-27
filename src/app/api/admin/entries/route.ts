import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const teacherId = searchParams.get("teacherId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {
      teacher: { schoolId: user.schoolId },
    };

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;
    if (status) where.status = status;
    if (subjectId) where.topics = { some: { subjectId } };

    const [entries, total] = await Promise.all([
      db.logbookEntry.findMany({
        where,
        include: {
          class: true,
          topics: { include: { subject: true } },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      db.logbookEntry.count({ where }),
    ]);

    return NextResponse.json({ entries, total });
  } catch (error) {
    console.error("GET /api/admin/entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
