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

const CONFIRMATIONS_HEADERS = [
  "confirmationId",
  "confirmationName",
  "email",
  "phone",
  "guestCount",
  "createdAt",
  "updatedAt",
];

const CONFIRMATIONS_COLUMNS = {
  confirmationId: 0,
  confirmationName: 1,
  email: 2,
  phone: 3,
  guestCount: 4,
  createdAt: 5,
  updatedAt: 6,
};

const GUESTS_HEADERS = [
  "guestId",
  "confirmationId",
  "confirmationName",
  "name",
  "lastname",
  "allergies",
  "otherAllergies",
  "comments",
  "outboundBus",
  "returnBus",
  "menu",
  "createdAt",
  "updatedAt",
];

const GUESTS_COLUMNS = {
  guestId: 0,
  confirmationId: 1,
  confirmationName: 2,
  name: 3,
  lastname: 4,
  allergies: 5,
  otherAllergies: 6,
  comments: 7,
  outboundBus: 8,
  returnBus: 9,
  menu: 10,
  createdAt: 11,
  updatedAt: 12,
};

const TABLES_HEADERS = [
  "tableId",
  "name",
  "group",
  "tag",
  "shape",
  "seatCount",
  "notes",
  "createdAt",
  "updatedAt",
];

const TABLES_COLUMNS = {
  tableId: 0,
  name: 1,
  group: 2,
  tag: 3,
  shape: 4,
  seatCount: 5,
  notes: 6,
  createdAt: 7,
  updatedAt: 8,
};

const SEATS_HEADERS = [
  "seatId",
  "tableId",
  "seatNumber",
  "createdAt",
  "updatedAt",
];

const SEATS_COLUMNS = {
  seatId: 0,
  tableId: 1,
  seatNumber: 2,
  createdAt: 3,
  updatedAt: 4,
};

const TABLE_ASSIGNMENTS_HEADERS = [
  "assignmentId",
  "seatId",
  "tableId",
  "guestId",
  "confirmationId",
  "createdAt",
  "updatedAt",
];

const TABLE_ASSIGNMENTS_COLUMNS = {
  assignmentId: 0,
  seatId: 1,
  tableId: 2,
  guestId: 3,
  confirmationId: 4,
  createdAt: 5,
  updatedAt: 6,
};

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

function getSeatsSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SEATS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SEATS_SHEET_NAME);
  }

  ensureHeader(sheet, SEATS_HEADERS);

  return sheet;
}

function getTableAssignmentsSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(TABLE_ASSIGNMENTS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(TABLE_ASSIGNMENTS_SHEET_NAME);
  }

  ensureHeader(sheet, TABLE_ASSIGNMENTS_HEADERS);

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

function createEntityId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createSeatId(tableId, seatNumber) {
  return `${String(tableId || "").trim()}-seat-${String(seatNumber || "").trim()}`;
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function decodeConfirmationName(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  try {
    return Utilities.newBlob(Utilities.base64Decode(text)).getDataAsString("UTF-8").trim();
  } catch (err) {
    return text;
  }
}

function encodeConfirmationName(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  return Utilities.base64Encode(text, Utilities.Charset.UTF_8);
}

function encodeConfirmationForApi(confirmation) {
  const encodedConfirmationName = encodeConfirmationName(confirmation.confirmationName);

  return {
    confirmationId: confirmation.confirmationId || "",
    id: confirmation.confirmationId || "",
    confirmationName: encodedConfirmationName,
    email: confirmation.email || "",
    phone: confirmation.phone || "",
    guests: (confirmation.guests || []).map((guest) => ({
      ...guest,
      confirmationId: confirmation.confirmationId || guest.confirmationId || "",
      guestId: guest.guestId || guest.id || "",
      id: guest.guestId || guest.id || "",
      confirmationName: encodedConfirmationName,
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
        confirmations: [],
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
  const confirmationName = decodeConfirmationName(data.confirmationName);
  const confirmationId = String(data.confirmationId || data.id || "").trim();

  return {
    confirmationId,
    confirmationName,
    email: String(data.email || "").trim(),
    phone: String(data.phone || "").trim(),
    guests: Array.isArray(data.guests)
      ? data.guests.map((guest) => ({
          ...guest,
          confirmationId,
          confirmationName,
        }))
      : [],
  };
}

function deleteGuestRows(sheet, confirmation) {
  const data = sheet.getDataRange().getValues();
  const confirmationId = String(confirmation.confirmationId || "").trim().toLowerCase();

  if (!confirmationId) return;

  for (let i = data.length - 1; i > 0; i--) {
    const rowConfirmationId = String(data[i][GUESTS_COLUMNS.confirmationId] || "")
      .trim()
      .toLowerCase();

    if (rowConfirmationId === confirmationId) {
      sheet.deleteRow(i + 1);
    }
  }
}

function deleteConfirmationRow(sheet, confirmation) {
  const data = sheet.getDataRange().getValues();
  const confirmationId = String(confirmation.confirmationId || "").trim().toLowerCase();

  if (!confirmationId) return;

  for (let i = data.length - 1; i > 0; i--) {
    const rowConfirmationId = String(data[i][CONFIRMATIONS_COLUMNS.confirmationId] || "")
      .trim()
      .toLowerCase();

    if (rowConfirmationId === confirmationId) {
      sheet.deleteRow(i + 1);
    }
  }
}

function buildConfirmationFromRow(row, guests) {
  return {
    confirmationId: row[CONFIRMATIONS_COLUMNS.confirmationId] || "",
    confirmationName: row[CONFIRMATIONS_COLUMNS.confirmationName] || "",
    email: row[CONFIRMATIONS_COLUMNS.email] || "",
    phone: row[CONFIRMATIONS_COLUMNS.phone] || "",
    guests: guests || [],
  };
}

function buildConfirmationRow(data) {
  const now = getCurrentTimestamp();

  return [
    data.confirmationId,
    data.confirmationName,
    data.email,
    data.phone,
    data.guests.length,
    data.createdAt || now,
    now,
  ];
}

function buildGuestFromRow(row, confirmation, assignmentContext) {
  const confirmationName = row[GUESTS_COLUMNS.confirmationName] || confirmation.confirmationName || "";
  const confirmationId =
    row[GUESTS_COLUMNS.confirmationId] || confirmation.confirmationId || "";
  const guestId = row[GUESTS_COLUMNS.guestId] || "";
  const assignment = assignmentContext?.assignmentsByGuestId?.[guestId] || null;
  const table = assignment
    ? assignmentContext?.tablesById?.[assignment.tableId] || null
    : null;
  const seat = assignment
    ? assignmentContext?.seatsById?.[assignment.seatId] || null
    : null;

  return {
    confirmationId,
    guestId,
    id: guestId,
    confirmationName,
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
    tableId: assignment?.tableId || "",
    table: table?.name || "",
    seat: seat?.seatNumber || "",
  };
}

function buildGuestRow(data, guest) {
  const now = getCurrentTimestamp();
  const guestId = String(guest.guestId || guest.id || "").trim() || createEntityId("guest");

  return [
    guestId,
    data.confirmationId,
    data.confirmationName,
    guest.name,
    guest.lastname,
    normalizeAllergies(guest.allergies),
    guest.otherAllergies || "",
    guest.comments || "",
    guest.outboundBus || "No",
    guest.returnBus || "No",
    normalizeMenu(guest.menu),
    guest.createdAt || now,
    now,
  ];
}

function normalizeTableShape(value) {
  const shape = String(value || "").trim();

  return shape === "round" || shape === "rectangular" ? shape : "rectangular";
}

function buildTableFromRow(row) {
  const name = row[TABLES_COLUMNS.name] || "";

  return {
    id: row[TABLES_COLUMNS.tableId] || "",
    tableId: row[TABLES_COLUMNS.tableId] || "",
    name,
    group: row[TABLES_COLUMNS.group] || row[TABLES_COLUMNS.tag] || "",
    tag: row[TABLES_COLUMNS.tag] || row[TABLES_COLUMNS.group] || "",
    shape: normalizeTableShape(row[TABLES_COLUMNS.shape]),
    seatCount: Math.max(Number(row[TABLES_COLUMNS.seatCount]) || 0, 0),
    notes: row[TABLES_COLUMNS.notes] || "",
  };
}

function buildSeatFromRow(row) {
  return {
    seatId: row[SEATS_COLUMNS.seatId] || "",
    tableId: row[SEATS_COLUMNS.tableId] || "",
    seatNumber: row[SEATS_COLUMNS.seatNumber] || "",
  };
}

function buildAssignmentFromRow(row) {
  return {
    assignmentId: row[TABLE_ASSIGNMENTS_COLUMNS.assignmentId] || "",
    seatId: row[TABLE_ASSIGNMENTS_COLUMNS.seatId] || "",
    tableId: row[TABLE_ASSIGNMENTS_COLUMNS.tableId] || "",
    guestId: row[TABLE_ASSIGNMENTS_COLUMNS.guestId] || "",
    confirmationId: row[TABLE_ASSIGNMENTS_COLUMNS.confirmationId] || "",
  };
}

function buildAssignmentContext() {
  const tablesRows = getTablesSheet().getDataRange().getDisplayValues();
  const seatsRows = getSeatsSheet().getDataRange().getDisplayValues();
  const assignmentRows = getTableAssignmentsSheet().getDataRange().getDisplayValues();
  const tablesById = {};
  const tablesByName = {};
  const seatsById = {};
  const seatsByTableAndNumber = {};
  const assignmentsByGuestId = {};

  for (let i = 1; i < tablesRows.length; i++) {
    const table = buildTableFromRow(tablesRows[i]);

    if (!table.tableId) continue;

    tablesById[table.tableId] = table;
    if (table.name) tablesByName[String(table.name).trim().toLowerCase()] = table;
  }

  for (let i = 1; i < seatsRows.length; i++) {
    const seat = buildSeatFromRow(seatsRows[i]);

    if (!seat.seatId) continue;

    seatsById[seat.seatId] = seat;
    seatsByTableAndNumber[`${seat.tableId}|${seat.seatNumber}`] = seat;
  }

  for (let i = 1; i < assignmentRows.length; i++) {
    const assignment = buildAssignmentFromRow(assignmentRows[i]);

    if (!assignment.guestId || !assignment.tableId || !assignment.seatId) continue;

    assignmentsByGuestId[assignment.guestId] = assignment;
  }

  return {
    assignmentsByGuestId,
    seatsById,
    seatsByTableAndNumber,
    tablesById,
    tablesByName,
  };
}

function deleteAssignmentsByConfirmationId(sheet, confirmationId) {
  const data = sheet.getDataRange().getValues();
  const normalizedConfirmationId = String(confirmationId || "").trim().toLowerCase();

  if (!normalizedConfirmationId) return;

  for (let i = data.length - 1; i > 0; i--) {
    const rowConfirmationId = String(data[i][TABLE_ASSIGNMENTS_COLUMNS.confirmationId] || "")
      .trim()
      .toLowerCase();

    if (rowConfirmationId === normalizedConfirmationId) {
      sheet.deleteRow(i + 1);
    }
  }
}

function appendAssignmentRowsForGuests(sheet, confirmation, guests) {
  const context = buildAssignmentContext();
  const rows = [];
  const now = getCurrentTimestamp();

  guests.forEach((guest) => {
    const guestId = String(guest.guestId || guest.id || "").trim();
    const rawTableId = String(guest.tableId || "").trim();
    const tableName = String(guest.table || "").trim().toLowerCase();
    const table = rawTableId
      ? context.tablesById[rawTableId]
      : context.tablesByName[tableName];
    const tableId = table?.tableId || rawTableId;
    const seatNumber = String(guest.seat || "").trim();
    const seat = context.seatsByTableAndNumber[`${tableId}|${seatNumber}`];

    if (!guestId || !tableId || !seatNumber || !seat) return;

    rows.push([
      `${tableId}-${seat.seatId}-${guestId}`,
      seat.seatId,
      tableId,
      guestId,
      confirmation.confirmationId,
      guest.assignmentCreatedAt || now,
      now,
    ]);
  });

  if (rows.length) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, rows.length, TABLE_ASSIGNMENTS_HEADERS.length)
      .setValues(rows);
  }
}

function cleanAssignmentsOutsideValidSeats(sheet, validTableIds, validSeatIds) {
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i > 0; i--) {
    const tableId = String(data[i][TABLE_ASSIGNMENTS_COLUMNS.tableId] || "").trim();
    const seatId = String(data[i][TABLE_ASSIGNMENTS_COLUMNS.seatId] || "").trim();

    if (!validTableIds.has(tableId) || !validSeatIds.has(seatId)) {
      sheet.deleteRow(i + 1);
    }
  }
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

  return value === true || text === "true" || text === "si" || text === "s" || text === "1";
}

function isActiveSheetValue(value) {
  const text = String(value || "").trim().toLowerCase();

  return !text || isTruthySheetValue(value);
}

function getProviderTimestamp(value, fallback) {
  return String(value || fallback || new Date().toISOString());
}

