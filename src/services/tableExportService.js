import { adminContent } from "@/constants/adminContent";
import { getTableGroupOption } from "@/constants/tables";
import { tableContent } from "@/constants/tableContent";
import { Guest, Table } from "@/models";

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
