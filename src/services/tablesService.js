import { ADMIN_TABLES_STORAGE_KEY } from "../constants/tables";
import { adminContent } from "../constants/adminContent";
import { rsvpContent } from "../constants/rsvpContent";
import { Confirmation, Guest, Table } from "../models";
import { confirmationRepository } from "../repositories/confirmationRepository";
import { tableRepository } from "../repositories/tableRepository";
import { normalizeAdminConfirmations } from "../utils/rsvpGroups";
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
export {
  assignGuestToSeat,
  assignGuestToSeatLocal,
  assignPendingGuestToSeat,
  assignPendingGuestToSeatLocal,
  getAssignableGuests,
  getPendingGuestRowKey,
  getPendingGuests,
  unassignGuestFromSeat,
  unassignGuestFromSeatLocal,
} from "./tableAssignmentService";
export { downloadTablesCsv } from "./tableExportService";

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
