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

export const createEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  classId: z.string().min(1, "Class is required"),
  // Support submitting for multiple classes at once
  classIds: z.array(z.string()).optional(),
  topicId: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
  moduleName: z.string().optional().nullable(),
  topicText: z.string().max(300, "Topic must be under 300 characters").optional().nullable(),
  assignmentId: z.string().optional().nullable(),
  // Support multiple assignments (for multi-class)
  assignmentIds: z.array(z.string()).optional(),
  timetableSlotId: z.string().optional().nullable(),
  period: z.number().int().min(1).max(9).optional().nullable(),
  duration: z.number().int().min(15).max(180).default(60),
  notes: z.string().max(500, "Notes must be under 500 characters").optional().nullable(),
  objectives: z
    .string()
    .max(500, "Objectives must be under 500 characters")
    .optional()
    .nullable(),
  signatureData: z.string().optional().nullable(),
  studentAttendance: z.number().int().min(0).optional().nullable(),
  engagementLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().nullable(),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
  // Mark a period as "class didn't hold"
  classDidNotHold: z.boolean().optional(),
}).refine(
  (data) => {
    // Period is required when submitting (not for drafts)
    if (data.status === "SUBMITTED" && !data.period && !data.timetableSlotId) {
      return false;
    }
    return true;
  },
  { message: "You must select a period before submitting", path: ["period"] }
);

export const updateEntrySchema = z.object({
  date: z.string().optional(),
  classId: z.string().optional(),
  topicId: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
  period: z.number().int().min(1).max(9).optional().nullable(),
  duration: z.number().int().min(15).max(180).optional(),
  notes: z.string().max(500).optional().nullable(),
  objectives: z.string().max(500).optional().nullable(),
  signatureData: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SUBMITTED", "VERIFIED", "FLAGGED"]).optional(),
  studentAttendance: z.number().int().min(0).optional().nullable(),
  engagementLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SchoolRegisterInput = z.infer<typeof schoolRegisterSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
