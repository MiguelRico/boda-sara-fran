import {
  AlertTriangle,
  Beef,
  BusFront,
  Fish,
  MailCheck,
  MessageCircle,
  UsersRound,
} from "lucide-react";

import { isMenuModuleEnabled } from "../../../config/features";
import {
  AdminMetricGrid,
  AdminMetricGridSkeleton,
  AdminMetricGroupCard,
  AdminMetricGroupCardSkeleton,
} from "../common";

export function GuestOverviewMetricGrid({ metrics, stats }) {
  return (
    <div className={getGuestMetricGridClass()}>
      <AdminMetricGroupCard
        className="col-span-4"
        icon={<MailCheck size={22} strokeWidth={1.8} />}
        items={[
          {
            icon: <MailCheck size={18} strokeWidth={1.8} />,
            label: metrics.confirmations,
            value: stats.groupCount,
          },
          {
            icon: <UsersRound size={18} strokeWidth={1.8} />,
            label: metrics.guests,
            value: stats.guestCount,
          },
          {
            icon: <MessageCircle size={18} strokeWidth={1.8} />,
            label: metrics.comments,
            value: stats.commentsCount,
          },
        ]}
        showHeaderIcon={false}
        showHeaderTitle={false}
        title={metrics.confirmations}
      />

      {isMenuModuleEnabled && (
        <AdminMetricGrid
          className="col-span-4 grid grid-cols-2 gap-2"
          items={getMenuMetricItems(metrics, stats)}
        />
      )}

      <AdminMetricGroupCard
        className="col-span-2"
        icon={<AlertTriangle size={22} strokeWidth={1.8} />}
        items={[
          {
            icon: <AlertTriangle size={18} strokeWidth={1.8} />,
            label: metrics.allergies,
            value: stats.allergyCount,
          },
          {
            icon: <AlertTriangle size={18} strokeWidth={1.8} />,
            label: metrics.otherAllergies,
            value: stats.otherAllergyCount,
          },
        ]}
        showHeaderIcon={false}
        showHeaderTitle={false}
        title={metrics.allergies}
      />

      <AdminMetricGroupCard
        className="col-span-2"
        icon={<BusFront size={22} strokeWidth={1.8} />}
        items={[
          {
            icon: <BusFront size={18} strokeWidth={1.8} />,
            label: metrics.outboundBus,
            value: stats.outboundBusCount,
          },
          {
            icon: <BusFront size={18} strokeWidth={1.8} />,
            label: metrics.returnBus,
            value: stats.returnBusCount,
          },
        ]}
        showHeaderIcon={false}
        showHeaderTitle={false}
        title="Transporte"
      />
    </div>
  );
}

export function GuestOverviewMetricGridSkeleton() {
  return (
    <div className={getGuestMetricGridClass()}>
      <AdminMetricGroupCardSkeleton
        className="col-span-4"
        showHeader={false}
      />
      {isMenuModuleEnabled && (
        <AdminMetricGridSkeleton
          className="col-span-4 grid grid-cols-2 gap-2"
          count={2}
        />
      )}
      <AdminMetricGroupCardSkeleton
        className="col-span-2"
        itemCount={2}
        showHeader={false}
      />
      <AdminMetricGroupCardSkeleton
        className="col-span-2"
        itemCount={2}
        showHeader={false}
      />
    </div>
  );
}

function getGuestMetricGridClass() {
  return "grid grid-cols-4 gap-2";
}

function getMenuMetricItems(metrics, stats) {
  return [
    {
      icon: <Beef size={22} strokeWidth={1.8} />,
      label: metrics.meat,
      value: stats.meatCount,
    },
    {
      icon: <Fish size={22} strokeWidth={1.8} />,
      label: metrics.fish,
      value: stats.fishCount,
    },
  ];
}
