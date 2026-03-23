/**
 * Curriculum Service — Business logic for curriculum data (modules, topics, coverage).
 */
import { db } from "@/lib/db";

export interface TopicWithCoverage {
  id: string;
  name: string;
  classLevel: string;
  moduleNum: number | null;
  moduleName: string | null;
  orderIndex: number;
  isCovered: boolean;
  coveredAt?: string;
}

export async function getModulesForSubject(subjectId: string, classLevel: string) {
  const topics = await db.topic.findMany({
    where: { subjectId, classLevel },
    orderBy: [{ moduleNum: "asc" }, { orderIndex: "asc" }],
    select: {
      id: true,
      name: true,
      classLevel: true,
      moduleNum: true,
      moduleName: true,
      orderIndex: true,
    },
  });

  // Group topics by module
  const modules = new Map<
    string,
    { moduleNum: number | null; moduleName: string; topics: typeof topics }
  >();

  for (const topic of topics) {
    const key = topic.moduleName || "General";
    if (!modules.has(key)) {
      modules.set(key, {
        moduleNum: topic.moduleNum,
        moduleName: topic.moduleName || "General",
        topics: [],
      });
    }
    modules.get(key)!.topics.push(topic);
  }

  return Array.from(modules.values()).sort(
    (a, b) => (a.moduleNum || 0) - (b.moduleNum || 0)
  );
}

export async function getTopicsWithCoverage(
  subjectId: string,
  classLevel: string,
  classId: string
): Promise<TopicWithCoverage[]> {
  const topics = await db.topic.findMany({
    where: { subjectId, classLevel },
    orderBy: [{ moduleNum: "asc" }, { orderIndex: "asc" }],
    include: {
      entries: {
        where: {
          classId,
          status: { in: ["SUBMITTED", "VERIFIED"] },
        },
        select: { date: true },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
  });

  return topics.map((t) => ({
    id: t.id,
    name: t.name,
    classLevel: t.classLevel,
    moduleNum: t.moduleNum,
    moduleName: t.moduleName,
    orderIndex: t.orderIndex,
    isCovered: t.entries.length > 0,
    coveredAt: t.entries[0]?.date?.toISOString(),
  }));
}

export async function getNextUntaughtTopic(
  subjectId: string,
  classLevel: string,
  classId: string
) {
  const topics = await getTopicsWithCoverage(subjectId, classLevel, classId);
  return topics.find((t) => !t.isCovered) || null;
}

export async function getCoverageForClass(
  classId: string,
  subjectId: string,
  classLevel: string
) {
  const [totalTopics, coveredTopics] = await Promise.all([
    db.topic.count({ where: { subjectId, classLevel } }),
    db.topic.count({
      where: {
        subjectId,
        classLevel,
        entries: {
          some: {
            classId,
            status: { in: ["SUBMITTED", "VERIFIED"] },
          },
        },
      },
    }),
  ]);

  return {
    totalTopics,
    coveredTopics,
    percentage: totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0,
  };
}
