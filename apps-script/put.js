/* eslint-disable */
function routePut(data) {
  const entity = getRequestEntity(data);

  if (entity === "confirmations") {
    return saveConfirmation(data);
  }

  if (entity === "tables") {
    return saveTables(data);
  }

  throw new Error("Resource not supported");
}

function saveConfirmation(data) {
  const confirmationsSheet = getConfirmationsSheet();
  const guestsSheet = getSheet();
  const confirmation = getNormalizedConfirmationData(data);

  if (!confirmation.groupName) {
    throw new Error("Missing groupName");
  }

  deleteConfirmationRow(confirmationsSheet, confirmation.groupName);
  deleteGroupRows(guestsSheet, confirmation.groupName);

  confirmationsSheet.appendRow(buildConfirmationRow(confirmation));

  confirmation.guests.forEach((guest) => {
    guestsSheet.appendRow(buildGuestRow(confirmation, guest));
  });

  sendConfirmationEmail(
    confirmation.email,
    confirmation.groupName,
    confirmation.guests,
  );
  sendAdminNotification(
    confirmation.groupName,
    confirmation.email,
    confirmation.phone,
    confirmation.guests,
  );

  return jsonResponse({
    success: true,
    groupName: encodeGroupName(confirmation.groupName),
  });
}

function saveTables(data) {
  if (data.password !== ADMIN_PASSWORD) {
    throw new Error("Unauthorized");
  }

  const sheet = getTablesSheet();
  const tables = Array.isArray(data.tables) ? data.tables : [];

  deleteAllTableRows(sheet);

  tables.forEach((table) => {
    const name = String(table.name || "").trim();
    const tag = String(table.tag || table.group || "").trim();
    const seatCount = Math.max(
      Number(table.seatCount) ||
        Number(table.seats && table.seats.length) ||
        0,
      0,
    );

    if (!name) return;

    sheet.appendRow([
      name,
      tag,
      normalizeTableShape(table.shape),
      seatCount,
      table.notes || "",
    ]);
  });

  return jsonResponse({
    success: true,
    tables: tables.length,
  });
}
