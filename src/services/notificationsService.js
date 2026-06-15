import { AdminNotification } from "../models";
import { notificationRepository } from "../repositories/notificationRepository";

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

export const loadNotifications = async ({ password } = {}) => {
  const response = await notificationRepository.findAll({ password });

  return AdminNotification.normalizeList(
    response?.notifications || response || [],
  );
};

export const persistNotifications = async ({ notifications, password }) => {
  const normalizedNotifications =
    AdminNotification.normalizeList(notifications);

  await notificationRepository.saveAdmin({
    notifications: normalizedNotifications,
    password,
  });

  return normalizedNotifications;
};

export const updateNotificationRead = async ({
  notificationId,
  password,
  read,
}) =>
  notificationRepository.updateRead({
    notificationId,
    password,
    read,
  });
