import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { REGIONS } from "./seed/regions";
import {
  DEMO_SCHOOL,
  DEMO_ADMIN,
  DEMO_TEACHERS,
  DEMO_CLASSES,
  DEFAULT_PERIOD_SCHEDULE,
  DEMO_TIMETABLE,
  DEMO_ENTRIES,
  DEMO_DIVISIONS,
  DEMO_NOTIFICATIONS,
} from "./seed/demo-data";

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
  console.log("🌱 Seeding Edlog V2 database...\n");

  // ── 1. Regions & Divisions ─────────────────────────────
  console.log("📍 Creating regions and divisions...");
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
  console.log(`  ✓ ${REGIONS.length} regions, ${Object.keys(divisionMap).length} divisions\n`);

  // ── 2. Regional Admin Accounts ─────────────────────────
  console.log("👤 Creating regional admin accounts...");
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
  console.log(`  ✓ 10 regional admin accounts\n`);

  // ── 3. Curriculum: Subjects & Topics ───────────────────
  console.log("📚 Seeding curriculum data...");
  const subjectMap: Record<string, string> = {};

  // Dynamic imports for curriculum files
  let allSubjects: SubjectDef[] = [];

  try {
    const { PHYSICS_CURRICULUM } = await import("./seed/curriculum-physics");
    allSubjects.push({ name: "Physics", code: "PHY", category: "Science", levels: PHYSICS_CURRICULUM });
  } catch { console.log("  ⚠ Physics curriculum file not found, skipping"); }

  try {
    const { CHEMISTRY_CURRICULUM } = await import("./seed/curriculum-chemistry");
    allSubjects.push({ name: "Chemistry", code: "CHE", category: "Science", levels: CHEMISTRY_CURRICULUM });
  } catch { console.log("  ⚠ Chemistry curriculum file not found, skipping"); }

  try {
    const { BIOLOGY_CURRICULUM } = await import("./seed/curriculum-biology");
    allSubjects.push({ name: "Biology", code: "BIO", category: "Science", levels: BIOLOGY_CURRICULUM });
  } catch { console.log("  ⚠ Biology curriculum file not found, skipping"); }

  try {
    const mod = await import("./seed/curriculum-mathematics");
    allSubjects.push({ name: "Mathematics", code: "MAT", category: "Science", levels: mod.MATHEMATICS_CURRICULUM });
    if (mod.ADDITIONAL_MATH_F4) allSubjects.push({ name: "Additional Mathematics", code: "AMA", category: "Science", levels: [...mod.ADDITIONAL_MATH_F4, ...(mod.ADDITIONAL_MATH_F5 || [])] });
    if (mod.PURE_MATH_LS) allSubjects.push({ name: "Pure Mathematics", code: "PMA", category: "Science", levels: [...mod.PURE_MATH_LS, ...(mod.PURE_MATH_US || [])] });
    if (mod.FURTHER_MATH_LS) allSubjects.push({ name: "Further Mathematics", code: "FMA", category: "Science", levels: [...mod.FURTHER_MATH_LS, ...(mod.FURTHER_MATH_US || [])] });
    if (mod.STATISTICS_US) allSubjects.push({ name: "Statistics", code: "STA", category: "Science", levels: mod.STATISTICS_US });
    if (mod.MECHANICS_US) allSubjects.push({ name: "Mechanics", code: "MEC", category: "Science", levels: mod.MECHANICS_US });
  } catch { console.log("  ⚠ Mathematics curriculum file not found, skipping"); }

  try {
    const { CS_CURRICULUM } = await import("./seed/curriculum-computer-science");
    allSubjects.push({ name: "Computer Science", code: "CSC", category: "Science", levels: CS_CURRICULUM });
  } catch { console.log("  ⚠ Computer Science curriculum file not found, skipping"); }

  try {
    const { OTHER_SUBJECTS } = await import("./seed/curriculum-other");
    allSubjects.push(...OTHER_SUBJECTS);
  } catch { console.log("  ⚠ Other subjects file not found, skipping"); }

  let totalTopics = 0;
  for (const subj of allSubjects) {
    const subject = await prisma.subject.create({
      data: { name: subj.name, code: subj.code, category: subj.category },
    });
    subjectMap[subj.code] = subject.id;

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
  console.log(`  ✓ ${allSubjects.length} subjects, ${totalTopics} topics\n`);

  // ── 4. Demo School ─────────────────────────────────────
  console.log("🏫 Creating demo school...");
  const swRegionId = regionMap["SW"];
  const fakoId = divisionMap["SW:Fako"];

  const school = await prisma.school.create({
    data: {
      name: DEMO_SCHOOL.name,
      code: "SW-FAK-0001",
      schoolType: DEMO_SCHOOL.schoolType,
      principalName: DEMO_SCHOOL.principalName,
      principalPhone: DEMO_SCHOOL.principalPhone,
      status: "ACTIVE",
      profileComplete: true,
      regionId: swRegionId,
      divisionId: fakoId,
    },
  });

  // Period schedule
  for (const p of DEFAULT_PERIOD_SCHEDULE) {
    await prisma.periodSchedule.create({
      data: { schoolId: school.id, ...p },
    });
  }

  // School admin
  const adminPw = await hash(DEMO_ADMIN.password, 12);
  const admin = await prisma.user.create({
    data: {
      email: DEMO_ADMIN.email,
      passwordHash: adminPw,
      firstName: DEMO_ADMIN.firstName,
      lastName: DEMO_ADMIN.lastName,
      role: Role.SCHOOL_ADMIN,
      isVerified: true,
      schoolId: school.id,
    },
  });
  await prisma.school.update({ where: { id: school.id }, data: { adminId: admin.id } });

  // Link subjects to school
  for (const code of Object.keys(subjectMap)) {
    await prisma.schoolSubject.create({
      data: { schoolId: school.id, subjectId: subjectMap[code] },
    });
  }
  // Create subject divisions for the demo school
  for (const div of DEMO_DIVISIONS) {
    const sId = subjectMap[div.subjectCode];
    if (sId) {
      await prisma.subjectDivision.create({
        data: { name: div.name, subjectId: sId, schoolId: school.id },
      });
    }
  }
  console.log(`  ✓ School: ${school.name} (${school.code}), ${DEMO_DIVISIONS.length} subject divisions\n`);

  // ── 5. Classes ─────────────────────────────────────────
  console.log("📋 Creating classes...");
  const classMap: Record<string, string> = {};
  const classLevelMap: Record<string, string> = {};
  for (const c of DEMO_CLASSES) {
    const cls = await prisma.class.create({
      data: { ...c, year: 2026, schoolId: school.id },
    });
    classMap[c.name] = cls.id;
    classLevelMap[c.name] = c.level;
  }
  console.log(`  ✓ ${DEMO_CLASSES.length} classes\n`);

  // ── 6. Demo Teachers ───────────────────────────────────
  console.log("👨‍🏫 Creating demo teachers...");
  const teacherMap: Record<string, string> = {};
  for (const t of DEMO_TEACHERS) {
    const pw = await hash(t.password, 12);
    const teacher = await prisma.user.create({
      data: {
        email: t.email,
        passwordHash: pw,
        firstName: t.firstName,
        lastName: t.lastName,
        role: Role.TEACHER,
        isVerified: true,
        schoolId: school.id,
      },
    });
    teacherMap[t.email] = teacher.id;
  }
  console.log(`  ✓ ${DEMO_TEACHERS.length} teachers\n`);

  // ── 7. Teacher Assignments & Timetable ─────────────────
  console.log("📅 Creating assignments and timetable...");
  const assignmentMap: Record<string, string> = {};

  // Create assignments from teacher subjects
  for (const t of DEMO_TEACHERS) {
    for (const subj of t.subjects) {
      for (const className of subj.classNames) {
        const key = `${t.email}:${className}:${subj.code}`;
        const assignment = await prisma.teacherAssignment.create({
          data: {
            teacherId: teacherMap[t.email],
            classId: classMap[className],
            subjectId: subjectMap[subj.code],
            schoolId: school.id,
          },
        });
        assignmentMap[key] = assignment.id;
      }
    }
  }

  // Create timetable slots
  const periodMap: Record<number, { startTime: string; endTime: string; label: string }> = {};
  for (const p of DEFAULT_PERIOD_SCHEDULE) {
    periodMap[p.periodNum] = { startTime: p.startTime, endTime: p.endTime, label: p.label };
  }

  for (const [email, className, subjCode, dayOfWeek, periodNum] of DEMO_TIMETABLE) {
    const assignKey = `${email}:${className}:${subjCode}`;
    const assignId = assignmentMap[assignKey];
    if (!assignId) {
      console.log(`  ⚠ Assignment not found for ${assignKey}`);
      continue;
    }
    const period = periodMap[periodNum];
    await prisma.timetableSlot.create({
      data: {
        assignmentId: assignId,
        dayOfWeek,
        startTime: period.startTime,
        endTime: period.endTime,
        periodLabel: period.label,
        schoolId: school.id,
      },
    });
  }
  console.log(`  ✓ ${Object.keys(assignmentMap).length} assignments, ${DEMO_TIMETABLE.length} timetable slots\n`);

  // ── 8. Sample Logbook Entries ──────────────────────────
  console.log("📝 Creating sample logbook entries...");
  const now = new Date();
  let entryCount = 0;

  for (const entry of DEMO_ENTRIES) {
    const entryDate = new Date(now);
    entryDate.setDate(entryDate.getDate() - (entry.daysAgo || 0));
    entryDate.setHours(8, 0, 0, 0);

    // Find assignment
    const assignKey = `${entry.teacherEmail}:${entry.className}:${entry.subjectCode}`;
    const assignId = assignmentMap[assignKey];

    // Find topics
    const subjectId = subjectMap[entry.subjectCode];
    const classLevel = classLevelMap[entry.className];
    const topics = await prisma.topic.findMany({
      where: {
        subjectId,
        classLevel,
        name: { in: entry.topicNames },
      },
    });

    if (topics.length === 0) {
      console.log(`  ⚠ No topics found for ${entry.subjectCode} ${classLevel}: ${entry.topicNames[0]}`);
      continue;
    }

    await prisma.logbookEntry.create({
      data: {
        date: entryDate,
        period: entry.period,
        duration: 60,
        notes: entry.notes || null,
        objectives: entry.objectives || null,
        status: (entry as Record<string, unknown>).status as string || "SUBMITTED",
        studentAttendance: entry.attendance || null,
        engagementLevel: entry.engagement || null,
        teacherId: teacherMap[entry.teacherEmail],
        classId: classMap[entry.className],
        assignmentId: assignId || null,
        topics: { connect: topics.map((t) => ({ id: t.id })) },
      },
    });
    entryCount++;
  }
  console.log(`  ✓ ${entryCount} logbook entries\n`);

  // ── 9. Notifications ───────────────────────────────────
  console.log("🔔 Creating sample notifications...");
  for (const n of DEMO_NOTIFICATIONS) {
    const userId = (n as Record<string, unknown>).teacherEmail
      ? teacherMap[(n as Record<string, unknown>).teacherEmail as string]
      : (n as Record<string, unknown>).adminEmail === "admin@edlog.cm"
      ? admin.id
      : null;
    if (!userId) continue;

    await prisma.notification.create({
      data: {
        userId,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead || false,
        link: n.link || null,
      },
    });
  }
  console.log(`  ✓ ${DEMO_NOTIFICATIONS.length} notifications\n`);

  // ── Summary ────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════");
  console.log("✅ Seed completed successfully!");
  console.log("═══════════════════════════════════════════════");
  console.log("\n📋 Login Credentials:");
  console.log("─────────────────────────────────────────────");
  console.log("Regional Admins (10 accounts):");
  for (const r of REGIONS) {
    console.log(`  ${r.name.padEnd(12)} ${r.email.padEnd(24)} EdLog2026_${r.code}!`);
  }
  console.log(`\nSchool Admin:  admin@edlog.cm       EdLog2026!`);
  console.log(`Teacher 1:     darren@edlog.cm      EdLog2026!`);
  console.log(`Teacher 2:     brayan@edlog.cm      EdLog2026!`);
  console.log(`\nSchool Code:   SW-FAK-0001`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
