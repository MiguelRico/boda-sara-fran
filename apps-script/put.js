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

  throw new Error("Resource not supported");
}

function saveConfirmation(data) {
  const confirmationsSheet = getConfirmationsSheet();
  const guestsSheet = getSheet();
  const assignmentsSheet = getTableAssignmentsSheet();
  const confirmation = getNormalizedConfirmationData(data);

  if (!confirmation.groupName) {
    throw new Error("Missing groupName");
  }

  if (!confirmation.confirmationId) {
    confirmation.confirmationId = createEntityId("confirmation");
  }

  deleteConfirmationRow(confirmationsSheet, confirmation);
  deleteGuestRows(guestsSheet, confirmation);
  deleteAssignmentsByConfirmationId(assignmentsSheet, confirmation.confirmationId);

  confirmationsSheet.appendRow(buildConfirmationRow(confirmation));

  const guestsWithIds = confirmation.guests.map((guest) => ({
    ...guest,
    guestId: String(guest.guestId || guest.id || "").trim() || createEntityId("guest"),
    confirmationId: confirmation.confirmationId,
    groupName: confirmation.groupName,
  }));

  guestsWithIds.forEach((guest) => {
    guestsSheet.appendRow(
      buildGuestRow(confirmation, guest),
    );
  });
  appendAssignmentRowsForGuests(assignmentsSheet, confirmation, guestsWithIds);

  sendConfirmationEmail(
    confirmation.email,
    confirmation.groupName,
    guestsWithIds,
    confirmation.confirmationId,
  );
  sendAdminNotification(
    confirmation.groupName,
    confirmation.email,
    confirmation.phone,
    guestsWithIds,
  );

  return jsonResponse({
    success: true,
    confirmationId: confirmation.confirmationId,
    groupName: encodeGroupName(confirmation.groupName),
  });
}

function saveTables(data) {
  if (data.password !== ADMIN_PASSWORD) {
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
    const tableId = String(table.tableId || table.id || "").trim() || createEntityId("table");
    const name = String(table.name || "").trim();
    const tag = String(table.tag || table.group || "").trim();
    const group = String(table.group || table.tag || "").trim();
    const seatCount = Math.max(
      Number(table.seatCount) ||
        Number(table.seats && table.seats.length) ||
        0,
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
    sheet.getRange(2, 1, tableRows.length, TABLES_HEADERS.length).setValues(tableRows);
  }

  if (seatRows.length) {
    seatsSheet.getRange(2, 1, seatRows.length, SEATS_HEADERS.length).setValues(seatRows);
  }

  cleanAssignmentsOutsideValidSeats(assignmentsSheet, validTableIds, validSeatIds);

  return jsonResponse({
    success: true,
    tables: tableRows.length,
  });
}

function saveProviders(data) {
  if (data.password !== ADMIN_PASSWORD) {
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

    (Array.isArray(provider.services) ? provider.services : []).forEach((service) => {
      const serviceId = String(service.serviceId || service.id || "").trim();

      if (!serviceId) return;

      const paymentCount = Math.min(
        Math.max(Number(service.paymentCount) || 1, 1),
        3,
      );

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

      (Array.isArray(service.payments) ? service.payments : [])
        .slice(0, paymentCount)
        .forEach((payment, index) => {
          paymentRows.push([
            payment.paymentId || payment.id || `${serviceId}-payment-${index + 1}`,
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
    });
  });

  deleteDataRows(providersSheet);
  deleteDataRows(servicesSheet);
  deleteDataRows(paymentsSheet);

  if (providerRows.length) {
    providersSheet.getRange(2, 1, providerRows.length, PROVIDERS_HEADERS.length).setValues(providerRows);
  }

  if (serviceRows.length) {
    servicesSheet.getRange(2, 1, serviceRows.length, PROVIDER_SERVICES_HEADERS.length).setValues(serviceRows);
  }

  if (paymentRows.length) {
    paymentsSheet.getRange(2, 1, paymentRows.length, PROVIDER_PAYMENTS_HEADERS.length).setValues(paymentRows);
  }

  return jsonResponse({
    success: true,
    providers: providerRows.length,
    services: serviceRows.length,
    payments: paymentRows.length,
  });
}
