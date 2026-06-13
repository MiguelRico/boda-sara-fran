import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Flag,
  Folder,
  ListTodo,
  Siren,
  Tag,
} from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import { TASK_CATEGORY_LABELS } from "../../../constants/tasks";
import { formatDate } from "../../../utils/formatters";
import { AdminMetricGrid, AdminMetricGridSkeleton } from "../AdminMetricGrid";

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
        <AdminMetricGridSkeleton className={TASK_METRIC_GRID_CLASS} count={19} />
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
              icon: <CheckCircle2 size={22} strokeWidth={1.8} />,
              label: metrics.completed,
              value: stats.completedCount,
            },
            {
              icon: <Circle size={22} strokeWidth={1.8} />,
              label: metrics.pending,
              value: stats.pendingCount,
            },
            {
              icon: <Siren size={22} strokeWidth={1.8} />,
              label: metrics.highPriority,
              value: stats.priorityCounts.alta,
            },
            {
              icon: <Flag size={22} strokeWidth={1.8} />,
              label: metrics.mediumPriority,
              value: stats.priorityCounts.media,
            },
            {
              icon: <Flag size={22} strokeWidth={1.8} />,
              label: metrics.lowPriority,
              value: stats.priorityCounts.baja,
            },
            ...stats.categoryCounts.map((category) => ({
              icon: <Folder size={22} strokeWidth={1.8} />,
              label: category.label,
              value: category.count,
            })),
            {
              icon: <Tag size={22} strokeWidth={1.8} />,
              label: metrics.nextCategory,
              value:
                TASK_CATEGORY_LABELS[stats.nextTaskCategory] ||
                stats.nextTaskCategory ||
                "-",
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
