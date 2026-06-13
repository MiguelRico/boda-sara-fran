import { ChevronDown } from "lucide-react";
import { useState } from "react";

import TaskCards from "./TaskCards";
import { adminContent } from "../../../constants/adminContent";

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

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-3 sm:p-4">
      <button
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="min-w-0">
          <span className="section-eyebrow block">
            {adminContent.tasks.list.categoryCount(tasks.length)}
          </span>
          <span className="block truncate font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
            {category.label}
          </span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white/60 text-[var(--color-accent-dark)]">
          <ChevronDown
            className={`transition-transform ${open ? "rotate-180" : ""}`}
            size={18}
            strokeWidth={1.8}
          />
        </span>
      </button>

      {open && (
        <div className="mt-4">
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
