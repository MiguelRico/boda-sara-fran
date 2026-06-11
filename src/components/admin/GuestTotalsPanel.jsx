import {
  AlertTriangle,
  Beef,
  BusFront,
  Fish,
  MailCheck,
  MessageCircle,
  UsersRound,
} from "lucide-react";

import { adminContent } from "../../constants/adminContent";
import { AdminMetricGrid, AdminMetricGridSkeleton } from "./AdminMetricGrid";

export default function GuestTotalsPanel({ loading, stats }) {
  const metrics = adminContent.guests.overview.metrics;

  return (
    <section className="premium-card mt-4 mb-5">
      <p className="section-eyebrow mb-2">
        {adminContent.guests.overview.eyebrow}
      </p>
      <h2 className="mb-5 font-serif text-3xl leading-none text-[var(--color-accent-dark)]">
        {adminContent.guests.overview.title}
      </h2>
      {loading ? (
        <AdminMetricGridSkeleton
          className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 xl:grid-cols-9"
          count={9}
        />
      ) : (
        <AdminMetricGrid
          className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 xl:grid-cols-9"
          items={[
            {
              emoji: <MailCheck size={22} strokeWidth={1.8} />,
              label: metrics.confirmations,
              value: stats.groupCount,
            },
            {
              emoji: <UsersRound size={22} strokeWidth={1.8} />,
              label: metrics.guests,
              value: stats.guestCount,
            },
            {
              emoji: <Beef size={22} strokeWidth={1.8} />,
              label: metrics.meat,
              value: stats.meatCount,
            },
            {
              emoji: <Fish size={22} strokeWidth={1.8} />,
              label: metrics.fish,
              value: stats.fishCount,
            },
            {
              emoji: <AlertTriangle size={22} strokeWidth={1.8} />,
              label: metrics.allergies,
              value: stats.allergyCount,
            },
            {
              emoji: <AlertTriangle size={22} strokeWidth={1.8} />,
              label: metrics.otherAllergies,
              value: stats.otherAllergyCount,
            },
            {
              emoji: <MessageCircle size={22} strokeWidth={1.8} />,
              label: metrics.comments,
              value: stats.commentsCount,
            },
            {
              emoji: <BusFront size={22} strokeWidth={1.8} />,
              label: metrics.outboundBus,
              value: stats.outboundBusCount,
            },
            {
              emoji: <BusFront size={22} strokeWidth={1.8} />,
              label: metrics.returnBus,
              value: stats.returnBusCount,
            },
          ]}
        />
      )}
    </section>
  );
}
