import { ADMIN_TABLES_STORAGE_KEY } from "../constants/tables";
import { adminContent } from "../constants/adminContent";
import { tableContent } from "../constants/tableContent";
import { rsvpContent } from "../constants/rsvpContent";
import { Confirmation, Guest, Table } from "../models";
import { confirmationRepository } from "../repositories/confirmationRepository";
import { tableRepository } from "../repositories/tableRepository";
import { normalizeAdminConfirmations } from "../utils/rsvpGroups";
import { getTableGroupOption } from "../constants/tables";
import {
  getTableKey,
  validateTableForm,
} from "../validators/tableValidators";
import { getStableJson, hasJsonChanged } from "../utils/objectSnapshot";
import {
  getLocalStorageValue,
  setLocalStorageValue,
} from "../utils/browserStorage";

export { getTableKey, validateTableForm };

export const loadAdminTableConfirmations = async ({ password } = {}) => {
  const response = await confirmationRepository.findAll({
    password,
  });

  return normalizeAdminConfirmations(response);
};

export const loadAdminTables = async ({ password } = {}) => {
  const response = await tableRepository.findAll({ password });

  if (response?.success === false) {
    throw new Error(response.error || adminContent.tables.errors.load);
  }

  return Table.normalizeList(response?.tables || []);
};

export const readStoredTables = () => {
  try {
    return Table.normalizeList(
      JSON.parse(getLocalStorageValue(ADMIN_TABLES_STORAGE_KEY) || "[]"),
    );
  } catch {
    return [];
  }
};

export const saveStoredTables = (tables) => {
  setLocalStorageValue(
    ADMIN_TABLES_STORAGE_KEY,
    JSON.stringify(Table.normalizeList(tables)),
  );
};

export const persistAdminTables = async ({ password, tables }) => {
  await tableRepository.saveAdmin({
    password,
    tables: Table.normalizeList(tables).map((table) => ({
      id: table.id || table.tableId,
      tableId: table.tableId || table.id,
      name: table.name,
      group: table.group,
      tag: table.tag || table.group,
      shape: table.shape,
      seatCount: table.seats.length,
      notes: table.notes,
    })),
  });
};

export const buildTables = ({ confirmations, manualTables }) => {
  const guests = Confirmation.getGuestsWithConfirmation(confirmations);
  const assignedTables = Table.fromGuests(guests);

  return Table.mergeLists(manualTables, assignedTables);
};

export const buildTableStats = (tables) => Table.buildStats(tables);

const getConfirmationKey = (group) => group.confirmationId || group.id;

export function buildPendingTableChanges({
  currentConfirmations,
  currentManualTables,
  savedConfirmations,
  savedManualTables,
}) {
  const changes = [
    ...buildManualTableChanges(savedManualTables, currentManualTables),
    ...buildSeatAssignmentChanges(savedConfirmations, currentConfirmations),
  ];

  return changes.length ? changes : [];
}

function buildManualTableChanges(savedTables, currentTables) {
  const savedByKey = new Map(
    savedTables.map((table) => [getTableKey(table), table]),
  );
  const currentByKey = new Map(
    currentTables.map((table) => [getTableKey(table), table]),
  );
  const changes = [];

  currentByKey.forEach((table, tableKey) => {
    if (!tableKey) return;

    const savedTable = savedByKey.get(tableKey);

    if (!savedTable) {
      changes.push(adminContent.tables.changes.created(table.name));
      return;
    }

    if (hasJsonChanged(savedTable, table)) {
      changes.push(adminContent.tables.changes.modified(table.name));
    }
  });

  savedByKey.forEach((table, tableKey) => {
    if (tableKey && !currentByKey.has(tableKey)) {
      changes.push(adminContent.tables.changes.deleted(table.name));
    }
  });

  return changes;
}

function buildSeatAssignmentChanges(savedConfirmations, currentConfirmations) {
  const savedByConfirmationId = new Map(
    savedConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const seenChanges = new Set();
  const changes = [];

  currentConfirmations.forEach((group) => {
    const savedGroup = savedByConfirmationId.get(getConfirmationKey(group));
    const savedGuestsByKey = new Map(
      (savedGroup?.guests || []).map((guest, index) => [
        getGuestChangeKey(savedGroup, guest, index),
        guest,
      ]),
    );

    group.guests.forEach((guest, index) => {
      const guestKey = getGuestChangeKey(group, guest, index);
      const savedGuest = savedGuestsByKey.get(guestKey) || {};
      const previousAssignment = getGuestAssignmentLabel(savedGuest);
      const currentAssignment = getGuestAssignmentLabel(guest);

      if (previousAssignment === currentAssignment) return;

      const change = `${Guest.getFullName(
        guest,
        rsvpContent.guest.fallbackName(index + 1),
      )}: ${previousAssignment} -> ${currentAssignment}`;

      if (seenChanges.has(change)) return;

      seenChanges.add(change);
      changes.push(change);
    });
  });

  return changes;
}

function getGuestChangeKey(group = {}, guest = {}, index = 0) {
  return [
    getConfirmationKey(group),
    guest.guestId || guest.id || guest.email || "",
    guest.guestId || guest.id
      ? ""
      : `${index}:${Guest.getFullName(
          guest,
          rsvpContent.guest.fallbackName(index + 1),
        )}`,
  ]
    .filter(Boolean)
    .join(":");
}

export function getChangedConfirmations(savedConfirmations, currentConfirmations) {
  const savedByConfirmationId = new Map(
    savedConfirmations.map((group) => [
      getConfirmationKey(group),
      getStableJson(group),
    ]),
  );

  return currentConfirmations.filter(
    (group) =>
      savedByConfirmationId.get(getConfirmationKey(group)) !==
      getStableJson(group),
  );
}

function getGuestAssignmentLabel(guest = {}) {
  const table = String(guest.table || "").trim();
  const seat = String(guest.seat || "").trim();

  if (!table && !seat) return adminContent.tables.changes.noSeat;

  return adminContent.tables.changes.assignmentLabel({ seat, table });
}

export function getGuestsUnassignedBySeatReduction(table, seatCount) {
  const nextSeatCount = Number(seatCount) || 0;

  return table.seats
    .filter((seat) => seat.guest && Number(seat.seat) > nextSeatCount)
    .sort((left, right) => Number(left.seat) - Number(right.seat))
    .map((seat) => ({
      name: Guest.getFullName(seat.guest, adminContent.common.fallbacks.guest),
      seat: seat.seat,
    }));
}

export function unassignGuestsOutsideTableSize({
  confirmations,
  seatCount,
  table,
}) {
  const tableKey = getTableKey(table);
  const nextSeatCount = Number(seatCount) || 0;

  if (!tableKey || !nextSeatCount) return confirmations;

  return confirmations.map((group) => {
    let changed = false;
    const guests = group.guests.map((guest) => {
      const isRemovedSeat =
        getTableKey({ name: guest.table }) === tableKey &&
        Number(guest.seat) > nextSeatCount;

      if (!isRemovedSeat) return guest;

      changed = true;

      return {
        ...guest,
        table: "",
        seat: "",
      };
    });

    return changed ? { ...group, guests } : group;
  });
}

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

export const createTableFormFromTable = (table) => {
  const normalizedTable = Table.normalize(table);

  return {
    group: normalizedTable.group,
    name: normalizedTable.name,
    notes: normalizedTable.notes,
    seatCount: normalizedTable.seats.length,
    shape: normalizedTable.shape,
  };
};

export const upsertManualTable = ({ editingTable, form, manualTables }) => {
  const nextTable = Table.create({
    ...form,
    seatCount: form.seatCount,
  });

  if (!editingTable) {
    return [...manualTables, nextTable];
  }

  const editingTableKey = getTableKey(editingTable);
  const existingIndex = manualTables.findIndex(
    (table) => getTableKey(table) === editingTableKey,
  );

  if (existingIndex === -1) {
    return [...manualTables, nextTable];
  }

  return manualTables.map((table, index) =>
    index === existingIndex ? nextTable : table,
  );
};

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
  const updatedConfirmation = updatedConfirmations.find(
    (group) =>
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

export const downloadTablesCsv = (tables) => {
  const headers = tableContent.csv.headers;
  const lines = tables.flatMap((table) =>
    table.seats.map((seat) =>
      [
        table.name,
        getTableGroupOption(table.group)?.label || "",
        Table.getShapeLabel(table),
        table.notes,
        seat.seat,
        seat.guest
          ? Guest.getFullName(seat.guest, adminContent.common.fallbacks.guest)
          : "",
        seat.guest?.menu || "",
      ]
        .map(escapeCsvValue)
        .join(","),
    ),
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = tableContent.csv.filename;
  link.click();
  URL.revokeObjectURL(url);
};

const escapeCsvValue = (value) =>
  `"${String(value || "").replaceAll('"', '""')}"`;





