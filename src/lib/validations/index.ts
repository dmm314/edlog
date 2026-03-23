/**
 * Modular validation schemas barrel export.
 *
 * New code should import from here: import { createEntrySchema } from '@/lib/validations/index'
 * or directly: import { createEntrySchema } from '@/lib/validations/entry.schema'
 *
 * Legacy code continues to import from '@/lib/validations' (resolves to validations.ts)
 */
export * from "./entry.schema";
export * from "./school.schema";

// Re-export legacy schemas for convenience
export {
  loginSchema,
  registerSchema,
  schoolRegisterSchema,
  createAssessmentSchema,
  updateAssessmentResultsSchema,
  type LoginInput,
  type RegisterInput,
  type SchoolRegisterInput,
  type CreateAssessmentInput,
  type UpdateAssessmentResultsInput,
} from "@/lib/validations.legacy";
