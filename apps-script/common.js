/* eslint-disable */
function getSheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
}

function jsonResponse(obj, e) {
  const json = JSON.stringify(obj);
  const callback = e && e.parameter.callback;

  if (
    callback &&
    /^[a-zA-Z_$][0-9a-zA-Z_$]*(\.[a-zA-Z_$][0-9a-zA-Z_$]*)*$/.test(callback)
  ) {
    return ContentService.createTextOutput(`${callback}(${json});`).setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    );
  }

  return ContentService.createTextOutput(json).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function readParam(value) {
  return decodeURIComponent(value || "").trim();
}

function validateAdmin(e) {
  const password = readParam(e.parameter.password || "");

  if (password !== ADMIN_PASSWORD) {
    return jsonResponse(
      {
        success: false,
        error: "Unauthorized",
        groups: [],
      },
      e,
    );
  }

  return null;
}

function normalizeAllergies(allergies) {
  if (!Array.isArray(allergies)) return "";

  return allergies.filter(Boolean).join(", ");
}

function parseAllergies(value) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeMenu(value) {
  const menu = String(value || "").trim();

  return menu === "Carne" || menu === "Pescado" ? menu : "";
}

function deleteGroupRows(sheet, groupId) {
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i > 0; i--) {
    if (String(data[i][0]).trim().toLowerCase() === String(groupId).trim().toLowerCase()) {
      sheet.deleteRow(i + 1);
    }
  }
}

function buildGuestFromRow(row) {
  return {
    email: row[0] || "",
    phone: row[1] || "",
    groupName: row[2] || "",
    name: row[3] || "",
    lastname: row[4] || "",
    allergies: parseAllergies(row[5]),
    otherAllergies: row[6] || "",
    comments: row[7] || "",
    outboundBus: row[8] || "No",
    returnBus: row[9] || "No",
    menu: normalizeMenu(row[11]),
    table: row[12] || "",
    seat: row[13] || "",
  };
}
