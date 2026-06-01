/* eslint-disable */
function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureGuestsHeader(sheet);

  return sheet;
}

const GUESTS_HEADERS = [
  "Email",
  "Telefono",
  "Grupo",
  "Nombre",
  "Apellidos",
  "Alergias",
  "Otras alergias",
  "Comentarios",
  "Ida",
  "Vuelta",
  "Menu",
  "Mesa",
  "Asiento",
  "Usuario",
  "Fecha",
];

const GUESTS_COLUMNS = {
  email: 0,
  phone: 1,
  groupName: 2,
  name: 3,
  lastname: 4,
  allergies: 5,
  otherAllergies: 6,
  comments: 7,
  outboundBus: 8,
  returnBus: 9,
  menu: 10,
  table: 11,
  seat: 12,
  user: 13,
  date: 14,
};

function ensureGuestsHeader(sheet) {
  const currentHeaders = sheet
    .getRange(1, 1, 1, GUESTS_HEADERS.length)
    .getValues()[0];
  const needsHeader = GUESTS_HEADERS.some(
    (header, index) => currentHeaders[index] !== header,
  );

  if (needsHeader) {
    sheet.getRange(1, 1, 1, GUESTS_HEADERS.length).setValues([GUESTS_HEADERS]);
  }
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
    if (
      String(data[i][GUESTS_COLUMNS.email]).trim().toLowerCase() ===
      String(groupId).trim().toLowerCase()
    ) {
      sheet.deleteRow(i + 1);
    }
  }
}

function buildGuestFromRow(row) {
  return {
    email: row[GUESTS_COLUMNS.email] || "",
    phone: row[GUESTS_COLUMNS.phone] || "",
    groupName: row[GUESTS_COLUMNS.groupName] || "",
    name: row[GUESTS_COLUMNS.name] || "",
    lastname: row[GUESTS_COLUMNS.lastname] || "",
    allergies: parseAllergies(row[GUESTS_COLUMNS.allergies]),
    otherAllergies: row[GUESTS_COLUMNS.otherAllergies] || "",
    comments: row[GUESTS_COLUMNS.comments] || "",
    outboundBus: row[GUESTS_COLUMNS.outboundBus] || "No",
    returnBus: row[GUESTS_COLUMNS.returnBus] || "No",
    menu: normalizeMenu(row[GUESTS_COLUMNS.menu]),
    table: row[GUESTS_COLUMNS.table] || "",
    seat: row[GUESTS_COLUMNS.seat] || "",
    user: row[GUESTS_COLUMNS.user] || "",
    date: row[GUESTS_COLUMNS.date] || "",
  };
}

function buildGuestRow(data, guest, now) {
  return [
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
    normalizeMenu(guest.menu),
    guest.table || "",
    guest.seat || "",
    data.user || data.usuario || data.updatedBy || "",
    now,
  ];
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
