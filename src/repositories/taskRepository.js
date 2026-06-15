import { findAllTasks, saveAdminTasks } from "../gateways/appScriptGateway";

export const taskRepository = {
  findAll: findAllTasks,
  saveAdmin: saveAdminTasks,
};
