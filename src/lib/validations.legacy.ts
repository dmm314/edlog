/**
 * Legacy validation schemas — Auth & Assessment schemas not yet migrated to modular format.
 * Entry schemas have been migrated to /lib/validations/entry.schema.ts
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    schoolCode: z.string().min(1, "School code is required"),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const schoolRegisterSchema = z.object({
  schoolName: z.string().min(3, "School name must be at least 3 characters"),
  registrationCode: z.string().min(1, "Registration code is required"),
  regionId: z.string().min(1, "Region is required"),
  divisionId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  adminFirstName: z.string().min(2, "First name must be at least 2 characters"),
  adminLastName: z.string().min(2, "Last name must be at least 2 characters"),
  adminEmail: z.string().email("Please enter a valid email address"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminConfirmPassword: z.string(),
}).refine((data) => data.adminPassword === data.adminConfirmPassword, {
  message: "Passwords do not match",
  path: ["adminConfirmPassword"],
});

// ── Assessments ──────────────────────────────────────────

export const createAssessmentSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(["sequence_test", "class_test", "assignment", "mock_exam", "exam"]),
  date: z.string().min(1, "Date is required"),
  totalMarks: z.number().int().min(1, "Total marks must be at least 1").max(1000),
  passMark: z.number().int().min(0),
  topicIds: z.array(z.string()).optional(),
  topicsNote: z.string().max(500).optional().nullable(),
});

export const updateAssessmentResultsSchema = z.object({
  corrected: z.boolean().optional(),
  correctionDate: z.string().optional().nullable(),
  totalStudents: z.number().int().min(0).optional().nullable(),
  totalMale: z.number().int().min(0).optional().nullable(),
  totalFemale: z.number().int().min(0).optional().nullable(),
  totalPassed: z.number().int().min(0).optional().nullable(),
  malePassed: z.number().int().min(0).optional().nullable(),
  femalePassed: z.number().int().min(0).optional().nullable(),
  highestMark: z.number().min(0).optional().nullable(),
  lowestMark: z.number().min(0).optional().nullable(),
  averageMark: z.number().min(0).optional().nullable(),
}).refine(
  (data) => {
    if (data.totalStudents != null && data.totalPassed != null && data.totalPassed > data.totalStudents) {
      return false;
    }
    return true;
  },
  { message: "Total passed cannot exceed total students", path: ["totalPassed"] }
);

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SchoolRegisterInput = z.infer<typeof schoolRegisterSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentResultsInput = z.infer<typeof updateAssessmentResultsSchema>;
