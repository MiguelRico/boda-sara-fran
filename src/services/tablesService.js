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
      id: table.id || table.name,
      name: table.name || table.id,
      group: table.group,
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

export const getPendingGuests = (groups) =>
  Confirmation.getGuestsWithConfirmation(groups).filter(
    (guest) => !guest.table || !guest.seat,
  );

export const getAssignableGuests = (groups) =>
  Confirmation.getGuestsWithConfirmation(groups);

export const createTableFormFromTable = (table) => {
  const normalizedTable = Table.normalize(table);

  return {
    group: normalizedTable.group,
    name: normalizedTable.name || normalizedTable.id,
    notes: normalizedTable.notes,
    seatCount: normalizedTable.seats.length,
    shape: normalizedTable.shape,
  };
};

export const getTableKey = (table) => (table.id || table.name || "").trim();

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
    id: editingTable ? getTableKey(editingTable) : form.name,
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

export const assignPendingGuestToSeat = async ({
  groups,
  guestEmail,
  guestId,
  password,
  seatNumber,
  tableId,
  tables,
}) => {
  const confirmation = groups.find((group) => group.email === guestEmail);

  if (!confirmation) {
    throw new Error("Grupo de invitacion no encontrado");
  }

  const guestIndex = confirmation.guests.findIndex(
    (guest) => Guest.getFullName(guest) === guestId,
  );

  if (guestIndex === -1) {
    throw new Error("Invitado no encontrado en el grupo");
  }

  const table = tables.find((item) => getTableKey(item) === tableId);

  if (!table) {
    throw new Error("Mesa no encontrada");
  }

  const emptySeat = Table.getEmptySeats(table).find(
    (seat) => seat.seat === seatNumber,
  );

  if (!emptySeat) {
    throw new Error("El asiento no esta disponible");
  }

  const updatedConfirmation = {
    ...confirmation,
    guests: confirmation.guests.map((guest, index) =>
      index === guestIndex
        ? {
            ...guest,
            table: tableId,
            seat: seatNumber,
          }
        : guest,
    ),
  };

  await saveAdminGroup({
    group: updatedConfirmation,
    password,
  });
};

export const assignGuestToSeat = async ({
  groups,
  guestEmail,
  guestName,
  password,
  seat,
  table,
}) => {
  const tableId = getTableKey(table);
  const seatNumber = seat.seat;
  const updatedGroups = groups.map((group) => {
    let changed = false;
    const guests = group.guests.map((guest) => {
      const isSelectedGuest =
        group.email === guestEmail && Guest.getFullName(guest) === guestName;
      const isCurrentSeatGuest =
        guest.table === tableId && guest.seat === seatNumber;

      if (!isSelectedGuest && !isCurrentSeatGuest) return guest;

      changed = true;

      if (isSelectedGuest) {
        return {
          ...guest,
          table: tableId,
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
        table.name || table.id,
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
