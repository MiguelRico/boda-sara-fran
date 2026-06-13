import { CheckCircle2, ChevronDown, Flag, Siren } from "lucide-react";
import { useState } from "react";

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
  const [open, setOpen] = useState(true);
  const summary = getCategorySummary(tasks);

  return (
    <section className="rounded-[1rem] border border-[var(--color-border)] bg-white/35 p-2">
      <button
        className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-left"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="min-w-0 px-1">
          <span className="block truncate font-serif text-lg leading-none text-[var(--color-accent-dark)] sm:text-xl">
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

      {open && (
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
      )}
    </section>
  );
}

function CategorySummary({ summary }) {
  return (
    <div className="flex min-w-0 items-center justify-end gap-1">
      <SummaryPill
        icon={<CheckCircle2 size={12} strokeWidth={2} />}
        label="Completas"
        toneClassName="border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]"
        value={summary.completed}
      />
      <SummaryPill
        icon={<Siren size={12} strokeWidth={2} />}
        label="Alta"
        toneClassName="border-rose-200 bg-rose-100 text-rose-700"
        value={summary.alta}
      />
      <SummaryPill
        icon={<Flag size={12} strokeWidth={2} />}
        label="Media"
        toneClassName="border-amber-200 bg-amber-100 text-amber-700"
        value={summary.media}
      />
      <SummaryPill
        icon={<Flag size={12} strokeWidth={2} />}
        label="Baja"
        toneClassName="border-emerald-200 bg-emerald-100 text-emerald-700"
        value={summary.baja}
      />
    </div>
  );
}

function SummaryPill({ icon, label, toneClassName, value }) {
  return (
    <span
      aria-label={`${label}: ${value}`}
      className={`inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-full border px-2 text-[0.68rem] font-semibold leading-none ${toneClassName}`}
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
