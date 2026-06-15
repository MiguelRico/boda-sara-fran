import { PROVIDER_CATEGORY_LABELS } from "../constants/providers";
import { adminContent } from "../constants/adminContent";
import { isServicePaid, normalizeProviders } from "../services/providersService";

export function filterProviders(providers, { category, query }) {
  const normalizedQuery = query.trim().toLowerCase();

  return providers.filter((provider) => {
    const matchesCategory = !category || provider.category === category;
    const searchableText = [
      provider.name,
      provider.email,
      provider.phone,
      PROVIDER_CATEGORY_LABELS[provider.category],
      ...provider.services.map((service) => service.name),
    ]
      .join(" ")
      .toLowerCase();

    return (
      matchesCategory &&
      (!normalizedQuery || searchableText.includes(normalizedQuery))
    );
  });
}

export function getProviderServices(providers) {
  return providers.flatMap((provider) =>
    provider.services.map((service) => ({
      ...service,
      category: provider.category,
      providerId: provider.id,
      providerName: provider.name || adminContent.common.fallbacks.provider,
    })),
  );
}

export function filterServices(services, { paymentStatus, query }) {
  const normalizedQuery = query.trim().toLowerCase();

  return services.filter((service) => {
    const matchesPaymentStatus =
      !paymentStatus ||
      (paymentStatus === "paid" && isServicePaid(service)) ||
      (paymentStatus === "unpaid" && !isServicePaid(service));
    const searchableText = String(service.name || "").toLowerCase();

    return (
      matchesPaymentStatus &&
      (!normalizedQuery || searchableText.includes(normalizedQuery))
    );
  });
}

export function getDeleteTargetName(deleteTarget) {
  if (deleteTarget.type === "service") {
    return deleteTarget.service?.name || adminContent.common.fallbacks.service;
  }

  return deleteTarget.provider?.name || adminContent.common.fallbacks.provider;
}

export function getProviderEmptyState(sourceCount) {
  if (sourceCount > 0) {
    return {
      text: adminContent.providers.list.noFilterText,
      title: adminContent.providers.list.emptyTitle,
    };
  }

  return {
    text: adminContent.providers.list.emptyText,
    title: adminContent.providers.list.emptyTitle,
  };
}

export function getServiceEmptyState(providerCount, serviceCount, selectedProvider) {
  if (providerCount === 0) {
    return {
      text: adminContent.providers.services.noProvidersText,
      title: adminContent.providers.services.noProvidersTitle,
    };
  }

  if (!selectedProvider) {
    return {
      text: adminContent.providers.services.noSelectionText,
      title: adminContent.providers.services.noSelectionTitle,
    };
  }

  if (serviceCount > 0) {
    return {
      text: adminContent.providers.services.noFilterText,
      title: adminContent.providers.services.emptyTitle,
    };
  }

  return {
    text: adminContent.providers.services.emptyText,
    title: adminContent.providers.services.emptyTitle,
  };
}

export function upsertProvider(providers, provider) {
  const exists = providers.some((item) => item.id === provider.id);

  if (!exists) return normalizeProviders([...providers, provider]);

  return normalizeProviders(
    providers.map((item) => (item.id === provider.id ? provider : item)),
  );
}
