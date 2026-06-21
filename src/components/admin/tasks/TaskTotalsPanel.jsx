import {
  ArrowDown,
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
  AdminMetricGroupCard,
  AdminMetricGroupCardSkeleton,
} from "../common";

const TASK_METRIC_GRID_CLASS =
  "grid grid-cols-1 gap-2 md:grid-cols-3";

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
          <AdminMetricGroupCardSkeleton
            showHeader={false}
          />
          <AdminMetricGroupCardSkeleton
            showHeader={false}
          />
          <AdminMetricGroupCardSkeleton />
        </div>
      ) : (
        <div className={TASK_METRIC_GRID_CLASS}>
          <AdminMetricGroupCard
            icon={<ListTodo size={22} strokeWidth={1.8} />}
            items={[
              {
                icon: <ListTodo size={18} strokeWidth={1.8} />,
                label: metrics.total,
                value: stats.totalCount,
              },
              {
                icon: <CheckCircle2 size={18} strokeWidth={1.8} />,
                label: metrics.completed,
                value: stats.completedCount,
              },
              {
                icon: <Circle size={18} strokeWidth={1.8} />,
                label: metrics.pending,
                value: stats.pendingCount,
              },
            ]}
            showHeaderIcon={false}
            showHeaderTitle={false}
            title={metrics.total}
          />
          <AdminMetricGroupCard
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
                icon: <ArrowDown size={18} strokeWidth={1.8} />,
                label: metrics.lowPriority,
                value: stats.priorityCounts.baja,
              },
            ]}
            showHeaderIcon={false}
            showHeaderTitle={false}
            title={metrics.priority}
          />
          <TaskNextSummary metrics={metrics} stats={stats} />
        </div>
      )}
    </section>
  );
}

function TaskNextSummary({ metrics, stats }) {
  const category =
    TASK_CATEGORY_LABELS[stats.nextTaskCategory] ||
    stats.nextTaskCategory ||
    "-";

  return (
    <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-3 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)] md:h-8 md:w-8">
        <CalendarDays className="h-[22px] w-[22px] md:h-[18px] md:w-[18px]" strokeWidth={1.8} />
      </div>
      <p className="mt-3 text-xs leading-snug text-[var(--color-muted)] md:mt-2 md:text-[0.66rem]">
        {metrics.nextTask}
        <span className="hidden md:inline"> ({formatDate(stats.nextTaskDate)})</span>
      </p>
      <p className="mt-2 break-words font-serif text-2xl leading-none text-[var(--color-accent-dark)] md:mt-1 md:text-lg">
        {stats.nextTaskTitle || "-"}
        <span className="hidden md:inline"> ({category})</span>
      </p>
      <p className="mt-2 text-sm leading-snug text-[var(--color-muted)] md:hidden">
        {formatDate(stats.nextTaskDate)} · {category}
      </p>
    </article>
  );
}
