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
    if (e.parameter.groupName) {
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

  if (!groupName) {
    return jsonResponse(
      {
        success: false,
        found: false,
        error: "Missing groupName",
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

    if (
      String(row[CONFIRMATIONS_COLUMNS.groupName]).trim().toLowerCase() ===
      groupName.toLowerCase()
    ) {
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
        guests: [],
      },
      e,
    );
  }

  for (let i = 1; i < guestRows.length; i++) {
    const row = guestRows[i];

    if (
      String(row[GUESTS_COLUMNS.groupName]).trim().toLowerCase() ===
      groupName.toLowerCase()
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
