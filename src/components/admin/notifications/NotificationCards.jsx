import { Bell, CalendarDays, Check, CircleAlert, CreditCard, MailCheck } from "lucide-react";

import Card from "../Card";
import IconButton from "../../ui/IconButton";
import { formatDate } from "../../../utils/formatters";

const typeIcons = {
  Aviso: CircleAlert,
  Pago: CreditCard,
  Confirmación: MailCheck,
};

export default function NotificationCards({
  emptyText,
  emptyTitle,
  notifications = [],
  onMarkRead,
  showActions = true,
}) {
  if (!notifications.length) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-5 text-center">
        <p className="font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
          {emptyTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
          showActions={showActions}
        />
      ))}
    </div>
  );
}

export function NotificationCard({
  notification,
  onMarkRead,
  showActions = true,
}) {
  const TypeIcon = typeIcons[notification.type] || Bell;

  return (
    <Card
      actions={
        showActions && !notification.read ? (
          <IconButton
            icon={<Check size={16} strokeWidth={1.8} />}
            label="Marcar como leída"
            onClick={() => onMarkRead?.(notification.id)}
            tone="primary"
            type="button"
          />
        ) : null
      }
      actionsPlacement="overlay"
      decorativeText={<TypeIcon size={72} strokeWidth={1.5} />}
      detail={notification.detail}
      eyebrow={notification.type}
      title={notification.title}
    >
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/60 px-3 py-2 text-xs text-[var(--color-muted)]">
          <CalendarDays size={14} strokeWidth={1.8} />
          <span>{formatDate(notification.date)}</span>
        </span>
        <span
          className={`inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-xs ${
            notification.read
              ? "border-[var(--color-border)] bg-white/45 text-[var(--color-muted)]"
              : "border-[var(--color-accent)] bg-[var(--color-accent-dark)] text-white"
          }`}
        >
          <Bell size={14} strokeWidth={1.8} />
          <span>{notification.read ? "Leída" : "Pendiente"}</span>
        </span>
      </div>
    </Card>
  );
}
