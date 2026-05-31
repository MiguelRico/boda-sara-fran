/* eslint-disable */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    if (!sheet) {
      throw new Error("Sheet not found");
    }

    const groupId = data.groupId || data.email;
    const now = new Date();

    deleteGroupRows(sheet, groupId);

    data.guests.forEach((guest) => {
      sheet.appendRow([
        data.email,
        data.phone,
        data.groupName,
        guest.name,
        guest.lastname,
        normalizeAllergies(guest.allergies),
        guest.otherAllergies || "",
        guest.comments || "",
        guest.outboundBus || "No",
        guest.returnBus || "No",
        now,
      ]);
    });

    sendConfirmationEmail(data.email, groupId, data.guests);
    sendAdminNotification(data.groupName, data.email, data.phone, data.guests);

    return jsonResponse({
      success: true,
      groupId,
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message,
    });
  }
}
