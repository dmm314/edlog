/**
 * Standalone script to add missing subjects to an existing database.
 * Run with: npx tsx prisma/seed-subjects.ts
 *
 * Safe to run multiple times — skips subjects that already exist.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SubjectDef {
  name: string;
  code: string;
  category: string;
}

const SUBJECTS: SubjectDef[] = [
  // Science
  { name: "Mathematics", code: "MAT", category: "Science" },
  { name: "Additional Mathematics", code: "AMA", category: "Science" },
  { name: "Pure Mathematics", code: "PMA", category: "Science" },
  { name: "Further Mathematics", code: "FMA", category: "Science" },
  { name: "Statistics", code: "STA", category: "Science" },
  { name: "Mechanics", code: "MEC", category: "Science" },
  { name: "Physics", code: "PHY", category: "Science" },
  { name: "Biology", code: "BIO", category: "Science" },
  { name: "Computer Science", code: "CSC", category: "Science" },

  // Chemistry branch
  { name: "Chemistry", code: "CHE", category: "Chemistry" },
  { name: "Physical Chemistry", code: "PCH", category: "Chemistry" },
  { name: "Organic Chemistry", code: "OCH", category: "Chemistry" },
  { name: "Inorganic Chemistry", code: "ICH", category: "Chemistry" },

  // Language
  { name: "English Language", code: "ENG", category: "Language" },
  { name: "French", code: "FRE", category: "Language" },
  { name: "Literature in English", code: "LIT", category: "Language" },

  // Humanities
  { name: "History", code: "HIS", category: "Humanities" },
  { name: "Geography", code: "GEO", category: "Humanities" },
  { name: "Economics", code: "ECO", category: "Humanities" },
  { name: "Religious Studies", code: "REL", category: "Humanities" },

  // General
  { name: "Citizenship", code: "CIT", category: "General" },
  { name: "Arts and Crafts", code: "ARC", category: "General" },
  { name: "Physical Education", code: "PHE", category: "General" },
  { name: "Sports", code: "SPO", category: "General" },
  { name: "Manual Labour", code: "MLA", category: "General" },
];

async function main() {
  console.log("📚 Seeding subjects...\n");

  let created = 0;
  let skipped = 0;

  for (const subj of SUBJECTS) {
    const existing = await prisma.subject.findFirst({
      where: { OR: [{ code: subj.code }, { name: subj.name }] },
    });

    if (existing) {
      // Update category if it changed (e.g. Chemistry: Science -> Chemistry)
      if (existing.category !== subj.category) {
        await prisma.subject.update({
          where: { id: existing.id },
          data: { category: subj.category },
        });
        console.log(`  ↻ ${subj.name} (${subj.code}) — updated category to ${subj.category}`);
      } else {
        skipped++;
      }
      continue;
    }

    await prisma.subject.create({
      data: { name: subj.name, code: subj.code, category: subj.category },
    });
    console.log(`  ✓ ${subj.name} (${subj.code})`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
