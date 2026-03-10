export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createAssessmentSchema } from "@/lib/validations";
import { sanitizeHtml } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    const corrected = searchParams.get("corrected");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};

    if (user.role === "TEACHER") {
      where.teacherId = user.id;
    } else if (user.role === "SCHOOL_ADMIN") {
      where.schoolId = user.schoolId;
    } else if (user.role === "REGIONAL_ADMIN") {
      where.school = { regionId: user.regionId };
    }

    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (corrected === "true") where.corrected = true;
    if (corrected === "false") where.corrected = false;

    const [assessments, total] = await Promise.all([
      db.assessment.findMany({
        where,
        include: {
          class: { select: { name: true } },
          subject: { select: { name: true, code: true } },
          topicsTested: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      db.assessment.count({ where }),
    ]);

    return NextResponse.json({ assessments, total });
  } catch (error) {
    console.error("GET /api/assessments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create assessments" },
        { status: 403 }
      );
    }
    if (!user.schoolId) {
      return NextResponse.json(
        { error: "No school assigned" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = createAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate passMark <= totalMarks
    if (data.passMark > data.totalMarks) {
      return NextResponse.json(
        { error: "Pass mark cannot exceed total marks" },
        { status: 400 }
      );
    }

    const topicsNote = data.topicsNote ? sanitizeHtml(data.topicsNote) : null;

    const assessment = await db.assessment.create({
      data: {
        teacherId: user.id,
        classId: data.classId,
        subjectId: data.subjectId,
        schoolId: user.schoolId,
        title: sanitizeHtml(data.title),
        type: data.type,
        date: new Date(data.date),
        totalMarks: data.totalMarks,
        passMark: data.passMark,
        topicsNote,
        ...(data.topicIds?.length
          ? { topicsTested: { connect: data.topicIds.map((id: string) => ({ id })) } }
          : {}),
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true, code: true } },
        topicsTested: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error("POST /api/assessments error:", error);
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
}
