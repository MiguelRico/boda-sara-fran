import { taskRepository } from "../repositories/taskRepository";

export const findAllTasks = taskRepository.findAll;
export const saveAdminTasks = taskRepository.saveAdmin;
