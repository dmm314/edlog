// Maps subject code + class level + module number to the official family of situation
// Source: MINSEC curriculum syllabi
// NOTE: This is a starter set. Expand as we extract more from official documents.

export const FAMILY_OF_SITUATION: Record<string, Record<string, Record<number, string>>> = {
  PHY: {
    "Form 1": {
      1: "Social and family environment",
      2: "Matter and measurement in daily life",
      3: "Energy in the environment",
      4: "Health and well-being",
      5: "Environment and sustainable development",
      6: "Technology in daily life",
    },
    "Form 2": {
      1: "Social and family environment",
      2: "Industry and technology",
      3: "Health and environment",
    },
  },
  CHE: {
    "Form 1": {
      1: "Social and family environment",
      2: "Matter in daily life",
    },
  },
  MAT: {
    "Form 1": {
      1: "Social and economic environment",
    },
  },
  // Add more subjects. For subjects/levels where we don't have data yet,
  // the field will be empty and the teacher can type it manually.
};

export function getFamilyOfSituation(
  subjectCode: string,
  classLevel: string,
  moduleNum: number
): string | null {
  return FAMILY_OF_SITUATION[subjectCode]?.[classLevel]?.[moduleNum] || null;
}
