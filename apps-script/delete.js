/* eslint-disable */
function routeDelete(data) {
  const entity = getRequestEntity(data);

  if (entity === "confirmations") {
    return deleteConfirmation(data);
  }

  throw new Error("Resource not supported");
}

function deleteConfirmation(data) {
  if (normalizeAdminPassword(data.password) !== getAdminPassword()) {
    throw new Error("Unauthorized");
  }

  const confirmationsSheet = getConfirmationsSheet();
  const guestsSheet = getSheet();
  const assignmentsSheet = getTableAssignmentsSheet();
  const confirmationId = String(data.confirmationId || data.id || "").trim();

  if (!confirmationId) {
    throw new Error("Missing confirmationId");
  }

  deleteConfirmationRow(confirmationsSheet, { confirmationId });
  deleteGuestRows(guestsSheet, { confirmationId });
  deleteAssignmentsByConfirmationId(assignmentsSheet, confirmationId);

  return jsonResponse({
    success: true,
    confirmationId,
  });
}
