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

export const BIOLOGY_CURRICULUM: LevelData[] = [
  {
    classLevel: "Form 1",
    topics: [
      {
        name: "Curriculum data pending",
        moduleNum: 1,
        moduleName: "Introduction to Biology",
        orderIndex: 0,
      },
    ],
  },
  {
    classLevel: "Form 2",
    topics: [
      {
        name: "Curriculum data pending",
        moduleNum: 1,
        moduleName: "Living Organisms",
        orderIndex: 0,
      },
    ],
  },
  {
    classLevel: "Form 3",
    topics: [
      {
        name: "Curriculum data pending",
        moduleNum: 1,
        moduleName: "Cell Biology",
        orderIndex: 0,
      },
    ],
  },
  {
    classLevel: "Form 4",
    topics: [
      {
        name: "Curriculum data pending",
        moduleNum: 1,
        moduleName: "Human Biology",
        orderIndex: 0,
      },
    ],
  },
  {
    classLevel: "Form 5",
    topics: [
      {
        name: "Curriculum data pending",
        moduleNum: 1,
        moduleName: "Ecology and Environment",
        orderIndex: 0,
      },
    ],
  },
  {
    classLevel: "Lower Sixth",
    topics: [
      {
        name: "Microscopy",
        moduleNum: 1,
        moduleName: "Cell Biology Foundations",
        orderIndex: 0,
      },
      {
        name: "Introduction to Cell",
        moduleNum: 1,
        moduleName: "Cell Biology Foundations",
        orderIndex: 1,
      },
      {
        name: "Cell Ultrastructure",
        moduleNum: 1,
        moduleName: "Cell Biology Foundations",
        orderIndex: 2,
      },
      {
        name: "Cell Division",
        moduleNum: 1,
        moduleName: "Cell Biology Foundations",
        orderIndex: 3,
      },
      {
        name: "Movement of Substances",
        moduleNum: 1,
        moduleName: "Cell Biology Foundations",
        orderIndex: 4,
      },
      {
        name: "Carbohydrates",
        moduleNum: 2,
        moduleName: "Biological Molecules Part 1",
        orderIndex: 5,
      },
      {
        name: "Lipids",
        moduleNum: 2,
        moduleName: "Biological Molecules Part 1",
        orderIndex: 6,
      },
      {
        name: "Proteins",
        moduleNum: 2,
        moduleName: "Biological Molecules Part 1",
        orderIndex: 7,
      },
      {
        name: "Nucleic Acids",
        moduleNum: 3,
        moduleName: "Nucleic Acids",
        orderIndex: 8,
      },
      {
        name: "DNA Replication and Protein Synthesis",
        moduleNum: 4,
        moduleName: "Molecular Biology",
        orderIndex: 9,
      },
      {
        name: "Enzymes",
        moduleNum: 4,
        moduleName: "Molecular Biology",
        orderIndex: 10,
      },
    ],
  },
  {
    classLevel: "Upper Sixth",
    topics: [
      {
        name: "Mendelian Laws",
        moduleNum: 1,
        moduleName: "Heredity",
        orderIndex: 0,
      },
      {
        name: "Deviation from Mendelian Laws",
        moduleNum: 1,
        moduleName: "Heredity",
        orderIndex: 1,
      },
      {
        name: "Gene Interactions",
        moduleNum: 1,
        moduleName: "Heredity",
        orderIndex: 2,
      },
      {
        name: "Variation and Mutations",
        moduleNum: 1,
        moduleName: "Heredity",
        orderIndex: 3,
      },
      {
        name: "Autotrophic Nutrition and Photosynthesis",
        moduleNum: 2,
        moduleName: "Nutrition",
        orderIndex: 4,
      },
      {
        name: "Parasitism",
        moduleNum: 2,
        moduleName: "Nutrition",
        orderIndex: 5,
      },
      {
        name: "Mutualism",
        moduleNum: 2,
        moduleName: "Nutrition",
        orderIndex: 6,
      },
      {
        name: "Holozoic Nutrition",
        moduleNum: 2,
        moduleName: "Nutrition",
        orderIndex: 7,
      },
      {
        name: "Digestion in Humans",
        moduleNum: 2,
        moduleName: "Nutrition",
        orderIndex: 8,
      },
      {
        name: "Cellular Respiration",
        moduleNum: 3,
        moduleName: "Metabolism and Transport",
        orderIndex: 9,
      },
      {
        name: "Waste Products of Metabolism",
        moduleNum: 3,
        moduleName: "Metabolism and Transport",
        orderIndex: 10,
      },
      {
        name: "Gaseous Exchange",
        moduleNum: 3,
        moduleName: "Metabolism and Transport",
        orderIndex: 11,
      },
      {
        name: "Excretion and Homeostasis in Animals",
        moduleNum: 4,
        moduleName: "Homeostasis",
        orderIndex: 12,
      },
      {
        name: "Excretion and Homeostasis in Plants",
        moduleNum: 4,
        moduleName: "Homeostasis",
        orderIndex: 13,
      },
      {
        name: "Types of Reproduction",
        moduleNum: 5,
        moduleName: "Reproduction and Growth",
        orderIndex: 14,
      },
      {
        name: "Reproduction in Flowering Plants",
        moduleNum: 5,
        moduleName: "Reproduction and Growth",
        orderIndex: 15,
      },
      {
        name: "Life Cycles",
        moduleNum: 5,
        moduleName: "Reproduction and Growth",
        orderIndex: 16,
      },
      {
        name: "Reproduction in Mammals",
        moduleNum: 5,
        moduleName: "Reproduction and Growth",
        orderIndex: 17,
      },
      {
        name: "Growth and Development",
        moduleNum: 5,
        moduleName: "Reproduction and Growth",
        orderIndex: 18,
      },
      {
        name: "Ecological Concepts",
        moduleNum: 6,
        moduleName: "Ecology",
        orderIndex: 19,
      },
      {
        name: "Energy Flow in Ecosystems",
        moduleNum: 6,
        moduleName: "Ecology",
        orderIndex: 20,
      },
      {
        name: "Man and His Environment",
        moduleNum: 6,
        moduleName: "Ecology",
        orderIndex: 21,
      },
    ],
  },
];
