/* eslint-disable */
function routePut(data) {
  const entity = getRequestEntity(data);

  if (entity === "confirmations") {
    return saveConfirmation(data);
  }

  if (entity === "tables") {
    return saveTables(data);
  }

  if (entity === "providers") {
    return saveProviders(data);
  }

  if (entity === "notifications") {
    return saveNotifications(data);
  }

  if (entity === "tasks") {
    return saveTasks(data);
  }

  if (entity === "notificationRead") {
    return updateNotificationRead(data);
  }

  throw new Error("Resource not supported");
}

function saveConfirmation(data) {
  const confirmationsSheet = getConfirmationsSheet();
  const guestsSheet = getSheet();
  const assignmentsSheet = getTableAssignmentsSheet();
  const confirmation = getNormalizedConfirmationData(data);

  if (!confirmation.confirmationName) {
    throw new Error("Missing confirmationName");
  }

  if (!confirmation.confirmationId) {
    confirmation.confirmationId = createEntityId("confirmation");
  }

  validateUniqueConfirmationContact(confirmation);

  const isAdmin = isAdminPayload(data);
  const isExistingConfirmation = confirmationExists(
    confirmation.confirmationId,
  );

  deleteConfirmationRow(confirmationsSheet, confirmation);
  deleteGuestRows(guestsSheet, confirmation);
  deleteAssignmentsByConfirmationId(
    assignmentsSheet,
    confirmation.confirmationId,
  );

  confirmationsSheet.appendRow(buildConfirmationRow(confirmation));

  const guestsWithIds = confirmation.guests.map((guest) => ({
    ...guest,
    guestId:
      String(guest.guestId || guest.id || "").trim() || createEntityId("guest"),
    confirmationId: confirmation.confirmationId,
    confirmationName: confirmation.confirmationName,
  }));

  guestsWithIds.forEach((guest) => {
    guestsSheet.appendRow(buildGuestRow(confirmation, guest));
  });
  appendAssignmentRowsForGuests(assignmentsSheet, confirmation, guestsWithIds);

  if (!isAdmin) {
    sendConfirmationEmail(
      confirmation.email,
      confirmation.confirmationName,
      guestsWithIds,
      confirmation.confirmationId,
    );
    sendAdminNotification(
      confirmation.confirmationName,
      confirmation.email,
      confirmation.phone,
      guestsWithIds,
    );
    createConfirmationNotification(
      confirmation,
      guestsWithIds,
      isExistingConfirmation ? "updated" : "created",
    );
  }

  return jsonResponse({
    success: true,
    confirmationId: confirmation.confirmationId,
    confirmationName: encodeConfirmationName(confirmation.confirmationName),
  });
}

function saveTables(data) {
  if (normalizeAdminPassword(data.password) !== getAdminPassword()) {
    throw new Error("Unauthorized");
  }

  const sheet = getTablesSheet();
  const seatsSheet = getSeatsSheet();
  const assignmentsSheet = getTableAssignmentsSheet();
  const tables = Array.isArray(data.tables) ? data.tables : [];
  const tableRows = [];
  const seatRows = [];
  const validTableIds = new Set();
  const validSeatIds = new Set();

  deleteAllTableRows(sheet);
  deleteDataRows(seatsSheet);

  tables.forEach((table) => {
    const tableId =
      String(table.tableId || table.id || "").trim() || createEntityId("table");
    const name = String(table.name || "").trim();
    const tag = String(table.tag || table.group || "").trim();
    const group = String(table.group || table.tag || "").trim();
    const seatCount = Math.max(
      Number(table.seatCount) || Number(table.seats && table.seats.length) || 0,
      0,
    );

    if (!name) return;

    validTableIds.add(tableId);
    tableRows.push([
      tableId,
      name,
      group,
      tag,
      normalizeTableShape(table.shape),
      seatCount,
      table.notes || "",
      table.createdAt || getCurrentTimestamp(),
      getCurrentTimestamp(),
    ]);

    for (let index = 1; index <= seatCount; index++) {
      const seatId = createSeatId(tableId, index);

      validSeatIds.add(seatId);
      seatRows.push([
        seatId,
        tableId,
        String(index),
        table.createdAt || getCurrentTimestamp(),
        getCurrentTimestamp(),
      ]);
    }
  });

  if (tableRows.length) {
    sheet
      .getRange(2, 1, tableRows.length, TABLES_HEADERS.length)
      .setValues(tableRows);
  }

  if (seatRows.length) {
    seatsSheet
      .getRange(2, 1, seatRows.length, SEATS_HEADERS.length)
      .setValues(seatRows);
  }

  cleanAssignmentsOutsideValidSeats(
    assignmentsSheet,
    validTableIds,
    validSeatIds,
  );

  return jsonResponse({
    success: true,
    tables: tableRows.length,
  });
}

function saveProviders(data) {
  if (normalizeAdminPassword(data.password) !== getAdminPassword()) {
    throw new Error("Unauthorized");
  }

  const providersSheet = getProvidersSheet();
  const servicesSheet = getProviderServicesSheet();
  const paymentsSheet = getProviderPaymentsSheet();
  const providers = Array.isArray(data.providers) ? data.providers : [];
  const now = new Date().toISOString();
  const providerRows = [];
  const serviceRows = [];
  const paymentRows = [];

  providers.forEach((provider) => {
    const providerId = String(provider.providerId || provider.id || "").trim();

    if (!providerId) return;

    providerRows.push([
      providerId,
      provider.name || "",
      provider.category || "",
      provider.phone || "",
      provider.email || "",
      provider.address || "",
      provider.web || "",
      provider.accountNumber || "",
      true,
      getProviderTimestamp(provider.createdAt, now),
      now,
    ]);

    (Array.isArray(provider.services) ? provider.services : []).forEach(
      (service) => {
        const serviceId = String(service.serviceId || service.id || "").trim();

        if (!serviceId) return;

        const paymentCount = Math.min(
          Math.max(Number(service.paymentCount) || 1, 1),
          3,
        );
        const servicePayments = (
          Array.isArray(service.payments) ? service.payments : []
        )
          .slice(0, paymentCount)
          .map((payment, index) => ({
            amount: payment.amount || "",
            createdAt: payment.createdAt || "",
            date: payment.date || "",
            notes: payment.notes || "",
            paid: Boolean(payment.paid),
            paymentId:
              payment.paymentId ||
              payment.id ||
              `${serviceId}-payment-${index + 1}`,
          }));

        serviceRows.push([
          serviceId,
          providerId,
          service.name || "",
          service.price || "",
          paymentCount,
          service.notes || "",
          true,
          getProviderTimestamp(service.createdAt, now),
          now,
        ]);

        servicePayments.forEach((payment, index) => {
          paymentRows.push([
            payment.paymentId,
            serviceId,
            index + 1,
            payment.amount || "",
            payment.date || "",
            payment.paid ? payment.date || "" : "",
            Boolean(payment.paid),
            payment.notes || "",
            getProviderTimestamp(payment.createdAt, now),
            now,
          ]);
        });
      },
    );
  });

  deleteDataRows(providersSheet);
  deleteDataRows(servicesSheet);
  deleteDataRows(paymentsSheet);

  if (providerRows.length) {
    providersSheet
      .getRange(2, 1, providerRows.length, PROVIDERS_HEADERS.length)
      .setValues(providerRows);
  }

  if (serviceRows.length) {
    servicesSheet
      .getRange(2, 1, serviceRows.length, PROVIDER_SERVICES_HEADERS.length)
      .setValues(serviceRows);
  }

  if (paymentRows.length) {
    paymentsSheet
      .getRange(2, 1, paymentRows.length, PROVIDER_PAYMENTS_HEADERS.length)
      .setValues(paymentRows);
  }

  return jsonResponse({
    success: true,
    providers: providerRows.length,
    services: serviceRows.length,
    payments: paymentRows.length,
  });
}

function saveNotifications(data) {
  if (normalizeAdminPassword(data.password) !== getAdminPassword()) {
    throw new Error("Unauthorized");
  }

  const sheet = getNotificationsSheet();
  const notifications = Array.isArray(data.notifications)
    ? data.notifications
    : [];
  const rows = notifications.map(buildNotificationRow);

  deleteDataRows(sheet);

  if (rows.length) {
    sheet
      .getRange(2, 1, rows.length, NOTIFICATIONS_HEADERS.length)
      .setValues(rows);
  }

  return jsonResponse({
    success: true,
    notifications: rows.length,
  });
}

function saveTasks(data) {
  if (normalizeAdminPassword(data.password) !== getAdminPassword()) {
    throw new Error("Unauthorized");
  }

  const sheet = getTasksSheet();
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const rows = tasks.map(buildTaskRow);

  deleteDataRows(sheet);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, TASKS_HEADERS.length).setValues(rows);
  }

  return jsonResponse({
    success: true,
    tasks: rows.length,
  });
}

function updateNotificationRead(data) {
  if (normalizeAdminPassword(data.password) !== getAdminPassword()) {
    throw new Error("Unauthorized");
  }

  const notificationId = String(data.notificationId || data.id || "").trim();
  const sheet = getNotificationsSheet();
  const rows = sheet.getDataRange().getDisplayValues();
  const read = Boolean(data.read);

  if (!notificationId) {
    throw new Error("Missing notificationId");
  }

  for (let i = 1; i < rows.length; i++) {
    const rowNotificationId = String(
      rows[i][NOTIFICATIONS_COLUMNS.notificationId] || "",
    ).trim();

    if (rowNotificationId !== notificationId) continue;

    sheet.getRange(i + 1, NOTIFICATIONS_COLUMNS.read + 1).setValue(read);
    sheet
      .getRange(i + 1, NOTIFICATIONS_COLUMNS.updatedAt + 1)
      .setValue(getCurrentTimestamp());

    return jsonResponse({
      success: true,
      notificationId,
      read,
    });
  }

  throw new Error("Notification not found");
}

function confirmationExists(confirmationId) {
  const rows = getConfirmationsSheet().getDataRange().getDisplayValues();
  const normalizedConfirmationId = String(confirmationId || "")
    .trim()
    .toLowerCase();

  if (!normalizedConfirmationId) return false;

  for (let i = 1; i < rows.length; i++) {
    const rowConfirmationId = String(
      rows[i][CONFIRMATIONS_COLUMNS.confirmationId] || "",
    )
      .trim()
      .toLowerCase();

    if (rowConfirmationId === normalizedConfirmationId) return true;
  }

  return false;
}
