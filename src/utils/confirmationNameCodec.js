const normalizeString = (value) => (value == null ? "" : String(value));

export const encodeConfirmationName = (confirmationName) => {
  const value = normalizeString(confirmationName).trim();

  if (!value) return "";

  return btoa(unescape(encodeURIComponent(value)));
};

export const decodeConfirmationName = (encodedConfirmationName) => {
  const value = normalizeString(encodedConfirmationName).trim();

  if (!value) return "";

  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return value;
  }
};

export const getConfirmationIdUrl = (confirmationId) =>
  `/rsvp/edit?confirmationId=${encodeURIComponent(normalizeString(confirmationId).trim())}`;

