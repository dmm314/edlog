// Delegates to the canonical curriculum-metadata.ts file.
// Kept for backward compatibility with existing imports.
import { getModuleMetadata } from "@/../prisma/seed/curriculum-metadata";

export function getFamilyOfSituation(
  subjectCode: string,
  classLevel: string,
  moduleNum: number
): string | null {
  return getModuleMetadata(subjectCode, classLevel, moduleNum)?.familyOfSituation || null;
}
