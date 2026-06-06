const normalizeString = (value) => (value == null ? "" : String(value));
const createId = () =>
  `provider-payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const ProviderPayment = {
  create(overrides = {}) {
    return {
      id: overrides.id || overrides.paymentId || createId(),
      paymentId: overrides.paymentId || overrides.id || "",
      amount: normalizeString(overrides.amount),
      date: normalizeString(overrides.date),
      paid: Boolean(overrides.paid),
    };
  },

  normalize(payment = {}) {
    return ProviderPayment.create(payment);
  },
};
