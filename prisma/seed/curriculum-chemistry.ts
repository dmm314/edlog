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

export const CHEMISTRY_CURRICULUM: LevelData[] = [
  {
    classLevel: "Form 1",
    topics: [
      {
        name: "Understanding Chemistry",
        moduleNum: 1,
        moduleName: "Understanding Chemistry and Classification",
        orderIndex: 0,
      },
      {
        name: "Simple Classification of Substances",
        moduleNum: 1,
        moduleName: "Understanding Chemistry and Classification",
        orderIndex: 1,
      },
      {
        name: "Chemical Elements",
        moduleNum: 1,
        moduleName: "Understanding Chemistry and Classification",
        orderIndex: 2,
      },
      {
        name: "Acids and Bases",
        moduleNum: 1,
        moduleName: "Understanding Chemistry and Classification",
        orderIndex: 3,
      },
      {
        name: "Effect of Heat on Substances",
        moduleNum: 2,
        moduleName: "Effect of Heat on Substances",
        orderIndex: 4,
      },
      {
        name: "Air",
        moduleNum: 3,
        moduleName: "Air Water and Solutions",
        orderIndex: 5,
      },
      {
        name: "Water",
        moduleNum: 3,
        moduleName: "Air Water and Solutions",
        orderIndex: 6,
      },
      {
        name: "Solutions",
        moduleNum: 3,
        moduleName: "Air Water and Solutions",
        orderIndex: 7,
      },
    ],
  },
  {
    classLevel: "Form 2",
    topics: [
      {
        name: "The Atom",
        moduleNum: 1,
        moduleName: "Atoms and Chemical Reactions",
        orderIndex: 0,
      },
      {
        name: "Chemical Symbols Formulae and Valency",
        moduleNum: 1,
        moduleName: "Atoms and Chemical Reactions",
        orderIndex: 1,
      },
      {
        name: "The Periodic Table",
        moduleNum: 1,
        moduleName: "Atoms and Chemical Reactions",
        orderIndex: 2,
      },
      {
        name: "Chemical Reactions",
        moduleNum: 1,
        moduleName: "Atoms and Chemical Reactions",
        orderIndex: 3,
      },
      {
        name: "Reactions with Oxygen",
        moduleNum: 1,
        moduleName: "Atoms and Chemical Reactions",
        orderIndex: 4,
      },
      {
        name: "Mixtures and Pure Substances",
        moduleNum: 1,
        moduleName: "Atoms and Chemical Reactions",
        orderIndex: 5,
      },
      {
        name: "Action of Heat on Materials",
        moduleNum: 2,
        moduleName: "Action of Heat and Electricity",
        orderIndex: 6,
      },
      {
        name: "Action of Electricity on Materials",
        moduleNum: 2,
        moduleName: "Action of Heat and Electricity",
        orderIndex: 7,
      },
    ],
  },
  {
    classLevel: "Form 3",
    topics: [
      {
        name: "Atoms",
        moduleNum: 1,
        moduleName: "Atoms Structure and Chemical Properties",
        orderIndex: 0,
      },
      {
        name: "Structure of Atom and Periodic Table",
        moduleNum: 1,
        moduleName: "Atoms Structure and Chemical Properties",
        orderIndex: 1,
      },
      {
        name: "Structure and Bonding",
        moduleNum: 1,
        moduleName: "Atoms Structure and Chemical Properties",
        orderIndex: 2,
      },
      {
        name: "Acidic and Alkaline Solutions",
        moduleNum: 1,
        moduleName: "Atoms Structure and Chemical Properties",
        orderIndex: 3,
      },
      {
        name: "Hydrogen",
        moduleNum: 1,
        moduleName: "Atoms Structure and Chemical Properties",
        orderIndex: 4,
      },
      {
        name: "Oxygen",
        moduleNum: 1,
        moduleName: "Atoms Structure and Chemical Properties",
        orderIndex: 5,
      },
      {
        name: "Phosphorus",
        moduleNum: 1,
        moduleName: "Atoms Structure and Chemical Properties",
        orderIndex: 6,
      },
      {
        name: "Halogens",
        moduleNum: 1,
        moduleName: "Atoms Structure and Chemical Properties",
        orderIndex: 7,
      },
      {
        name: "Carbon",
        moduleNum: 1,
        moduleName: "Atoms Structure and Chemical Properties",
        orderIndex: 8,
      },
    ],
  },
  {
    classLevel: "Form 4",
    topics: [
      {
        name: "Sulphur",
        moduleNum: 1,
        moduleName: "Elements Compounds and Organic Chemistry",
        orderIndex: 0,
      },
      {
        name: "Nitrogen",
        moduleNum: 1,
        moduleName: "Elements Compounds and Organic Chemistry",
        orderIndex: 1,
      },
      {
        name: "Formulae Moles and Equations",
        moduleNum: 1,
        moduleName: "Elements Compounds and Organic Chemistry",
        orderIndex: 2,
      },
      {
        name: "Gaseous State",
        moduleNum: 1,
        moduleName: "Elements Compounds and Organic Chemistry",
        orderIndex: 3,
      },
      {
        name: "Alkali and Alkaline-Earth Metals",
        moduleNum: 1,
        moduleName: "Elements Compounds and Organic Chemistry",
        orderIndex: 4,
      },
      {
        name: "Transition Metals",
        moduleNum: 1,
        moduleName: "Elements Compounds and Organic Chemistry",
        orderIndex: 5,
      },
      {
        name: "Identification of Ions",
        moduleNum: 1,
        moduleName: "Elements Compounds and Organic Chemistry",
        orderIndex: 6,
      },
      {
        name: "Salts",
        moduleNum: 1,
        moduleName: "Elements Compounds and Organic Chemistry",
        orderIndex: 7,
      },
      {
        name: "Organic Chemistry Part 1 — Hydrocarbons",
        moduleNum: 1,
        moduleName: "Elements Compounds and Organic Chemistry",
        orderIndex: 8,
      },
    ],
  },
  {
    classLevel: "Form 5",
    topics: [
      {
        name: "Rates of Reaction",
        moduleNum: 1,
        moduleName: "Reaction Rates and Organic Chemistry",
        orderIndex: 0,
      },
      {
        name: "Reversible Reactions",
        moduleNum: 1,
        moduleName: "Reaction Rates and Organic Chemistry",
        orderIndex: 1,
      },
      {
        name: "Solutions and Acid-Base Titrations",
        moduleNum: 1,
        moduleName: "Reaction Rates and Organic Chemistry",
        orderIndex: 2,
      },
      {
        name: "Organic Chemistry Part 2",
        moduleNum: 1,
        moduleName: "Reaction Rates and Organic Chemistry",
        orderIndex: 3,
      },
      {
        name: "Extraction of Metals",
        moduleNum: 2,
        moduleName: "Industrial Chemistry",
        orderIndex: 4,
      },
      {
        name: "Heavy Chemical Industries",
        moduleNum: 2,
        moduleName: "Industrial Chemistry",
        orderIndex: 5,
      },
      {
        name: "Energetics",
        moduleNum: 3,
        moduleName: "Energetics and Electrochemistry",
        orderIndex: 6,
      },
      {
        name: "Electrochemistry",
        moduleNum: 3,
        moduleName: "Energetics and Electrochemistry",
        orderIndex: 7,
      },
    ],
  },
  {
    classLevel: "Lower Sixth",
    topics: [
      {
        name: "Mole Concept",
        moduleNum: 1,
        moduleName: "Fundamental Chemistry",
        orderIndex: 0,
      },
      {
        name: "Atomic Structure and Periodic Table",
        moduleNum: 1,
        moduleName: "Fundamental Chemistry",
        orderIndex: 1,
      },
      {
        name: "Bonding Structure and Intermolecular Forces",
        moduleNum: 1,
        moduleName: "Fundamental Chemistry",
        orderIndex: 2,
      },
      {
        name: "Organic Chemistry — Fundamentals and Hydrocarbons",
        moduleNum: 1,
        moduleName: "Fundamental Chemistry",
        orderIndex: 3,
      },
      {
        name: "Descriptive Inorganic Chemistry",
        moduleNum: 1,
        moduleName: "Fundamental Chemistry",
        orderIndex: 4,
      },
      {
        name: "Phase Equilibria and Raoult's Law",
        moduleNum: 1,
        moduleName: "Fundamental Chemistry",
        orderIndex: 5,
      },
      {
        name: "Thermochemistry and Enthalpy Changes",
        moduleNum: 3,
        moduleName: "Thermochemistry",
        orderIndex: 6,
      },
    ],
  },
  {
    classLevel: "Upper Sixth",
    topics: [
      {
        name: "Equilibria",
        moduleNum: 1,
        moduleName: "Equilibria and Organic Chemistry",
        orderIndex: 0,
      },
      {
        name: "Organic Chemistry 2",
        moduleNum: 1,
        moduleName: "Equilibria and Organic Chemistry",
        orderIndex: 1,
      },
      {
        name: "Organic Chemistry 3 — Reaction Mechanisms",
        moduleNum: 1,
        moduleName: "Equilibria and Organic Chemistry",
        orderIndex: 2,
      },
      {
        name: "Descriptive Inorganic Chemistry — Group IV VII and Transition Metals",
        moduleNum: 1,
        moduleName: "Equilibria and Organic Chemistry",
        orderIndex: 3,
      },
      {
        name: "Chemistry and Society",
        moduleNum: 2,
        moduleName: "Chemistry and Society",
        orderIndex: 4,
      },
      {
        name: "Reaction Kinetics",
        moduleNum: 3,
        moduleName: "Reaction Kinetics",
        orderIndex: 5,
      },
    ],
  },
];
