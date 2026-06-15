import { adminContent } from "../../../constants/adminContent";
import { VerticalBarChart } from "../common";
import CollapsiblePanel from "../../ui/CollapsiblePanel";
import { SkeletonBlock } from "../../ui/TableSectionSkeleton";
import {
  GuestOverviewMetricGrid,
  GuestOverviewMetricGridSkeleton,
} from "./GuestOverviewMetrics";

const BAR_COLORS = [
  "#344531",
  "#556b52",
  "#6f8b6b",
  "#879d7e",
  "#bccdb5",
  "#c7d4bf",
  "#9caf88",
  "#71816d",
  "#dfe8d7",
];

const TRANSPORT_BAR_COLORS = ["#344531", "#6f8b6b", "#bccdb5"];

export default function GuestTotalsPanel({
  chartStats = null,
  loading,
  stats,
}) {
  const metrics = adminContent.guests.overview.metrics;
  const showCharts = Boolean(chartStats);

  return (
    <section className="premium-card">
      <p className="section-eyebrow mb-2">
        {adminContent.guests.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.guests.overview.title}
      </h2>
      {loading ? (
        <>
          <GuestOverviewMetricGridSkeleton />
          {showCharts ? <GuestChartsSkeleton /> : null}
        </>
      ) : (
        <>
          <GuestOverviewMetricGrid metrics={metrics} stats={stats} />
          {showCharts ? <GuestCharts chartStats={chartStats} /> : null}
        </>
      )}
    </section>
  );
}

function GuestCharts({ chartStats }) {
  const content = adminContent.stats.confirmations.charts;

  return (
    <div className="mt-3 grid gap-2">
      <CollapsiblePanel
        className="border-[var(--color-border)] bg-white/35"
        compact
        title={content.allergies}
      >
        <BarStatsCard
          emptyText={adminContent.guests.overview.emptyAllergies}
          items={chartStats.allergiesByType || []}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        className="border-[var(--color-border)] bg-white/35"
        compact
        title={content.transport}
      >
        <TransportCard stats={chartStats} />
      </CollapsiblePanel>
    </div>
  );
}

function GuestChartsSkeleton() {
  return (
    <div className="mt-3 grid gap-2">
      {Array.from({ length: 2 }).map((_, panelIndex) => (
        <div
          className="rounded-[1rem] border border-[var(--color-border)] bg-white/35 p-2.5"
          key={panelIndex}
        >
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock
              className={`h-5 rounded-full ${
                panelIndex === 0 ? "w-28" : "w-24"
              }`}
            />
            <SkeletonBlock className="h-[1.125rem] w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BarStatsCard({ emptyText, items }) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-[var(--color-border)] bg-white/45 p-3 text-xs text-[var(--color-muted)]">
        {emptyText}
      </p>
    );
  }

  return <VerticalBarChart items={items} />;
}

function TransportCard({ stats }) {
  const content = adminContent.stats.confirmations.charts;

  return (
    <div className="grid grid-cols-2 gap-2">
      <TransportGroup
        items={stats.outboundBusStats || []}
        title={content.outbound}
      />
      <TransportGroup
        items={stats.returnBusStats || []}
        title={content.return}
      />
    </div>
  );
}

function TransportGroup({ items, title }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-white/35 p-2">
      <p className="mb-2 truncate text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[var(--color-accent-dark)]">
        {title}
      </p>
      <BarChart colors={TRANSPORT_BAR_COLORS} compact items={items} />
    </div>
  );
}

function BarChart({ colors = BAR_COLORS, compact = false, items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={`grid ${compact ? "gap-1.5" : "gap-2"}`}>
      {items.map((item, index) => {
        const color = colors[index % colors.length];
        const width = total ? Math.max((item.value / total) * 100, 3) : 0;

        return (
          <div
            className={`rounded-lg bg-white/45 ${
              compact
                ? "p-1.5"
                : "border border-[var(--color-border)] p-2"
            }`}
            key={item.label}
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-[0.68rem] leading-tight">
              <span className="min-w-0 truncate text-[var(--color-muted)]">
                {item.label}
              </span>
              <span className="shrink-0 font-medium text-[var(--color-accent-dark)]">
                {item.value} / {total}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
              <span
                className="block h-full rounded-full"
                style={{ backgroundColor: color, width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
