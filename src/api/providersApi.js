import { providerRepository } from "../repositories/providerRepository";

export const findAllProviders = providerRepository.findAll;
export const saveAdminProviders = providerRepository.saveAdmin;
