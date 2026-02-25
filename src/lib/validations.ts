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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  classId: z.string().min(1, "Class is required"),
  topicId: z.string().min(1, "Topic is required"),
  period: z.number().int().min(1).max(8).optional().nullable(),
  duration: z.number().int().min(15).max(180).default(60),
  notes: z.string().max(500, "Notes must be under 500 characters").optional().nullable(),
  objectives: z
    .string()
    .max(500, "Objectives must be under 500 characters")
    .optional()
    .nullable(),
  signatureData: z.string().optional().nullable(),
});

export const updateEntrySchema = z.object({
  date: z.string().optional(),
  classId: z.string().optional(),
  topicId: z.string().optional(),
  period: z.number().int().min(1).max(8).optional().nullable(),
  duration: z.number().int().min(15).max(180).optional(),
  notes: z.string().max(500).optional().nullable(),
  objectives: z.string().max(500).optional().nullable(),
  signatureData: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SUBMITTED", "VERIFIED", "FLAGGED"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
