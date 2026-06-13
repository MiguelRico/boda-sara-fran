import { findAllTasks, saveAdminTasks } from "../services/rsvpService";

export const taskRepository = {
  findAll: findAllTasks,
  saveAdmin: saveAdminTasks,
};
