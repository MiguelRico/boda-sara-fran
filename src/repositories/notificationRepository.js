import {
  findAllNotifications,
  saveAdminNotifications,
  updateAdminNotificationRead,
} from "../gateways/appScriptGateway";

export const notificationRepository = {
  findAll: findAllNotifications,
  saveAdmin: saveAdminNotifications,
  updateRead: updateAdminNotificationRead,
};
