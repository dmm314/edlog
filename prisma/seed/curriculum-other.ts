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
