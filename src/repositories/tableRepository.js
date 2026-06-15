import { findAllTables, saveAdminTables } from "../gateways/appScriptGateway";

export const tableRepository = {
  findAll: findAllTables,
  saveAdmin: saveAdminTables,
};
