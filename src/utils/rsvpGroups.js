export function getGroupsFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.groups)) return response.groups;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;

  return [];
}

export function normalizeAdminGroups(response) {
  return getGroupsFromResponse(response).map((group) => ({
    groupId: group.groupId || group.email || "",
    email: group.email || group.groupId || "",
    groupName: group.groupName || group.nombre_grupo || "",
    phone: group.phone || "",
    guests: Array.isArray(group.guests) ? group.guests : [],
  }));
}
