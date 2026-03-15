export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sanitizeHtml, formatDate } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await db.logbookEntry.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        teacherId: true,
        class: {
          select: { schoolId: true, school: { select: { regionId: true } } },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Authorization: same as viewing the entry
    if (user.role === "TEACHER") {
      if (entry.teacherId !== user.id) {
        // Check if HOD for this teacher's subjects
        const isHod = await db.headOfDepartment.findFirst({
          where: {
            teacherId: user.id,
            school: {
              teachers: { some: { id: entry.teacherId } },
            },
          },
        });
        if (!isHod) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    } else if (user.role === "SCHOOL_ADMIN" && entry.class.schoolId !== user.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (user.role === "REGIONAL_ADMIN" && entry.class.school?.regionId !== user.regionId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const remarks = await db.entryRemark.findMany({
      where: { entryId: params.id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(remarks);
  } catch (error) {
    console.error("GET /api/entries/[id]/remarks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch remarks" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }
    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Content must be 1000 characters or less" },
        { status: 400 }
      );
    }

    const entry = await db.logbookEntry.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            schoolId: true,
            school: { select: { regionId: true } },
          },
        },
        assignment: { include: { subject: true } },
        topics: { include: { subject: true } },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Determine remarkType and authorize
    let remarkType: string;
    let authorRole: string;

    if (user.role === "REGIONAL_ADMIN") {
      // Regional admin: must be in same region
      if (entry.class.school?.regionId !== user.regionId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      remarkType = "inspector_note";
      authorRole = "REGIONAL_ADMIN";
    } else if (user.role === "SCHOOL_ADMIN") {
      // School admin: must be at same school
      if (entry.class.schoolId !== user.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      remarkType = "admin_verification";
      authorRole = "SCHOOL_ADMIN";
    } else if (user.role === "TEACHER") {
      if (entry.teacherId === user.id) {
        // Teacher adding self-reflection to own entry
        remarkType = "self_reflection";
        authorRole = "TEACHER";
      } else {
        // Check if this teacher is HOD for the entry's subject at the same school
        const entrySubjectId =
          entry.assignment?.subjectId ||
          entry.topics?.[0]?.subjectId;

        if (!entrySubjectId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const hodRecord = await db.headOfDepartment.findFirst({
          where: {
            teacherId: user.id,
            schoolId: entry.class.schoolId!,
            subjectId: entrySubjectId,
          },
        });

        if (!hodRecord) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        remarkType = "hod_review";
        authorRole = "HOD";
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sanitizedContent = sanitizeHtml(content);

    const remark = await db.entryRemark.create({
      data: {
        entryId: params.id,
        authorId: user.id,
        authorRole,
        content: sanitizedContent,
        remarkType,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            photoUrl: true,
          },
        },
      },
    });

    // Send notification to the entry's teacher (except for self-reflections)
    if (remarkType !== "self_reflection" && entry.teacherId !== user.id) {
      const authorName = `${user.firstName} ${user.lastName}`;
      const subjectName =
        entry.assignment?.subject?.name ||
        entry.topics?.[0]?.subject?.name ||
        "an";
      const formattedDate = formatDate(entry.date);

      const typeLabel =
        remarkType === "hod_review"
          ? "HOD"
          : remarkType === "admin_verification"
          ? "Admin"
          : "Inspector";

      await db.notification.create({
        data: {
          userId: entry.teacherId,
          type: "LOG_REVIEWED",
          title: `${typeLabel} reviewed your entry`,
          message: `${authorName} left a remark on your ${subjectName} entry from ${formattedDate}: "${sanitizedContent.substring(0, 100)}${sanitizedContent.length > 100 ? "..." : ""}"`,
          link: `/logbook/${entry.id}`,
          isRead: false,
        },
      });
    }

    return NextResponse.json(remark, { status: 201 });
  } catch (error) {
    console.error("POST /api/entries/[id]/remarks error:", error);
    return NextResponse.json(
      { error: "Failed to create remark" },
      { status: 500 }
    );
  }
}
