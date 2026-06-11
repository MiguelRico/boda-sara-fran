import { AdminNotification } from "../models";

const STORAGE_KEY = "boda-admin-notifications";

const readStoredNotifications = () => {
  try {
    return AdminNotification.normalizeList(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]"),
    );
  } catch (error) {
    console.error("Error al leer notificaciones:", error);
    return [];
  }
};

const writeStoredNotifications = (notifications) => {
  const normalizedNotifications =
    AdminNotification.normalizeList(notifications);

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizedNotifications),
  );

  return normalizedNotifications;
};

export const notificationRepository = {
  findAll: async () => ({ notifications: readStoredNotifications() }),
  saveAdmin: async ({ notifications }) => ({
    notifications: writeStoredNotifications(notifications),
    success: true,
  }),
};
