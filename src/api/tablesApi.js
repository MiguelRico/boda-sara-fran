import { tableRepository } from "../repositories/tableRepository";

export const findAllTables = tableRepository.findAll;
export const saveAdminTables = tableRepository.saveAdmin;
