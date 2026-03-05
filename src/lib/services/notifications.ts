import { NotificationType } from "@prisma/client"
import { db } from "@/lib/db"

export async function notifyUser(
  userId: string,
  message: string,
  title = "Notification",
  type: NotificationType = "GENERAL"
) {
  await db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      isRead: false,
    }
  })
}
