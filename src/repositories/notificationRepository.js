import {
  findAllNotifications,
  saveAdminNotifications,
  updateAdminNotificationRead,
} from "../services/rsvpService";

export const notificationRepository = {
  findAll: findAllNotifications,
  saveAdmin: saveAdminNotifications,
  updateRead: updateAdminNotificationRead,
};
