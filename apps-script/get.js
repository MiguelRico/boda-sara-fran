/* eslint-disable */
function doGet(e) {
  try {
    const redirect = readParam(e.parameter.redirect);

    if (redirect === "rsvp") {
      return executeRedirection();
    }

    const action = readParam(e.parameter.action);

    if (action === "search") {
      return searchConfirmation(e);
    }

    if (action === "list") {
      const authError = validateAdmin(e);
      if (authError) return authError;

      return listConfirmations(e);
    }

    return jsonResponse(
      {
        success: false,
        error: "Action not supported",
      },
      e,
    );
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
          <p style="font-size:16px;color:#7b6b5d;">Abriendo vuestra invitación...</p>
          <a href="${RSVP_URL}" style="color:#8f6f56;font-weight:600;">Abrir invitación</a>
        </div>
      </body>
    </html>
  `);
}

function searchConfirmation(e) {
  const groupId = readParam(e.parameter.groupId || e.parameter.email);

  if (!groupId) {
    return jsonResponse(
      {
        success: false,
        found: false,
        error: "Missing groupId or email",
      },
      e,
    );
  }

  const sheet = getSheet();
  const rows = sheet.getDataRange().getDisplayValues();
  const result = [];
  let phone = "";
  let groupName = "";

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    if (String(row[0]).trim().toLowerCase() === groupId.toLowerCase()) {
      phone = row[1] || "";
      groupName = row[2] || "";
      result.push(buildGuestFromRow(row));
    }
  }

  return jsonResponse(
    {
      success: true,
      found: result.length > 0,
      groupId,
      email: groupId,
      groupName,
      phone,
      guests: result,
    },
    e,
  );
}

function listConfirmations(e) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getDisplayValues();
  const groupsByEmail = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const email = row[0];

    if (!email) continue;

    if (!groupsByEmail[email]) {
      groupsByEmail[email] = {
        groupId: email,
        email,
        phone: row[1] || "",
        groupName: row[2] || "",
        guests: [],
      };
    }

    groupsByEmail[email].guests.push(buildGuestFromRow(row));
  }

  return jsonResponse(
    {
      success: true,
      groups: Object.values(groupsByEmail),
    },
    e,
  );
}
