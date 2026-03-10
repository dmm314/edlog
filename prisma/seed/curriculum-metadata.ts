// TODO: This is a starter dataset. Expand by extracting from official MINSEC syllabi documents.
// The structure supports incremental additions — add new subjects/levels/modules as data is obtained.

export interface ModuleMetadata {
  familyOfSituation: string;
  objectives: string[]; // "Learners are able to..." completions
}

// Keyed by: subjectCode → classLevel → moduleNum
export const CURRICULUM_METADATA: Record<string, Record<string, Record<number, ModuleMetadata>>> = {
  PHY: {
    "Form 1": {
      1: {
        familyOfSituation: "Social and family environment",
        objectives: [
          "identify the different branches of science",
          "name prominent scientists and their discoveries",
          "define physics and list its branches",
          "identify basic equipment in the physics laboratory",
          "state safety rules for working in the laboratory",
          "use measuring instruments for simple measurements",
          "distinguish between physical and non-physical quantities",
          "convert between SI units",
        ],
      },
      2: {
        familyOfSituation: "Matter and measurement in daily life",
        objectives: [
          "describe the three states of matter and interconversion processes",
          "measure length using appropriate instruments",
          "define mass, weight, and differentiate between them",
          "measure volumes of liquids, regular and irregular solids",
          "calculate density from mass and volume",
          "convert between temperature scales",
          "apply safety rules on products and materials",
        ],
      },
      3: {
        familyOfSituation: "Energy in the environment",
        objectives: [
          "identify forms and sources of energy",
          "describe daily applications of energy",
          "explain the principle of energy conservation",
          "identify components and uses of solar, chemical, and electrical energy",
          "explain conduction, convection, and radiation",
          "define force and describe its effects",
          "describe types of motion",
        ],
      },
      4: {
        familyOfSituation: "Health and well-being",
        objectives: [
          "describe how sound is produced and perceived by the ear",
          "explain the effects of loud sound and prevention measures",
          "measure body temperature and identify normal vs abnormal ranges",
          "describe good body posture and its importance",
        ],
      },
      5: {
        familyOfSituation: "Environment and sustainable development",
        objectives: [
          "identify harmful waste and background radiation",
          "explain safety procedures for handling radioactive substances",
          "describe the greenhouse effect and climate change",
          "explain principles of environmental sustainability",
        ],
      },
      6: {
        familyOfSituation: "Technology in daily life",
        objectives: [
          "identify common machines and their uses",
          "describe how simple machines make work easier",
          "explain the concept of mechanical advantage",
        ],
      },
    },
    "Form 2": {
      1: {
        familyOfSituation: "Social and family environment",
        objectives: [
          "describe the concept of equilibrium",
          "explain the conditions for static equilibrium",
          "solve problems involving moments and couples",
        ],
      },
      2: {
        familyOfSituation: "Industry and technology",
        objectives: [
          "describe types of motion in detail",
          "calculate speed, velocity, and acceleration",
          "interpret distance-time and velocity-time graphs",
        ],
      },
      3: {
        familyOfSituation: "Health and environment",
        objectives: [
          "explain pressure in solids, liquids, and gases",
          "apply the concept of atmospheric pressure",
          "describe the operation of hydraulic systems",
        ],
      },
    },
  },
  CHE: {
    "Form 1": {
      1: {
        familyOfSituation: "Social and family environment",
        objectives: [
          "define chemistry and explain its importance",
          "identify common laboratory apparatus and their uses",
          "state laboratory safety rules",
        ],
      },
      2: {
        familyOfSituation: "Matter in daily life",
        objectives: [
          "classify matter as elements, compounds, and mixtures",
          "describe methods of separating mixtures",
          "distinguish between physical and chemical changes",
        ],
      },
    },
    "Lower Sixth": {
      // NOTE: Chemistry divisions (Physical/Organic/Inorganic) apply here
      // Family of situation applies at the division level for second cycle
      1: {
        familyOfSituation: "Industry and technology",
        objectives: [
          "explain atomic structure and electronic configuration",
          "describe chemical bonding types",
          "perform stoichiometric calculations",
        ],
      },
    },
  },
  MAT: {
    "Form 1": {
      1: {
        familyOfSituation: "Social and economic environment",
        objectives: [
          "perform operations with natural numbers",
          "solve problems involving basic arithmetic",
          "represent data in tables and graphs",
        ],
      },
    },
  },
  BIO: {
    "Form 1": {
      1: {
        familyOfSituation: "Health and environment",
        objectives: [
          "describe the characteristics of living things",
          "classify organisms into kingdoms",
          "use a microscope to observe cells",
        ],
      },
    },
  },
  // Add more subjects as data becomes available.
  // For subjects/levels without data, the fields remain manual input.
};

export function getModuleMetadata(
  subjectCode: string,
  classLevel: string,
  moduleNum: number
): ModuleMetadata | null {
  return CURRICULUM_METADATA[subjectCode]?.[classLevel]?.[moduleNum] || null;
}
