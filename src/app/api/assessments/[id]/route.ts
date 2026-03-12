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

    // Validate totalPassed <= totalStudents
    if (data.totalPassed != null && data.totalStudents != null && data.totalPassed > data.totalStudents) {
      return NextResponse.json(
        { error: "Total passed cannot exceed total students" },
        { status: 400 }
      );
    }

    // Validate malePassed <= totalMale
    if (data.malePassed != null && data.totalMale != null && data.malePassed > data.totalMale) {
      return NextResponse.json(
        { error: "Male passed cannot exceed total male students" },
        { status: 400 }
      );
    }

    // Validate femalePassed <= totalFemale
    if (data.femalePassed != null && data.totalFemale != null && data.femalePassed > data.totalFemale) {
      return NextResponse.json(
        { error: "Female passed cannot exceed total female students" },
        { status: 400 }
      );
    }

    // Validate marks against totalMarks
    if (data.highestMark != null && data.highestMark > assessment.totalMarks) {
      return NextResponse.json(
        { error: "Highest mark cannot exceed total marks" },
        { status: 400 }
      );
    }
    if (data.lowestMark != null && data.lowestMark > assessment.totalMarks) {
      return NextResponse.json(
        { error: "Lowest mark cannot exceed total marks" },
        { status: 400 }
      );
    }
    if (data.averageMark != null && data.averageMark > assessment.totalMarks) {
      return NextResponse.json(
        { error: "Average mark cannot exceed total marks" },
        { status: 400 }
      );
    }

    // Validate lowestMark <= highestMark
    if (data.lowestMark != null && data.highestMark != null && data.lowestMark > data.highestMark) {
      return NextResponse.json(
        { error: "Lowest mark cannot exceed highest mark" },
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

    // Auto-calculate pass rates when corrected
    if (data.corrected) {
      const ts = data.totalStudents ?? assessment.totalStudents ?? 0;
      const tp = data.totalPassed ?? assessment.totalPassed ?? 0;
      const tm = data.totalMale ?? assessment.totalMale ?? 0;
      const tf = data.totalFemale ?? assessment.totalFemale ?? 0;
      const mp = data.malePassed ?? assessment.malePassed ?? 0;
      const fp = data.femalePassed ?? assessment.femalePassed ?? 0;

      updateData.passRate = ts > 0 ? Math.round(((tp / ts) * 100) * 10) / 10 : 0;
      updateData.malePassRate = tm > 0 ? Math.round(((mp / tm) * 100) * 10) / 10 : 0;
      updateData.femalePassRate = tf > 0 ? Math.round(((fp / tf) * 100) * 10) / 10 : 0;

      // Auto-calculate average if not provided
      if (data.averageMark == null && data.highestMark != null && data.lowestMark != null) {
        updateData.averageMark = Math.round(((data.highestMark + data.lowestMark) / 2) * 10) / 10;
      }
    }

    const updated = await db.assessment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        class: { select: { name: true, level: true } },
        subject: { select: { name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
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
