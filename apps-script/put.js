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
    const providerId = String(provider.id || "").trim();

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
      const serviceId = String(service.id || "").trim();

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
            payment.id || `${serviceId}-payment-${index + 1}`,
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
