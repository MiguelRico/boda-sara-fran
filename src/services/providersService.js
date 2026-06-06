import { findAllProviders, saveAdminProviders } from "../api/providersApi";
import { Provider, ProviderPayment, ProviderService } from "../models";
import { validateProvider } from "../validators/providerValidators";

export const createEmptyPayment = ProviderPayment.create;
export const createEmptyService = ProviderService.create;
export const createEmptyProvider = Provider.create;
export const normalizeServices = ProviderService.normalizeList;
export const normalizeProviders = Provider.normalizeList;
export const getProviderTotal = Provider.getTotal;
export const getProviderPaidTotal = Provider.getPaidTotal;
export { validateProvider };

export const loadProviders = async ({ password } = {}) => {
  const response = await findAllProviders({ password });

  if (response?.success === false) {
    throw new Error(response.error || "No se pudieron cargar los proveedores.");
  }

  return normalizeProviders(response?.providers || []);
};

export const persistProviders = async ({ password, providers }) => {
  const normalizedProviders = normalizeProviders(providers);

  await saveAdminProviders({
    password,
    providers: normalizedProviders,
  });

  return normalizedProviders;
};
