export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { updateAssessmentResultsSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessment = await db.assessment.findUnique({
      where: { id: params.id },
      include: {
        class: { select: { name: true, level: true } },
        subject: { select: { name: true, code: true } },
        teacher: {
          select: { id: true, firstName: true, lastName: true },
        },
        topicsTested: { select: { id: true, name: true } },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Authorization
    if (user.role === "TEACHER" && assessment.teacherId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("GET /api/assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessment = await db.assessment.findUnique({
      where: { id: params.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (user.role === "TEACHER" && assessment.teacherId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateAssessmentResultsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate totalMale + totalFemale = totalStudents (if both provided)
    if (data.totalMale != null && data.totalFemale != null && data.totalStudents != null) {
      if (data.totalMale + data.totalFemale !== data.totalStudents) {
        return NextResponse.json(
          { error: "Male + Female students must equal total students" },
          { status: 400 }
        );
      }
    }

    // Validate marks against totalMarks
    if (data.highestMark != null && data.highestMark > assessment.totalMarks) {
      return NextResponse.json(
        { error: "Highest mark cannot exceed total marks" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (data.corrected !== undefined) updateData.corrected = data.corrected;
    if (data.correctionDate) updateData.correctionDate = new Date(data.correctionDate);
    else if (data.corrected) updateData.correctionDate = new Date();
    if (data.totalStudents !== undefined) updateData.totalStudents = data.totalStudents;
    if (data.totalMale !== undefined) updateData.totalMale = data.totalMale;
    if (data.totalFemale !== undefined) updateData.totalFemale = data.totalFemale;
    if (data.totalPassed !== undefined) updateData.totalPassed = data.totalPassed;
    if (data.malePassed !== undefined) updateData.malePassed = data.malePassed;
    if (data.femalePassed !== undefined) updateData.femalePassed = data.femalePassed;
    if (data.highestMark !== undefined) updateData.highestMark = data.highestMark;
    if (data.lowestMark !== undefined) updateData.lowestMark = data.lowestMark;
    if (data.averageMark !== undefined) updateData.averageMark = data.averageMark;

    const updated = await db.assessment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true, code: true } },
        topicsTested: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update assessment" },
      { status: 500 }
    );
  }
}
