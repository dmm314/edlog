/**
 * Drafts Service — Auto-save and draft management for entry forms.
 * Drafts are stored separately from LogbookEntries to keep the main table clean.
 */
import { db } from "@/lib/db";

const DRAFT_EXPIRY_DAYS = 30;

export async function saveDraft(
  teacherId: string,
  formData: Record<string, unknown>,
  slotId?: string | null
) {
  // Check for existing draft for this teacher
  const existing = await db.draftEntry.findFirst({
    where: { teacherId },
    orderBy: { lastSavedAt: "desc" },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DRAFT_EXPIRY_DAYS);

  // Prisma JSON fields require serializable values
  const jsonData = JSON.parse(JSON.stringify(formData));

  if (existing) {
    return db.draftEntry.update({
      where: { id: existing.id },
      data: {
        formData: jsonData,
        slotId: slotId || existing.slotId,
        lastSavedAt: new Date(),
        expiresAt,
      },
    });
  }

  return db.draftEntry.create({
    data: {
      teacherId,
      formData: jsonData,
      slotId,
      expiresAt,
    },
  });
}

export async function getDraft(teacherId: string, slotId?: string) {
  const where = {
    teacherId,
    ...(slotId ? { slotId } : {}),
  };

  return db.draftEntry.findFirst({
    where,
    orderBy: { lastSavedAt: "desc" },
  });
}

export async function getDrafts(teacherId: string) {
  return db.draftEntry.findMany({
    where: { teacherId },
    orderBy: { lastSavedAt: "desc" },
  });
}

export async function deleteDraft(draftId: string) {
  return db.draftEntry.delete({ where: { id: draftId } });
}

export async function deleteDraftByTeacher(teacherId: string, slotId?: string) {
  if (slotId) {
    return db.draftEntry.deleteMany({ where: { teacherId, slotId } });
  }
  return db.draftEntry.deleteMany({ where: { teacherId } });
}

export async function cleanupExpiredDrafts() {
  return db.draftEntry.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
