/* eslint-disable */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === "tables-save") {
      return saveTables(data);
    }

    const sheet = getSheet();

    if (!sheet) {
      throw new Error("Sheet not found");
    }

    const groupId = data.groupId || data.email;
    const now = new Date();

    deleteGroupRows(sheet, groupId);

    data.guests.forEach((guest) => {
      sheet.appendRow([
        data.email,
        data.phone,
        data.groupName,
        guest.name,
        guest.lastname,
        normalizeAllergies(guest.allergies),
        guest.otherAllergies || "",
        guest.comments || "",
        guest.outboundBus || "No",
        guest.returnBus || "No",
        now,
        normalizeMenu(guest.menu),
        guest.table || "",
        guest.seat || "",
      ]);
    });

    sendConfirmationEmail(data.email, groupId, data.guests);
    sendAdminNotification(data.groupName, data.email, data.phone, data.guests);

    return jsonResponse({
      success: true,
      groupId,
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message,
    });
  }
}

function saveTables(data) {
  if (data.password !== ADMIN_PASSWORD) {
    throw new Error("Unauthorized");
  }

  const sheet = getTablesSheet();
  const now = new Date();
  const tables = Array.isArray(data.tables) ? data.tables : [];

  deleteAllTableRows(sheet);

  tables.forEach((table) => {
    const id = String(table.id || table.name || "").trim();
    const name = String(table.name || table.id || "").trim();
    const seatCount = Math.max(Number(table.seatCount) || Number(table.seats && table.seats.length) || 0, 0);

    if (!id && !name) return;

    sheet.appendRow([
      id,
      name,
      normalizeTableGroup(table.group),
      normalizeTableShape(table.shape),
      seatCount,
      table.notes || "",
      now,
    ]);
  });

  return jsonResponse({
    success: true,
    tables: tables.length,
  });
}
