import { db } from "@/lib/db"

type PrismaArgs = {
  where?: Record<string, unknown>
  data?: Record<string, unknown>
}

export function schoolDb(schoolId: string) {
  return {
    teacherAssignment: {
      findMany: (args: PrismaArgs = {}) =>
        db.teacherAssignment.findMany({
          ...args,
          where: { ...(args.where ?? {}), schoolId }
        }),

      create: (args: PrismaArgs) =>
        db.teacherAssignment.create({
          ...args,
          data: { ...(args.data ?? {}), schoolId }
        })
    },

    schoolSubject: {
      findMany: (args: PrismaArgs = {}) =>
        db.schoolSubject.findMany({
          ...args,
          where: { ...(args.where ?? {}), schoolId }
        })
    }
  }
}
