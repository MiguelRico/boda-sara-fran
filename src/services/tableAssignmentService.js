import { adminContent } from "@/constants/adminContent";
import { Confirmation, Guest } from "@/models";
import { confirmationRepository } from "@/repositories/confirmationRepository";
import { getTableKey } from "@/validators/tableValidators";

export function getPendingGuestRowKey(guest) {
  return (
    guest.guestId ||
    guest.id ||
    `${guest.confirmationId || ""}-${guest.guestIndex ?? ""}-${Guest.getFullName(guest)}`
  );
}

const getGuestsWithGroupIndex = (confirmations) =>
  Confirmation.normalizeList(confirmations).flatMap((confirmation) =>
    confirmation.guests.map((guest, guestIndex) => ({
      ...guest,
      confirmationId: guest.confirmationId || confirmation.confirmationId,
      guestId: guest.guestId || guest.id,
      email: confirmation.email,
      confirmationName: confirmation.confirmationName,
      phone: confirmation.phone,
      guestIndex,
    })),
  );

const getNormalizedGuestIndex = (guestIndex) => {
  const rawGuestIndex = String(guestIndex ?? "").trim();

  if (!rawGuestIndex) return null;

  const normalizedGuestIndex = Number(rawGuestIndex);

  return Number.isInteger(normalizedGuestIndex) && normalizedGuestIndex >= 0
    ? normalizedGuestIndex
    : null;
};

const doesGuestMatch = ({
  group,
  guest,
  confirmationId,
  guestconfirmationName,
  guestId,
  guestIndex,
  guestName,
  index,
}) => {
  const groupConfirmationId = group.confirmationId || group.id;

  if (confirmationId && groupConfirmationId !== confirmationId) return false;
  if (!confirmationId && group.confirmationName !== guestconfirmationName) return false;

  const normalizedGuestId = String(guestId || "").trim();
  const currentGuestId = String(guest.guestId || guest.id || "").trim();

  if (normalizedGuestId && currentGuestId) {
    return normalizedGuestId === currentGuestId;
  }

  const normalizedGuestIndex = getNormalizedGuestIndex(guestIndex);

  if (normalizedGuestIndex !== null) {
    return index === normalizedGuestIndex;
  }

  const fullName = Guest.getFullName(guest);
  const possibleNames = [guestId, guestName].filter(Boolean);

  return possibleNames.some(
    (name) => name === fullName || name === guest.name,
  );
};

export const getPendingGuests = (confirmations) =>
  getGuestsWithGroupIndex(confirmations).filter((guest) => !guest.table || !guest.seat);

export const getAssignableGuests = (confirmations) => getGuestsWithGroupIndex(confirmations);

export const assignPendingGuestToSeatLocal = ({
  confirmationId,
  confirmations,
  guestconfirmationName,
  guestId,
  guestIndex,
  seatNumber,
  tableName,
  tables,
}) => {
  const confirmation = confirmations.find((group) => {
    const groupConfirmationId = group.confirmationId || group.id;

    return confirmationId
      ? groupConfirmationId === confirmationId
      : group.confirmationName === guestconfirmationName;
  });

  if (!confirmation) {
    throw new Error(adminContent.tables.errors.groupNotFound);
  }

  const nextGuestIndex = confirmation.guests.findIndex((guest, index) =>
    doesGuestMatch({
      group: confirmation,
      confirmationId,
      guest,
      guestconfirmationName,
      guestId,
      guestIndex,
      index,
    }),
  );

  if (nextGuestIndex === -1) {
    throw new Error(adminContent.tables.errors.guestNotFound);
  }

  const currentGuest = confirmation.guests[nextGuestIndex];

  if (!currentGuest) {
    throw new Error(adminContent.tables.errors.guestNotFound);
  }

  const table = tables.find(
    (item) => getTableKey(item) === String(tableName || "").trim(),
  );

  if (!table) {
    throw new Error(adminContent.tables.errors.tableNotFound);
  }

  const occupiedByAnotherGuest = table.seats.some(
    (seat) => seat.seat === seatNumber && seat.guest,
  );

  if (occupiedByAnotherGuest) {
    throw new Error(adminContent.tables.errors.seatUnavailable);
  }

  const updatedConfirmation = {
    ...confirmation,
    guests: confirmation.guests.map((guest, index) =>
      index === nextGuestIndex
        ? {
            ...guest,
            tableId: table.tableId || table.id || "",
            table: tableName,
            seat: seatNumber,
          }
        : guest,
    ),
  };

  return confirmations.map((group) =>
    (group.confirmationId || group.id) ===
    (updatedConfirmation.confirmationId || updatedConfirmation.id)
      ? updatedConfirmation
      : group,
  );
};

export const assignPendingGuestToSeat = async ({
  confirmationId,
  confirmations,
  guestconfirmationName,
  guestId,
  guestIndex,
  password,
  seatNumber,
  tableName,
  tables,
}) => {
  const updatedConfirmations = assignPendingGuestToSeatLocal({
    confirmations,
    confirmationId,
    guestconfirmationName,
    guestId,
    guestIndex,
    seatNumber,
    tableName,
    tables,
  });
  const updatedConfirmation = updatedConfirmations.find((group) =>
    confirmationId
      ? (group.confirmationId || group.id) === confirmationId
      : group.confirmationName === guestconfirmationName,
  );

  await confirmationRepository.saveAdmin({
    confirmation: updatedConfirmation,
    password,
  });

  return updatedConfirmations;
};

export const assignGuestToSeatLocal = ({
  confirmationId,
  confirmations,
  guestconfirmationName,
  guestId,
  guestIndex,
  guestName,
  seat,
  table,
}) => {
  const tableName = getTableKey(table);
  const seatNumber = seat.seat;
  let selectedGuestFound = false;
  let selectedOriginalAssignment = null;

  confirmations.forEach((group) => {
    group.guests.forEach((guest, index) => {
      const isSelectedGuest = doesGuestMatch({
        group,
        confirmationId,
        guest,
        guestconfirmationName,
        guestId,
        guestIndex,
        guestName,
        index,
      });

      if (isSelectedGuest) {
        selectedOriginalAssignment = {
          table: guest.table,
          tableId: guest.tableId,
          seat: guest.seat,
        };
      }
    });
  });

  const updatedConfirmations = confirmations.map((group) => {
    let changed = false;
    const guests = group.guests.map((guest, index) => {
      const isSelectedGuest = doesGuestMatch({
        group,
        confirmationId,
        guest,
        guestconfirmationName,
        guestId,
        guestIndex,
        guestName,
        index,
      });
      const isCurrentSeatGuest =
        getTableKey({ name: guest.table }) === tableName &&
        String(guest.seat) === String(seatNumber);

      if (!isSelectedGuest && !isCurrentSeatGuest) return guest;

      changed = true;

      if (isSelectedGuest) {
        selectedGuestFound = true;

        return {
          ...guest,
          tableId: table.tableId || table.id || "",
          table: tableName,
          seat: seatNumber,
        };
      }

      if (
        selectedOriginalAssignment?.table &&
        selectedOriginalAssignment?.seat
      ) {
        return {
          ...guest,
          table: selectedOriginalAssignment.table,
          tableId: selectedOriginalAssignment.tableId || "",
          seat: selectedOriginalAssignment.seat,
        };
      }

      return {
        ...guest,
        table: "",
        tableId: "",
        seat: "",
      };
    });

    return changed ? { ...group, guests } : group;
  });
  if (!selectedGuestFound) {
    throw new Error(adminContent.tables.errors.guestNotFound);
  }

  return updatedConfirmations;
};

export const assignGuestToSeat = async ({
  confirmationId,
  confirmations,
  guestconfirmationName,
  guestId,
  guestIndex,
  guestName,
  password,
  seat,
  table,
}) => {
  const updatedConfirmations = assignGuestToSeatLocal({
    confirmations,
    confirmationId,
    guestconfirmationName,
    guestId,
    guestIndex,
    guestName,
    seat,
    table,
  });
  const changedConfirmations = updatedConfirmations.filter(
    (group, index) => group !== confirmations[index],
  );

  await Promise.all(
    changedConfirmations.map((group) =>
      confirmationRepository.saveAdmin({
        confirmation: group,
        password,
      }),
    ),
  );

  return updatedConfirmations;
};

export const unassignGuestFromSeatLocal = ({ confirmations, seat, table }) => {
  const tableName = getTableKey(table);
  const seatNumber = seat.seat;
  const updatedConfirmations = confirmations.map((group) => {
    let changed = false;
    const guests = group.guests.map((guest) => {
      const isCurrentSeatGuest =
        getTableKey({ name: guest.table }) === tableName &&
        String(guest.seat) === String(seatNumber);

      if (!isCurrentSeatGuest) return guest;

      changed = true;

      return {
        ...guest,
        table: "",
        tableId: "",
        seat: "",
      };
    });

    return changed ? { ...group, guests } : group;
  });
  const changedConfirmations = updatedConfirmations.filter(
    (group, index) => group !== confirmations[index],
  );

  if (!changedConfirmations.length) {
    throw new Error(adminContent.tables.errors.noGuestAssignedToSeat);
  }

  return updatedConfirmations;
};

export const unassignGuestFromSeat = async ({ confirmations, password, seat, table }) => {
  const updatedConfirmations = unassignGuestFromSeatLocal({ confirmations, seat, table });
  const changedConfirmations = updatedConfirmations.filter(
    (group, index) => group !== confirmations[index],
  );

  await Promise.all(
    changedConfirmations.map((group) =>
      confirmationRepository.saveAdmin({
        confirmation: group,
        password,
      }),
    ),
  );

  return updatedConfirmations;
};
