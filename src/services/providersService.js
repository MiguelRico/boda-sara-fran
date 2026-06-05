import {
  PROVIDER_CATEGORIES,
  PROVIDER_PAYMENT_COUNT,
} from "../constants/providers";

const STORAGE_KEY = "wedding_admin_providers";

const normalizeString = (value) => (value == null ? "" : String(value));
const createId = () =>
  `provider-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createEmptyPayment = (overrides = {}) => ({
  amount: normalizeString(overrides.amount),
  date: normalizeString(overrides.date),
  paid: Boolean(overrides.paid),
});

export const createEmptyService = (overrides = {}) => ({
  id: overrides.id || createId(),
  name: normalizeString(overrides.name),
  paymentCount: Math.min(
    Math.max(Number(overrides.paymentCount) || 1, 1),
    PROVIDER_PAYMENT_COUNT,
  ),
  payments: Array.from({ length: PROVIDER_PAYMENT_COUNT }, (_, index) =>
    createEmptyPayment(overrides.payments?.[index]),
  ),
  price: normalizeString(overrides.price),
});

export const createEmptyProvider = (overrides = {}) => ({
  id: overrides.id || createId(),
  accountNumber: normalizeString(overrides.accountNumber),
  address: normalizeString(overrides.address),
  category: overrides.category || PROVIDER_CATEGORIES[0].value,
  email: normalizeString(overrides.email),
  name: normalizeString(overrides.name),
  phone: normalizeString(overrides.phone),
  services: normalizeServices(overrides.services),
  web: normalizeString(overrides.web),
});

export const normalizeServices = (services) => {
  if (!Array.isArray(services) || !services.length) {
    return [createEmptyService()];
  }

  return services.map((service) => createEmptyService(service));
};

export const normalizeProviders = (providers) => {
  if (!Array.isArray(providers)) return [];

  return providers.map((provider) => createEmptyProvider(provider));
};

export const loadProviders = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    return normalizeProviders(stored ? JSON.parse(stored) : []);
  } catch (error) {
    console.error("Error al cargar proveedores:", error);
    return [];
  }
};

export const persistProviders = (providers) => {
  const normalizedProviders = normalizeProviders(providers);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedProviders));

  return normalizedProviders;
};

export const getProviderTotal = (provider) => {
  return normalizeServices(provider.services).reduce(
    (total, service) => total + (Number(service.price) || 0),
    0,
  );
};

export const getProviderPaidTotal = (provider) => {
  return normalizeServices(provider.services).reduce((total, service) => {
    const paid = service.payments.reduce(
      (paymentTotal, payment) =>
        paymentTotal + (payment.paid ? Number(payment.amount) || 0 : 0),
      0,
    );

    return total + paid;
  }, 0);
};

export const validateProvider = (provider) => {
  const errors = {};

  if (!provider.name.trim()) errors.name = "El nombre es obligatorio";
  if (!provider.phone.trim()) errors.phone = "El teléfono es obligatorio";
  if (!provider.email.trim()) {
    errors.email = "El email es obligatorio";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(provider.email)) {
    errors.email = "Introduce un email válido";
  }

  provider.services.forEach((service, index) => {
    if (!service.name.trim()) {
      errors[`service_${index}_name`] = "El servicio necesita nombre";
    }

    if (!String(service.price).trim()) {
      errors[`service_${index}_price`] = "El precio es obligatorio";
    }

    const price = Number(service.price) || 0;
    const paymentTotal = service.payments
      .slice(0, service.paymentCount)
      .reduce((total, payment) => total + (Number(payment.amount) || 0), 0);

    if (price > 0 && paymentTotal !== price) {
      errors[`service_${index}_payments`] =
        paymentTotal > price
          ? "La suma de los plazos supera el precio total"
          : "La suma de los plazos no alcanza el precio total";
    }
  });

  return errors;
};
