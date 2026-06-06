import { findAllTables, saveAdminTables } from "../services/rsvpService";

export const tableRepository = {
  findAll: findAllTables,
  saveAdmin: saveAdminTables,
};
