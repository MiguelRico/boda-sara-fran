import {
  AlertTriangle,
  Beef,
  BusFront,
  Fish,
  MailCheck,
  MessageCircle,
  UsersRound,
} from "lucide-react";

import { isMenuModuleEnabled } from "../../config/features";
import { AdminMetricGrid, AdminMetricGridSkeleton } from "./AdminMetricGrid";

export function GuestOverviewMetricGrid({ metrics, stats }) {
  return (
    <AdminMetricGrid
      className={getGuestMetricGridClass()}
      items={getGuestMetricItems(metrics, stats)}
    />
  );
}

export function GuestOverviewMetricGridSkeleton() {
  return (
    <AdminMetricGridSkeleton
      className={getGuestMetricGridClass()}
      count={isMenuModuleEnabled ? 9 : 7}
    />
  );
}

function getGuestMetricGridClass() {
  return isMenuModuleEnabled
    ? "grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 xl:grid-cols-9"
    : "grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-7";
}

function getGuestMetricItems(metrics, stats) {
  return [
    {
      icon: <MailCheck size={22} strokeWidth={1.8} />,
      label: metrics.confirmations,
      value: stats.groupCount,
    },
    {
      icon: <UsersRound size={22} strokeWidth={1.8} />,
      label: metrics.guests,
      value: stats.guestCount,
    },
    ...(isMenuModuleEnabled
      ? [
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
        ]
      : []),
    {
      icon: <AlertTriangle size={22} strokeWidth={1.8} />,
      label: metrics.allergies,
      value: stats.allergyCount,
    },
    {
      icon: <AlertTriangle size={22} strokeWidth={1.8} />,
      label: metrics.otherAllergies,
      value: stats.otherAllergyCount,
    },
    {
      icon: <MessageCircle size={22} strokeWidth={1.8} />,
      label: metrics.comments,
      value: stats.commentsCount,
    },
    {
      icon: <BusFront size={22} strokeWidth={1.8} />,
      label: metrics.outboundBus,
      value: stats.outboundBusCount,
    },
    {
      icon: <BusFront size={22} strokeWidth={1.8} />,
      label: metrics.returnBus,
      value: stats.returnBusCount,
    },
  ];
}
