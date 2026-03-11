/**
 * EDLOG CURRICULUM METADATA
 *
 * This file contains Family of Situation and Learning Objectives for each
 * module in the Cameroonian national curriculum. It is used to auto-populate
 * fields in the logbook entry form.
 *
 * HOW TO READ THIS FILE:
 *   Each subject (PHY, CHE, MAT, etc.) contains class levels ("Form 1", "Form 2", etc.)
 *   Each class level contains modules (numbered 1, 2, 3, etc.)
 *   Each module has:
 *     - familyOfSituation: the official MINSEC family of situation for that module
 *     - objectives: things learners should be able to do after studying this module
 *
 * HOW TO UPDATE:
 *   1. Find the subject code (PHY = Physics, CHE = Chemistry, etc.)
 *   2. Find the class level ("Form 1", "Lower Sixth", etc.)
 *   3. Find or add the module number
 *   4. Add or edit the familyOfSituation and objectives
 *   5. Save the file
 *   6. Run: npx prisma db seed (or restart the dev server)
 *
 * IMPORTANT: Module numbers and names must match what's in the corresponding
 * curriculum file (curriculum-physics.ts, etc.) — the moduleNum and moduleName
 * fields in the Topic table.
 *
 * Source: MINSEC National Syllabi, Competency-Based Approach (CBA)
 * Last updated: March 2026
 */

export interface ModuleObjective {
  text: string;           // "identify the different branches of science"
  // The teacher will select which objectives were achieved, and for each
  // selected objective they'll indicate: "all", "most", "some", or "few" students
}

export interface ModuleMetadata {
  moduleNum: number;
  moduleName: string;     // Must match the moduleName in the Topic table
  familyOfSituation: string;
  objectives: ModuleObjective[];
}

export interface LevelMetadata {
  classLevel: string;     // "Form 1", "Form 2", ..., "Lower Sixth", "Upper Sixth"
  modules: ModuleMetadata[];
}

export interface SubjectMetadata {
  subjectCode: string;    // "PHY", "CHE", "MAT", "BIO", etc.
  subjectName: string;    // "Physics", "Chemistry", etc.
  levels: LevelMetadata[];
}


// ════════════════════════════════════════════════════════════════════
// PHYSICS
// ════════════════════════════════════════════════════════════════════

const PHYSICS: SubjectMetadata = {
  subjectCode: "PHY",
  subjectName: "Physics",
  levels: [
    // ── FORM 1 ──────────────────────────────────────────────────
    {
      classLevel: "Form 1",
      modules: [
        {
          moduleNum: 1,
          moduleName: "The World of Science",
          familyOfSituation: "Social and family environment",
          objectives: [
            { text: "identify the different branches of science" },
            { text: "name prominent scientists and their discoveries" },
            { text: "define physics and list its branches" },
            { text: "describe what physicists do" },
            { text: "identify basic equipment in the physics laboratory" },
            { text: "state safety rules for working in the laboratory" },
            { text: "list job opportunities for science students" },
            { text: "perform simple measurements using measuring instruments" },
            { text: "distinguish between physical and non-physical quantities" },
            { text: "state and use SI units of measurement" },
          ],
        },
        {
          moduleNum: 2,
          moduleName: "Matter – Properties and Transformation",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "describe the three states of matter" },
            { text: "explain interconversion processes between states" },
            { text: "define and measure length using appropriate instruments" },
            { text: "define mass and measure it using a balance" },
            { text: "differentiate between mass and weight" },
            { text: "measure volumes of liquids, regular and irregular solids" },
            { text: "define density and calculate it from mass and volume" },
            { text: "define temperature and convert between temperature scales" },
            { text: "apply safety rules on products and materials" },
          ],
        },
        {
          moduleNum: 3,
          moduleName: "Energy – Applications and Uses",
          familyOfSituation: "Economic activity and the environment",
          objectives: [
            { text: "identify forms and sources of energy" },
            { text: "describe daily applications of different forms of energy" },
            { text: "explain the principle of energy conservation" },
            { text: "describe components and uses of solar energy" },
            { text: "identify sources and uses of chemical, electrical, and heat energy" },
            { text: "explain conduction, convection, and radiation" },
            { text: "define force and describe its effects" },
            { text: "define and describe types of motion" },
            { text: "explain safety rules related to seat belts and road signs" },
          ],
        },
        {
          moduleNum: 4,
          moduleName: "Health Education",
          familyOfSituation: "Health and well-being",
          objectives: [
            { text: "describe how sound is produced" },
            { text: "explain how the ear perceives sound" },
            { text: "describe the effects of loud sound and prevention measures" },
            { text: "measure body temperature using a thermometer" },
            { text: "identify normal and abnormal body temperatures" },
            { text: "describe good body posture and its importance" },
          ],
        },
        {
          moduleNum: 5,
          moduleName: "Environmental Education and Sustainable Development",
          familyOfSituation: "Environment and sustainable development",
          objectives: [
            { text: "identify harmful waste and background radiation" },
            { text: "explain safety procedures for handling radioactive substances" },
            { text: "describe the greenhouse effect" },
            { text: "explain the causes and effects of climate change" },
            { text: "describe principles of environmental sustainability" },
          ],
        },
        {
          moduleNum: 6,
          moduleName: "Technology",
          familyOfSituation: "Media and communication",
          objectives: [
            { text: "identify common machines and their uses" },
            { text: "describe how simple machines make work easier" },
            { text: "explain the concept of mechanical advantage" },
          ],
        },
      ],
    },
    // ── FORM 2 ──────────────────────────────────────────────────
    {
      classLevel: "Form 2",
      modules: [
        // TODO: Add Form 2 modules when data is extracted from MINSEC syllabus
        // Example structure:
        // {
        //   moduleNum: 1,
        //   moduleName: "...",
        //   familyOfSituation: "...",
        //   objectives: [
        //     { text: "..." },
        //   ],
        // },
      ],
    },
    // ── FORM 3 ──────────────────────────────────────────────────
    {
      classLevel: "Form 3",
      modules: [
        // TODO: Add Form 3 modules
      ],
    },
    // ── FORM 4 ──────────────────────────────────────────────────
    {
      classLevel: "Form 4",
      modules: [
        // TODO: Add Form 4 modules
      ],
    },
    // ── FORM 5 ──────────────────────────────────────────────────
    {
      classLevel: "Form 5",
      modules: [
        // TODO: Add Form 5 modules
      ],
    },
    // ── LOWER SIXTH ─────────────────────────────────────────────
    {
      classLevel: "Lower Sixth",
      modules: [
        // NOTE: At this level, Physics has divisions (Mechanics, Electricity,
        // Waves & Optics, Modern Physics). Each division may have its own
        // family of situation. Add modules per division as data is available.
        //
        // TODO: Add Lower Sixth modules
      ],
    },
    // ── UPPER SIXTH ─────────────────────────────────────────────
    {
      classLevel: "Upper Sixth",
      modules: [
        // TODO: Add Upper Sixth modules
      ],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// CHEMISTRY
// ════════════════════════════════════════════════════════════════════

const CHEMISTRY: SubjectMetadata = {
  subjectCode: "CHE",
  subjectName: "Chemistry",
  levels: [
    {
      classLevel: "Form 1",
      modules: [
        // TODO: Add Chemistry Form 1 modules
        // NOTE: Chemistry in Form 1 has NO divisions. Divisions (Physical,
        // Organic, Inorganic) only apply to second cycle (Lower/Upper Sixth).
        // The family of situation for Chemistry Form 1 will be different from
        // Chemistry Lower Sixth even if the topic names seem similar.
      ],
    },
    {
      classLevel: "Form 2",
      modules: [],
    },
    {
      classLevel: "Form 3",
      modules: [],
    },
    {
      classLevel: "Form 4",
      modules: [],
    },
    {
      classLevel: "Form 5",
      modules: [],
    },
    {
      classLevel: "Lower Sixth",
      modules: [
        // NOTE: At this level, Chemistry has divisions:
        // - Physical Chemistry
        // - Organic Chemistry
        // - Inorganic Chemistry
        // Each division has its own modules with distinct families of situation.
        // The family of situation for "Physical Chemistry" in Lower Sixth is
        // "Industry and technology" — different from general Chemistry in Form 1.
        //
        // TODO: Add Lower Sixth Chemistry modules per division
      ],
    },
    {
      classLevel: "Upper Sixth",
      modules: [],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// MATHEMATICS
// ════════════════════════════════════════════════════════════════════

const MATHEMATICS: SubjectMetadata = {
  subjectCode: "MAT",
  subjectName: "Mathematics",
  levels: [
    {
      classLevel: "Form 1",
      modules: [
        // TODO: Add Mathematics Form 1 modules
        // Math modules are organized around: Numbers, Algebra, Geometry,
        // Statistics, etc. Each has a distinct family of situation.
        // Example:
        // - Geometry module → "Social and family environment" (measuring plots,
        //   room dimensions, etc.)
        // - Statistics module → "Economic activity" (interpreting market data, etc.)
      ],
    },
    {
      classLevel: "Form 2",
      modules: [],
    },
    {
      classLevel: "Form 3",
      modules: [],
    },
    {
      classLevel: "Form 4",
      modules: [],
    },
    {
      classLevel: "Form 5",
      modules: [],
    },
    {
      classLevel: "Lower Sixth",
      modules: [
        // NOTE: Math in Lower Sixth has divisions:
        // - Pure Mathematics
        // - Mechanics
        // - Statistics
        // Each has distinct families and objectives.
        // TODO: Add per-division modules
      ],
    },
    {
      classLevel: "Upper Sixth",
      modules: [],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// BIOLOGY
// ════════════════════════════════════════════════════════════════════

const BIOLOGY: SubjectMetadata = {
  subjectCode: "BIO",
  subjectName: "Biology",
  levels: [
    {
      classLevel: "Form 1",
      modules: [
        // TODO: Add Biology Form 1 modules
      ],
    },
    {
      classLevel: "Form 2",
      modules: [],
    },
    {
      classLevel: "Form 3",
      modules: [],
    },
    {
      classLevel: "Form 4",
      modules: [],
    },
    {
      classLevel: "Form 5",
      modules: [],
    },
    {
      classLevel: "Lower Sixth",
      modules: [
        // Divisions: Cell Biology, Genetics, Ecology, Physiology
        // TODO: Add per-division modules
      ],
    },
    {
      classLevel: "Upper Sixth",
      modules: [],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// COMPUTER SCIENCE
// ════════════════════════════════════════════════════════════════════

const COMPUTER_SCIENCE: SubjectMetadata = {
  subjectCode: "CSC",
  subjectName: "Computer Science",
  levels: [
    {
      classLevel: "Form 1",
      modules: [],
    },
    {
      classLevel: "Form 2",
      modules: [],
    },
    {
      classLevel: "Form 3",
      modules: [],
    },
    {
      classLevel: "Form 4",
      modules: [],
    },
    {
      classLevel: "Form 5",
      modules: [],
    },
    {
      classLevel: "Lower Sixth",
      modules: [],
    },
    {
      classLevel: "Upper Sixth",
      modules: [],
    },
  ],
};


// ════════════════════════════════════════════════════════════════════
// ADD MORE SUBJECTS BELOW
// ════════════════════════════════════════════════════════════════════
//
// To add a new subject:
// 1. Create a const following the same pattern as PHYSICS above
// 2. Add it to the ALL_METADATA array at the bottom
// 3. Fill in modules as data becomes available
//
// Subject codes must match what's in the Subject table:
//   ENG = English, FRE = French, LIT = Literature in English,
//   ECO = Economics, GEO = Geography, HIS = History,
//   PHI = Philosophy, LOG = Logic, ACC = Accounting,
//   COM = Commerce, FOA = Food and Nutrition,
//   and any others in your Subject table.
// ════════════════════════════════════════════════════════════════════


// ── MASTER EXPORT ───────────────────────────────────────────────────

export const ALL_METADATA: SubjectMetadata[] = [
  PHYSICS,
  CHEMISTRY,
  MATHEMATICS,
  BIOLOGY,
  COMPUTER_SCIENCE,
  // Add more subjects here as they are created above
];


// ── LOOKUP HELPERS ──────────────────────────────────────────────────
// These functions are used by the API to quickly find metadata.

/**
 * Find metadata for a specific subject + level + module combination.
 * Returns null if no metadata exists yet.
 */
export function getModuleMetadata(
  subjectCode: string,
  classLevel: string,
  moduleNum: number
): ModuleMetadata | null {
  const subject = ALL_METADATA.find(s => s.subjectCode === subjectCode);
  if (!subject) return null;

  const level = subject.levels.find(l => l.classLevel === classLevel);
  if (!level) return null;

  const mod = level.modules.find(m => m.moduleNum === moduleNum);
  return mod || null;
}

/**
 * Find metadata by module NAME instead of number.
 * Useful when the entry form knows the moduleName but not the moduleNum.
 */
export function getModuleMetadataByName(
  subjectCode: string,
  classLevel: string,
  moduleName: string
): ModuleMetadata | null {
  const subject = ALL_METADATA.find(s => s.subjectCode === subjectCode);
  if (!subject) return null;

  const level = subject.levels.find(l => l.classLevel === classLevel);
  if (!level) return null;

  const mod = level.modules.find(
    m => m.moduleName.toLowerCase() === moduleName.toLowerCase()
  );
  return mod || null;
}

/**
 * Get all available families of situation for a subject + level.
 * Used to populate the dropdown when no specific module match exists.
 */
export function getFamiliesForLevel(
  subjectCode: string,
  classLevel: string
): string[] {
  const subject = ALL_METADATA.find(s => s.subjectCode === subjectCode);
  if (!subject) return [];

  const level = subject.levels.find(l => l.classLevel === classLevel);
  if (!level) return [];

  const families = level.modules
    .map(m => m.familyOfSituation)
    .filter(Boolean);

  return Array.from(new Set(families)); // deduplicate
}

/**
 * Get ALL unique families of situation across the entire curriculum.
 * Used as fallback dropdown options.
 */
export function getAllFamilies(): string[] {
  const families = new Set<string>();
  for (const subject of ALL_METADATA) {
    for (const level of subject.levels) {
      for (const mod of level.modules) {
        if (mod.familyOfSituation) {
          families.add(mod.familyOfSituation);
        }
      }
    }
  }
  return Array.from(families).sort();
}
