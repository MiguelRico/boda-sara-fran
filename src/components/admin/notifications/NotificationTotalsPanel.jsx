import { Bell, BellOff, CircleAlert, CreditCard, MailCheck } from "lucide-react";

import { adminContent } from "../../../constants/adminContent";
import { GUESTS_TYPE } from "../../../models/AdminNotification";
import { AdminMetricGrid, AdminMetricGridSkeleton } from "../AdminMetricGrid";

const NOTIFICATION_METRIC_GRID_CLASS =
  "grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3";

export default function NotificationTotalsPanel({ loading, stats }) {
  const metrics = adminContent.notifications.overview.metrics;

  return (
    <section className="premium-card">
      <p className="section-eyebrow mb-2">
        {adminContent.notifications.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.notifications.overview.title}
      </h2>
      {loading ? (
        <AdminMetricGridSkeleton
          className={NOTIFICATION_METRIC_GRID_CLASS}
          count={6}
        />
      ) : (
        <AdminMetricGrid
          className={NOTIFICATION_METRIC_GRID_CLASS}
          items={[
            {
              icon: <Bell size={22} strokeWidth={1.8} />,
              label: metrics.total,
              value: stats.totalCount,
            },
            {
              icon: <Bell size={22} strokeWidth={1.8} />,
              label: metrics.read,
              value: stats.readCount,
            },
            {
              icon: <BellOff size={22} strokeWidth={1.8} />,
              label: metrics.unread,
              value: stats.unreadCount,
            },
            {
              icon: <CircleAlert size={22} strokeWidth={1.8} />,
              label: metrics.warning,
              value: stats.typeCounts.Aviso || 0,
            },
            {
              icon: <CreditCard size={22} strokeWidth={1.8} />,
              label: metrics.payment,
              value: stats.typeCounts.Pago || 0,
            },
            {
              icon: <MailCheck size={22} strokeWidth={1.8} />,
              label: metrics.confirmation,
              value: stats.typeCounts[GUESTS_TYPE] || 0,
            },
          ]}
        />
      )}
    </section>
  );
}
