import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { REGIONS } from "./seed/regions";

const prisma = new PrismaClient();

// Helper types for curriculum data
interface TopicData {
  name: string;
  moduleNum: number;
  moduleName: string;
  orderIndex: number;
}
interface LevelData {
  classLevel: string;
  topics: TopicData[];
}
interface SubjectDef {
  name: string;
  code: string;
  category: string;
  levels: LevelData[];
}

async function main() {
  console.log("========================================");
  console.log("  EDLOG PRODUCTION DATABASE SEED");
  console.log("========================================\n");

  // ── 1. Regions & Divisions ─────────────────────────────
  console.log("Creating regions and divisions...");
  const regionMap: Record<string, string> = {};
  const divisionMap: Record<string, string> = {};

  for (const r of REGIONS) {
    const region = await prisma.region.create({
      data: { name: r.name, code: r.code, capital: r.capital },
    });
    regionMap[r.code] = region.id;

    for (const divName of r.divisions) {
      const div = await prisma.division.create({
        data: { name: divName, regionId: region.id },
      });
      divisionMap[`${r.code}:${divName}`] = div.id;
    }
  }
  console.log(`  ${REGIONS.length} regions, ${Object.keys(divisionMap).length} divisions\n`);

  // ── 2. Regional Admin Accounts ─────────────────────────
  // Real Cameroonian names for each region's inspector
  const REGIONAL_NAMES: Record<string, { firstName: string; lastName: string }> = {
    AD: { firstName: "Aïssatou", lastName: "Mohammadou" },
    CE: { firstName: "Jean-Pierre", lastName: "Atangana" },
    ES: { firstName: "Hélène", lastName: "Mbassi" },
    FN: { firstName: "Oumarou", lastName: "Boukar" },
    LT: { firstName: "Christelle", lastName: "Douala-Bell" },
    NO: { firstName: "Abdoulaye", lastName: "Hamadou" },
    NW: { firstName: "Comfort", lastName: "Ngwa" },
    SU: { firstName: "Marie-Claire", lastName: "Oyono" },
    SW: { firstName: "Peter", lastName: "Enoh Mbi" },
    OU: { firstName: "Bernadette", lastName: "Tchouankam" },
  };

  console.log("Creating 10 regional admin accounts...");
  const regionalPw = await hash("Edlog2026!", 12);
  for (const r of REGIONS) {
    const names = REGIONAL_NAMES[r.code] || { firstName: "Regional", lastName: `Admin ${r.name}` };
    await prisma.user.create({
      data: {
        email: r.email,
        passwordHash: regionalPw,
        firstName: names.firstName,
        lastName: names.lastName,
        role: Role.REGIONAL_ADMIN,
        isVerified: true,
        regionId: regionMap[r.code],
      },
    });
  }
  console.log("  Done.\n");

  // ── 3. Curriculum: Subjects & Topics ───────────────────
  console.log("Seeding curriculum data...");

  // Dynamic imports for curriculum files
  const allSubjects: SubjectDef[] = [];

  try {
    const { PHYSICS_CURRICULUM } = await import("./seed/curriculum-physics");
    allSubjects.push({ name: "Physics", code: "PHY", category: "Science", levels: PHYSICS_CURRICULUM });
  } catch { /* skip */ }

  try {
    const { CHEMISTRY_CURRICULUM } = await import("./seed/curriculum-chemistry");
    allSubjects.push({ name: "Chemistry", code: "CHE", category: "Science", levels: CHEMISTRY_CURRICULUM });
  } catch { /* skip */ }

  try {
    const { BIOLOGY_CURRICULUM } = await import("./seed/curriculum-biology");
    allSubjects.push({ name: "Biology", code: "BIO", category: "Science", levels: BIOLOGY_CURRICULUM });
  } catch { /* skip */ }

  try {
    const mod = await import("./seed/curriculum-mathematics");
    allSubjects.push({ name: "Mathematics", code: "MAT", category: "Science", levels: mod.MATHEMATICS_CURRICULUM });
    if (mod.ADDITIONAL_MATH_F4) allSubjects.push({ name: "Additional Mathematics", code: "AMA", category: "Science", levels: [...mod.ADDITIONAL_MATH_F4, ...(mod.ADDITIONAL_MATH_F5 || [])] });
    if (mod.PURE_MATH_LS) allSubjects.push({ name: "Pure Mathematics", code: "PMA", category: "Science", levels: [...mod.PURE_MATH_LS, ...(mod.PURE_MATH_US || [])] });
    if (mod.FURTHER_MATH_LS) allSubjects.push({ name: "Further Mathematics", code: "FMA", category: "Science", levels: [...mod.FURTHER_MATH_LS, ...(mod.FURTHER_MATH_US || [])] });
    if (mod.STATISTICS_US) allSubjects.push({ name: "Statistics", code: "STA", category: "Science", levels: mod.STATISTICS_US });
    if (mod.MECHANICS_US) allSubjects.push({ name: "Mechanics", code: "MEC", category: "Science", levels: mod.MECHANICS_US });
  } catch { /* skip */ }

  try {
    const { CS_CURRICULUM } = await import("./seed/curriculum-computer-science");
    allSubjects.push({ name: "Computer Science", code: "CSC", category: "Science", levels: CS_CURRICULUM });
  } catch { /* skip */ }

  try {
    const { OTHER_SUBJECTS } = await import("./seed/curriculum-other");
    allSubjects.push(...OTHER_SUBJECTS);
  } catch { /* skip */ }

  let totalTopics = 0;
  for (const subj of allSubjects) {
    const subject = await prisma.subject.create({
      data: { name: subj.name, code: subj.code, category: subj.category },
    });

    for (const level of subj.levels) {
      for (const topic of level.topics) {
        await prisma.topic.create({
          data: {
            name: topic.name,
            classLevel: level.classLevel,
            moduleNum: topic.moduleNum,
            moduleName: topic.moduleName,
            orderIndex: topic.orderIndex,
            subjectId: subject.id,
          },
        });
        totalTopics++;
      }
    }
  }
  console.log(`  ${allSubjects.length} subjects, ${totalTopics} topics\n`);

  // ── Summary ────────────────────────────────────────────
  console.log("========================================");
  console.log("  PRODUCTION SEED COMPLETE");
  console.log("========================================\n");
  console.log("10 Regional Admin Accounts (Password: Edlog2026!)");
  console.log("─────────────────────────────────────────");
  for (const r of REGIONS) {
    const names = REGIONAL_NAMES[r.code];
    console.log(`  ${r.name.padEnd(14)} ${names.firstName} ${names.lastName.padEnd(16)} ${r.email}`);
  }
  console.log("─────────────────────────────────────────\n");
  console.log("This is a PRODUCTION seed. No demo data created.");
  console.log("Regional admins create registration codes,");
  console.log("schools register at /register/school,");
  console.log("teachers register at /register.");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
