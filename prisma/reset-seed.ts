import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { REGIONS } from "./seed/regions";

const prisma = new PrismaClient();

// Curriculum imports (same as seed.ts)
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
  console.log("  EDLOG DATABASE RESET");
  console.log("========================================\n");

  // ── 1. Wipe all data ────────────────────────────────────
  console.log("Clearing all existing data...");
  await prisma.notification.deleteMany();
  await prisma.logbookEntry.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.periodSchedule.deleteMany();
  await prisma.schoolSubject.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.session.deleteMany();
  await prisma.registrationCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();
  await prisma.division.deleteMany();
  await prisma.region.deleteMany();
  console.log("  Done — all tables cleared.\n");

  // ── 2. Regions & Divisions ──────────────────────────────
  console.log("Creating 10 regions and divisions...");
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

  // ── 3. Regional Admin Accounts ──────────────────────────
  console.log("Creating 10 regional admin accounts...");
  for (const r of REGIONS) {
    const pw = await hash(`EdLog2026_${r.code}!`, 12);
    await prisma.user.create({
      data: {
        email: r.email,
        passwordHash: pw,
        firstName: "Regional",
        lastName: `Admin — ${r.name}`,
        role: Role.REGIONAL_ADMIN,
        isVerified: true,
        regionId: regionMap[r.code],
      },
    });
  }
  console.log("  Done.\n");

  // ── 4. Curriculum: Subjects & Topics ────────────────────
  console.log("Seeding curriculum data...");
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

  // ── Summary ─────────────────────────────────────────────
  console.log("========================================");
  console.log("  DATABASE RESET COMPLETE");
  console.log("========================================\n");
  console.log("Regional Admin Login Credentials:");
  console.log("─────────────────────────────────────────");
  for (const r of REGIONS) {
    console.log(`  ${r.name.padEnd(14)} Email: ${r.email.padEnd(24)} Password: EdLog2026_${r.code}!`);
  }
  console.log("\n─────────────────────────────────────────");
  console.log("No schools, teachers, or entries exist.");
  console.log("Schools can register at /register/school");
  console.log("Teachers can register at /register");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("Reset failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
