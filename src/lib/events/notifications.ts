import { on } from "@/lib/events"
import { notifyUser } from "@/lib/services/notifications"

on("teacher.assigned", async ({ teacherId, subjectName }: { teacherId: string; subjectName: string }) => {
  await notifyUser(
    teacherId,
    `You have been assigned to teach ${subjectName}`
  )
})

on("timetable.updated", async ({ teacherId }: { teacherId: string }) => {
  await notifyUser(
    teacherId,
    "Your timetable has been updated"
  )
})
