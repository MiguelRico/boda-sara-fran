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

export const getServicePaidTotal = ProviderService.getPaidTotal;

export function getServicePendingTotal(service) {
  return Math.max((Number(service?.price) || 0) - getServicePaidTotal(service), 0);
}

export function getProviderPendingTotal(provider) {
  return Math.max(getProviderTotal(provider) - getProviderPaidTotal(provider), 0);
}

export function getActiveProviderCategories(providers) {
  return new Set(normalizeProviders(providers).map((provider) => provider.category))
    .size;
}

export function getServicePaymentStats(service) {
  const normalizedService = ProviderService.normalize(service);
  const activePayments = normalizedService.payments.slice(
    0,
    normalizedService.paymentCount,
  );
  const paidCount = activePayments.filter((payment) => payment.paid).length;

  return {
    paidCount,
    pendingCount: activePayments.length - paidCount,
    totalCount: activePayments.length,
  };
}

export function getNextPaymentInfoFromServices(services) {
  const pendingPayments = normalizeServices(services)
    .flatMap((service) =>
      service.payments.slice(0, service.paymentCount).map((payment) => ({
        amount: Number(payment.amount) || 0,
        date: String(payment.date || "").trim(),
        paid: payment.paid,
      })),
    )
    .filter((payment) => !payment.paid && payment.date);

  if (!pendingPayments.length) {
    return {
      amount: 0,
      count: 0,
      date: "",
    };
  }

  const sortedDates = pendingPayments
    .map((payment) => payment.date)
    .sort((left, right) => left.localeCompare(right));
  const nextDate = sortedDates[0];
  const nextPayments = pendingPayments.filter(
    (payment) => payment.date === nextDate,
  );

  return {
    amount: nextPayments.reduce((total, payment) => total + payment.amount, 0),
    count: nextPayments.length,
    date: nextDate,
  };
}

export function getProviderNextPaymentInfo(provider) {
  return getNextPaymentInfoFromServices(Provider.normalize(provider).services);
}

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
