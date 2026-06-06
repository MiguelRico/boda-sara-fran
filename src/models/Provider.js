import { PROVIDER_CATEGORIES } from "../constants/providers";
import { ProviderService } from "./ProviderService";

const normalizeString = (value) => (value == null ? "" : String(value));
const createId = () =>
  `provider-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const Provider = {
  create(overrides = {}) {
    return {
      id: overrides.id || createId(),
      providerId: overrides.providerId || overrides.id || "",
      accountNumber: normalizeString(overrides.accountNumber),
      address: normalizeString(overrides.address),
      category: overrides.category || PROVIDER_CATEGORIES[0].value,
      email: normalizeString(overrides.email),
      name: normalizeString(overrides.name),
      phone: normalizeString(overrides.phone),
      services: ProviderService.normalizeList(overrides.services),
      web: normalizeString(overrides.web),
    };
  },

  normalize(provider = {}) {
    return Provider.create(provider);
  },

  normalizeList(providers) {
    if (!Array.isArray(providers)) return [];

    return providers.map((provider) => Provider.normalize(provider));
  },

  getTotal(provider) {
    return Provider.normalize(provider).services.reduce(
      (total, service) => total + (Number(service.price) || 0),
      0,
    );
  },

  getPaidTotal(provider) {
    return Provider.normalize(provider).services.reduce(
      (total, service) => total + ProviderService.getPaidTotal(service),
      0,
    );
  },
};
