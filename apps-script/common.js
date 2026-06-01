/* eslint-disable */
function getSheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
}

function getTablesSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(TABLES_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(TABLES_SHEET_NAME);
  }

  ensureTablesHeader(sheet);

  return sheet;
}

function ensureTablesHeader(sheet) {
  const headers = [
    "id",
    "name",
    "group",
    "shape",
    "seatCount",
    "notes",
    "updatedAt",
  ];
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = headers.some((header, index) => currentHeaders[index] !== header);

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
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

function normalizeTableShape(value) {
  const shape = String(value || "").trim();

  return shape === "round" || shape === "rectangular" ? shape : "rectangular";
}

function normalizeTableGroup(value) {
  const group = String(value || "").trim();

  return group === "familia" || group === "amistades" || group === "trabajo"
    ? group
    : "familia";
}

function buildTableFromRow(row) {
  const id = row[0] || row[1] || "";
  const name = row[1] || row[0] || "";
  const shape = normalizeTableShape(row[3]);
  const seatCount = Math.max(Number(row[4]) || 0, 0);

  return {
    id,
    name,
    group: normalizeTableGroup(row[2]),
    shape,
    seatCount,
    notes: row[5] || "",
  };
}

function deleteAllTableRows(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}
