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

export const CS_CURRICULUM: LevelData[] = [
  {
    classLevel: "Form 1",
    topics: [
      {
        name: "The Computing Environment",
        moduleNum: 1,
        moduleName: "The Computing Environment",
        orderIndex: 0,
      },
      {
        name: "Word Processing",
        moduleNum: 2,
        moduleName: "Word Processing",
        orderIndex: 1,
      },
      {
        name: "Spreadsheets",
        moduleNum: 3,
        moduleName: "Spreadsheets",
        orderIndex: 2,
      },
      {
        name: "The Internet",
        moduleNum: 4,
        moduleName: "The Internet",
        orderIndex: 3,
      },
    ],
  },
  {
    classLevel: "Form 2",
    topics: [
      {
        name: "Computer Maintenance",
        moduleNum: 1,
        moduleName: "Computer Maintenance",
        orderIndex: 0,
      },
      {
        name: "Word Processing Advanced",
        moduleNum: 2,
        moduleName: "Word Processing Advanced",
        orderIndex: 1,
      },
      {
        name: "Spreadsheets Intermediate",
        moduleNum: 3,
        moduleName: "Spreadsheets Intermediate",
        orderIndex: 2,
      },
      {
        name: "The Internet Intermediate",
        moduleNum: 4,
        moduleName: "The Internet Intermediate",
        orderIndex: 3,
      },
      {
        name: "Introduction to Algorithms and Programming",
        moduleNum: 5,
        moduleName: "Introduction to Algorithms and Programming",
        orderIndex: 4,
      },
    ],
  },
  {
    classLevel: "Form 3",
    topics: [
      {
        name: "Introduction to DBMS",
        moduleNum: 1,
        moduleName: "Introduction to DBMS",
        orderIndex: 0,
      },
      {
        name: "Computer Networks",
        moduleNum: 2,
        moduleName: "Computer Networks",
        orderIndex: 1,
      },
      {
        name: "Spreadsheet Advanced",
        moduleNum: 3,
        moduleName: "Spreadsheet Advanced",
        orderIndex: 2,
      },
      {
        name: "Web Design",
        moduleNum: 4,
        moduleName: "Web Design",
        orderIndex: 3,
      },
      {
        name: "Introduction to Programming",
        moduleNum: 5,
        moduleName: "Introduction to Programming",
        orderIndex: 4,
      },
    ],
  },
  {
    classLevel: "Form 4",
    topics: [
      {
        name: "Introduction to Information Systems",
        moduleNum: 1,
        moduleName: "Introduction to Information Systems",
        orderIndex: 0,
      },
      {
        name: "Database Management Systems",
        moduleNum: 2,
        moduleName: "Database Management Systems",
        orderIndex: 1,
      },
      {
        name: "Computer Networks",
        moduleNum: 3,
        moduleName: "Computer Networks",
        orderIndex: 2,
      },
      {
        name: "Programming with Visual Basic",
        moduleNum: 4,
        moduleName: "Programming with Visual Basic",
        orderIndex: 3,
      },
    ],
  },
  {
    classLevel: "Form 5",
    topics: [
      {
        name: "Information Systems",
        moduleNum: 1,
        moduleName: "Information Systems",
        orderIndex: 0,
      },
      {
        name: "Database Management Systems",
        moduleNum: 2,
        moduleName: "Database Management Systems",
        orderIndex: 1,
      },
      {
        name: "Computer Networks",
        moduleNum: 3,
        moduleName: "Computer Networks",
        orderIndex: 2,
      },
      {
        name: "Object-Oriented Programming with C++",
        moduleNum: 4,
        moduleName: "Object-Oriented Programming with C++",
        orderIndex: 3,
      },
    ],
  },
  {
    classLevel: "Lower Sixth",
    topics: [
      {
        name: "Computer Systems",
        moduleNum: 1,
        moduleName: "Computer Systems",
        orderIndex: 0,
      },
      {
        name: "Algorithmics and Programming",
        moduleNum: 2,
        moduleName: "Algorithmics and Programming",
        orderIndex: 1,
      },
      {
        name: "Structured Data",
        moduleNum: 3,
        moduleName: "Structured Data",
        orderIndex: 2,
      },
    ],
  },
  {
    classLevel: "Upper Sixth",
    topics: [
      {
        name: "Software Engineering",
        moduleNum: 1,
        moduleName: "Software Engineering",
        orderIndex: 0,
      },
      {
        name: "Information Systems",
        moduleNum: 2,
        moduleName: "Information Systems",
        orderIndex: 1,
      },
      {
        name: "Web Technology",
        moduleNum: 3,
        moduleName: "Web Technology",
        orderIndex: 2,
      },
      {
        name: "Databases",
        moduleNum: 4,
        moduleName: "Databases",
        orderIndex: 3,
      },
    ],
  },
];
