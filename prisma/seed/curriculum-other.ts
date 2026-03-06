// ============================================================
// CURRICULUM-OTHER: Placeholder subjects without full curriculum data
// ============================================================
//
// HOW TO ADD A NEW SUBJECT:
//   1. Add a new object to the OTHER_SUBJECTS array at the bottom
//   2. Each subject needs: name, code (unique 2-3 letter), category, levels
//   3. Use buildLevels("Subject Name", levelsFromTo("Form 1", "Upper Sixth"))
//      to auto-generate placeholder topics for each form level
//   4. levelsFromTo(start, end) picks a range from:
//      "Form 1", "Form 2", "Form 3", "Form 4", "Form 5",
//      "Lower Sixth", "Upper Sixth"
//
// HOW TO ADD FULL CURRICULUM (replace placeholders):
//   1. Create a new file: prisma/seed/curriculum-<subject>.ts
//   2. Export a constant like PHYSICS_CURRICULUM (array of LevelData)
//   3. Import it in prisma/seed.ts and push to allSubjects[]
//   4. Remove the placeholder entry from OTHER_SUBJECTS here
//
// CATEGORIES used: "Science", "Language", "Humanities", "General",
//                  "Chemistry" (for chemistry branches)
//
// AFTER CHANGES: Re-run `npx prisma db seed` (or do a full reset
//   via neon-reset.sql + seed) for new subjects to appear.
// ============================================================

export interface TopicData {
  name: string;
  moduleNum: number;
  moduleName: string;
  orderIndex: number;
}

export interface LevelData {
  classLevel: string;
  topics: TopicData[];
}

export interface SubjectDef {
  name: string;
  code: string;
  category: string;
  levels: LevelData[];
}

// ---------------------------------------------------------------------------
// Helper: given a subject name and a slice of class-level strings, produce
// one module per level with the single placeholder topic.
// ---------------------------------------------------------------------------
const ALL_LEVELS = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
] as const;

function buildLevels(
  subjectName: string,
  levelNames: readonly string[],
): LevelData[] {
  return levelNames.map((classLevel) => ({
    classLevel,
    topics: [
      {
        name: "Topics to be added from official MINSEC curriculum",
        moduleNum: 1,
        moduleName: `Module 1: ${subjectName} — Curriculum data pending update`,
        orderIndex: 1,
      },
    ],
  }));
}

/** Convenience – pick a contiguous range from the canonical level list. */
function levelsFromTo(from: string, to: string): readonly string[] {
  const start = ALL_LEVELS.indexOf(from as (typeof ALL_LEVELS)[number]);
  const end = ALL_LEVELS.indexOf(to as (typeof ALL_LEVELS)[number]);
  return ALL_LEVELS.slice(start, end + 1);
}

// ---------------------------------------------------------------------------
// Placeholder curriculum data for subjects whose full curriculum has not yet
// been provided. Each subject gets one module per form level with a note that
// curriculum data is pending.
// ---------------------------------------------------------------------------
export const OTHER_SUBJECTS: SubjectDef[] = [
  {
    name: "English Language",
    code: "ENG",
    category: "Language",
    levels: buildLevels(
      "English Language",
      levelsFromTo("Form 1", "Upper Sixth"),
    ),
  },
  {
    name: "French",
    code: "FRE",
    category: "Language",
    levels: buildLevels("French", levelsFromTo("Form 1", "Upper Sixth")),
  },
  {
    name: "History",
    code: "HIS",
    category: "Humanities",
    levels: buildLevels("History", levelsFromTo("Form 1", "Upper Sixth")),
  },
  {
    name: "Geography",
    code: "GEO",
    category: "Humanities",
    levels: buildLevels("Geography", levelsFromTo("Form 1", "Upper Sixth")),
  },
  {
    name: "Economics",
    code: "ECO",
    category: "Humanities",
    levels: buildLevels("Economics", levelsFromTo("Form 2", "Upper Sixth")),
  },
  {
    name: "Literature in English",
    code: "LIT",
    category: "Language",
    levels: buildLevels(
      "Literature in English",
      levelsFromTo("Form 3", "Upper Sixth"),
    ),
  },
  {
    name: "Religious Studies",
    code: "REL",
    category: "Humanities",
    levels: buildLevels(
      "Religious Studies",
      levelsFromTo("Form 1", "Upper Sixth"),
    ),
  },
  {
    name: "Citizenship",
    code: "CIT",
    category: "General",
    levels: buildLevels("Citizenship", levelsFromTo("Form 1", "Form 3")),
  },
  {
    name: "Arts and Crafts",
    code: "ARC",
    category: "General",
    levels: buildLevels("Arts and Crafts", levelsFromTo("Form 1", "Form 2")),
  },
  {
    name: "Physical Education",
    code: "PHE",
    category: "General",
    levels: buildLevels(
      "Physical Education",
      levelsFromTo("Form 1", "Form 5"),
    ),
  },
  {
    name: "Sports",
    code: "SPO",
    category: "General",
    levels: buildLevels("Sports", levelsFromTo("Form 1", "Upper Sixth")),
  },
  {
    name: "Manual Labour",
    code: "MLA",
    category: "General",
    levels: buildLevels(
      "Manual Labour",
      levelsFromTo("Form 1", "Form 5"),
    ),
  },
  // ICT — part of the Computer Science family but a distinct subject
  // (shares HOD with Computer Science)
  {
    name: "Information and Communication Technology",
    code: "ICT",
    category: "Science",
    levels: buildLevels(
      "Information and Communication Technology",
      levelsFromTo("Form 1", "Upper Sixth"),
    ),
  },
  // Food Science
  {
    name: "Food Science",
    code: "FSC",
    category: "Science",
    levels: buildLevels(
      "Food Science",
      levelsFromTo("Form 3", "Upper Sixth"),
    ),
  },
  // Chemistry branch subjects — individually assignable
  {
    name: "Physical Chemistry",
    code: "PCH",
    category: "Chemistry",
    levels: buildLevels(
      "Physical Chemistry",
      levelsFromTo("Form 1", "Upper Sixth"),
    ),
  },
  {
    name: "Organic Chemistry",
    code: "OCH",
    category: "Chemistry",
    levels: buildLevels(
      "Organic Chemistry",
      levelsFromTo("Form 1", "Upper Sixth"),
    ),
  },
  {
    name: "Inorganic Chemistry",
    code: "ICH",
    category: "Chemistry",
    levels: buildLevels(
      "Inorganic Chemistry",
      levelsFromTo("Form 1", "Upper Sixth"),
    ),
  },
];
