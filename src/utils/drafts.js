import { createEmptyTableForm } from "../constants/tables";
import { Confirmation } from "../models";

const ADMIN_DEFAULT_EMAIL = "admin@admin.com";
const ADMIN_DEFAULT_PHONE = "666666666";

export function createDraftGroup(group) {
  if (!group) return Confirmation.createEmpty();

  return Confirmation.normalize(group);
}

export function normalizeAdminGroupBeforeSave(group, { isCreation }) {
  const confirmation = Confirmation.normalize(group);

  if (!isCreation) return confirmation;

  return Confirmation.normalize({
    ...confirmation,
    email: confirmation.email.trim() || ADMIN_DEFAULT_EMAIL,
    phone: confirmation.phone.trim() || ADMIN_DEFAULT_PHONE,
  });
}

export function createDraftTableForm(table) {
  if (!table) return createEmptyTableForm();

  return table;
}
