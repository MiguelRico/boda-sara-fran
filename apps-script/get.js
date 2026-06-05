/* eslint-disable */
function doGet(e) {
  try {
    const redirect = readParam(e.parameter.redirect);

    if (redirect === "rsvp") {
      return executeRedirection();
    }

    return routeGet(e);
  } catch (err) {
    return jsonResponse(
      {
        success: false,
        error: err.message,
      },
      e,
    );
  }
}

function routeGet(e) {
  const entity = readParam(e.parameter.entity);

  if (entity === "confirmations") {
    if (e.parameter.email || e.parameter.groupName) {
      return getConfirmation(e);
    }

    const authError = validateAdmin(e);
    if (authError) return authError;

    return listConfirmations(e);
  }

  if (entity === "tables") {
    const authError = validateAdmin(e);
    if (authError) return authError;

    return listTables(e);
  }

  if (entity === "providers") {
    const authError = validateAdmin(e);
    if (authError) return authError;

    return listProviders(e);
  }

  return jsonResponse(
    {
      success: false,
      error: "Resource not supported",
    },
    e,
  );
}

function executeRedirection() {
  return HtmlService.createHtmlOutput(`
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="0; url=${RSVP_URL}">
        <script>
          window.location.replace("${RSVP_URL}");
        </script>
      </head>
      <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fbf7f1;font-family:Arial,sans-serif;color:#2f2a25;text-align:center;padding:24px;">
        <div>
          <p style="font-size:16px;color:#7b6b5d;">Abriendo vuestra invitacion...</p>
          <a href="${RSVP_URL}" style="color:#8f6f56;font-weight:600;">Abrir invitacion</a>
        </div>
      </body>
    </html>
  `);
}

function getConfirmation(e) {
  const groupName = decodeGroupName(readParam(e.parameter.groupName));
  const email = readParam(e.parameter.email).toLowerCase();

  if (!groupName && !email) {
    return jsonResponse(
      {
        success: false,
        found: false,
        error: "Missing groupName or email",
      },
      e,
    );
  }

  const confirmationsSheet = getConfirmationsSheet();
  const guestsSheet = getSheet();
  const confirmationRows = confirmationsSheet.getDataRange().getDisplayValues();
  const guestRows = guestsSheet.getDataRange().getDisplayValues();
  let confirmation = null;

  for (let i = 1; i < confirmationRows.length; i++) {
    const row = confirmationRows[i];
    const rowGroupName = String(row[CONFIRMATIONS_COLUMNS.groupName])
      .trim()
      .toLowerCase();
    const rowEmail = String(row[CONFIRMATIONS_COLUMNS.email])
      .trim()
      .toLowerCase();
    const groupNameMatches = groupName && rowGroupName === groupName.toLowerCase();
    const emailMatches = email && rowEmail === email;

    if (groupNameMatches || emailMatches) {
      confirmation = buildConfirmationFromRow(row, []);
      break;
    }
  }

  if (!confirmation) {
    return jsonResponse(
      {
        success: true,
        found: false,
        groupName: encodeGroupName(groupName),
        email: email,
        guests: [],
      },
      e,
    );
  }

  for (let i = 1; i < guestRows.length; i++) {
    const row = guestRows[i];

    if (
      String(row[GUESTS_COLUMNS.groupName]).trim().toLowerCase() ===
      confirmation.groupName.toLowerCase()
    ) {
      confirmation.guests.push(buildGuestFromRow(row, confirmation));
    }
  }

  return jsonResponse(
    {
      success: true,
      found: confirmation.guests.length > 0,
      ...encodeConfirmationForApi(confirmation),
    },
    e,
  );
}

function listConfirmations(e) {
  const confirmationsSheet = getConfirmationsSheet();
  const guestsSheet = getSheet();
  const confirmationRows = confirmationsSheet.getDataRange().getDisplayValues();
  const guestRows = guestsSheet.getDataRange().getDisplayValues();
  const groupsByName = {};

  for (let i = 1; i < confirmationRows.length; i++) {
    const row = confirmationRows[i];
    const groupName = row[CONFIRMATIONS_COLUMNS.groupName];

    if (!groupName) continue;

    groupsByName[groupName] = buildConfirmationFromRow(row, []);
  }

  for (let i = 1; i < guestRows.length; i++) {
    const row = guestRows[i];
    const groupName = row[GUESTS_COLUMNS.groupName];
    const confirmation = groupsByName[groupName];

    if (!confirmation) continue;

    confirmation.guests.push(buildGuestFromRow(row, confirmation));
  }

  return jsonResponse(
    {
      success: true,
      groups: Object.values(groupsByName).map(encodeConfirmationForApi),
    },
    e,
  );
}

function listTables(e) {
  const sheet = getTablesSheet();
  const rows = sheet.getDataRange().getDisplayValues();
  const tables = [];

  for (let i = 1; i < rows.length; i++) {
    const table = buildTableFromRow(rows[i]);

    if (!table.name) continue;

    tables.push(table);
  }

  return jsonResponse(
    {
      success: true,
      tables,
    },
    e,
  );
}

function listProviders(e) {
  const providersSheet = getProvidersSheet();
  const servicesSheet = getProviderServicesSheet();
  const paymentsSheet = getProviderPaymentsSheet();
  const providerRows = providersSheet.getDataRange().getDisplayValues();
  const serviceRows = servicesSheet.getDataRange().getDisplayValues();
  const paymentRows = paymentsSheet.getDataRange().getDisplayValues();
  const providers = [];
  const providersById = {};
  const servicesById = {};

  for (let i = 1; i < providerRows.length; i++) {
    const row = providerRows[i];
    const providerId = String(row[PROVIDERS_COLUMNS.providerId] || "").trim();

    if (!providerId || !isActiveSheetValue(row[PROVIDERS_COLUMNS.activo])) continue;

    const provider = {
      id: providerId,
      accountNumber: row[PROVIDERS_COLUMNS.numeroCuenta] || "",
      address: row[PROVIDERS_COLUMNS.direccion] || "",
      category: row[PROVIDERS_COLUMNS.categoria] || "",
      email: row[PROVIDERS_COLUMNS.email] || "",
      name: row[PROVIDERS_COLUMNS.nombre] || "",
      phone: row[PROVIDERS_COLUMNS.telefono] || "",
      services: [],
      web: row[PROVIDERS_COLUMNS.web] || "",
    };

    providers.push(provider);
    providersById[providerId] = provider;
  }

  for (let i = 1; i < serviceRows.length; i++) {
    const row = serviceRows[i];
    const serviceId = String(row[PROVIDER_SERVICES_COLUMNS.serviceId] || "").trim();
    const providerId = String(row[PROVIDER_SERVICES_COLUMNS.providerId] || "").trim();
    const provider = providersById[providerId];

    if (
      !serviceId ||
      !provider ||
      !isActiveSheetValue(row[PROVIDER_SERVICES_COLUMNS.activo])
    ) {
      continue;
    }

    const service = {
      id: serviceId,
      name: row[PROVIDER_SERVICES_COLUMNS.nombre] || "",
      paymentCount: Math.min(
        Math.max(Number(row[PROVIDER_SERVICES_COLUMNS.numeroPlazos]) || 1, 1),
        3,
      ),
      payments: [],
      price: row[PROVIDER_SERVICES_COLUMNS.precio] || "",
    };

    provider.services.push(service);
    servicesById[serviceId] = service;
  }

  for (let i = 1; i < paymentRows.length; i++) {
    const row = paymentRows[i];
    const serviceId = String(row[PROVIDER_PAYMENTS_COLUMNS.serviceId] || "").trim();
    const service = servicesById[serviceId];

    if (!service) continue;

    service.payments.push({
      amount: row[PROVIDER_PAYMENTS_COLUMNS.importe] || "",
      date: row[PROVIDER_PAYMENTS_COLUMNS.fechaPrevista] || "",
      paid: isTruthySheetValue(row[PROVIDER_PAYMENTS_COLUMNS.pagado]),
    });
  }

  return jsonResponse(
    {
      success: true,
      providers,
    },
    e,
  );
}
