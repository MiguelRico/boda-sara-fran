import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Flag,
  ListTodo,
  Siren,
} from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import { TASK_CATEGORY_LABELS } from "../../../constants/tasks";
import { formatDate } from "../../../utils/formatters";
import {
  AdminMetricGrid,
  AdminMetricGridSkeleton,
  AdminMetricGroupCard,
  AdminMetricGroupCardSkeleton,
} from "../AdminMetricGrid";

const TASK_METRIC_GRID_CLASS =
  "grid grid-cols-3 gap-2 sm:gap-3";

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
        <div className={TASK_METRIC_GRID_CLASS}>
          <AdminMetricGridSkeleton
            className="col-span-3 grid grid-cols-3 gap-2 sm:gap-3"
            count={3}
          />
          <AdminMetricGroupCardSkeleton className="col-span-3" />
          <AdminMetricGridSkeleton
            className="col-span-3 grid grid-cols-1 gap-2 sm:gap-3"
            count={1}
          />
        </div>
      ) : (
        <div className={TASK_METRIC_GRID_CLASS}>
          <AdminMetricGrid
            className="col-span-3 grid grid-cols-3 gap-2 sm:gap-3"
            items={[
              {
                icon: <ListTodo size={22} strokeWidth={1.8} />,
                label: metrics.total,
                value: stats.totalCount,
              },
              {
                icon: <CheckCircle2 size={22} strokeWidth={1.8} />,
                label: metrics.completed,
                value: stats.completedCount,
              },
              {
                icon: <Circle size={22} strokeWidth={1.8} />,
                label: metrics.pending,
                value: stats.pendingCount,
              },
            ]}
          />
          <AdminMetricGroupCard
            className="col-span-3"
            icon={<Siren size={22} strokeWidth={1.8} />}
            items={[
              {
                icon: <Siren size={18} strokeWidth={1.8} />,
                label: metrics.highPriority,
                value: stats.priorityCounts.alta,
              },
              {
                icon: <Flag size={18} strokeWidth={1.8} />,
                label: metrics.mediumPriority,
                value: stats.priorityCounts.media,
              },
              {
                icon: <Flag size={18} strokeWidth={1.8} />,
                label: metrics.lowPriority,
                value: stats.priorityCounts.baja,
              },
            ]}
            title={metrics.priority}
          />
          <AdminMetricGrid
            className="col-span-3 grid grid-cols-1 gap-2 sm:gap-3"
            items={[
              {
                detail: formatDate(stats.nextTaskDate),
                icon: <CalendarDays size={22} strokeWidth={1.8} />,
                label: metrics.nextTask,
                value:
                  TASK_CATEGORY_LABELS[stats.nextTaskCategory] ||
                  stats.nextTaskCategory ||
                  "-",
              },
            ]}
          />
        </div>
      )}
    </section>
  );
}
