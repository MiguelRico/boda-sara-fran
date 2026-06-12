import {
  AlertTriangle,
  Beef,
  BusFront,
  Fish,
  Mail,
  MessageCircle,
  Phone,
  UsersRound,
} from "lucide-react";

import { GUEST_MENU_OPTIONS } from "../constants/rsvp";
import { isMenuModuleEnabled } from "../config/features";
import { Guest } from "../models";
import { getEmailHref, getPhoneHref } from "./contactLinks";

const iconSize = 13;
const iconStrokeWidth = 1.8;

export function getGroupSummaryChips(contact, guests) {
  const normalizedGuests = Guest.normalizeList(guests, { ensureOne: false });
  const guestCount = normalizedGuests.length;
  const allergiesCount = getGuestCountBy(normalizedGuests, Guest.hasAllergies);
  const commentsCount = getGuestCountBy(normalizedGuests, Guest.hasComments);
  const outboundBusCount = getGuestCountBy(
    normalizedGuests,
    (guest) => guest.outboundBus && guest.outboundBus !== "No",
  );
  const returnBusCount = getGuestCountBy(
    normalizedGuests,
    (guest) => guest.returnBus && guest.returnBus !== "No",
  );

  return [
    {
      className: "col-span-2",
      href: getEmailHref(contact.email),
      icon: <Mail size={iconSize} strokeWidth={iconStrokeWidth} />,
      key: "email",
      tone: "secondary",
      value: contact.email || "-",
    },
    {
      href: getPhoneHref(contact.phone),
      icon: <Phone size={iconSize} strokeWidth={iconStrokeWidth} />,
      key: "phone",
      tone: "secondary",
      value: contact.phone || "-",
    },
    {
      icon: <UsersRound size={iconSize} strokeWidth={iconStrokeWidth} />,
      key: "guests",
      strong: true,
      value: `${guestCount} ${guestCount === 1 ? "invitado" : "invitados"}`,
    },
    ...(isMenuModuleEnabled
      ? GUEST_MENU_OPTIONS.map((menu) => {
          const count = getGuestCountBy(
            normalizedGuests,
            (guest) => guest.menu === menu,
          );

          if (!count) return null;

          return {
            icon: getMenuIcon(menu),
            key: `menu-${menu}`,
            strong: true,
            value: `${menu}: ${count}`,
          };
        }).filter(Boolean)
      : []),
    allergiesCount
      ? {
          icon: <AlertTriangle size={iconSize} strokeWidth={iconStrokeWidth} />,
          key: "allergies",
          value: `Alergias: ${allergiesCount}`,
        }
      : null,
    commentsCount
      ? {
          icon: <MessageCircle size={iconSize} strokeWidth={iconStrokeWidth} />,
          key: "comments",
          value: `Notas: ${commentsCount}`,
        }
      : null,
    outboundBusCount
      ? {
          icon: <BusFront size={iconSize} strokeWidth={iconStrokeWidth} />,
          key: "outbound-bus",
          value: `Ida: ${outboundBusCount}`,
        }
      : null,
    returnBusCount
      ? {
          icon: <BusFront size={iconSize} strokeWidth={iconStrokeWidth} />,
          key: "return-bus",
          value: `Vuelta: ${returnBusCount}`,
        }
      : null,
  ].filter(Boolean);
}

export function getGuestSummaryChips(guest) {
  const normalizedGuest = Guest.normalize(guest);
  const allergies = normalizedGuest.allergies;
  const otherAllergies = normalizedGuest.otherAllergies.trim();
  const usesBus = Guest.usesBus(normalizedGuest);
  const comments = normalizedGuest.comments.trim();

  return [
    isMenuModuleEnabled && normalizedGuest.menu
      ? {
          icon: getMenuIcon(normalizedGuest.menu),
          key: "menu",
          strong: true,
          value: normalizedGuest.menu,
        }
      : null,
    ...allergies.map((allergy) => ({
      icon: <AlertTriangle size={iconSize} strokeWidth={iconStrokeWidth} />,
      key: `allergy-${allergy}`,
      value: allergy,
    })),
    otherAllergies
      ? {
          className: "col-span-2",
          icon: <AlertTriangle size={iconSize} strokeWidth={iconStrokeWidth} />,
          key: "other-allergies",
          value: otherAllergies,
          valueClassName: "whitespace-normal break-words",
        }
      : null,
    usesBus
      ? {
          icon: <BusFront size={iconSize} strokeWidth={iconStrokeWidth} />,
          key: "outbound-bus",
          value: `Ida: ${normalizedGuest.outboundBus || "No"}`,
        }
      : null,
    usesBus
      ? {
          icon: <BusFront size={iconSize} strokeWidth={iconStrokeWidth} />,
          key: "return-bus",
          value: `Vuelta: ${normalizedGuest.returnBus || "No"}`,
        }
      : null,
    comments
      ? {
          className: "col-span-2",
          icon: <MessageCircle size={iconSize} strokeWidth={iconStrokeWidth} />,
          key: "comments",
          value: comments,
          valueClassName: "whitespace-normal break-words",
        }
      : null,
  ].filter(Boolean);
}

export function getMenuIcon(menu) {
  const normalizedMenu = String(menu || "")
    .trim()
    .toLowerCase();

  if (normalizedMenu === "pescado") {
    return <Fish size={iconSize} strokeWidth={iconStrokeWidth} />;
  }

  if (normalizedMenu === "carne") {
    return <Beef size={iconSize} strokeWidth={iconStrokeWidth} />;
  }

  return null;
}

function getGuestCountBy(guests, predicate) {
  return guests.filter(predicate).length;
}
