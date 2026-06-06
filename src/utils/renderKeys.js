import { Guest } from "../models";

export function getRenderKey(item, { fallback = "item", index = 0 } = {}) {
  if (!item) return `${fallback}-${index}`;

  if (item.rowId) return item.rowId;
  if (item.id) return item.id;
  if (item.name && Array.isArray(item.seats)) return getTableRenderKey(item);
  if (item.confirmationName) return item.confirmationName;

  return `${fallback}-${index}`;
}

export function getTableRenderKey(table) {
  const seatSignature = (table.seats || [])
    .map((seat) => {
      const guestName = seat.guest ? Guest.getFullName(seat.guest) : "";

      return `${seat.seat}:${guestName}`;
    })
    .join(",");

  return `${table.name}-${seatSignature}`;
}

