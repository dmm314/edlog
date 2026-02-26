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

export const MATHEMATICS_CURRICULUM: LevelData[] = [
  {
    classLevel: "Form 1",
    topics: [
      {
        name: "Numbers",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 0,
      },
      {
        name: "Natural Numbers",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 1,
      },
      {
        name: "Integers",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 2,
      },
      {
        name: "Rational Numbers",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 3,
      },
      {
        name: "Number Patterns",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 4,
      },
      {
        name: "Time and Temperature",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 5,
      },
      {
        name: "Decimals",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 6,
      },
      {
        name: "Arithmetic Processes",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 7,
      },
      {
        name: "Points and Lines",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 8,
      },
      {
        name: "Distance",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 9,
      },
      {
        name: "Circles",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 10,
      },
      {
        name: "Angles",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 11,
      },
      {
        name: "Triangles",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 12,
      },
      {
        name: "Cubes and Cuboids",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 13,
      },
      {
        name: "Cylinders and Cones",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 14,
      },
      {
        name: "Statistics",
        moduleNum: 3,
        moduleName: "Statistics",
        orderIndex: 15,
      },
      {
        name: "Coordinate Geometry",
        moduleNum: 4,
        moduleName: "Coordinate Geometry",
        orderIndex: 16,
      },
    ],
  },
  {
    classLevel: "Form 2",
    topics: [
      {
        name: "Integers",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 0,
      },
      {
        name: "Number Patterns",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 1,
      },
      {
        name: "Fractions and Decimals",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 2,
      },
      {
        name: "Real Numbers",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 3,
      },
      {
        name: "Arithmetic Processes",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 4,
      },
      {
        name: "Algebraic Expressions",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 5,
      },
      {
        name: "Equations and Inequalities",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 6,
      },
      {
        name: "Distances",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 7,
      },
      {
        name: "Angles",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 8,
      },
      {
        name: "Triangles",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 9,
      },
      {
        name: "Polygons",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 10,
      },
      {
        name: "Symmetry",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 11,
      },
      {
        name: "Circles",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 12,
      },
      {
        name: "Right Prisms",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 13,
      },
      {
        name: "Regular Pyramids",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 14,
      },
      {
        name: "Spheres",
        moduleNum: 2,
        moduleName: "Geometry",
        orderIndex: 15,
      },
      {
        name: "Coordinate Geometry",
        moduleNum: 3,
        moduleName: "Coordinate Geometry",
        orderIndex: 16,
      },
      {
        name: "Representation of Discrete Data",
        moduleNum: 4,
        moduleName: "Statistics",
        orderIndex: 17,
      },
      {
        name: "Measures of Central Tendencies",
        moduleNum: 4,
        moduleName: "Statistics",
        orderIndex: 18,
      },
    ],
  },
  {
    classLevel: "Form 3",
    topics: [
      {
        name: "Simple Algebra",
        moduleNum: 1,
        moduleName: "Algebra",
        orderIndex: 0,
      },
      {
        name: "Transposition and Variation",
        moduleNum: 1,
        moduleName: "Algebra",
        orderIndex: 1,
      },
      {
        name: "Indices and Logarithm",
        moduleNum: 1,
        moduleName: "Algebra",
        orderIndex: 2,
      },
      {
        name: "Sets",
        moduleNum: 1,
        moduleName: "Algebra",
        orderIndex: 3,
      },
      {
        name: "Trigonometry in Right Triangle",
        moduleNum: 2,
        moduleName: "Geometry and Trigonometry",
        orderIndex: 4,
      },
      {
        name: "Congruency and Similarities",
        moduleNum: 2,
        moduleName: "Geometry and Trigonometry",
        orderIndex: 5,
      },
      {
        name: "Mensuration",
        moduleNum: 2,
        moduleName: "Geometry and Trigonometry",
        orderIndex: 6,
      },
      {
        name: "Matrices",
        moduleNum: 3,
        moduleName: "Matrices and Vectors",
        orderIndex: 7,
      },
      {
        name: "Vectors in 2D",
        moduleNum: 3,
        moduleName: "Matrices and Vectors",
        orderIndex: 8,
      },
      {
        name: "Functions and Relations",
        moduleNum: 4,
        moduleName: "Functions and Relations",
        orderIndex: 9,
      },
      {
        name: "Statistics and Probability",
        moduleNum: 5,
        moduleName: "Statistics and Probability",
        orderIndex: 10,
      },
    ],
  },
  {
    classLevel: "Form 4",
    topics: [
      {
        name: "Estimation Approximation and Errors",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 0,
      },
      {
        name: "Algebraic Processes",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 1,
      },
      {
        name: "Equations and Inequations",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 2,
      },
      {
        name: "Surds Indices and Logarithms",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 3,
      },
      {
        name: "Sequences",
        moduleNum: 1,
        moduleName: "Numbers and Algebra",
        orderIndex: 4,
      },
      {
        name: "Trigonometry",
        moduleNum: 2,
        moduleName: "Geometry and Trigonometry",
        orderIndex: 5,
      },
      {
        name: "Circles and Circle Theorems",
        moduleNum: 2,
        moduleName: "Geometry and Trigonometry",
        orderIndex: 6,
      },
      {
        name: "Simple Transformations",
        moduleNum: 2,
        moduleName: "Geometry and Trigonometry",
        orderIndex: 7,
      },
      {
        name: "Networks",
        moduleNum: 2,
        moduleName: "Geometry and Trigonometry",
        orderIndex: 8,
      },
      {
        name: "Time Zones",
        moduleNum: 2,
        moduleName: "Geometry and Trigonometry",
        orderIndex: 9,
      },
      {
        name: "Matrices",
        moduleNum: 3,
        moduleName: "Matrices and Vectors",
        orderIndex: 10,
      },
      {
        name: "Vectors in 2D",
        moduleNum: 3,
        moduleName: "Matrices and Vectors",
        orderIndex: 11,
      },
    ],
  },
  {
    classLevel: "Form 5",
    topics: [
      {
        name: "Coordinate Geometry",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 0,
      },
      {
        name: "Euclidean Geometry",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 1,
      },
      {
        name: "Solid Figures",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 2,
      },
      {
        name: "Introduction to Logic",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 3,
      },
      {
        name: "Loci",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 4,
      },
      {
        name: "Geometrical Construction",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 5,
      },
      {
        name: "Statistics",
        moduleNum: 2,
        moduleName: "Statistics and Probability",
        orderIndex: 6,
      },
      {
        name: "Probability",
        moduleNum: 2,
        moduleName: "Statistics and Probability",
        orderIndex: 7,
      },
    ],
  },
];

export const ADDITIONAL_MATH_F4: LevelData[] = [
  {
    classLevel: "Form 4",
    topics: [
      {
        name: "Elementary Group Theory",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 0,
      },
      {
        name: "Quadratic Functions",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 1,
      },
      {
        name: "Surds Indices and Logarithms",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 2,
      },
      {
        name: "Absolute Value Functions",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 3,
      },
      {
        name: "Polynomials",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 4,
      },
      {
        name: "Linear Programming",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 5,
      },
      {
        name: "Sequences",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 6,
      },
      {
        name: "Vectors",
        moduleNum: 2,
        moduleName: "Vectors and Geometry",
        orderIndex: 7,
      },
      {
        name: "Transformations",
        moduleNum: 2,
        moduleName: "Vectors and Geometry",
        orderIndex: 8,
      },
      {
        name: "Coordinate Geometry",
        moduleNum: 2,
        moduleName: "Vectors and Geometry",
        orderIndex: 9,
      },
    ],
  },
];

export const ADDITIONAL_MATH_F5: LevelData[] = [
  {
    classLevel: "Form 5",
    topics: [
      {
        name: "Permutations Combinations and Binomial Theorem",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 0,
      },
      {
        name: "Circular Measure and Trigonometry",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 1,
      },
      {
        name: "Differentiation",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 2,
      },
      {
        name: "Integration",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 3,
      },
      {
        name: "Application of Calculus",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 4,
      },
      {
        name: "Descriptive Statistics",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 5,
      },
      {
        name: "Probability",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 6,
      },
      {
        name: "Elementary Discrete Probability Distributions",
        moduleNum: 1,
        moduleName: "Pure Mathematics",
        orderIndex: 7,
      },
      {
        name: "Forces",
        moduleNum: 2,
        moduleName: "Mechanics",
        orderIndex: 8,
      },
      {
        name: "Dynamics",
        moduleNum: 2,
        moduleName: "Mechanics",
        orderIndex: 9,
      },
      {
        name: "Work Energy and Power",
        moduleNum: 2,
        moduleName: "Mechanics",
        orderIndex: 10,
      },
    ],
  },
];

export const PURE_MATH_LS: LevelData[] = [
  {
    classLevel: "Lower Sixth",
    topics: [
      {
        name: "Theory of Quadratic Functions",
        moduleNum: 1,
        moduleName: "Foundations",
        orderIndex: 0,
      },
      {
        name: "Equations and Inequalities",
        moduleNum: 1,
        moduleName: "Foundations",
        orderIndex: 1,
      },
      {
        name: "Absolute Value Functions",
        moduleNum: 1,
        moduleName: "Foundations",
        orderIndex: 2,
      },
      {
        name: "Polynomials",
        moduleNum: 1,
        moduleName: "Foundations",
        orderIndex: 3,
      },
      {
        name: "Rational Polynomial Functions",
        moduleNum: 1,
        moduleName: "Foundations",
        orderIndex: 4,
      },
      {
        name: "Mathematical Statements Logic and Proofs",
        moduleNum: 1,
        moduleName: "Foundations",
        orderIndex: 5,
      },
      {
        name: "Binomial Expansions",
        moduleNum: 1,
        moduleName: "Foundations",
        orderIndex: 6,
      },
      {
        name: "Binary Relations and Functions",
        moduleNum: 1,
        moduleName: "Foundations",
        orderIndex: 7,
      },
      {
        name: "Indices Surds and Logarithms",
        moduleNum: 2,
        moduleName: "Number Systems and Counting",
        orderIndex: 8,
      },
      {
        name: "Sequences and Series",
        moduleNum: 2,
        moduleName: "Number Systems and Counting",
        orderIndex: 9,
      },
      {
        name: "Sets and Representation",
        moduleNum: 2,
        moduleName: "Number Systems and Counting",
        orderIndex: 10,
      },
      {
        name: "Permutations and Combinations",
        moduleNum: 2,
        moduleName: "Number Systems and Counting",
        orderIndex: 11,
      },
      {
        name: "Circular Functions",
        moduleNum: 3,
        moduleName: "Functions and Calculus",
        orderIndex: 12,
      },
      {
        name: "Coordinate Geometry",
        moduleNum: 3,
        moduleName: "Functions and Calculus",
        orderIndex: 13,
      },
      {
        name: "Matrices",
        moduleNum: 3,
        moduleName: "Functions and Calculus",
        orderIndex: 14,
      },
      {
        name: "Vectors",
        moduleNum: 3,
        moduleName: "Functions and Calculus",
        orderIndex: 15,
      },
      {
        name: "Calculus 1 — Limits and Differentiation",
        moduleNum: 3,
        moduleName: "Functions and Calculus",
        orderIndex: 16,
      },
      {
        name: "Application of Differentiation",
        moduleNum: 3,
        moduleName: "Functions and Calculus",
        orderIndex: 17,
      },
      {
        name: "Integration",
        moduleNum: 3,
        moduleName: "Functions and Calculus",
        orderIndex: 18,
      },
    ],
  },
];

export const FURTHER_MATH_LS: LevelData[] = [
  {
    classLevel: "Lower Sixth",
    topics: [
      {
        name: "Division and Euclidean Algorithms",
        moduleNum: 1,
        moduleName: "Number Theory and Algebra",
        orderIndex: 0,
      },
      {
        name: "Further Partial Fractions",
        moduleNum: 1,
        moduleName: "Number Theory and Algebra",
        orderIndex: 1,
      },
      {
        name: "Polynomials",
        moduleNum: 1,
        moduleName: "Number Theory and Algebra",
        orderIndex: 2,
      },
      {
        name: "Mathematical Reasoning and Proofs",
        moduleNum: 2,
        moduleName: "Logic and Structures",
        orderIndex: 3,
      },
      {
        name: "Algebraic Structures",
        moduleNum: 2,
        moduleName: "Logic and Structures",
        orderIndex: 4,
      },
      {
        name: "Limits Continuity and Differentiability",
        moduleNum: 3,
        moduleName: "Analysis and Geometry",
        orderIndex: 5,
      },
      {
        name: "Sequences and Series",
        moduleNum: 3,
        moduleName: "Analysis and Geometry",
        orderIndex: 6,
      },
      {
        name: "Polar Coordinates",
        moduleNum: 3,
        moduleName: "Analysis and Geometry",
        orderIndex: 7,
      },
      {
        name: "Further Coordinate Geometry",
        moduleNum: 3,
        moduleName: "Analysis and Geometry",
        orderIndex: 8,
      },
      {
        name: "Matrices",
        moduleNum: 4,
        moduleName: "Linear Algebra",
        orderIndex: 9,
      },
      {
        name: "Vector Space",
        moduleNum: 4,
        moduleName: "Linear Algebra",
        orderIndex: 10,
      },
    ],
  },
];

export const PURE_MATH_US: LevelData[] = [
  {
    classLevel: "Upper Sixth",
    topics: [
      {
        name: "Circle Geometry",
        moduleNum: 4,
        moduleName: "Advanced Topics",
        orderIndex: 0,
      },
      {
        name: "Complex Numbers",
        moduleNum: 4,
        moduleName: "Advanced Topics",
        orderIndex: 1,
      },
      {
        name: "Vectors",
        moduleNum: 4,
        moduleName: "Advanced Topics",
        orderIndex: 2,
      },
      {
        name: "Integration",
        moduleNum: 4,
        moduleName: "Advanced Topics",
        orderIndex: 3,
      },
      {
        name: "First Order Differential Equations",
        moduleNum: 4,
        moduleName: "Advanced Topics",
        orderIndex: 4,
      },
      {
        name: "Location of Roots",
        moduleNum: 4,
        moduleName: "Advanced Topics",
        orderIndex: 5,
      },
      {
        name: "Curve Sketching",
        moduleNum: 4,
        moduleName: "Advanced Topics",
        orderIndex: 6,
      },
    ],
  },
];

export const STATISTICS_US: LevelData[] = [
  {
    classLevel: "Upper Sixth",
    topics: [
      {
        name: "Descriptive Statistics",
        moduleNum: 5,
        moduleName: "Descriptive Statistics",
        orderIndex: 0,
      },
      {
        name: "Regression and Correlation",
        moduleNum: 5,
        moduleName: "Descriptive Statistics",
        orderIndex: 1,
      },
      {
        name: "Elementary Probability",
        moduleNum: 6,
        moduleName: "Probability",
        orderIndex: 2,
      },
      {
        name: "Random Variables",
        moduleNum: 6,
        moduleName: "Probability",
        orderIndex: 3,
      },
      {
        name: "Special Discrete Distributions",
        moduleNum: 6,
        moduleName: "Probability",
        orderIndex: 4,
      },
      {
        name: "Continuous Random Variables",
        moduleNum: 7,
        moduleName: "Inference",
        orderIndex: 5,
      },
      {
        name: "Special Continuous Distributions",
        moduleNum: 7,
        moduleName: "Inference",
        orderIndex: 6,
      },
      {
        name: "Sampling and Estimation",
        moduleNum: 7,
        moduleName: "Inference",
        orderIndex: 7,
      },
      {
        name: "Hypothesis Testing",
        moduleNum: 7,
        moduleName: "Inference",
        orderIndex: 8,
      },
    ],
  },
];

export const MECHANICS_US: LevelData[] = [
  {
    classLevel: "Upper Sixth",
    topics: [
      {
        name: "Applications of Vectors in Mechanics",
        moduleNum: 5,
        moduleName: "Vectors and Kinematics",
        orderIndex: 0,
      },
      {
        name: "Kinematics in Straight Line",
        moduleNum: 5,
        moduleName: "Vectors and Kinematics",
        orderIndex: 1,
      },
      {
        name: "Velocity and Acceleration as Vectors",
        moduleNum: 5,
        moduleName: "Vectors and Kinematics",
        orderIndex: 2,
      },
      {
        name: "Kinematics in a Plane",
        moduleNum: 6,
        moduleName: "Motion and Forces",
        orderIndex: 3,
      },
      {
        name: "Motion in a Circle",
        moduleNum: 6,
        moduleName: "Motion and Forces",
        orderIndex: 4,
      },
      {
        name: "Centre of Mass",
        moduleNum: 6,
        moduleName: "Motion and Forces",
        orderIndex: 5,
      },
      {
        name: "Equilibrium",
        moduleNum: 6,
        moduleName: "Motion and Forces",
        orderIndex: 6,
      },
      {
        name: "Work Energy and Power",
        moduleNum: 6,
        moduleName: "Motion and Forces",
        orderIndex: 7,
      },
      {
        name: "Newton's Laws",
        moduleNum: 7,
        moduleName: "Dynamics",
        orderIndex: 8,
      },
      {
        name: "Connected Particles",
        moduleNum: 7,
        moduleName: "Dynamics",
        orderIndex: 9,
      },
      {
        name: "Momentum as a Vector",
        moduleNum: 7,
        moduleName: "Dynamics",
        orderIndex: 10,
      },
      {
        name: "Elementary Probability",
        moduleNum: 7,
        moduleName: "Dynamics",
        orderIndex: 11,
      },
    ],
  },
];

export const FURTHER_MATH_US: LevelData[] = [
  {
    classLevel: "Upper Sixth",
    topics: [
      {
        name: "Hyperbolic Functions",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 0,
      },
      {
        name: "Further Complex Numbers",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 1,
      },
      {
        name: "Plane Transformations",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 2,
      },
      {
        name: "Further Integration",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 3,
      },
      {
        name: "Applications of Definite Integrals",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 4,
      },
      {
        name: "Differential Equations",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 5,
      },
      {
        name: "Further Curve Sketching",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 6,
      },
      {
        name: "Modelling with Differential Equations",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 7,
      },
      {
        name: "SHM and Damped Harmonic Motion",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 8,
      },
      {
        name: "Numerical Methods",
        moduleNum: 6,
        moduleName: "Analysis",
        orderIndex: 9,
      },
      {
        name: "Motion in 2D",
        moduleNum: 7,
        moduleName: "Applied",
        orderIndex: 10,
      },
      {
        name: "Oblique Impact",
        moduleNum: 7,
        moduleName: "Applied",
        orderIndex: 11,
      },
      {
        name: "Linear Transformation",
        moduleNum: 7,
        moduleName: "Applied",
        orderIndex: 12,
      },
      {
        name: "Vector Product",
        moduleNum: 7,
        moduleName: "Applied",
        orderIndex: 13,
      },
      {
        name: "Scalar and Vector Products",
        moduleNum: 7,
        moduleName: "Applied",
        orderIndex: 14,
      },
      {
        name: "Rotational Dynamics",
        moduleNum: 7,
        moduleName: "Applied",
        orderIndex: 15,
      },
      {
        name: "Discrete Random Variables",
        moduleNum: 8,
        moduleName: "Statistics",
        orderIndex: 16,
      },
      {
        name: "Special Continuous Distributions",
        moduleNum: 8,
        moduleName: "Statistics",
        orderIndex: 17,
      },
      {
        name: "Continuous Random Variables",
        moduleNum: 8,
        moduleName: "Statistics",
        orderIndex: 18,
      },
      {
        name: "Sampling and Estimation",
        moduleNum: 9,
        moduleName: "Inference",
        orderIndex: 19,
      },
      {
        name: "Hypothesis Testing",
        moduleNum: 9,
        moduleName: "Inference",
        orderIndex: 20,
      },
    ],
  },
];
