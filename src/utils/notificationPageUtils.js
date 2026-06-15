import { adminContent } from "@/constants/adminContent";

export const READ_FILTERS = [
  { value: "", label: adminContent.notifications.filters.allTypes },
  { value: "unread", label: adminContent.notifications.overview.metrics.unread },
  { value: "read", label: adminContent.notifications.overview.metrics.read },
];

export function matchesNotificationFilters(
  notification,
  { query, readFilter, typeFilter },
) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery =
    !normalizedQuery ||
    [
      notification.title,
      notification.detail,
      notification.type,
      notification.date,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  const matchesType = !typeFilter || notification.type === typeFilter;
  const matchesRead =
    !readFilter ||
    (readFilter === "read" ? notification.read : !notification.read);

  return matchesQuery && matchesType && matchesRead;
}
