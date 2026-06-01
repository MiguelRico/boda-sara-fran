import { ADMIN_TABLES_STORAGE_KEY } from "../constants/tables";
import { Confirmation, Guest, Table } from "../models";
import {
  findAllGroups,
  findAllTables,
  saveAdminGroup,
  saveAdminTables,
} from "./rsvpService";
import { normalizeAdminGroups } from "../utils/rsvpGroups";
import { getTableGroupOption, TABLE_GROUP_OPTIONS } from "../constants/tables";

export const loadAdminTableGroups = async ({ password } = {}) => {
  const response = await findAllGroups({ password });

  return normalizeAdminGroups(response);
};

export const loadAdminTables = async ({ password } = {}) => {
  const response = await findAllTables({ password });

  if (response?.success === false) {
    throw new Error(response.error || "No se pudieron cargar las mesas.");
  }

  return Table.normalizeList(response?.tables || []);
};

export const readStoredTables = () => {
  try {
    return Table.normalizeList(
      JSON.parse(window.localStorage.getItem(ADMIN_TABLES_STORAGE_KEY) || "[]"),
    );
  } catch {
    return [];
  }
};

export const saveStoredTables = (tables) => {
  try {
    window.localStorage.setItem(
      ADMIN_TABLES_STORAGE_KEY,
      JSON.stringify(Table.normalizeList(tables)),
    );
  } catch {
    // Storage can be unavailable in private or locked browser contexts.
  }
};

export const persistAdminTables = async ({ password, tables }) => {
  saveStoredTables(tables);

  await saveAdminTables({
    password,
    tables: Table.normalizeList(tables).map((table) => ({
      name: table.name,
      group: table.group,
      tag: table.tag || table.group,
      shape: table.shape,
      seatCount: table.seats.length,
      notes: table.notes,
    })),
  });
};

export const buildTables = ({ groups, manualTables }) => {
  const guests = Confirmation.getGuestsWithConfirmation(groups);
  const assignedTables = Table.fromGuests(guests);

  return Table.mergeLists(manualTables, assignedTables);
};

export const buildTableStats = (tables) => Table.buildStats(tables);

const getGuestsWithGroupIndex = (groups) =>
  Confirmation.normalizeList(groups).flatMap((confirmation) =>
    confirmation.guests.map((guest, guestIndex) => ({
      ...guest,
      email: confirmation.email,
      groupName: confirmation.groupName,
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
  guestGroupName,
  guestId,
  guestIndex,
  guestName,
  index,
}) => {
  if (group.groupName !== guestGroupName) return false;

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

export const getPendingGuests = (groups) =>
  getGuestsWithGroupIndex(groups).filter((guest) => !guest.table || !guest.seat);

export const getAssignableGuests = (groups) => getGuestsWithGroupIndex(groups);

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

export const getTableKey = (table) => (table.name || "").trim();

export const validateTableForm = (form, tables, editingTable = null) => {
  const errors = {};
  const tableName = form.name.trim();
  const editingTableKey = editingTable ? getTableKey(editingTable) : "";
  const repeatedTable = tables.some(
    (table) =>
      getTableKey(table).toLowerCase() !== editingTableKey.toLowerCase() &&
      getTableKey(table).toLowerCase() === tableName.toLowerCase(),
  );

  if (!tableName) {
    errors.name = "Introduce el nombre de la mesa.";
  } else if (repeatedTable) {
    errors.name = "Ya existe una mesa con este nombre.";
  }

  if (!form.shape) {
    errors.shape = "Selecciona la forma de la mesa.";
  }

  if (!TABLE_GROUP_OPTIONS.some((option) => option.value === form.group)) {
    errors.group = "Selecciona un grupo de mesa.";
  }

  if (!Table.isSeatCountAllowed(form.shape, form.seatCount)) {
    const range = Table.getSeatRange(form.shape);

    errors.seatCount = `Selecciona entre ${range.min} y ${range.max} asientos.`;
  }

  return errors;
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

  return [
    ...manualTables.filter((table) => getTableKey(table) !== editingTableKey),
    nextTable,
  ];
};

export const assignPendingGuestToSeatLocal = ({
  groups,
  guestGroupName,
  guestId,
  guestIndex,
  seatNumber,
  tableName,
  tables,
}) => {
  const confirmation = groups.find((group) => group.groupName === guestGroupName);

  if (!confirmation) {
    throw new Error("Grupo de invitacion no encontrado");
  }

  const nextGuestIndex = confirmation.guests.findIndex((guest, index) =>
    doesGuestMatch({
      group: confirmation,
      guest,
      guestGroupName,
      guestId,
      guestIndex,
      index,
    }),
  );

  if (nextGuestIndex === -1) {
    throw new Error("Invitado no encontrado en el grupo");
  }

  const currentGuest = confirmation.guests[nextGuestIndex];

  if (!currentGuest) {
    throw new Error("Invitado no encontrado en el grupo");
  }

  const table = tables.find(
    (item) => getTableKey(item) === String(tableName || "").trim(),
  );

  if (!table) {
    throw new Error("Mesa no encontrada");
  }

  const occupiedByAnotherGuest = table.seats.some(
    (seat) => seat.seat === seatNumber && seat.guest,
  );

  if (occupiedByAnotherGuest) {
    throw new Error("El asiento no esta disponible");
  }

  const updatedConfirmation = {
    ...confirmation,
    guests: confirmation.guests.map((guest, index) =>
      index === nextGuestIndex
        ? {
            ...guest,
            table: tableName,
            seat: seatNumber,
          }
        : guest,
    ),
  };

  return groups.map((group) =>
    group.groupName === updatedConfirmation.groupName
      ? updatedConfirmation
      : group,
  );
};

export const assignPendingGuestToSeat = async ({
  groups,
  guestGroupName,
  guestId,
  guestIndex,
  password,
  seatNumber,
  tableName,
  tables,
}) => {
  const updatedGroups = assignPendingGuestToSeatLocal({
    groups,
    guestGroupName,
    guestId,
    guestIndex,
    seatNumber,
    tableName,
    tables,
  });
  const updatedConfirmation = updatedGroups.find(
    (group) => group.groupName === guestGroupName,
  );

  await saveAdminGroup({
    group: updatedConfirmation,
    password,
  });

  return updatedGroups;
};

export const assignGuestToSeatLocal = ({
  groups,
  guestGroupName,
  guestIndex,
  guestName,
  seat,
  table,
}) => {
  const tableName = getTableKey(table);
  const seatNumber = seat.seat;
  let selectedGuestFound = false;
  const updatedGroups = groups.map((group) => {
    let changed = false;
    const guests = group.guests.map((guest, index) => {
      const isSelectedGuest = doesGuestMatch({
        group,
        guest,
        guestGroupName,
        guestIndex,
        guestName,
        index,
      });
      const isCurrentSeatGuest =
        guest.table === tableName && guest.seat === seatNumber;

      if (!isSelectedGuest && !isCurrentSeatGuest) return guest;

      changed = true;

      if (isSelectedGuest) {
        selectedGuestFound = true;

        return {
          ...guest,
          table: tableName,
          seat: seatNumber,
        };
      }

      return {
        ...guest,
        table: "",
        seat: "",
      };
    });

    return changed ? { ...group, guests } : group;
  });
  if (!selectedGuestFound) {
    throw new Error("Invitado no encontrado en el grupo");
  }

  return updatedGroups;
};

export const assignGuestToSeat = async ({
  groups,
  guestGroupName,
  guestIndex,
  guestName,
  password,
  seat,
  table,
}) => {
  const updatedGroups = assignGuestToSeatLocal({
    groups,
    guestGroupName,
    guestIndex,
    guestName,
    seat,
    table,
  });
  const changedGroups = updatedGroups.filter(
    (group, index) => group !== groups[index],
  );

  await Promise.all(
    changedGroups.map((group) =>
      saveAdminGroup({
        group,
        password,
      }),
    ),
  );

  return updatedGroups;
};

export const unassignGuestFromSeatLocal = ({ groups, seat, table }) => {
  const tableName = getTableKey(table);
  const seatNumber = seat.seat;
  const updatedGroups = groups.map((group) => {
    let changed = false;
    const guests = group.guests.map((guest) => {
      const isCurrentSeatGuest =
        guest.table === tableName && guest.seat === seatNumber;

      if (!isCurrentSeatGuest) return guest;

      changed = true;

      return {
        ...guest,
        table: "",
        seat: "",
      };
    });

    return changed ? { ...group, guests } : group;
  });
  const changedGroups = updatedGroups.filter(
    (group, index) => group !== groups[index],
  );

  if (!changedGroups.length) {
    throw new Error("No hay ningun invitado asignado a este asiento");
  }

  return updatedGroups;
};

export const unassignGuestFromSeat = async ({ groups, password, seat, table }) => {
  const updatedGroups = unassignGuestFromSeatLocal({ groups, seat, table });
  const changedGroups = updatedGroups.filter(
    (group, index) => group !== groups[index],
  );

  await Promise.all(
    changedGroups.map((group) =>
      saveAdminGroup({
        group,
        password,
      }),
    ),
  );

  return updatedGroups;
};

export const downloadTablesCsv = (tables) => {
  const headers = [
    "mesa",
    "grupo",
    "forma",
    "notas",
    "asiento",
    "invitado",
    "menu",
  ];
  const lines = tables.flatMap((table) =>
    table.seats.map((seat) =>
      [
        table.name,
        getTableGroupOption(table.group)?.label || "",
        Table.getShapeLabel(table),
        table.notes,
        seat.seat,
        seat.guest ? Guest.getFullName(seat.guest, "Invitado") : "",
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
  link.download = "mesas.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const escapeCsvValue = (value) =>
  `"${String(value || "").replaceAll('"', '""')}"`;
