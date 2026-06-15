import { adminContent } from "../constants/adminContent";
import { isMenuModuleEnabled } from "../config/features";
import { Confirmation, Guest } from "../models";
import { getConfirmationKey } from "../services/guestsService";
import { normalizeAdminConfirmations } from "./rsvpGroups";

export function getGuestItems(confirmations) {
  return normalizeAdminConfirmations(confirmations).flatMap((group) =>
    Guest.normalizeList(group.guests, { ensureOne: false }).map(
      (guest, guestIndex) => ({
        ...guest,
        email: group.email,
        group,
        confirmationName: group.confirmationName,
        guestIndex,
        phone: group.phone,
        rowId: `${group.confirmationId || group.id || group.confirmationName || "group"}-${guest.guestId || guest.id || guestIndex}`,
      }),
    ),
  );
}

export function findAdminRowForGroup(confirmations, group) {
  const targetKey = getConfirmationKey(group);

  return Confirmation.toAdminRows(confirmations).find(
    (row) => getConfirmationKey(row.group) === targetKey,
  );
}

export function removeGuestFromConfirmationList(confirmations, group, guestIndex) {
  const targetKey = getConfirmationKey(group);

  return Confirmation.normalizeList(confirmations).map((confirmation) =>
    getConfirmationKey(confirmation) === targetKey
      ? Confirmation.withRemovedGuest(confirmation, guestIndex)
      : confirmation,
  );
}

export function getDeleteTargetLabel(deleteTarget) {
  if (deleteTarget.type === "guest") {
    return Guest.getFullName(
      deleteTarget.guest,
      adminContent.guests.dialogs.fallbackGuestDeleteTarget,
    );
  }

  return (
    deleteTarget.group?.confirmationName ||
    deleteTarget.group?.email ||
    adminContent.guests.dialogs.fallbackConfirmationDeleteTarget
  );
}

export function mergeSingleGuestIntoGroup(group, editedGuest, guestIndex) {
  const normalizedGroup = Confirmation.normalize(group);
  const normalizedGuestIndex = Number(guestIndex);

  if (
    !editedGuest ||
    !Number.isInteger(normalizedGuestIndex) ||
    normalizedGuestIndex < 0
  ) {
    return normalizedGroup;
  }

  if (normalizedGuestIndex >= normalizedGroup.guests.length) {
    return Confirmation.normalize({
      ...normalizedGroup,
      guests: [
        ...normalizedGroup.guests,
        {
          ...editedGuest,
          confirmationId:
            normalizedGroup.confirmationId || normalizedGroup.id || "",
          confirmationName: normalizedGroup.confirmationName,
        },
      ],
    });
  }

  return Confirmation.normalize({
    ...normalizedGroup,
    guests: normalizedGroup.guests.map((guest, index) =>
      index === normalizedGuestIndex
        ? {
            ...editedGuest,
            confirmationId: guest.confirmationId || editedGuest.confirmationId,
            guestId: guest.guestId || guest.id || editedGuest.guestId,
            confirmationName:
              guest.confirmationName || editedGuest.confirmationName,
            id: guest.id || guest.guestId || editedGuest.id,
          }
        : guest,
    ),
  });
}

export function filterGuestItems(guests, query, filter) {
  const normalizedQuery = String(query || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  return guests.filter((guest) => {
    const searchableText = [
      guest.email,
      guest.phone,
      guest.confirmationName,
      Guest.getFullName(guest),
      isMenuModuleEnabled ? guest.menu : "",
    ]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const matchesQuery =
      !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesFilter =
      filter === "all" ||
      (filter === "allergies" && Guest.hasAllergies(guest)) ||
      (filter === "bus" && Guest.usesBus(guest)) ||
      (filter === "comments" && Guest.hasComments(guest));

    return matchesQuery && matchesFilter;
  });
}

export function buildGuestStats(rows, guests) {
  const menuGuests = isMenuModuleEnabled ? guests : [];

  return {
    allergyCount: guests.filter(
      (guest) => Guest.normalize(guest).allergies.length > 0,
    ).length,
    commentsCount: guests.filter(Guest.hasComments).length,
    fishCount: menuGuests.filter((guest) => guest.menu === "Pescado").length,
    groupCount: rows.length,
    guestCount: guests.length,
    meatCount: menuGuests.filter((guest) => guest.menu === "Carne").length,
    otherAllergyCount: guests.filter(Guest.hasOtherAllergies).length,
    outboundBusCount: guests.filter(
      (guest) => guest.outboundBus && guest.outboundBus !== "No",
    ).length,
    returnBusCount: guests.filter(
      (guest) => guest.returnBus && guest.returnBus !== "No",
    ).length,
  };
}

export function getGroupEmptyState(groupCount) {
  if (groupCount > 0) {
    return {
      text: adminContent.guests.list.emptyText,
      title: adminContent.guests.list.emptyTitle,
    };
  }

  return {
    text: adminContent.guests.list.noConfirmationsText,
    title: adminContent.guests.list.noConfirmationsTitle,
  };
}

export function getGuestListEmptyState(groupCount, guestCount, selectedGroup) {
  if (groupCount === 0) {
    return {
      text: adminContent.guests.guestList.noConfirmationsText,
      title: adminContent.guests.guestList.noConfirmationsTitle,
    };
  }

  if (!selectedGroup) {
    return {
      text: adminContent.guests.guestList.noSelectionText,
      title: adminContent.guests.guestList.noSelectionTitle,
    };
  }

  if (guestCount > 0) {
    return {
      text: adminContent.guests.guestList.noFilterText,
      title: adminContent.guests.list.emptyTitle,
    };
  }

  return {
    text: adminContent.guests.guestList.noGuestsText,
    title: adminContent.guests.guestList.noGuestsTitle,
  };
}
