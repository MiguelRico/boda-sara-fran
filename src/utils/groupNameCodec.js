const normalizeString = (value) => (value == null ? "" : String(value));

export const encodeGroupName = (groupName) => {
  const value = normalizeString(groupName).trim();

  if (!value) return "";

  return btoa(unescape(encodeURIComponent(value)));
};

export const decodeGroupName = (encodedGroupName) => {
  const value = normalizeString(encodedGroupName).trim();

  if (!value) return "";

  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return value;
  }
};

export const getGroupNameUrl = (groupName) =>
  `/rsvp/edit?groupName=${encodeURIComponent(encodeGroupName(groupName))}`;
