import { NextResponse } from "next/server";
import { withAuth } from "@/lib/services/auth.service";
import { saveDraft, getDrafts, deleteDraftByTeacher } from "@/lib/services/drafts.service";

// GET /api/drafts — get all drafts for current teacher
export const GET = withAuth(async (_req, user) => {
  const drafts = await getDrafts(user.id);
  return NextResponse.json(drafts);
}, { roles: ["TEACHER"] });

// POST /api/drafts — save/update a draft
export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { formData, slotId } = body;

  if (!formData || typeof formData !== "object") {
    return NextResponse.json({ error: "formData is required" }, { status: 400 });
  }

  const draft = await saveDraft(user.id, formData, slotId || null);
  return NextResponse.json(draft);
}, { roles: ["TEACHER"] });

// DELETE /api/drafts — delete all drafts for current teacher
export const DELETE = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const slotId = url.searchParams.get("slotId");
  await deleteDraftByTeacher(user.id, slotId || undefined);
  return NextResponse.json({ success: true });
}, { roles: ["TEACHER"] });
