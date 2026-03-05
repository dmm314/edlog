import { db } from "@/lib/db"

export function schoolDb(schoolId: string) {
  return {
    teacherAssignment: {
      findMany: (args = {}) =>
        db.teacherAssignment.findMany({
          ...args,
          where: { ...args.where, schoolId }
        }),

      create: (args: any) =>
        db.teacherAssignment.create({
          ...args,
          data: { ...args.data, schoolId }
        })
    },

    schoolSubject: {
      findMany: (args = {}) =>
        db.schoolSubject.findMany({
          ...args,
          where: { ...args.where, schoolId }
        })
    }
  }
}
