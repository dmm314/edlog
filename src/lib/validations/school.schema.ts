/**
 * School & Academic Year validation schemas.
 */
import { z } from "zod";

export const createAcademicYearSchema = z.object({
  name: z.string().min(1, "Name is required").max(20), // e.g., '2025/2026'
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean().optional(),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: "Start date must be before end date", path: ["endDate"] }
);

export const createTermSchema = z.object({
  academicYearId: z.string().min(1, "Academic year is required"),
  name: z.string().min(1, "Term name is required").max(50),
  number: z.number().int().min(1).max(3),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: "Start date must be before end date", path: ["endDate"] }
);

export const updateSchoolProfileSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  schoolType: z.string().optional().nullable(),
  principalName: z.string().max(100).optional().nullable(),
  principalPhone: z.string().max(20).optional().nullable(),
  foundingDate: z.string().optional().nullable(),
});

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateSchoolProfileInput = z.infer<typeof updateSchoolProfileSchema>;
