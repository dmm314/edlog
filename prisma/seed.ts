import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── RPI Board ──────────────────────────────────────────
  const rpiBoard = await prisma.rPIBoard.create({
    data: {
      name: "RPI Board — Centre Region",
      region: "Centre",
    },
  });

  // ── School ─────────────────────────────────────────────
  const school = await prisma.school.create({
    data: {
      name: "Lycée Bilingue de Yaoundé",
      code: "LBY-001",
      town: "Yaoundé",
      region: "Centre",
      rpiBoardId: rpiBoard.id,
    },
  });

  // ── Admin User ─────────────────────────────────────────
  const adminPassword = await hash("edlog2025", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@edlog.cm",
      passwordHash: adminPassword,
      firstName: "Brayan",
      lastName: "Lontchi",
      role: "SCHOOL_ADMIN",
      isVerified: true,
      schoolId: school.id,
    },
  });

  await prisma.school.update({
    where: { id: school.id },
    data: { adminId: admin.id },
  });

  // ── Demo Teacher ───────────────────────────────────────
  const teacherPassword = await hash("edlog2025", 12);
  const teacher = await prisma.user.create({
    data: {
      email: "teacher@edlog.cm",
      passwordHash: teacherPassword,
      firstName: "Darren",
      lastName: "Monyongo",
      role: "TEACHER",
      isVerified: true,
      schoolId: school.id,
    },
  });

  // ── Classes (year 2025) ────────────────────────────────
  const classesData = [
    { name: "Form 5 Science A", level: "Form 5", stream: "Science", section: "A" },
    { name: "Form 5 Science B", level: "Form 5", stream: "Science", section: "B" },
    { name: "Form 5 Arts", level: "Form 5", stream: "Arts", section: null },
    { name: "Lower Sixth Science", level: "Lower Sixth", stream: "Science", section: null },
    { name: "Lower Sixth Arts", level: "Lower Sixth", stream: "Arts", section: null },
    { name: "Upper Sixth Science", level: "Upper Sixth", stream: "Science", section: null },
    { name: "Upper Sixth Arts", level: "Upper Sixth", stream: "Arts", section: null },
  ];

  const classes: Record<string, string> = {};
  for (const c of classesData) {
    const created = await prisma.class.create({
      data: { ...c, year: 2025, schoolId: school.id },
    });
    classes[c.name] = created.id;
  }

  // ── Subjects & Topics ─────────────────────────────────

  interface TopicDef {
    moduleName: string;
    topics: string[];
  }

  interface SubjectDef {
    name: string;
    code: string;
    category: string;
    modules: TopicDef[];
  }

  const subjectsData: SubjectDef[] = [
    {
      name: "Physics",
      code: "PHY",
      category: "Science",
      modules: [
        {
          moduleName: "Mechanics",
          topics: [
            "Kinematics",
            "Newton's Laws of Motion",
            "Work Energy & Power",
            "Momentum & Collisions",
          ],
        },
        { moduleName: "Rotational Mechanics", topics: ["Circular Motion"] },
        { moduleName: "Fields", topics: ["Gravitational Fields"] },
        {
          moduleName: "Electricity",
          topics: [
            "Electric Fields",
            "Current Electricity",
            "Electromagnetic Induction",
          ],
        },
        { moduleName: "Waves & Optics", topics: ["Wave Motion", "Light & Optics"] },
        { moduleName: "Thermal Physics", topics: ["Thermal Physics"] },
        {
          moduleName: "Modern Physics",
          topics: ["Nuclear Physics", "Radioactivity"],
        },
      ],
    },
    {
      name: "Mathematics",
      code: "MAT",
      category: "Science",
      modules: [
        {
          moduleName: "Pure Mathematics",
          topics: [
            "Algebra & Polynomials",
            "Trigonometry",
            "Coordinate Geometry",
            "Sequences & Series",
          ],
        },
        { moduleName: "Calculus", topics: ["Differentiation", "Integration"] },
        { moduleName: "Vectors & Mechanics", topics: ["Vectors"] },
        { moduleName: "Statistics", topics: ["Statistics & Probability"] },
        { moduleName: "Applied Mathematics", topics: ["Mechanics"] },
      ],
    },
    {
      name: "Chemistry",
      code: "CHE",
      category: "Science",
      modules: [
        {
          moduleName: "Physical Chemistry",
          topics: [
            "Atomic Structure",
            "Chemical Bonding",
            "Stoichiometry",
            "Energetics & Thermochemistry",
            "Reaction Kinetics",
            "Chemical Equilibrium",
            "Electrochemistry",
          ],
        },
        {
          moduleName: "Organic Chemistry",
          topics: ["Hydrocarbons", "Functional Groups"],
        },
        {
          moduleName: "Inorganic Chemistry",
          topics: ["Periodic Table & Trends"],
        },
      ],
    },
    {
      name: "Further Mathematics",
      code: "FMA",
      category: "Science",
      modules: [
        {
          moduleName: "Pure Mathematics",
          topics: [
            "Complex Numbers",
            "Matrices & Transformations",
            "Proof & Logic",
            "Hyperbolic Functions",
          ],
        },
        { moduleName: "Calculus", topics: ["Differential Equations"] },
        { moduleName: "Applied", topics: ["Numerical Methods"] },
      ],
    },
    {
      name: "Computer Science",
      code: "CSC",
      category: "Science",
      modules: [
        { moduleName: "Fundamentals", topics: ["Data Representation"] },
        { moduleName: "Programming", topics: ["Programming Concepts"] },
        {
          moduleName: "Computer Science",
          topics: ["Algorithms & Data Structures"],
        },
        { moduleName: "Hardware", topics: ["Computer Architecture"] },
        { moduleName: "Networks", topics: ["Networking"] },
        { moduleName: "Data Management", topics: ["Databases"] },
      ],
    },
    {
      name: "English Language",
      code: "ENG",
      category: "Language",
      modules: [
        { moduleName: "Reading", topics: ["Comprehension & Summary"] },
        { moduleName: "Writing", topics: ["Essay Writing"] },
        { moduleName: "Language", topics: ["Grammar & Usage"] },
        { moduleName: "Literature", topics: ["Prose", "Poetry", "Drama"] },
      ],
    },
    {
      name: "French",
      code: "FRE",
      category: "Language",
      modules: [
        { moduleName: "Lecture", topics: ["Compréhension écrite"] },
        { moduleName: "Écriture", topics: ["Expression écrite"] },
        { moduleName: "Langue", topics: ["Grammaire"] },
        { moduleName: "Oral", topics: ["Compréhension orale"] },
        { moduleName: "Littérature", topics: ["Littérature"] },
      ],
    },
  ];

  const subjectIds: Record<string, string> = {};
  const topicIds: Record<string, string> = {};
  let orderIdx = 0;

  for (const subjectDef of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        name: subjectDef.name,
        code: subjectDef.code,
        category: subjectDef.category,
      },
    });
    subjectIds[subjectDef.name] = subject.id;

    let moduleNum = 1;
    for (const mod of subjectDef.modules) {
      for (const topicName of mod.topics) {
        const topic = await prisma.topic.create({
          data: {
            name: topicName,
            moduleName: mod.moduleName,
            moduleNum,
            orderIndex: orderIdx++,
            subjectId: subject.id,
          },
        });
        topicIds[`${subjectDef.name}:${topicName}`] = topic.id;
      }
      moduleNum++;
    }

    // Link subject to school
    await prisma.schoolSubject.create({
      data: {
        schoolId: school.id,
        subjectId: subject.id,
      },
    });
  }

  // ── Sample Logbook Entries ─────────────────────────────
  const now = new Date();
  const entries = [
    {
      daysAgo: 1,
      subject: "Physics",
      topic: "Kinematics",
      className: "Form 5 Science A",
      period: 2,
      notes: "Covered equations of motion for uniformly accelerated bodies. Students practiced with numerical examples.",
      objectives: "Students can derive and apply the three equations of motion",
    },
    {
      daysAgo: 2,
      subject: "Physics",
      topic: "Newton's Laws of Motion",
      className: "Form 5 Science B",
      period: 1,
      notes: "Introduced Newton's three laws. Demonstrated with practical examples using weights and pulleys.",
      objectives: "Students understand and can state Newton's three laws",
    },
    {
      daysAgo: 3,
      subject: "Mathematics",
      topic: "Differentiation",
      className: "Lower Sixth Science",
      period: 3,
      notes: "Taught differentiation from first principles. Moved to power rule and sum rule.",
      objectives: "Students can differentiate polynomial functions",
    },
    {
      daysAgo: 4,
      subject: "Chemistry",
      topic: "Atomic Structure",
      className: "Form 5 Science A",
      period: 4,
      notes: "Electronic configuration and quantum numbers. Students drew orbital diagrams.",
      objectives: "Students can write electronic configurations for elements 1-36",
    },
    {
      daysAgo: 5,
      subject: "Physics",
      topic: "Work Energy & Power",
      className: "Upper Sixth Science",
      period: 2,
      notes: "Work-energy theorem and conservation of mechanical energy. Solved past GCE questions.",
      objectives: "Students can apply the work-energy theorem to solve problems",
    },
    {
      daysAgo: 7,
      subject: "Mathematics",
      topic: "Trigonometry",
      className: "Form 5 Science A",
      period: 5,
      notes: "Trigonometric identities and solving trig equations in a given range.",
      objectives: "Students can prove simple trig identities and solve equations",
    },
    {
      daysAgo: 8,
      subject: "Computer Science",
      topic: "Programming Concepts",
      className: "Lower Sixth Science",
      period: 1,
      notes: "Introduction to loops and conditional statements. Wrote basic programs in Python.",
      objectives: "Students can write programs using for loops and if statements",
    },
    {
      daysAgo: 10,
      subject: "Physics",
      topic: "Wave Motion",
      className: "Form 5 Science B",
      period: 3,
      notes: "Properties of waves: frequency, wavelength, amplitude. Distinction between transverse and longitudinal.",
      objectives: "Students can describe wave properties and classify wave types",
    },
    {
      daysAgo: 12,
      subject: "Chemistry",
      topic: "Chemical Bonding",
      className: "Form 5 Science A",
      period: 2,
      notes: "Ionic and covalent bonding. Drew Lewis dot structures for common molecules.",
      objectives: "Students can explain ionic and covalent bonding with examples",
    },
    {
      daysAgo: 13,
      subject: "Mathematics",
      topic: "Integration",
      className: "Upper Sixth Science",
      period: 4,
      notes: "Definite integrals and area under curves. Applied to find areas between curves.",
      objectives: "Students can evaluate definite integrals and compute areas",
    },
  ];

  for (const entry of entries) {
    const entryDate = new Date(now);
    entryDate.setDate(entryDate.getDate() - entry.daysAgo);
    entryDate.setHours(8, 0, 0, 0);

    await prisma.logbookEntry.create({
      data: {
        date: entryDate,
        period: entry.period,
        duration: 60,
        notes: entry.notes,
        objectives: entry.objectives,
        status: "SUBMITTED",
        teacherId: teacher.id,
        classId: classes[entry.className],
        topicId: topicIds[`${entry.subject}:${entry.topic}`],
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log(`  - 1 RPI Board`);
  console.log(`  - 1 School (code: LBY-001)`);
  console.log(`  - 1 Admin (admin@edlog.cm / edlog2025)`);
  console.log(`  - 1 Teacher (teacher@edlog.cm / edlog2025)`);
  console.log(`  - ${classesData.length} Classes`);
  console.log(`  - ${subjectsData.length} Subjects with topics`);
  console.log(`  - ${entries.length} Sample entries`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
