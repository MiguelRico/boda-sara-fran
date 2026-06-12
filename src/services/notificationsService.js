import { AdminNotification } from "../models";

export function buildNotificationStats(notifications) {
  const normalizedNotifications =
    AdminNotification.normalizeList(notifications);
  const typeCounts = AdminNotification.types.reduce(
    (counts, type) => ({
      ...counts,
      [type]: normalizedNotifications.filter(
        (notification) => notification.type === type,
      ).length,
    }),
    {},
  );

  return {
    totalCount: normalizedNotifications.length,
    readCount: normalizedNotifications.filter((notification) => notification.read)
      .length,
    unreadCount: normalizedNotifications.filter(
      (notification) => !notification.read,
    ).length,
    typeCounts,
  };
}
