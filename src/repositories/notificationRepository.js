import {
  findAllNotifications,
  saveAdminNotifications,
} from "../services/rsvpService";

export const notificationRepository = {
  findAll: findAllNotifications,
  saveAdmin: saveAdminNotifications,
};
