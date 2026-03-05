import { db } from "@/lib/db"

export async function notifyUser(userId: string, message: string) {
  await db.notification.create({
    data: {
      userId,
      message,
      isRead: false
    }
  })
}
