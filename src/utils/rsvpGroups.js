import { Confirmation } from "../models/Confirmation";

export function getConfirmationsFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.confirmations)) return response.confirmations;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;

  return [];
}

export function normalizeAdminConfirmations(response) {
  return Confirmation.normalizeList(getConfirmationsFromResponse(response));
}
