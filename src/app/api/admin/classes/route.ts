import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Valid class levels in Cameroon's Anglophone education system
const VALID_LEVELS = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
];

const STREAMS = ["General", "Science", "Arts"];
const SECTIONS = ["A", "B", "C", "D", "E", "F"];

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json(
        { error: "No school assigned" },
        { status: 400 }
      );
    }

    const classes = await db.class.findMany({
      where: { schoolId: user.schoolId },
      include: {
        _count: {
          select: { entries: true, assignments: true },
        },
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        abbreviation: c.abbreviation,
        level: c.level,
        stream: c.stream,
        section: c.section,
        year: c.year,
        entryCount: c._count.entries,
        teacherCount: c._count.assignments,
      })),
      levels: VALID_LEVELS,
      streams: STREAMS,
      sections: SECTIONS,
    });
  } catch (error) {
    console.error("GET /api/admin/classes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.schoolId) {
      return NextResponse.json(
        { error: "No school assigned" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { level, stream, section } = body;

    if (!level || !VALID_LEVELS.includes(level)) {
      return NextResponse.json(
        { error: "Invalid class level" },
        { status: 400 }
      );
    }

    // Build class name
    let name = level;
    if (stream && stream !== "General") {
      name += ` ${stream}`;
    }
    if (section) {
      name += ` ${section}`;
    }

    // Build abbreviation
    let abbreviation = "";
    if (level.startsWith("Form")) {
      abbreviation = `F${level.split(" ")[1]}`;
    } else if (level === "Lower Sixth") {
      abbreviation = "LS";
    } else if (level === "Upper Sixth") {
      abbreviation = "US";
    }
    if (stream && stream !== "General") {
      abbreviation += stream[0]; // S for Science, A for Arts
    }
    if (section) {
      abbreviation += section;
    }

    const currentYear = new Date().getFullYear();

    // Check for duplicate
    const existing = await db.class.findFirst({
      where: {
        schoolId: user.schoolId,
        name,
        year: currentYear,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Class "${name}" already exists for ${currentYear}` },
        { status: 409 }
      );
    }

    const newClass = await db.class.create({
      data: {
        name,
        abbreviation,
        level,
        stream: stream || "General",
        section: section || null,
        year: currentYear,
        schoolId: user.schoolId,
      },
    });

    return NextResponse.json({
      id: newClass.id,
      name: newClass.name,
      abbreviation: newClass.abbreviation,
      level: newClass.level,
      stream: newClass.stream,
      section: newClass.section,
      year: newClass.year,
      entryCount: 0,
      teacherCount: 0,
    });
  } catch (error) {
    console.error("POST /api/admin/classes error:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("id");

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Verify class belongs to this school and has no entries
    const cls = await db.class.findFirst({
      where: { id: classId, schoolId: user.schoolId! },
      include: { _count: { select: { entries: true, assignments: true } } },
    });

    if (!cls) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    if (cls._count.entries > 0) {
      return NextResponse.json(
        { error: "Cannot delete a class with existing entries" },
        { status: 400 }
      );
    }

    // Delete assignments first, then the class
    if (cls._count.assignments > 0) {
      await db.teacherAssignment.deleteMany({
        where: { classId },
      });
    }

    await db.class.delete({ where: { id: classId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/classes error:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
