import { notificationRepository } from "../repositories/notificationRepository";

export const findAllNotifications = notificationRepository.findAll;
export const saveAdminNotifications = notificationRepository.saveAdmin;
