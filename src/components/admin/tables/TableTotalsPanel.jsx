import { Armchair, CircleCheckBig, CircleDashed, Grid2X2 } from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import {
  AdminMetricGroupCard,
  AdminMetricGroupCardSkeleton,
} from "../common";

const TABLE_METRIC_GRID_CLASS = "grid grid-cols-4 gap-2";

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
        <div className={TABLE_METRIC_GRID_CLASS}>
          <AdminMetricGroupCardSkeleton
            className="col-span-2"
            itemCount={2}
            showHeader={false}
          />
          <AdminMetricGroupCardSkeleton
            className="col-span-2"
            itemCount={2}
            showHeader={false}
          />
        </div>
      ) : (
        <div className={TABLE_METRIC_GRID_CLASS}>
          <AdminMetricGroupCard
            className="col-span-2"
            icon={<Grid2X2 size={22} strokeWidth={1.8} />}
            items={[
              {
                icon: <Grid2X2 size={18} strokeWidth={1.8} />,
                label: adminContent.tables.overview.metrics.tableCount,
                value: stats.totalTables,
              },
              {
                icon: <Armchair size={18} strokeWidth={1.8} />,
                label: adminContent.tables.overview.metrics.seatCount,
                value: stats.totalSeats,
              },
            ]}
            showHeaderIcon={false}
            showHeaderTitle={false}
            title={adminContent.tables.overview.metrics.tableCount}
          />
          <AdminMetricGroupCard
            className="col-span-2"
            icon={<CircleCheckBig size={22} strokeWidth={1.8} />}
            items={[
              {
                icon: <CircleCheckBig size={18} strokeWidth={1.8} />,
                label: adminContent.tables.overview.metrics.assignedSeats,
                value: stats.assignedSeats,
              },
              {
                icon: <CircleDashed size={18} strokeWidth={1.8} />,
                label: adminContent.tables.overview.metrics.pendingSeats,
                value: stats.pendingSeats,
              },
            ]}
            showHeaderIcon={false}
            showHeaderTitle={false}
            title={adminContent.tables.overview.metrics.assignedSeats}
          />
        </div>
      )}
    </section>
  );
}
