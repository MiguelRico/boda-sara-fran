export function downloadCsv({ filename, headers, rows }) {
  const csvRows = rows.map((row) => row.map(escapeCsvValue).join(","));
  const csv = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function escapeCsvValue(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
