import { Guest } from "./Guest";
import {
  DEFAULT_TABLE_SHAPE,
  TABLE_SHAPE_OPTIONS,
} from "../constants/tables";

const TABLE_DEFAULTS = {
  id: "",
  tableId: "",
  name: "",
  group: "",
  tag: "",
  notes: "",
  shape: DEFAULT_TABLE_SHAPE,
  seats: [],
};

const TABLE_SEAT_DEFAULTS = {
  seat: "",
  guest: null,
};

const normalizeString = (value) => (value == null ? "" : String(value));
const normalizeKey = (value) => normalizeString(value).trim().toLowerCase();
const getTableShapeOption = (shape) =>
  TABLE_SHAPE_OPTIONS.find((option) => option.value === shape) ||
  TABLE_SHAPE_OPTIONS.find((option) => option.value === DEFAULT_TABLE_SHAPE);

const compareNaturalText = (left, right) =>
  normalizeString(left).localeCompare(normalizeString(right), "es", {
    numeric: true,
    sensitivity: "base",
  });

export const Table = {
  create(overrides = {}) {
    const name = normalizeString(overrides.name || overrides.table).trim();
    const shape = getTableShapeOption(overrides.shape).value;
    const normalizedSeats = Table.normalizeSeats(overrides.seats);
    const hasExplicitSeatCount =
      overrides.seatCount !== undefined &&
      overrides.seatCount !== null &&
      String(overrides.seatCount).trim() !== "";
    const seats = hasExplicitSeatCount
      ? Table.resizeSeats(normalizedSeats, overrides.seatCount)
      : normalizedSeats;

    return {
      ...TABLE_DEFAULTS,
      id: normalizeString(overrides.tableId || overrides.id).trim(),
      tableId: normalizeString(overrides.tableId || overrides.id).trim(),
      name,
      group: normalizeString(
        overrides.group || overrides.tag || overrides.confirmationName,
      ).trim(),
      tag: normalizeString(
        overrides.tag || overrides.group || overrides.confirmationName,
      ).trim(),
      notes: normalizeString(overrides.notes).trim(),
      shape,
      seats,
    };
  },

  normalize(table = {}) {
    return Table.create(table);
  },

  normalizeList(tables) {
    return Array.isArray(tables)
      ? tables.map((table) => Table.normalize(table))
      : [];
  },

  resizeSeats(seats, seatCount) {
    const nextSeatCount = Math.max(Number(seatCount) || 0, 0);
    const seatsById = new Map(
      Table.normalizeSeats(seats).map((seat) => [seat.seat, seat]),
    );

    return Array.from({ length: nextSeatCount }, (_, index) => {
      const seatId = String(index + 1);

      return seatsById.get(seatId) || Table.createSeat(seatId);
    });
  },

  createSeat(overrides = {}) {
    if (typeof overrides === "string" || typeof overrides === "number") {
      return {
        ...TABLE_SEAT_DEFAULTS,
        seat: normalizeString(overrides).trim(),
      };
    }

    return {
      ...TABLE_SEAT_DEFAULTS,
      seat: normalizeString(overrides.seat || overrides.number).trim(),
      guest: overrides.guest ? Guest.normalize(overrides.guest) : null,
    };
  },

  normalizeSeats(seats) {
    return Array.isArray(seats)
      ? seats
          .map((seat) => Table.createSeat(seat))
          .filter((seat) => seat.seat)
          .sort((left, right) => compareNaturalText(left.seat, right.seat))
      : [];
  },

  fromGuests(guests) {
    const tablesByName = Guest.normalizeList(guests, { ensureOne: false }).reduce(
      (acc, guest) => {
        const tableName = normalizeString(guest.table).trim();

        if (!tableName) return acc;

        const seat = normalizeString(guest.seat).trim();
        const table = acc.get(tableName) || Table.create({ name: tableName });
        const seatId = seat || String(table.seats.length + 1);

        acc.set(
          tableName,
          Table.withAssignedGuest(table, seatId, {
            ...guest,
            table: tableName,
            seat: seatId,
          }),
        );

        return acc;
      },
      new Map(),
    );

    return Array.from(tablesByName.values()).sort((left, right) =>
      compareNaturalText(left.name, right.name),
    );
  },

  mergeLists(primaryTables, secondaryTables) {
    return Table.normalizeList([...primaryTables, ...secondaryTables]).reduce(
      (acc, table) => {
        const tableKey = normalizeKey(table.name);
        const existingIndex = acc.findIndex(
          (item) => normalizeKey(item.name) === tableKey,
        );

        if (!tableKey || existingIndex < 0) {
          return [...acc, table];
        }

        const existingTable = acc[existingIndex];
        const seatsById = new Map(
          existingTable.seats.map((seat) => [seat.seat, seat]),
        );

        table.seats.forEach((seat) => {
          const currentSeat = seatsById.get(seat.seat);

          seatsById.set(
            seat.seat,
            currentSeat?.guest && !seat.guest ? currentSeat : seat,
          );
        });

        return acc.map((item, index) =>
          index === existingIndex
            ? Table.create({
                ...table,
                ...existingTable,
                group: existingTable.group || table.group,
                seats: Array.from(seatsById.values()),
              })
            : item,
        );
      },
      [],
    );
  },

  withAssignedGuest(table, seat, guest) {
    const normalizedTable = Table.normalize(table);
    const seatId = normalizeString(seat).trim();

    if (!seatId) return normalizedTable;

    const assignedGuest = Guest.normalize({
      ...guest,
      table: normalizedTable.name,
      seat: seatId,
    });
    const existingSeatIndex = normalizedTable.seats.findIndex(
      (item) => item.seat === seatId,
    );
    const seats =
      existingSeatIndex >= 0
        ? normalizedTable.seats.map((item, index) =>
            index === existingSeatIndex
              ? Table.createSeat({ ...item, guest: assignedGuest })
              : item,
          )
        : [
            ...normalizedTable.seats,
            Table.createSeat({ seat: seatId, guest: assignedGuest }),
          ];

    return Table.create({
      ...normalizedTable,
      seats,
    });
  },

  getAssignedGuests(table) {
    return Table.normalize(table).seats
      .map((seat) => seat.guest)
      .filter(Boolean);
  },

  getEmptySeats(table) {
    return Table.normalize(table).seats.filter((seat) => !seat.guest);
  },

  buildStats(tables) {
    const normalizedTables = Table.normalizeList(tables);
    const totalSeats = normalizedTables.reduce(
      (sum, table) => sum + table.seats.length,
      0,
    );
    const assignedSeats = normalizedTables.reduce(
      (sum, table) => sum + Table.getAssignedGuests(table).length,
      0,
    );

    return {
      assignedSeats,
      pendingSeats: Math.max(totalSeats - assignedSeats, 0),
      totalSeats,
      totalTables: normalizedTables.length,
    };
  },

  getShapeLabel(table) {
    const normalizedTable = Table.normalize(table);

    return getTableShapeOption(normalizedTable.shape).label;
  },

  getSeatRange(shape) {
    return getTableShapeOption(shape).seatRange;
  },

  isSeatCountAllowed(shape, seatCount) {
    const range = Table.getSeatRange(shape);
    const normalizedSeatCount = Number(seatCount);

    return (
      normalizedSeatCount >= range.min && normalizedSeatCount <= range.max
    );
  },

};

