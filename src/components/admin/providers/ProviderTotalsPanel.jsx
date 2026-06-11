import {
  BadgeEuro,
  BriefcaseBusiness,
  CalendarDays,
  Euro,
  ReceiptText,
  HandCoins,
  Coins,
  ReceiptEuro,
} from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { AdminMetricGrid, AdminMetricGridSkeleton } from "../AdminMetricGrid";

export default function ProviderTotalsPanel({ loading, stats }) {
  const metrics = adminContent.providers.overview.metrics;

  return (
    <section className="premium-card">
      <p className="section-eyebrow mb-2">
        {adminContent.providers.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.providers.overview.title}
      </h2>
      {loading ? (
        <AdminMetricGridSkeleton
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8"
          count={8}
        />
      ) : (
        <AdminMetricGrid
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8"
          items={[
            {
              emoji: <BriefcaseBusiness size={22} strokeWidth={1.8} />,
              label: metrics.providers,
              value: stats.providerCount,
            },
            {
              emoji: <BadgeEuro size={22} strokeWidth={1.8} />,
              label: metrics.services,
              value: stats.serviceCount,
            },
            {
              emoji: <Euro size={22} strokeWidth={1.8} />,
              label: metrics.budget,
              value: formatCurrency(stats.totalBudget),
            },
            {
              emoji: <HandCoins size={22} strokeWidth={1.8} />,
              label: metrics.paid,
              value: formatCurrency(stats.totalPaid),
            },
            {
              emoji: <ReceiptEuro size={22} strokeWidth={1.8} />,
              label: metrics.pending,
              value: formatCurrency(stats.totalPending),
            },
            {
              emoji: <Coins size={22} strokeWidth={1.8} />,
              label: metrics.nextPayments,
              value: stats.nextPaymentCount,
            },
            {
              emoji: <CalendarDays size={22} strokeWidth={1.8} />,
              label: metrics.nextPaymentDate,
              value: formatDate(stats.nextPaymentDate),
            },
            {
              emoji: <ReceiptText size={22} strokeWidth={1.8} />,
              label: metrics.nextPaymentAmount,
              value: formatCurrency(stats.nextPaymentAmount),
            },
          ]}
        />
      )}
    </section>
  );
}
