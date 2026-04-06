// ============================================================
// DEVELOPMENT/TESTING ONLY — NOT FOR PRODUCTION
//
// This file contains demo data (school, teachers, classes,
// timetable, sample entries) for local development and testing.
// It is NOT imported by the production seed (prisma/seed.ts).
// Never run this in production environments.
// ============================================================

// Demo school, teachers, classes, timetable, and sample entries

export const DEMO_SCHOOL = {
  name: "Lycée Bilingue de Buea",
  schoolType: "GBHS",
  principalName: "Dr. Emmanuel Tabi",
  principalPhone: "+237670000001",
  regionCode: "SW",
  divisionName: "Fako",
};

export const DEMO_ADMIN = {
  email: "admin@edlog.cm",
  password: "EdLog2026!",
  firstName: "Admin",
  lastName: "Buea",
  role: "SCHOOL_ADMIN" as const,
};

export const DEMO_TEACHERS = [
  {
    email: "darren@edlog.cm",
    password: "EdLog2026!",
    firstName: "Darren",
    lastName: "Monyongo",
    subjects: [
      { code: "PHY", classNames: ["Form 3A", "Form 5A (Science)", "Upper Sixth Science A"] },
      { code: "FMA", classNames: ["Upper Sixth Science A"] },
    ],
  },
  {
    email: "brayan@edlog.cm",
    password: "EdLog2026!",
    firstName: "Brayan",
    lastName: "Lontchi",
    subjects: [
      { code: "CHE", classNames: ["Form 4A (Science)", "Lower Sixth Science A"] },
      { code: "BIO", classNames: ["Lower Sixth Science A", "Upper Sixth Science B"] },
    ],
  },
];

export const DEMO_CLASSES = [
  // Form 1
  { name: "Form 1A", abbreviation: "F1A", level: "Form 1", stream: "General", section: "A" },
  { name: "Form 1B", abbreviation: "F1B", level: "Form 1", stream: "General", section: "B" },
  // Form 2
  { name: "Form 2A", abbreviation: "F2A", level: "Form 2", stream: "General", section: "A" },
  { name: "Form 2B", abbreviation: "F2B", level: "Form 2", stream: "General", section: "B" },
  // Form 3
  { name: "Form 3A", abbreviation: "F3A", level: "Form 3", stream: "General", section: "A" },
  { name: "Form 3B", abbreviation: "F3B", level: "Form 3", stream: "General", section: "B" },
  // Form 4
  { name: "Form 4A (Science)", abbreviation: "F4A", level: "Form 4", stream: "Science", section: "A" },
  { name: "Form 4B (Arts)", abbreviation: "F4B", level: "Form 4", stream: "Arts", section: "B" },
  // Form 5
  { name: "Form 5A (Science)", abbreviation: "F5A", level: "Form 5", stream: "Science", section: "A" },
  // Lower Sixth
  { name: "Lower Sixth Science A", abbreviation: "LSSA", level: "Lower Sixth", stream: "Science", section: "A" },
  { name: "Lower Sixth Science B", abbreviation: "LSSB", level: "Lower Sixth", stream: "Science", section: "B" },
  { name: "Lower Sixth Arts A", abbreviation: "LSAA", level: "Lower Sixth", stream: "Arts", section: "A" },
  // Upper Sixth
  { name: "Upper Sixth Science A", abbreviation: "USSA", level: "Upper Sixth", stream: "Science", section: "A" },
  { name: "Upper Sixth Science B", abbreviation: "USSB", level: "Upper Sixth", stream: "Science", section: "B" },
  { name: "Upper Sixth Arts A", abbreviation: "USAA", level: "Upper Sixth", stream: "Arts", section: "A" },
];

export const DEFAULT_PERIOD_SCHEDULE = [
  { periodNum: 1, label: "Period 1", startTime: "07:30", endTime: "08:30" },
  { periodNum: 2, label: "Period 2", startTime: "08:30", endTime: "09:30" },
  { periodNum: 3, label: "Period 3", startTime: "09:45", endTime: "10:45" },
  { periodNum: 4, label: "Period 4", startTime: "10:45", endTime: "11:45" },
  { periodNum: 5, label: "Period 5", startTime: "12:30", endTime: "13:30" },
  { periodNum: 6, label: "Period 6", startTime: "13:30", endTime: "14:30" },
  { periodNum: 7, label: "Period 7", startTime: "14:45", endTime: "15:45" },
  { periodNum: 8, label: "Period 8", startTime: "15:45", endTime: "16:45" },
];

// Sample timetable: [teacherEmail, className, subjectCode, dayOfWeek, periodNum]
export const DEMO_TIMETABLE: [string, string, string, number, number][] = [
  // Darren — Physics
  ["darren@edlog.cm", "Form 3A", "PHY", 1, 1],    // Mon P1
  ["darren@edlog.cm", "Form 3A", "PHY", 3, 2],    // Wed P2
  ["darren@edlog.cm", "Form 5A (Science)", "PHY", 1, 3],  // Mon P3
  ["darren@edlog.cm", "Form 5A (Science)", "PHY", 4, 1],  // Thu P1
  ["darren@edlog.cm", "Upper Sixth Science A", "PHY", 2, 1], // Tue P1
  ["darren@edlog.cm", "Upper Sixth Science A", "PHY", 5, 2], // Fri P2
  // Darren — Further Math
  ["darren@edlog.cm", "Upper Sixth Science A", "FMA", 3, 1], // Wed P1
  ["darren@edlog.cm", "Upper Sixth Science A", "FMA", 5, 3], // Fri P3
  // Brayan — Chemistry
  ["brayan@edlog.cm", "Form 4A (Science)", "CHE", 1, 2],  // Mon P2
  ["brayan@edlog.cm", "Form 4A (Science)", "CHE", 3, 3],  // Wed P3
  ["brayan@edlog.cm", "Lower Sixth Science A", "CHE", 2, 2], // Tue P2
  ["brayan@edlog.cm", "Lower Sixth Science A", "CHE", 4, 3], // Thu P3
  // Brayan — Biology
  ["brayan@edlog.cm", "Lower Sixth Science A", "BIO", 1, 4], // Mon P4
  ["brayan@edlog.cm", "Lower Sixth Science A", "BIO", 3, 4], // Wed P4
  ["brayan@edlog.cm", "Upper Sixth Science B", "BIO", 2, 3], // Tue P3
  ["brayan@edlog.cm", "Upper Sixth Science B", "BIO", 5, 1], // Fri P1
];

// Sample logbook entries: spread across last 2 weeks
export const DEMO_ENTRIES = [
  { teacherEmail: "darren@edlog.cm", className: "Form 3A", subjectCode: "PHY", daysAgo: 1, period: 1, moduleName: "Introduction to Mechanics", topicNames: ["Definitions examples and units of physical quantities", "Scalar and vector quantities"], notes: "Introduced physical quantities and SI units. Students practiced identifying scalar vs vector quantities.", objectives: "Students can distinguish scalar and vector quantities", engagement: "HIGH" as const, attendance: 42 },
  { teacherEmail: "darren@edlog.cm", className: "Form 5A (Science)", subjectCode: "PHY", daysAgo: 1, period: 3, moduleName: "Fields – Magnetic Fields and Their Effects", topicNames: ["Introduction to magnetism", "Law of magnetism"], notes: "Covered magnetic properties and laws. Demonstrated attraction/repulsion with bar magnets.", objectives: "Students understand fundamental laws of magnetism", engagement: "HIGH" as const, attendance: 38 },
  { teacherEmail: "darren@edlog.cm", className: "Upper Sixth Science A", subjectCode: "PHY", daysAgo: 2, period: 1, moduleName: "Field Phenomena", topicNames: ["Newton's law of universal gravitation", "Kepler's laws"], notes: "Derived gravitational force equation. Discussed Kepler's three laws with planetary examples.", objectives: "Students can apply Newton's law of gravitation", engagement: "MEDIUM" as const, attendance: 35 },
  { teacherEmail: "darren@edlog.cm", className: "Form 3A", subjectCode: "PHY", daysAgo: 3, period: 2, moduleName: "Introduction to Mechanics", topicNames: ["Prefixes and standard form", "Basic equipment in force study"], notes: "Covered metric prefixes (nano to giga) and standard form notation. Showed force measurement equipment.", objectives: "Students can convert between SI prefixes and use standard form", engagement: "MEDIUM" as const, attendance: 40 },
  { teacherEmail: "darren@edlog.cm", className: "Upper Sixth Science A", subjectCode: "FMA", daysAgo: 3, period: 1, moduleName: "Analysis", topicNames: ["Hyperbolic Functions"], notes: "Introduced sinh, cosh, tanh and their properties. Derived identities from exponential definitions.", objectives: "Students can define and manipulate hyperbolic functions", engagement: "LOW" as const, attendance: 33 },
  { teacherEmail: "brayan@edlog.cm", className: "Form 4A (Science)", subjectCode: "CHE", daysAgo: 1, period: 2, moduleName: "Elements Compounds and Organic Chemistry", topicNames: ["Sulphur"], notes: "Properties and allotropes of sulphur. Demonstrated monoclinic and rhombic sulphur.", objectives: "Students can describe properties and allotropes of sulphur", engagement: "HIGH" as const, attendance: 44 },
  { teacherEmail: "brayan@edlog.cm", className: "Lower Sixth Science A", subjectCode: "CHE", daysAgo: 2, period: 2, moduleName: "Fundamental Chemistry", topicNames: ["Mole Concept"], notes: "Introduced Avogadro's number and molar mass. Worked through calculation exercises.", objectives: "Students can calculate amount of substance in moles", engagement: "MEDIUM" as const, attendance: 36 },
  { teacherEmail: "brayan@edlog.cm", className: "Lower Sixth Science A", subjectCode: "BIO", daysAgo: 1, period: 4, moduleName: "Cell Biology Foundations", topicNames: ["Microscopy", "Introduction to Cell"], notes: "Light vs electron microscopy. Introduced cell theory and basic cell components.", objectives: "Students can compare light and electron microscopes", engagement: "HIGH" as const, attendance: 37 },
  { teacherEmail: "brayan@edlog.cm", className: "Upper Sixth Science B", subjectCode: "BIO", daysAgo: 2, period: 3, moduleName: "Heredity", topicNames: ["Mendelian Laws"], notes: "Mendel's experiments with pea plants. Monohybrid crosses and Punnett squares.", objectives: "Students can solve monohybrid cross problems", engagement: "MEDIUM" as const, attendance: 30 },
  { teacherEmail: "brayan@edlog.cm", className: "Form 4A (Science)", subjectCode: "CHE", daysAgo: 3, period: 3, moduleName: "Elements Compounds and Organic Chemistry", topicNames: ["Nitrogen"], notes: "Industrial and lab preparation of nitrogen. Properties and uses.", objectives: "Students can describe preparation methods for nitrogen", engagement: "MEDIUM" as const, attendance: 43 },
  // A few more spread across the 2 weeks
  { teacherEmail: "darren@edlog.cm", className: "Form 5A (Science)", subjectCode: "PHY", daysAgo: 4, period: 1, moduleName: "Fields – Magnetic Fields and Their Effects", topicNames: ["Applications of magnets", "Hard and soft magnetic materials"], notes: "Discussed industrial applications. Compared hard/soft materials.", objectives: "Students can classify magnetic materials", engagement: "MEDIUM" as const, attendance: 37 },
  { teacherEmail: "darren@edlog.cm", className: "Form 3A", subjectCode: "PHY", daysAgo: 5, period: 1, moduleName: "Matter – Properties and Transformation", topicNames: ["Definition calculation and unit of density", "Measurement of density of regular and irregular objects"], notes: "Density formula and calculations. Lab: measuring density using displacement method.", objectives: "Students can measure and calculate density", engagement: "HIGH" as const, attendance: 41 },
  { teacherEmail: "brayan@edlog.cm", className: "Lower Sixth Science A", subjectCode: "CHE", daysAgo: 4, period: 3, moduleName: "Fundamental Chemistry", topicNames: ["Atomic Structure and Periodic Table"], notes: "Electron configuration and periodic trends. Discussed ionization energies.", objectives: "Students can write electron configurations", engagement: "MEDIUM" as const, attendance: 35 },
  { teacherEmail: "brayan@edlog.cm", className: "Upper Sixth Science B", subjectCode: "BIO", daysAgo: 5, period: 1, moduleName: "Heredity", topicNames: ["Deviation from Mendelian Laws", "Gene Interactions"], notes: "Incomplete dominance, codominance, epistasis examples.", objectives: "Students can explain non-Mendelian inheritance", engagement: "HIGH" as const, attendance: 31 },
  // Drafts
  { teacherEmail: "darren@edlog.cm", className: "Upper Sixth Science A", subjectCode: "PHY", daysAgo: 0, period: 1, moduleName: "Field Phenomena", topicNames: ["Gravitational field strength"], notes: "", objectives: "", engagement: undefined, attendance: undefined, status: "DRAFT" as const },
  { teacherEmail: "brayan@edlog.cm", className: "Form 4A (Science)", subjectCode: "CHE", daysAgo: 0, period: 2, moduleName: "Elements Compounds and Organic Chemistry", topicNames: ["Formulae Moles and Equations"], notes: "", objectives: "", engagement: undefined, attendance: undefined, status: "DRAFT" as const },
  // Some verified entries
  { teacherEmail: "darren@edlog.cm", className: "Form 3A", subjectCode: "PHY", daysAgo: 8, period: 2, moduleName: "Matter – Properties and Transformation", topicNames: ["Applications of density in engineering"], notes: "Real-world density applications: shipbuilding, hot air balloons, hydrometer.", objectives: "Students can explain applications of density", engagement: "HIGH" as const, attendance: 43, status: "VERIFIED" as const },
  { teacherEmail: "brayan@edlog.cm", className: "Lower Sixth Science A", subjectCode: "BIO", daysAgo: 7, period: 4, moduleName: "Cell Biology Foundations", topicNames: ["Cell Ultrastructure"], notes: "Detailed study of organelles: mitochondria, ER, Golgi apparatus, lysosomes.", objectives: "Students can identify and describe cell organelles", engagement: "HIGH" as const, attendance: 36, status: "VERIFIED" as const },
];

// Subject divisions (school-specific sub-subjects)
// These are created per-school so teachers can be assigned to specific divisions
export const DEMO_DIVISIONS = [
  { subjectCode: "CHE", name: "Physical Chemistry" },
  { subjectCode: "CHE", name: "Organic Chemistry" },
  { subjectCode: "CHE", name: "Inorganic Chemistry" },
  { subjectCode: "ENG", name: "Directed Writing" },
  { subjectCode: "ENG", name: "Composition" },
];

export const DEMO_NOTIFICATIONS = [
  { teacherEmail: "darren@edlog.cm", type: "WEEKLY_SUMMARY" as const, title: "Weekly Summary", message: "You logged 6 entries this week across 3 classes. Great consistency!", isRead: false },
  { teacherEmail: "darren@edlog.cm", type: "LOG_REVIEWED" as const, title: "Entry Verified", message: "Your Physics entry for Form 3A on density applications has been verified by the school admin.", isRead: true, link: "/history" },
  { teacherEmail: "brayan@edlog.cm", type: "LOG_REMINDER" as const, title: "Daily Reminder", message: "You haven't logged any entries today. Don't forget to record your lessons!", isRead: false, link: "/logbook/new" },
  { adminEmail: "admin@edlog.cm", type: "NEW_TEACHER" as const, title: "New Teacher Registered", message: "A new teacher has registered with your school code. Please verify their account.", isRead: false, link: "/admin/teachers" },
];
