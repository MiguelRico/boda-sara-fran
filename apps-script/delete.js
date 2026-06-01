/* eslint-disable */
function routeDelete(data) {
  const entity = getRequestEntity(data);

  if (entity === "confirmations") {
    return deleteConfirmation(data);
  }

  throw new Error("Resource not supported");
}

function deleteConfirmation(data) {
  if (data.password !== ADMIN_PASSWORD) {
    throw new Error("Unauthorized");
  }

  const confirmationsSheet = getConfirmationsSheet();
  const guestsSheet = getSheet();
  const groupName = decodeGroupName(data.groupName);

  if (!groupName) {
    throw new Error("Missing groupName");
  }

  deleteConfirmationRow(confirmationsSheet, groupName);
  deleteGroupRows(guestsSheet, groupName);

  return jsonResponse({
    success: true,
    groupName: encodeGroupName(groupName),
  });
}
