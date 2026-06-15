import { adminContent } from "../constants/adminContent";
import { Provider, ProviderPayment, ProviderService } from "../models";
import { providerRepository } from "../repositories/providerRepository";
import { hasJsonChanged } from "../utils/objectSnapshot";
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
        serviceCategory: service.category || "",
        providerName: service.providerName || "",
        serviceName: service.name || "",
        servicePrice: Number(service.price) || 0,
      })),
    )
    .filter((payment) => !payment.paid && payment.date);

  if (!pendingPayments.length) {
    return {
      amount: 0,
      count: 0,
      date: "",
      providerName: "",
      serviceCategory: "",
      serviceName: "",
      servicePrice: 0,
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
    providerName: nextPayments[0]?.providerName || "",
    serviceCategory: nextPayments[0]?.serviceCategory || "",
    serviceName: nextPayments[0]?.serviceName || "",
    servicePrice: nextPayments[0]?.servicePrice || 0,
  };
}

export function getProviderNextPaymentInfo(provider) {
  return getNextPaymentInfoFromServices(Provider.normalize(provider).services);
}

export function buildProviderStats(providers) {
  const normalizedProviders = normalizeProviders(providers);
  const baseStats = normalizedProviders.reduce(
    (stats, provider) => {
      const providerTotal = getProviderTotal(provider);
      const providerPaid = getProviderPaidTotal(provider);
      const paidServiceCount = provider.services.filter(isServicePaid).length;
      const paymentCount = provider.services.reduce(
        (total, service) => total + service.paymentCount,
        0,
      );

      return {
        paidServiceCount: stats.paidServiceCount + paidServiceCount,
        paymentCount: stats.paymentCount + paymentCount,
        providerCount: stats.providerCount + 1,
        serviceCount: stats.serviceCount + provider.services.length,
        totalBudget: stats.totalBudget + providerTotal,
        totalPaid: stats.totalPaid + providerPaid,
        totalPending: stats.totalPending + getProviderPendingTotal(provider),
      };
    },
    {
      paidServiceCount: 0,
      paymentCount: 0,
      providerCount: 0,
      serviceCount: 0,
      totalBudget: 0,
      totalPaid: 0,
      totalPending: 0,
    },
  );
  const nextPayment = getNextPaymentInfoFromServices(
    normalizedProviders.flatMap((provider) =>
      provider.services.map((service) => ({
        ...service,
        category: provider.category,
        providerName: provider.name,
      })),
    ),
  );

  return {
    ...baseStats,
    categoryCount: getActiveProviderCategories(normalizedProviders),
    nextPaymentAmount: nextPayment.amount,
    nextPaymentCount: nextPayment.count,
    nextPaymentDate: nextPayment.date,
    nextPaymentProviderName: nextPayment.providerName,
    nextPaymentServiceCategory: nextPayment.serviceCategory,
    nextPaymentServiceName: nextPayment.serviceName,
    nextPaymentServicePrice: nextPayment.servicePrice,
  };
}

export function buildPendingProviderChanges(savedProviders, currentProviders) {
  const normalizedSavedProviders = normalizeProviders(savedProviders);
  const normalizedCurrentProviders = normalizeProviders(currentProviders);
  const savedById = new Map(
    normalizedSavedProviders.map((provider) => [provider.id, provider]),
  );
  const currentById = new Map(
    normalizedCurrentProviders.map((provider) => [provider.id, provider]),
  );
  const changes = [];

  currentById.forEach((provider, providerId) => {
    const savedProvider = savedById.get(providerId);
    const providerLabel =
      provider.name || adminContent.common.fallbacks.unnamed;

    if (!savedProvider) {
      changes.push(adminContent.common.changes.providerCreated(providerLabel));
      return;
    }

    if (hasJsonChanged(savedProvider, provider)) {
      changes.push(adminContent.common.changes.providerModified(providerLabel));
    }
  });

  savedById.forEach((provider, providerId) => {
    if (!currentById.has(providerId)) {
      changes.push(
        adminContent.common.changes.providerDeleted(
          provider.name || adminContent.common.fallbacks.unnamed,
        ),
      );
    }
  });

  return changes;
}

export function isServicePaid(service) {
  const price = Number(service?.price) || 0;
  const paid = getServicePaidTotal(service);

  return price > 0 && paid >= price;
}

export const loadProviders = async ({ password } = {}) => {
  const response = await providerRepository.findAll({ password });

  if (response?.success === false) {
    throw new Error(response.error || adminContent.providers.dialogs.loadError);
  }

  return normalizeProviders(response?.providers || []);
};

export const persistProviders = async ({ password, providers }) => {
  const normalizedProviders = normalizeProviders(providers);

  await providerRepository.saveAdmin({
    password,
    providers: normalizedProviders,
  });

  return normalizedProviders;
};
