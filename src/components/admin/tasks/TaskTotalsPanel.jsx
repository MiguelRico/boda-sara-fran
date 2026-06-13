import { CalendarDays, CheckCircle2, Circle, ListTodo, Siren } from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import { formatDate } from "../../../utils/formatters";
import { AdminMetricGrid, AdminMetricGridSkeleton } from "../AdminMetricGrid";

const TASK_METRIC_GRID_CLASS =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5";

export default function TaskTotalsPanel({ loading, stats }) {
  const metrics = adminContent.tasks.overview.metrics;

  return (
    <section className="premium-card">
      <p className="section-eyebrow mb-2">
        {adminContent.tasks.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.tasks.overview.title}
      </h2>
      {loading ? (
        <AdminMetricGridSkeleton className={TASK_METRIC_GRID_CLASS} count={5} />
      ) : (
        <AdminMetricGrid
          className={TASK_METRIC_GRID_CLASS}
          items={[
            {
              icon: <ListTodo size={22} strokeWidth={1.8} />,
              label: metrics.total,
              value: stats.totalCount,
            },
            {
              icon: <Circle size={22} strokeWidth={1.8} />,
              label: metrics.pending,
              value: stats.pendingCount,
            },
            {
              icon: <CheckCircle2 size={22} strokeWidth={1.8} />,
              label: metrics.completed,
              value: stats.completedCount,
            },
            {
              icon: <Siren size={22} strokeWidth={1.8} />,
              label: metrics.highPriority,
              value: stats.highPriorityPendingCount,
            },
            {
              icon: <CalendarDays size={22} strokeWidth={1.8} />,
              label: metrics.nextDate,
              value: formatDate(stats.nextTaskDate),
            },
          ]}
        />
      )}
    </section>
  );
}
