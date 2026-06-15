import {
  Bell,
  BellOff,
  CalendarDays,
  CircleAlert,
  CreditCard,
  MailCheck,
} from "lucide-react";

import { Card, CardActions, SelectableCardPage } from "../common";
import Chip from "../../ui/Chip";
import IconButton from "../../ui/IconButton";
import { formatDate } from "../../../utils/formatters";
import { CONFIRMATION_TYPE } from "../../../models/AdminNotification";
import { adminContent } from "../../../constants/adminContent";

const typeIcons = {
  Aviso: CircleAlert,
  Pago: CreditCard,
  [CONFIRMATION_TYPE]: MailCheck,
};

export default function NotificationCards({
  emptyText,
  emptyTitle,
  notifications = [],
  onDelete,
  onEdit,
  onToggleRead,
}) {
  return (
    <SelectableCardPage
      emptyIcon={BellOff}
      emptyState={{ text: emptyText, title: emptyTitle }}
      getKey={(notification) => notification.id}
      items={notifications}
      renderCard={(notification) => (
        <NotificationCard
          notification={notification}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleRead={onToggleRead}
        />
      )}
    />
  );
}

function NotificationCard({ notification, onDelete, onEdit, onToggleRead }) {
  const TypeIcon = typeIcons[notification.type] || Bell;
  const readLabel = notification.read
    ? "Marcar como no leída"
    : "Marcar como leída";

  return (
    <Card
      actions={
        <CardActions
          className="grid shrink-0 grid-cols-3 gap-2 self-start"
          extraActions={
            <IconButton
              className="w-full min-w-0 basis-0 !shrink !gap-1.5 !px-3"
              icon={
                notification.read ? (
                  <BellOff size={16} strokeWidth={1.8} />
                ) : (
                  <Bell size={16} strokeWidth={1.8} />
                )
              }
              label={readLabel}
              onClick={(event) => {
                event.stopPropagation();
                onToggleRead?.(notification);
              }}
              showText={false}
              tone={notification.read ? "terciary" : "primary"}
              type="button"
            />
          }
          item={notification}
          onDelete={onDelete}
          onEdit={onEdit}
          showText={false}
          stopPropagation
        />
      }
      actionsPlacement="overlay"
      decorativeText={<TypeIcon size={72} strokeWidth={1.5} />}
      eyebrow={notification.type}
      title={notification.title || adminContent.common.fallbacks.notification}
    >
      <NotificationChips notification={notification} />
    </Card>
  );
}

export function NotificationChips({ className = "mt-4", notification }) {
  const ReadIcon = notification.read ? Bell : BellOff;

  return (
    <div className={`${className} grid grid-cols-2 gap-2 text-xs`}>
      <Chip
        icon={<ReadIcon size={13} strokeWidth={1.8} />}
        strong={!notification.read}
        tone={notification.read ? "secondary" : "primary"}
        value={notification.read ? "Leída" : "No leída"}
      />
      <Chip
        icon={<CalendarDays size={13} strokeWidth={1.8} />}
        value={formatDate(notification.date)}
      />
      {notification.detail && (
        <Chip
          className="col-span-2"
          icon={<CircleAlert size={13} strokeWidth={1.8} />}
          value={notification.detail}
          valueClassName="whitespace-normal break-words leading-snug"
        />
      )}
    </div>
  );
}
