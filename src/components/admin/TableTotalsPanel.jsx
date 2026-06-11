import { Armchair, CircleCheckBig, CircleDashed, Grid2X2 } from "lucide-react";

import { adminContent } from "../../constants/adminContent";
import { AdminMetricGrid, AdminMetricGridSkeleton } from "./AdminMetricGrid";

const TABLE_METRIC_GRID_CLASS =
  "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3";

export default function TableTotalsPanel({ loading, stats }) {
  return (
    <section className="premium-card">
      <p className="section-eyebrow mb-2">
        {adminContent.tables.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.tables.overview.title}
      </h2>
      {loading ? (
        <AdminMetricGridSkeleton
          count={4}
          className={TABLE_METRIC_GRID_CLASS}
        />
      ) : (
        <AdminMetricGrid
          className={TABLE_METRIC_GRID_CLASS}
          items={getTableSummaryItems(stats)}
        />
      )}
    </section>
  );
}

function getTableSummaryItems(stats) {
  return [
    {
      label: adminContent.tables.overview.metrics.tableCount,
      value: stats.totalTables,
      emoji: <Grid2X2 size={22} strokeWidth={1.8} />,
    },
    {
      label: adminContent.tables.overview.metrics.seatCount,
      value: stats.totalSeats,
      emoji: <Armchair size={22} strokeWidth={1.8} />,
    },
    {
      label: adminContent.tables.overview.metrics.assignedSeats,
      value: stats.assignedSeats,
      emoji: <CircleCheckBig size={22} strokeWidth={1.8} />,
    },
    {
      label: adminContent.tables.overview.metrics.pendingSeats,
      value: stats.pendingSeats,
      emoji: <CircleDashed size={22} strokeWidth={1.8} />,
    },
  ];
}
