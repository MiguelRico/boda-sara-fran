import {
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Flag,
  Siren,
  UserRound,
} from "lucide-react";

import { Card, CardActions } from "../common";
import Chip from "../../ui/Chip";
import IconButton from "../../ui/IconButton";
import { TASK_PRIORITY_LABELS } from "../../../constants/tasks";
import { adminContent } from "../../../constants/adminContent";
import { formatDate } from "../../../utils/formatters";

const priorityIcons = {
  alta: Siren,
  media: Flag,
  baja: ArrowDown,
};

export default function TaskCards({
  emptyText,
  emptyTitle,
  onDelete,
  onEdit,
  onToggleStatus,
  tasks = [],
}) {
  if (!tasks.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border-strong)] bg-white/35 p-6 text-center">
        <ClipboardList
          className="mx-auto mb-3 text-[var(--color-accent)]"
          size={28}
          strokeWidth={1.7}
        />
        <h3 className="font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
          {emptyTitle}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          task={task}
        />
      ))}
    </div>
  );
}

function TaskCard({ onDelete, onEdit, onToggleStatus, task }) {
  const completed = task.status === "completed";
  const PriorityIcon = priorityIcons[task.priority] || Flag;

  return (
    <Card
      actions={
        <CardActions
          className="grid shrink-0 grid-cols-3 gap-2 self-start"
          extraActions={
            <IconButton
              className="w-full min-w-0 basis-0 !shrink !gap-1.5 !px-3"
              icon={
                completed ? (
                  <CheckCircle2 size={16} strokeWidth={1.8} />
                ) : (
                  <Circle size={16} strokeWidth={1.8} />
                )
              }
              label={adminContent.tasks.actions.toggleComplete}
              onClick={(event) => {
                event.stopPropagation();
                onToggleStatus?.(task);
              }}
              showText={false}
              tone={completed ? "terciary" : "primary"}
              type="button"
            />
          }
          item={task}
          onDelete={onDelete}
          onEdit={onEdit}
          showText={false}
          stopPropagation
        />
      }
      actionsPlacement="overlay"
      decorativeText={<ClipboardList size={72} strokeWidth={1.5} />}
      eyebrow={
        <span className={getPriorityClassName(task.priority)}>
          <PriorityIcon size={13} strokeWidth={2} />
          {TASK_PRIORITY_LABELS[task.priority] || task.priority}
        </span>
      }
      title={task.title || adminContent.common.fallbacks.task}
    >
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Chip
          className="min-h-8"
          icon={<CalendarDays size={13} strokeWidth={1.8} />}
          value={formatDate(task.maxDate)}
        />
        <Chip
          className="min-h-8"
          icon={<UserRound size={13} strokeWidth={1.8} />}
          value={task.responsible || "-"}
        />
        {task.description && (
          <Chip
            className="col-span-2 min-h-8"
            icon={<ClipboardList size={13} strokeWidth={1.8} />}
            value={task.description}
            valueClassName="whitespace-normal break-words leading-snug"
          />
        )}
      </div>
    </Card>
  );
}

function getPriorityClassName(priority) {
  const baseClassName =
    "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[0.68rem] font-semibold leading-none";

  if (priority === "alta") {
    return `${baseClassName} border-rose-200 bg-rose-100 text-rose-700`;
  }

  if (priority === "media") {
    return `${baseClassName} border-amber-200 bg-amber-100 text-amber-700`;
  }

  return `${baseClassName} border-[var(--color-border-strong)] bg-white/45 text-[var(--color-muted)]`;
}
