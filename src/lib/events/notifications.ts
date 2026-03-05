import { on } from "@/lib/events"
import { notifyUser } from "@/lib/services/notifications"

on("teacher.assigned", async ({ teacherId, subjectName }) => {
  await notifyUser(
    teacherId,
    `You have been assigned to teach ${subjectName}`
  )
})

on("timetable.updated", async ({ teacherId }) => {
  await notifyUser(
    teacherId,
    "Your timetable has been updated"
  )
})
