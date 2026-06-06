import { PROVIDER_PAYMENT_COUNT } from "../constants/providers";
import { ProviderPayment } from "./ProviderPayment";

const normalizeString = (value) => (value == null ? "" : String(value));
const createId = () =>
  `provider-service-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const ProviderService = {
  create(overrides = {}) {
    return {
      id: overrides.id || createId(),
      serviceId: overrides.serviceId || overrides.id || "",
      name: normalizeString(overrides.name),
      paymentCount: Math.min(
        Math.max(Number(overrides.paymentCount) || 1, 1),
        PROVIDER_PAYMENT_COUNT,
      ),
      payments: Array.from({ length: PROVIDER_PAYMENT_COUNT }, (_, index) =>
        ProviderPayment.normalize(overrides.payments?.[index]),
      ),
      price: normalizeString(overrides.price),
    };
  },

  normalize(service = {}) {
    return ProviderService.create(service);
  },

  normalizeList(services) {
    if (!Array.isArray(services)) return [];

    return services.map((service) => ProviderService.normalize(service));
  },

  getPaidTotal(service) {
    return ProviderService.normalize(service).payments.reduce(
      (total, payment) =>
        total + (payment.paid ? Number(payment.amount) || 0 : 0),
      0,
    );
  },
};
