import { Guest } from "./Guest";
import {
  DEFAULT_TABLE_SHAPE,
  TABLE_GROUP_OPTIONS,
  TABLE_SHAPE_OPTIONS,
  TABLE_SHAPES,
} from "../constants/tables";

export const TABLE_DEFAULTS = {
  id: "",
  name: "",
  group: "",
  notes: "",
  shape: DEFAULT_TABLE_SHAPE,
  seats: [],
};

export const TABLE_SEAT_DEFAULTS = {
  seat: "",
  guest: null,
};

const normalizeString = (value) => (value == null ? "" : String(value));
const normalizeKey = (value) => normalizeString(value).trim().toLowerCase();
const getTableShapeOption = (shape) =>
  TABLE_SHAPE_OPTIONS.find((option) => option.value === shape) ||
  TABLE_SHAPE_OPTIONS.find((option) => option.value === DEFAULT_TABLE_SHAPE);
const getGuestKey = (guest) => {
  const normalizedGuest = Guest.normalize(guest);
  const name = Guest.getFullName(normalizedGuest);

  return normalizeKey(
    [
      normalizedGuest.email,
      normalizedGuest.groupName,
      name,
      normalizedGuest.menu,
    ]
      .filter(Boolean)
      .join("|"),
  );
};

const compareNaturalText = (left, right) =>
  normalizeString(left).localeCompare(normalizeString(right), "es", {
    numeric: true,
    sensitivity: "base",
  });

export const Table = {
  create(overrides = {}) {
    const id = normalizeString(
      overrides.id || overrides.table || overrides.name,
    ).trim();
    const name = normalizeString(overrides.name || overrides.table || id).trim();
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
      id,
      name,
      group: normalizeString(overrides.group || overrides.groupName).trim(),
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

  createSeatsFromCount(seatCount) {
    const nextSeatCount = Math.max(Number(seatCount) || 0, 0);

    return Array.from({ length: nextSeatCount }, (_, index) =>
      Table.createSeat(String(index + 1)),
    );
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
    const tablesById = Guest.normalizeList(guests, { ensureOne: false }).reduce(
      (acc, guest) => {
        const tableId = normalizeString(guest.table).trim();

        if (!tableId) return acc;

        const seat = normalizeString(guest.seat).trim();
        const table = acc.get(tableId) || Table.create({ id: tableId });
        const seatId = seat || String(table.seats.length + 1);

        acc.set(
          tableId,
          Table.withAssignedGuest(table, seatId, {
            ...guest,
            table: tableId,
            seat: seatId,
          }),
        );

        return acc;
      },
      new Map(),
    );

    return Array.from(tablesById.values()).sort((left, right) =>
      compareNaturalText(left.name || left.id, right.name || right.id),
    );
  },

  mergeLists(primaryTables, secondaryTables) {
    return Table.normalizeList([...primaryTables, ...secondaryTables]).reduce(
      (acc, table) => {
        const tableKey = normalizeKey(table.id || table.name);
        const existingIndex = acc.findIndex(
          (item) => normalizeKey(item.id || item.name) === tableKey,
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

  withSeatCount(table, seatCount) {
    const normalizedTable = Table.normalize(table);
    const nextSeatCount = Math.max(Number(seatCount) || 0, 0);
    const existingSeats = new Map(
      normalizedTable.seats.map((seat) => [seat.seat, seat]),
    );
    const seats = Array.from({ length: nextSeatCount }, (_, index) => {
      const seatId = String(index + 1);

      return existingSeats.get(seatId) || Table.createSeat(seatId);
    });

    return Table.create({
      ...normalizedTable,
      seats,
    });
  },

  withAssignedGuest(table, seat, guest) {
    const normalizedTable = Table.normalize(table);
    const seatId = normalizeString(seat).trim();

    if (!seatId) return normalizedTable;

    const assignedGuest = Guest.normalize({
      ...guest,
      table: normalizedTable.id || normalizedTable.name,
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

  withRemovedGuest(table, seat) {
    const normalizedTable = Table.normalize(table);
    const seatId = normalizeString(seat).trim();

    return Table.create({
      ...normalizedTable,
      seats: normalizedTable.seats.map((item) =>
        item.seat === seatId ? Table.createSeat({ ...item, guest: null }) : item,
      ),
    });
  },

  getSeat(table, seat) {
    const seatId = normalizeString(seat).trim();

    return (
      Table.normalize(table).seats.find((item) => item.seat === seatId) || null
    );
  },

  getSeatGuest(table, seat) {
    return Table.getSeat(table, seat)?.guest || null;
  },

  isSeatOccupied(table, seat) {
    return Boolean(Table.getSeatGuest(table, seat));
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

  toGuestAssignments(tables) {
    return Table.normalizeList(tables).flatMap((table) =>
      table.seats
        .filter((seat) => seat.guest)
        .map((seat) =>
          Guest.normalize({
            ...seat.guest,
            table: table.id || table.name,
            seat: seat.seat,
          }),
        ),
    );
  },

  validate(table) {
    const normalizedTable = Table.normalize(table);
    const errors = [];

    if (!normalizedTable.id && !normalizedTable.name) {
      errors.push("La mesa necesita identificador o nombre.");
    }

    if (!TABLE_SHAPES[normalizedTable.shape]) {
      errors.push("La forma de la mesa no es valida.");
    }

    if (
      normalizedTable.group &&
      !TABLE_GROUP_OPTIONS.some((option) => option.value === normalizedTable.group)
    ) {
      errors.push("El grupo de la mesa no es valido.");
    }

    if (
      normalizedTable.seats.length > 0 &&
      !Table.isSeatCountAllowed(normalizedTable.shape, normalizedTable.seats.length)
    ) {
      const range = Table.getSeatRange(normalizedTable.shape);

      errors.push(
        `La mesa ${Table.getShapeLabel(normalizedTable).toLowerCase()} necesita entre ${range.min} y ${range.max} asientos.`,
      );
    }

    const repeatedSeats = normalizedTable.seats
      .map((seat) => seat.seat)
      .filter((seat, index, seats) => seats.indexOf(seat) !== index);

    if (repeatedSeats.length) {
      errors.push(`Asientos duplicados: ${[...new Set(repeatedSeats)].join(", ")}.`);
    }

    return errors;
  },

  validateList(tables) {
    const normalizedTables = Table.normalizeList(tables);
    const guestKeys = new Set();
    const errors = normalizedTables.flatMap((table) => Table.validate(table));

    normalizedTables.forEach((table) => {
      table.seats.forEach((seat) => {
        if (!seat.guest) return;

        const guestKey = getGuestKey(seat.guest);

        if (guestKey && guestKeys.has(guestKey)) {
          errors.push(
            `${Guest.getFullName(seat.guest, "Invitado")} aparece en mas de un asiento.`,
          );
        }

        guestKeys.add(guestKey);
      });
    });

    return errors;
  },
};
