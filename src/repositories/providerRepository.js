import { findAllProviders, saveAdminProviders } from "../services/rsvpService";

export const providerRepository = {
  findAll: findAllProviders,
  saveAdmin: saveAdminProviders,
};
