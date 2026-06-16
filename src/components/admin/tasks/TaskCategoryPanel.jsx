import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  CheckCircle2,
  ChevronDown,
  Flag,
  Siren,
} from "lucide-react";
import { useState } from "react";

import { adminContent } from "../../../constants/adminContent";
import TaskCards from "./TaskCards";

export default function TaskCategoryPanel({
  category,
  emptyText,
  emptyTitle,
  onDelete,
  onEdit,
  onToggleStatus,
  tasks,
}) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const summary = getCategorySummary(tasks);
  const panelHidden = reduceMotion
    ? { opacity: 0, height: 0 }
    : { opacity: 0, height: 0, y: -8, filter: "blur(6px)" };
  const panelVisible = reduceMotion
    ? { opacity: 1, height: "auto" }
    : { opacity: 1, height: "auto", y: 0, filter: "blur(0px)" };

  return (
    <section className="rounded-[1rem] border border-[var(--color-border)] bg-white/35 p-2">
      <button
        className="grid w-full grid-cols-[minmax(0,1fr)_8.75rem_auto] items-center gap-2 text-left"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="min-w-0 px-1">
          <span className="block truncate font-serif text-lg leading-none text-[var(--color-accent-dark)]">
            {category.label}
          </span>
        </span>
        <CategorySummary summary={summary} />
        <span className="flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-full bg-[var(--color-border-strong)] text-white transition">
          <ChevronDown
            className={`transition-transform ${open ? "rotate-180" : ""}`}
            size={16}
            strokeWidth={1.8}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate={panelVisible}
            className="overflow-hidden"
            exit={panelHidden}
            initial={panelHidden}
            key="task-category-content"
            transition={{
              duration: reduceMotion ? 0.18 : 0.46,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="mt-2">
              <TaskCards
                emptyText={emptyText}
                emptyTitle={emptyTitle}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                tasks={tasks}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function CategorySummary({ summary }) {
  return (
    <div className="grid w-[8.75rem] grid-cols-4 gap-1">
      <SummaryPill
        icon={<CheckCircle2 size={12} strokeWidth={2} />}
        label={adminContent.tasks.overview.metrics.completed}
        toneClassName="border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-[var(--shadow-button)]"
        value={summary.completed}
      />
      <SummaryPill
        icon={<Siren size={12} strokeWidth={2} />}
        label={adminContent.tasks.overview.priorityLabels.high}
        toneClassName="border-rose-200 bg-rose-100 text-rose-700"
        value={summary.alta}
      />
      <SummaryPill
        icon={<Flag size={12} strokeWidth={2} />}
        label={adminContent.tasks.overview.priorityLabels.medium}
        toneClassName="border-amber-200 bg-amber-100 text-amber-700"
        value={summary.media}
      />
      <SummaryPill
        icon={<ArrowDown size={12} strokeWidth={2} />}
        label={adminContent.tasks.overview.priorityLabels.low}
        toneClassName="border-[var(--color-border-strong)] bg-white/45 text-[var(--color-muted)]"
        value={summary.baja}
      />
    </div>
  );
}

function SummaryPill({ icon, label, toneClassName, value }) {
  return (
    <span
      aria-label={`${label}: ${value}`}
      className={`inline-flex h-7 w-8 items-center justify-center gap-0.5 rounded-full border text-[0.68rem] font-semibold leading-none ${toneClassName}`}
      title={`${label}: ${value}`}
    >
      {icon}
      <span>{value}</span>
    </span>
  );
}

function getCategorySummary(tasks) {
  return tasks.reduce(
    (summary, task) => ({
      ...summary,
      completed: summary.completed + (task.status === "completed" ? 1 : 0),
      [task.priority]: (summary[task.priority] || 0) + 1,
    }),
    {
      alta: 0,
      baja: 0,
      completed: 0,
      media: 0,
    },
  );
}
