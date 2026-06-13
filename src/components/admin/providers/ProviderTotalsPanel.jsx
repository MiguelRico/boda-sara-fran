import {
  BadgeEuro,
  BriefcaseBusiness,
  CalendarDays,
  Euro,
  HandCoins,
  ReceiptEuro,
} from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { AdminMetricGrid, AdminMetricGridSkeleton } from "../AdminMetricGrid";

const PROVIDER_METRIC_GRID_CLASS = "grid grid-cols-2 gap-2 sm:gap-3";

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
          className={PROVIDER_METRIC_GRID_CLASS}
          count={6}
        />
      ) : (
        <div className="space-y-3">
          <AdminMetricGrid
            className={PROVIDER_METRIC_GRID_CLASS}
            items={[
              {
                icon: <BriefcaseBusiness size={22} strokeWidth={1.8} />,
                label: metrics.providers,
                value: stats.providerCount,
              },
              {
                icon: <BadgeEuro size={22} strokeWidth={1.8} />,
                label: metrics.services,
                value: stats.serviceCount,
              },
            ]}
          />

          <ProviderFinanceSummary metrics={metrics} stats={stats} />

          <AdminMetricGrid
            className="grid grid-cols-1 gap-2 sm:gap-3"
            items={[
              {
                detail: [
                  formatDate(stats.nextPaymentDate),
                  formatCurrency(stats.nextPaymentAmount),
                ].join(" · "),
                icon: <CalendarDays size={22} strokeWidth={1.8} />,
                label: metrics.nextService,
                value: getNextServiceLabel(stats),
              },
            ]}
          />
        </div>
      )}
    </section>
  );
}

function ProviderFinanceSummary({ metrics, stats }) {
  const items = [
    {
      icon: <Euro size={18} strokeWidth={1.8} />,
      label: metrics.budget,
      value: formatCurrency(stats.totalBudget),
    },
    {
      icon: <HandCoins size={18} strokeWidth={1.8} />,
      label: metrics.paid,
      value: formatCurrency(stats.totalPaid),
    },
    {
      icon: <ReceiptEuro size={18} strokeWidth={1.8} />,
      label: metrics.pending,
      value: formatCurrency(stats.totalPending),
    },
  ];

  return (
    <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3 sm:p-5">
      <p className="text-center text-xs leading-snug text-[var(--color-muted)] sm:uppercase sm:tracking-[0.16em]">
        {metrics.paymentStatus}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div className="min-w-0 text-center" key={item.label}>
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
              {item.icon}
            </div>
            <p className="mt-2 text-[0.66rem] leading-snug text-[var(--color-muted)] sm:text-xs">
              {item.label}
            </p>
            <p className="mt-1 break-words font-serif text-lg leading-none text-[var(--color-accent-dark)] sm:text-3xl">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function getNextServiceLabel(stats) {
  if (!stats.nextPaymentServiceName) return "-";

  if (!stats.nextPaymentProviderName) return stats.nextPaymentServiceName;

  return `${stats.nextPaymentServiceName} · ${stats.nextPaymentProviderName}`;
}
