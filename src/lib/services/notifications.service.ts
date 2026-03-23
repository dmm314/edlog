/**
 * Notifications Service — Business logic for notifications and announcements.
 */
import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function sendNotification(
  userId: string,
  data: {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    senderRole?: string;
    schoolId?: string;
  }
) {
  return db.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      senderRole: data.senderRole,
      schoolId: data.schoolId,
    },
  });
}

export async function broadcastAnnouncement(
  schoolId: string,
  data: {
    title: string;
    message: string;
    senderRole: string;
    targetTeacherIds?: string[]; // If empty, broadcast to all teachers
  }
) {
  let teacherIds: string[];

  if (data.targetTeacherIds && data.targetTeacherIds.length > 0) {
    teacherIds = data.targetTeacherIds;
  } else {
    const teachers = await db.user.findMany({
      where: { schoolId, role: "TEACHER" },
      select: { id: true },
    });
    teacherIds = teachers.map((t) => t.id);
  }

  const notifications = teacherIds.map((userId) => ({
    userId,
    type: "SCHOOL_ANNOUNCEMENT" as NotificationType,
    title: data.title,
    message: data.message,
    senderRole: data.senderRole,
    schoolId,
  }));

  return db.notification.createMany({ data: notifications });
}

export async function broadcastRegionalAnnouncement(
  regionId: string,
  data: {
    title: string;
    message: string;
    senderRole: string;
  }
) {
  const teachers = await db.user.findMany({
    where: { school: { regionId }, role: "TEACHER" },
    select: { id: true, schoolId: true },
  });

  const notifications = teachers.map((t) => ({
    userId: t.id,
    type: "REGIONAL_ANNOUNCEMENT" as NotificationType,
    title: data.title,
    message: data.message,
    senderRole: data.senderRole,
    schoolId: t.schoolId,
  }));

  return db.notification.createMany({ data: notifications });
}

export async function getNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number; offset?: number }
) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  const where = {
    userId,
    ...(options?.unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.notification.count({ where }),
    db.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    data: notifications,
    meta: { total, unreadCount },
  };
}

export async function markNotificationRead(notificationId: string) {
  return db.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({
    where: { userId, isRead: false },
  });
}
