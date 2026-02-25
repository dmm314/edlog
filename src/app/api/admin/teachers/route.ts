import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teachers = await db.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: "TEACHER",
      },
      include: {
        entries: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true },
        },
        _count: { select: { entries: true } },
      },
      orderBy: { lastName: "asc" },
    });

    const result = teachers.map((t) => ({
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone,
      isVerified: t.isVerified,
      createdAt: t.createdAt.toISOString(),
      entryCount: t._count.entries,
      lastEntry: t.entries[0]?.date.toISOString() ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/admin/teachers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}
