/**
 * Entry validation schemas — Zod schemas for entry-related API endpoints.
 * These run both client-side and server-side.
 */
import { z } from "zod";

export const createEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  classId: z.string().min(1, "Class is required"),
  classIds: z.array(z.string()).optional(),
  topicId: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
  moduleName: z.string().optional().nullable(),
  topicText: z.string().max(300, "Topic must be under 300 characters").optional().nullable(),
  assignmentId: z.string().optional().nullable(),
  assignmentIds: z.array(z.string()).optional(),
  timetableSlotId: z.string().optional().nullable(),
  period: z.number().int().min(1).max(9).optional().nullable(),
  duration: z.number().int().min(15).max(180).default(60),
  notes: z.string().max(500, "Notes must be under 500 characters").optional().nullable(),
  objectives: z.union([
    z.string().max(500, "Objectives must be under 500 characters"),
    z.array(z.object({
      text: z.string(),
      proportion: z.enum(["all", "most", "some", "few"]).default("all"),
    })),
  ]).optional().nullable(),
  signatureData: z.string().optional().nullable(),
  studentAttendance: z.number().int().min(0).optional().nullable(),
  engagementLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().nullable(),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),

  // Class did not hold
  classDidNotHold: z.boolean().optional(),
  classDidNotHoldReason: z.string().max(300).optional().nullable(),

  // CBA Fields
  familyOfSituation: z.string().max(200).optional().nullable(),
  bilingualActivity: z.boolean().optional(),
  bilingualType: z.enum(["game", "discussion", "quiz", "role_play", "exercise", "translation", "song"]).optional().nullable(),
  bilingualNote: z.string().max(200).optional().nullable(),
  integrationActivity: z.string().max(500).optional().nullable(),
  integrationLevel: z.enum(["basic", "intermediate", "advanced"]).optional().nullable(),
  integrationStatus: z.enum(["completed", "partial", "carried_over"]).optional().nullable(),
  lessonMode: z.enum(["physical", "digital", "hybrid"]).optional().nullable(),
  digitalTools: z.array(z.string()).optional(),

  // Assignment tracking
  assignmentGiven: z.boolean().optional(),
  assignmentDetails: z.string().max(300).optional().nullable(),
  assignmentReviewed: z.boolean().optional().nullable(),

  // Academic year / term scoping
  academicYearId: z.string().optional().nullable(),
  termId: z.string().optional().nullable(),

  // Offline support
  offlineCreatedAt: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.status === "SUBMITTED" && !data.period && !data.timetableSlotId) {
      return false;
    }
    return true;
  },
  { message: "You must select a period before submitting", path: ["period"] }
).refine(
  (data) => {
    if (data.status === "DRAFT" || data.classDidNotHold) return true;
    if (data.status === "SUBMITTED") {
      return !!(data.moduleName && data.moduleName.trim().length > 0);
    }
    return true;
  },
  { message: "Select which module this lesson covers before submitting", path: ["moduleName"] }
).refine(
  (data) => {
    if (data.status === "DRAFT" || data.classDidNotHold) return true;
    if (data.status === "SUBMITTED") {
      const hasTopicIds = !!(data.topicIds && data.topicIds.length > 0);
      const hasTopicId = !!data.topicId;
      const hasTopicText = !!(data.topicText && data.topicText.trim().length > 0);
      return hasTopicIds || hasTopicId || hasTopicText;
    }
    return true;
  },
  { message: "Select or type at least one topic before submitting", path: ["topicText"] }
).refine(
  (data) => {
    if (data.classDidNotHold && !data.classDidNotHoldReason?.trim()) {
      return false;
    }
    return true;
  },
  { message: "Reason is required when class did not hold", path: ["classDidNotHoldReason"] }
).refine(
  (data) => {
    if (data.bilingualActivity && !data.bilingualType) {
      return false;
    }
    return true;
  },
  { message: "Bilingual type is required when bilingual activity is enabled", path: ["bilingualType"] }
).refine(
  (data) => {
    if (data.assignmentGiven && !data.assignmentDetails?.trim()) {
      return false;
    }
    return true;
  },
  { message: "Assignment details are required when assignment is given", path: ["assignmentDetails"] }
);

export const updateEntrySchema = z.object({
  date: z.string().optional(),
  classId: z.string().optional(),
  topicId: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
  moduleName: z.string().optional().nullable(),
  topicText: z.string().max(300).optional().nullable(),
  period: z.number().int().min(1).max(9).optional().nullable(),
  duration: z.number().int().min(15).max(180).optional(),
  notes: z.string().max(500).optional().nullable(),
  objectives: z.union([
    z.string().max(500),
    z.array(z.object({
      text: z.string(),
      proportion: z.enum(["all", "most", "some", "few"]).default("all"),
    })),
  ]).optional().nullable(),
  signatureData: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SUBMITTED", "VERIFIED", "FLAGGED"]).optional(),
  studentAttendance: z.number().int().min(0).optional().nullable(),
  engagementLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().nullable(),
  classDidNotHold: z.boolean().optional(),
  classDidNotHoldReason: z.string().max(300).optional().nullable(),
  familyOfSituation: z.string().max(200).optional().nullable(),
  bilingualActivity: z.boolean().optional(),
  bilingualType: z.enum(["game", "discussion", "quiz", "role_play", "exercise", "translation", "song"]).optional().nullable(),
  bilingualNote: z.string().max(200).optional().nullable(),
  integrationActivity: z.string().max(500).optional().nullable(),
  integrationLevel: z.enum(["basic", "intermediate", "advanced"]).optional().nullable(),
  integrationStatus: z.enum(["completed", "partial", "carried_over"]).optional().nullable(),
  lessonMode: z.enum(["physical", "digital", "hybrid"]).optional().nullable(),
  digitalTools: z.array(z.string()).optional(),
  assignmentGiven: z.boolean().optional(),
  assignmentDetails: z.string().max(300).optional().nullable(),
  assignmentReviewed: z.boolean().optional().nullable(),
  academicYearId: z.string().optional().nullable(),
  termId: z.string().optional().nullable(),
});

export const verifyEntrySchema = z.object({
  remark: z.string().max(500).optional().nullable(),
  verificationSignature: z.string().optional().nullable(),
});

export const flagEntrySchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
});

export const remarkSchema = z.object({
  content: z.string().min(1, "Remark content is required").max(1000),
  remarkType: z.enum(["self_reflection", "hod_review", "admin_verification", "inspector_note"]),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type VerifyEntryInput = z.infer<typeof verifyEntrySchema>;
export type FlagEntryInput = z.infer<typeof flagEntrySchema>;
export type RemarkInput = z.infer<typeof remarkSchema>;
