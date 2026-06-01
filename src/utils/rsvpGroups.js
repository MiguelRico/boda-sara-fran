import { Confirmation } from "../models/Confirmation";

export function getGroupsFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.groups)) return response.groups;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;

  return [];
}

export function normalizeAdminGroups(response) {
  return Confirmation.normalizeList(getGroupsFromResponse(response));
}
