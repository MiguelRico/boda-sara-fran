import {
  BadgeEuro,
  BriefcaseBusiness,
  CalendarDays,
  Coins,
  Euro,
  HandCoins,
  ReceiptEuro,
} from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import { PROVIDER_CATEGORY_LABELS } from "../../../constants/providers";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { SkeletonBlock } from "../../ui/TableSectionSkeleton";

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
        <div className="space-y-3">
          <ProviderGroupedSummarySkeleton />
          <ProviderGroupedSummarySkeleton />
          <ProviderNextServiceSummarySkeleton />
        </div>
      ) : (
        <div className="space-y-3">
          <ProviderOperationsSummary metrics={metrics} stats={stats} />
          <ProviderFinanceSummary metrics={metrics} stats={stats} />
          <ProviderNextServiceSummary metrics={metrics} stats={stats} />
        </div>
      )}
    </section>
  );
}

function ProviderGroupedSummarySkeleton() {
  return (
    <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3">
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="min-w-0 text-center" key={index}>
            <SkeletonBlock className="mx-auto h-8 w-8 rounded-full" />
            <SkeletonBlock className="mx-auto mt-2 h-3 w-14 rounded-full" />
            <SkeletonBlock className="mx-auto mt-2 h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </article>
  );
}

function ProviderNextServiceSummarySkeleton() {
  return (
    <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3 text-center">
      <SkeletonBlock className="mx-auto h-10 w-10 rounded-full" />
      <SkeletonBlock className="mx-auto mt-3 h-3 w-36 max-w-full rounded-full" />
      <SkeletonBlock className="mx-auto mt-3 h-8 w-40 max-w-full rounded-full" />
      <SkeletonBlock className="mx-auto mt-3 h-4 w-28 max-w-full rounded-full" />
    </article>
  );
}

function ProviderOperationsSummary({ metrics, stats }) {
  const items = [
    {
      icon: <BriefcaseBusiness size={18} strokeWidth={1.8} />,
      label: metrics.providers,
      value: stats.providerCount,
    },
    {
      icon: <BadgeEuro size={18} strokeWidth={1.8} />,
      label: metrics.services,
      value: stats.serviceCount,
    },
    {
      icon: <Coins size={18} strokeWidth={1.8} />,
      label: metrics.nextPayments,
      value: stats.paymentCount,
    },
  ];

  return <ProviderGroupedSummary items={items} />;
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

  return <ProviderGroupedSummary items={items} />;
}

function ProviderGroupedSummary({ items }) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div className="min-w-0 text-center" key={item.label}>
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
              {item.icon}
            </div>
            <p className="mt-2 text-[0.66rem] leading-snug text-[var(--color-muted)]">
              {item.label}
            </p>
            <p className="mt-1 break-words font-serif text-lg leading-none text-[var(--color-accent-dark)]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function ProviderNextServiceSummary({ metrics, stats }) {
  const serviceName = stats.nextPaymentServiceName || "-";
  const category =
    PROVIDER_CATEGORY_LABELS[stats.nextPaymentServiceCategory] ||
    stats.nextPaymentServiceCategory ||
    "-";
  const amount = formatCurrency(
    stats.nextPaymentServicePrice || stats.nextPaymentAmount,
  );

  return (
    <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
        <CalendarDays size={22} strokeWidth={1.8} />
      </div>
      <p className="mt-3 text-xs leading-snug text-[var(--color-muted)]">
        {metrics.nextService} ({formatDate(stats.nextPaymentDate)})
      </p>
      <p className="mt-2 break-words font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
        {serviceName}
      </p>
      <p className="mt-2 text-sm leading-snug text-[var(--color-muted)]">
        {category} · {amount}
      </p>
    </article>
  );
}
