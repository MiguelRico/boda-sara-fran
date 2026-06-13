import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Flag,
  UserRound,
} from "lucide-react";

import Card from "../Card";
import CardActions from "../CardActions";
import Chip from "../../ui/Chip";
import IconButton from "../../ui/IconButton";
import {
  TASK_CATEGORY_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "../../../constants/tasks";
import { adminContent } from "../../../constants/adminContent";
import { formatDate } from "../../../utils/formatters";

const priorityTone = {
  alta: "danger",
  media: "primary",
  baja: "secondary",
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
    <div className="grid gap-3 lg:grid-cols-2">
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
      detail={task.description}
      eyebrow={TASK_CATEGORY_LABELS[task.category] || task.category}
      title={task.title || "Tarea sin titulo"}
    >
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Chip
          icon={<Flag size={13} strokeWidth={1.8} />}
          strong={task.priority === "alta"}
          tone={priorityTone[task.priority]}
          value={TASK_PRIORITY_LABELS[task.priority] || task.priority}
        />
        <Chip
          icon={
            completed ? (
              <CheckCircle2 size={13} strokeWidth={1.8} />
            ) : (
              <Circle size={13} strokeWidth={1.8} />
            )
          }
          strong={!completed}
          tone={completed ? "secondary" : "primary"}
          value={TASK_STATUS_LABELS[task.status] || task.status}
        />
        <Chip
          icon={<CalendarDays size={13} strokeWidth={1.8} />}
          value={formatDate(task.maxDate)}
        />
        <Chip
          icon={<UserRound size={13} strokeWidth={1.8} />}
          value={task.responsible || "-"}
        />
      </div>
    </Card>
  );
}
