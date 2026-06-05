/* eslint-disable */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getConfirmationsSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIRMATIONS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIRMATIONS_SHEET_NAME);
  }

  ensureHeader(sheet, CONFIRMATIONS_HEADERS);

  return sheet;
}

function getSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeader(sheet, GUESTS_HEADERS);

  return sheet;
}

const CONFIRMATIONS_HEADERS = ["groupName", "email", "phone", "guests"];

const CONFIRMATIONS_COLUMNS = {
  groupName: 0,
  email: 1,
  phone: 2,
  guests: 3,
};

const GUESTS_HEADERS = [
  "groupName",
  "name",
  "lastname",
  "allergies",
  "otherAllergies",
  "comments",
  "outboundBus",
  "returnBus",
  "menu",
  "table",
  "seat",
];

const GUESTS_COLUMNS = {
  groupName: 0,
  name: 1,
  lastname: 2,
  allergies: 3,
  otherAllergies: 4,
  comments: 5,
  outboundBus: 6,
  returnBus: 7,
  menu: 8,
  table: 9,
  seat: 10,
};

const TABLES_HEADERS = ["name", "tag", "shape", "seats", "notes"];

const PROVIDERS_HEADERS = [
  "providerId",
  "nombre",
  "categoria",
  "telefono",
  "email",
  "direccion",
  "web",
  "numeroCuenta",
  "activo",
  "createdAt",
  "updatedAt",
];

const PROVIDERS_COLUMNS = {
  providerId: 0,
  nombre: 1,
  categoria: 2,
  telefono: 3,
  email: 4,
  direccion: 5,
  web: 6,
  numeroCuenta: 7,
  activo: 8,
  createdAt: 9,
  updatedAt: 10,
};

const PROVIDER_SERVICES_HEADERS = [
  "serviceId",
  "providerId",
  "nombre",
  "precio",
  "numeroPlazos",
  "notas",
  "activo",
  "createdAt",
  "updatedAt",
];

const PROVIDER_SERVICES_COLUMNS = {
  serviceId: 0,
  providerId: 1,
  nombre: 2,
  precio: 3,
  numeroPlazos: 4,
  notas: 5,
  activo: 6,
  createdAt: 7,
  updatedAt: 8,
};

const PROVIDER_PAYMENTS_HEADERS = [
  "paymentId",
  "serviceId",
  "numeroPlazo",
  "importe",
  "fechaPrevista",
  "fechaPago",
  "pagado",
  "notas",
  "createdAt",
  "updatedAt",
];

const PROVIDER_PAYMENTS_COLUMNS = {
  paymentId: 0,
  serviceId: 1,
  numeroPlazo: 2,
  importe: 3,
  fechaPrevista: 4,
  fechaPago: 5,
  pagado: 6,
  notas: 7,
  createdAt: 8,
  updatedAt: 9,
};

function ensureHeader(sheet, headers) {
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = headers.some((header, index) => currentHeaders[index] !== header);

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function getTablesSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(TABLES_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(TABLES_SHEET_NAME);
  }

  ensureHeader(sheet, TABLES_HEADERS);

  return sheet;
}

function getProvidersSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(PROVIDERS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(PROVIDERS_SHEET_NAME);
  }

  ensureHeader(sheet, PROVIDERS_HEADERS);

  return sheet;
}

function getProviderServicesSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(PROVIDER_SERVICES_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(PROVIDER_SERVICES_SHEET_NAME);
  }

  ensureHeader(sheet, PROVIDER_SERVICES_HEADERS);

  return sheet;
}

function getProviderPaymentsSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(PROVIDER_PAYMENTS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(PROVIDER_PAYMENTS_SHEET_NAME);
  }

  ensureHeader(sheet, PROVIDER_PAYMENTS_HEADERS);

  return sheet;
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

function decodeGroupName(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  try {
    return Utilities.newBlob(Utilities.base64Decode(text)).getDataAsString("UTF-8").trim();
  } catch (err) {
    return text;
  }
}

function encodeGroupName(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  return Utilities.base64Encode(text, Utilities.Charset.UTF_8);
}

function encodeConfirmationForApi(confirmation) {
  const encodedGroupName = encodeGroupName(confirmation.groupName);

  return {
    groupName: encodedGroupName,
    email: confirmation.email || "",
    phone: confirmation.phone || "",
    guests: (confirmation.guests || []).map((guest) => ({
      ...guest,
      groupName: encodedGroupName,
    })),
  };
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

function getNormalizedConfirmationData(data) {
  const groupName = decodeGroupName(data.groupName);

  return {
    groupName,
    email: String(data.email || "").trim(),
    phone: String(data.phone || "").trim(),
    guests: Array.isArray(data.guests)
      ? data.guests.map((guest) => ({
          ...guest,
          groupName,
        }))
      : [],
  };
}

function deleteGroupRows(sheet, groupName) {
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i > 0; i--) {
    if (
      String(data[i][GUESTS_COLUMNS.groupName]).trim().toLowerCase() ===
      String(groupName).trim().toLowerCase()
    ) {
      sheet.deleteRow(i + 1);
    }
  }
}

function deleteConfirmationRow(sheet, groupName) {
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i > 0; i--) {
    if (
      String(data[i][CONFIRMATIONS_COLUMNS.groupName]).trim().toLowerCase() ===
      String(groupName).trim().toLowerCase()
    ) {
      sheet.deleteRow(i + 1);
    }
  }
}

function buildConfirmationFromRow(row, guests) {
  return {
    groupName: row[CONFIRMATIONS_COLUMNS.groupName] || "",
    email: row[CONFIRMATIONS_COLUMNS.email] || "",
    phone: row[CONFIRMATIONS_COLUMNS.phone] || "",
    guests: guests || [],
  };
}

function buildConfirmationRow(data) {
  return [data.groupName, data.email, data.phone, data.guests.length];
}

function buildGuestFromRow(row, confirmation) {
  const groupName = row[GUESTS_COLUMNS.groupName] || confirmation.groupName || "";

  return {
    groupName,
    email: confirmation.email || "",
    phone: confirmation.phone || "",
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
  };
}

function buildGuestRow(data, guest) {
  return [
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
  ];
}

function normalizeTableShape(value) {
  const shape = String(value || "").trim();

  return shape === "round" || shape === "rectangular" ? shape : "rectangular";
}

function buildTableFromRow(row) {
  const name = row[0] || "";

  return {
    name,
    group: row[1] || "",
    tag: row[1] || "",
    shape: normalizeTableShape(row[2]),
    seatCount: Math.max(Number(row[3]) || 0, 0),
    notes: row[4] || "",
  };
}

function deleteAllTableRows(sheet) {
  deleteDataRows(sheet);
}

function deleteDataRows(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

function isTruthySheetValue(value) {
  const text = String(value || "").trim().toLowerCase();

  return value === true || text === "true" || text === "si" || text === "sÃ­" || text === "1";
}

function isActiveSheetValue(value) {
  const text = String(value || "").trim().toLowerCase();

  return !text || isTruthySheetValue(value);
}

function getProviderTimestamp(value, fallback) {
  return String(value || fallback || new Date().toISOString());
}
