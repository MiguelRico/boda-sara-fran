const normalizeString = (value) => (value == null ? "" : String(value));
const createId = () =>
  `provider-payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createStableId = (overrides = {}) => {
  const explicitId = normalizeString(overrides.id || overrides.paymentId).trim();

  if (explicitId) return explicitId;

  const stableParts = [overrides.date, overrides.amount, overrides.paid]
    .map((part) => normalizeString(part).trim().toLowerCase())
    .filter(Boolean);

  return stableParts.length
    ? `provider-payment:${stableParts.join(":")}`
    : createId();
};

export const ProviderPayment = {
  create(overrides = {}) {
    const id = createStableId(overrides);

    return {
      id,
      paymentId: overrides.paymentId || overrides.id || id,
      amount: normalizeString(overrides.amount),
      date: normalizeString(overrides.date),
      paid: Boolean(overrides.paid),
    };
  },

  normalize(payment = {}) {
    return ProviderPayment.create(payment);
  },
};
