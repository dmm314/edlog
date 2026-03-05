import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export function schoolDb(schoolId: string) {
  return {
    teacherAssignment: {
      findMany: (args: Prisma.TeacherAssignmentFindManyArgs = {}) =>
        db.teacherAssignment.findMany({
          ...args,
          where: { ...(args.where ?? {}), schoolId }
        }),
    },

    schoolSubject: {
      findMany: (args: Prisma.SchoolSubjectFindManyArgs = {}) =>
        db.schoolSubject.findMany({
          ...args,
          where: { ...(args.where ?? {}), schoolId }
        })
    }
  }
}
