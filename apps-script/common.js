/* eslint-disable */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet(sheetName, headers) {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  ensureHeader(sheet, headers);

  return sheet;
}

function getConfirmationsSheet() {
  return getOrCreateSheet(CONFIRMATIONS_SHEET_NAME, CONFIRMATIONS_HEADERS);
}

function getSheet() {
  return getOrCreateSheet(SHEET_NAME, GUESTS_HEADERS);
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

const NOTIFICATIONS_HEADERS = [
  "notificationId",
  "title",
  "detail",
  "date",
  "type",
  "read",
  "createdAt",
  "updatedAt",
];

const NOTIFICATIONS_COLUMNS = {
  notificationId: 0,
  title: 1,
  detail: 2,
  date: 3,
  type: 4,
  read: 5,
  createdAt: 6,
  updatedAt: 7,
};

const TASKS_HEADERS = [
  "taskId",
  "title",
  "description",
  "category",
  "maxDate",
  "priority",
  "responsible",
  "status",
  "createdAt",
  "updatedAt",
];

const TASKS_COLUMNS = {
  taskId: 0,
  title: 1,
  description: 2,
  category: 3,
  maxDate: 4,
  priority: 5,
  responsible: 6,
  status: 7,
  createdAt: 8,
  updatedAt: 9,
};

const DEFAULT_TASKS = [
  ["Elegir lugar ceremonia", "ceremonia", "2026-02-15", "alta", "Sara"],
  ["Reservar lugar ceremonia", "ceremonia", "2026-03-01", "alta", "Fran"],
  ["Confirmar horario ceremonia", "ceremonia", "2026-07-15", "media", "Sara"],
  ["Confirmar oficiante ceremonia", "ceremonia", "2026-07-15", "alta", "Fran"],
  ["Preparar lecturas", "ceremonia", "2026-08-01", "media", "Sara"],
  ["Preparar votos", "ceremonia", "2026-08-10", "media", "Fran"],
  ["Elegir musica ceremonia", "ceremonia", "2026-07-25", "media", "Sara"],
  ["Confirmar decoracion ceremonia", "ceremonia", "2026-08-01", "media", "Fran"],
  ["Comprar traje novio", "novios", "2026-05-15", "alta", "Fran"],
  ["Comprar traje novia", "novios", "2026-04-15", "alta", "Sara"],
  ["Prueba vestido novia", "novios", "2026-06-15", "alta", "Sara"],
  ["Ajustes vestido novia", "novios", "2026-07-20", "media", "Sara"],
  ["Comprar zapatos novia", "novios", "2026-07-01", "media", "Sara"],
  ["Comprar complementos novia", "novios", "2026-07-15", "baja", "Sara"],
  ["Comprar alianzas", "novios", "2026-06-01", "alta", "Fran"],
  ["Recoger alianzas", "novios", "2026-08-01", "alta", "Fran"],
  ["Definir listado de fotos", "fotografia", "2026-07-20", "media", "Sara"],
  ["Confirmar horario de llegada", "fotografia", "2026-08-05", "media", "Fran"],
  ["Confirmar postboda", "video", "2026-08-05", "baja", "Fran"],
  ["Confirmar alergias", "banquete", "2026-08-01", "alta", "Sara"],
  ["Confirmar vegetarianos", "banquete", "2026-08-01", "alta", "Sara"],
  ["Confirmar total de asistentes", "banquete", "2026-08-05", "alta", "Fran"],
  ["Enviar invitaciones", "invitados", "2026-04-01", "alta", "Sara"],
  ["Entregar invitaciones", "invitados", "2026-05-01", "media", "Fran"],
  ["Recordatorio confirmaciones", "invitados", "2026-07-15", "media", "Sara"],
  ["Confirmar numero final", "invitados", "2026-08-05", "alta", "Fran"],
  ["Confirmar plazas", "transporte", "2026-08-01", "media", "Sara"],
  ["Confirmar total de autobuses", "transporte", "2026-08-05", "media", "Fran"],
  ["Crear mesas", "mesas", "2026-07-25", "alta", "Sara"],
  ["Asignar familiares", "mesas", "2026-08-05", "media", "Sara"],
  ["Asignar amigos", "mesas", "2026-08-05", "media", "Fran"],
  ["Revisar incompatibilidades", "mesas", "2026-08-10", "alta", "Sara"],
  ["Imprimir seating plan", "mesas", "2026-08-18", "media", "Fran"],
  ["Crear lista de canciones", "fiesta", "2026-07-20", "baja", "Sara"],
  ["Preparar primer baile", "fiesta", "2026-08-01", "media", "Fran"],
  ["Confirmar iluminacion", "fiesta", "2026-08-05", "media", "Fran"],
  ["Confirmar barra libre", "fiesta", "2026-08-05", "alta", "Sara"],
  ["Confirmar flores", "decoracion", "2026-07-20", "media", "Sara"],
  ["Confirmar centros de mesa", "decoracion", "2026-07-25", "media", "Fran"],
  ["Pago fotografo", "pagos", "2026-08-10", "alta", "Fran"],
  ["Pago floristeria", "pagos", "2026-08-10", "alta", "Sara"],
  ["Pago final proveedores", "pagos", "2026-08-15", "alta", "Fran"],
];

function ensureHeader(sheet, headers) {
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = headers.some((header, index) => currentHeaders[index] !== header);

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function getTablesSheet() {
  return getOrCreateSheet(TABLES_SHEET_NAME, TABLES_HEADERS);
}

function getSeatsSheet() {
  return getOrCreateSheet(SEATS_SHEET_NAME, SEATS_HEADERS);
}

function getTableAssignmentsSheet() {
  return getOrCreateSheet(
    TABLE_ASSIGNMENTS_SHEET_NAME,
    TABLE_ASSIGNMENTS_HEADERS,
  );
}

function getProvidersSheet() {
  return getOrCreateSheet(PROVIDERS_SHEET_NAME, PROVIDERS_HEADERS);
}

function getProviderServicesSheet() {
  return getOrCreateSheet(
    PROVIDER_SERVICES_SHEET_NAME,
    PROVIDER_SERVICES_HEADERS,
  );
}

function getProviderPaymentsSheet() {
  return getOrCreateSheet(
    PROVIDER_PAYMENTS_SHEET_NAME,
    PROVIDER_PAYMENTS_HEADERS,
  );
}

function getNotificationsSheet() {
  return getOrCreateSheet(NOTIFICATIONS_SHEET_NAME, NOTIFICATIONS_HEADERS);
}

function getTasksSheet() {
  const sheet = getOrCreateSheet(TASKS_SHEET_NAME, TASKS_HEADERS);

  seedDefaultTasksIfEmpty(sheet);

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

function isAdminPayload(data) {
  return String(data.password || "").trim() === ADMIN_PASSWORD;
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

function normalizeNotificationType(value) {
  const type = String(value || "").trim();

  if (type === "Pago" || type === "Invitados") return type;
  if (type === "Confirmación" || type === "Confirmacion") return "Invitados";

  return "Aviso";
}

function normalizeNotificationDate(value) {
  const text = String(value || "").trim();

  if (text) return text;

  return new Date().toISOString().slice(0, 10);
}

function buildNotificationFromRow(row) {
  const notificationId = row[NOTIFICATIONS_COLUMNS.notificationId] || "";

  return {
    id: notificationId,
    notificationId,
    title: row[NOTIFICATIONS_COLUMNS.title] || "",
    detail: row[NOTIFICATIONS_COLUMNS.detail] || "",
    date: normalizeNotificationDate(row[NOTIFICATIONS_COLUMNS.date]),
    type: normalizeNotificationType(row[NOTIFICATIONS_COLUMNS.type]),
    read: isTruthySheetValue(row[NOTIFICATIONS_COLUMNS.read]),
  };
}

function buildNotificationRow(notification) {
  const now = getCurrentTimestamp();
  const notificationId =
    String(notification.notificationId || notification.id || "").trim() ||
    createEntityId("notification");

  return [
    notificationId,
    String(notification.title || "").trim(),
    String(notification.detail || "").trim(),
    normalizeNotificationDate(notification.date),
    normalizeNotificationType(notification.type),
    Boolean(notification.read),
    notification.createdAt || now,
    now,
  ];
}

function normalizeTaskCategory(value) {
  const category = String(value || "").trim().toLowerCase();
  const validCategories = [
    "ceremonia",
    "novios",
    "fotografia",
    "video",
    "banquete",
    "invitados",
    "transporte",
    "mesas",
    "fiesta",
    "decoracion",
    "pagos",
  ];

  return validCategories.indexOf(category) >= 0 ? category : "ceremonia";
}

function normalizeTaskPriority(value) {
  const priority = String(value || "").trim().toLowerCase();

  if (priority === "alta" || priority === "media" || priority === "baja") {
    return priority;
  }

  return "media";
}

function normalizeTaskStatus(value) {
  const status = String(value || "").trim().toLowerCase();

  if (status === "completed" || status === "completa") return "completed";

  return "pending";
}

function buildTaskFromRow(row) {
  const taskId = row[TASKS_COLUMNS.taskId] || "";

  return {
    id: taskId,
    taskId,
    title: row[TASKS_COLUMNS.title] || "",
    description: row[TASKS_COLUMNS.description] || "",
    category: normalizeTaskCategory(row[TASKS_COLUMNS.category]),
    maxDate: row[TASKS_COLUMNS.maxDate] || "",
    priority: normalizeTaskPriority(row[TASKS_COLUMNS.priority]),
    responsible: row[TASKS_COLUMNS.responsible] || "",
    status: normalizeTaskStatus(row[TASKS_COLUMNS.status]),
  };
}

function buildTaskRow(task) {
  const now = getCurrentTimestamp();
  const taskId =
    String(task.taskId || task.id || "").trim() || createEntityId("task");

  return [
    taskId,
    String(task.title || "").trim(),
    String(task.description || "").trim(),
    normalizeTaskCategory(task.category),
    String(task.maxDate || "").trim(),
    normalizeTaskPriority(task.priority),
    String(task.responsible || "").trim(),
    normalizeTaskStatus(task.status),
    task.createdAt || now,
    now,
  ];
}

function seedDefaultTasksIfEmpty(sheet) {
  if (sheet.getLastRow() > 1) return;

  const now = getCurrentTimestamp();
  const rows = DEFAULT_TASKS.map((task, index) => [
    `task_seed_${index + 1}`,
    task[0],
    "",
    task[1],
    task[2],
    task[3],
    task[4],
    "pending",
    now,
    now,
  ]);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, TASKS_HEADERS.length).setValues(rows);
  }
}

function appendNotification(notification) {
  const sheet = getNotificationsSheet();

  sheet.appendRow(buildNotificationRow(notification));
}

function createConfirmationNotification(confirmation, guests, action) {
  const guestNames = (guests || [])
    .map((guest) => `${guest.name || ""} ${guest.lastname || ""}`.trim())
    .filter(Boolean)
    .join(", ");
  const contactParts = [
    confirmation.email ? `Email: ${confirmation.email}` : "",
    confirmation.phone ? `Telefono: ${confirmation.phone}` : "",
    guestNames ? `Invitados: ${guestNames}` : "",
  ].filter(Boolean);

  appendNotification({
    title: getConfirmationNotificationTitle(confirmation, action),
    detail: contactParts.join(" | "),
    date: normalizeNotificationDate(),
    type: "Invitados",
    read: false,
  });
}

function getConfirmationNotificationTitle(confirmation, action) {
  const name = confirmation.confirmationName || "Sin nombre";

  if (action === "deleted") return `Confirmacion eliminada: ${name}`;
  if (action === "updated") return `Confirmacion actualizada: ${name}`;

  return `Confirmacion recibida: ${name}`;
}

function createServicePaymentNotifications(provider, service, action) {
  const payments = (Array.isArray(service.payments) ? service.payments : [])
    .slice(0, Math.max(Number(service.paymentCount) || 1, 1))
    .filter((payment) => String(payment.date || payment.fechaPrevista || "").trim());

  payments.forEach((payment, index) => {
    const paymentDate = String(payment.date || payment.fechaPrevista || "").trim();
    const amount = payment.amount || payment.importe || "";
    const detailParts = [
      provider.name ? `Proveedor: ${provider.name}` : "",
      service.name ? `Servicio: ${service.name}` : "",
      amount ? `Importe: ${amount}` : "",
      `Plazo: ${index + 1}`,
      action ? `Accion: ${getServiceActionLabel(action)}` : "",
    ].filter(Boolean);

    appendNotification({
      title: `${getServiceActionLabel(action)}: ${
        service.name || "Servicio sin nombre"
      }`,
      detail: detailParts.join(" | "),
      date: paymentDate,
      type: "Pago",
      read: false,
    });
  });
}

function getServiceActionLabel(action) {
  if (action === "deleted") return "Servicio eliminado";
  if (action === "updated") return "Servicio actualizado";

  return "Servicio creado";
}

function validateUniqueConfirmationContact(confirmation) {
  const rows = getConfirmationsSheet().getDataRange().getDisplayValues();
  const confirmationId = String(confirmation.confirmationId || "")
    .trim()
    .toLowerCase();
  const email = String(confirmation.email || "").trim().toLowerCase();
  const phone = normalizePhoneSearch(confirmation.phone);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowConfirmationId = String(row[CONFIRMATIONS_COLUMNS.confirmationId] || "")
      .trim()
      .toLowerCase();

    if (confirmationId && rowConfirmationId === confirmationId) continue;

    const rowEmail = String(row[CONFIRMATIONS_COLUMNS.email] || "")
      .trim()
      .toLowerCase();
    const rowPhone = normalizePhoneSearch(row[CONFIRMATIONS_COLUMNS.phone]);

    if (email && rowEmail === email) {
      throw new Error("Duplicated confirmation email");
    }

    if (phone && rowPhone === phone) {
      throw new Error("Duplicated confirmation phone");
    }
  }
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

