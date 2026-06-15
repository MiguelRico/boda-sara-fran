import { adminContent } from "../constants/adminContent";
import { Confirmation, Guest } from "../models";
import { confirmationRepository } from "../repositories/confirmationRepository";
import { normalizeAdminGroupBeforeSave } from "../utils/drafts";
import { hasJsonChanged } from "../utils/objectSnapshot";
import { normalizeAdminConfirmations } from "../utils/rsvpGroups";

export const getConfirmationKey = (group) => {
  const normalizedGroup = group || {};

  return (
    normalizedGroup.confirmationId ||
    normalizedGroup.id ||
    `draft:${normalizedGroup.email || ""}:${normalizedGroup.phone || ""}`
  );
};

export function upsertConfirmationInList(confirmations, group) {
  const normalizedGroup = normalizeAdminConfirmations([group])[0];
  const normalizedKey = getConfirmationKey(normalizedGroup);
  const existingIndex = confirmations.findIndex((item) => {
    const itemKey = getConfirmationKey(item);

    return normalizedKey ? itemKey === normalizedKey : false;
  });

  if (existingIndex === -1) {
    return normalizeAdminConfirmations([...confirmations, normalizedGroup]);
  }

  return normalizeAdminConfirmations(
    confirmations.map((item, index) =>
      index === existingIndex ? normalizedGroup : item,
    ),
  );
}

export function getDuplicateContactErrors(group, confirmations) {
  const normalizedGroup = Confirmation.normalize(group);
  const targetKey = getConfirmationKey(normalizedGroup);
  const email = normalizedGroup.email.trim().toLowerCase();
  const phone = normalizePhoneForComparison(normalizedGroup.phone);
  const errors = {};

  Confirmation.normalizeList(confirmations).some((confirmation) => {
    if (getConfirmationKey(confirmation) === targetKey) return false;

    const duplicatedEmail =
      email && confirmation.email.trim().toLowerCase() === email;
    const duplicatedPhone =
      phone && normalizePhoneForComparison(confirmation.phone) === phone;

    if (duplicatedEmail) {
      errors.email = adminContent.guests.validation.duplicateEmail;
    }

    if (duplicatedPhone) {
      errors.phone = adminContent.guests.validation.duplicatePhone;
    }

    return duplicatedEmail || duplicatedPhone;
  });

  return errors;
}

function normalizePhoneForComparison(value) {
  return String(value || "").replace(/\D/g, "");
}

export function removeConfirmationFromList(confirmations, target) {
  const targetKey = getConfirmationKey(target);

  return normalizeAdminConfirmations(
    confirmations.filter(
      (group) => group !== target && getConfirmationKey(group) !== targetKey,
    ),
  );
}

export async function persistGuestChanges({
  currentConfirmations,
  password,
  savedConfirmations,
}) {
  const savedByconfirmationName = new Map(
    savedConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const currentByconfirmationName = new Map(
    currentConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const persistencePromises = [];

  savedByconfirmationName.forEach((group, confirmationName) => {
    if (!currentByconfirmationName.has(confirmationName)) {
      persistencePromises.push(
        confirmationRepository.deleteAdmin({
          confirmationId: group.confirmationId || group.id || "",
          password,
        }),
      );
    }
  });

  currentByconfirmationName.forEach((group, confirmationName) => {
    const savedGroup = savedByconfirmationName.get(confirmationName);
    const isCreation = !savedGroup;

    if (!isCreation && !hasJsonChanged(savedGroup, group)) {
      return;
    }

    persistencePromises.push(
      confirmationRepository.saveAdmin({
        confirmation: group,
        method: isCreation ? "POST" : "PUT",
        password,
      }),
    );
  });

  await Promise.all(persistencePromises);
}

export function buildPendingConfirmationChanges(
  savedConfirmations,
  currentConfirmations,
) {
  const savedByconfirmationName = new Map(
    savedConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const currentByconfirmationName = new Map(
    currentConfirmations.map((group) => [getConfirmationKey(group), group]),
  );
  const changes = [];

  currentByconfirmationName.forEach((group, confirmationName) => {
    const savedGroup = savedByconfirmationName.get(confirmationName);

    if (!savedGroup) {
      changes.push({
        details: buildGroupEditorChanges({}, group, {
          isCreation: true,
        }),
        title: adminContent.common.changes.confirmationCreated(
          group.confirmationName ||
            confirmationName ||
            group.email ||
            adminContent.common.fallbacks.unnamed,
        ),
      });
      return;
    }

    if (hasJsonChanged(savedGroup, group)) {
      changes.push({
        details: buildGroupEditorChanges(savedGroup, group, {
          isCreation: false,
        }),
        title: adminContent.common.changes.confirmationEdited(
          getGroupChangeLabel(savedGroup, group),
        ),
      });
    }
  });

  savedByconfirmationName.forEach((group, confirmationName) => {
    if (!currentByconfirmationName.has(confirmationName)) {
      changes.push({
        details: Guest.normalizeList(group.guests, { ensureOne: false }).map(
          (guest, index) =>
            adminContent.common.changes.guestDeleted(
              Guest.getDisplayName(guest, index),
            ),
        ),
        title: adminContent.common.changes.confirmationDeleted(
          group.confirmationName ||
            confirmationName ||
            group.email ||
            adminContent.common.fallbacks.unnamed,
        ),
      });
    }
  });

  return changes;
}

export function buildGroupEditorChanges(
  originalGroup,
  draftGroup,
  { isCreation },
) {
  const original = normalizeAdminGroupBeforeSave(originalGroup, { isCreation });
  const draft = normalizeAdminGroupBeforeSave(draftGroup, { isCreation });
  const contactChanges = [];

  if (isCreation) {
    contactChanges.push(adminContent.common.changes.confirmationNew);
  }

  [
    [
      "confirmationName",
      adminContent.common.changes.contactFields.confirmationName,
    ],
    ["email", adminContent.common.changes.contactFields.email],
    ["phone", adminContent.common.changes.contactFields.phone],
  ].forEach(([field, label]) => {
    if (String(original[field] || "") !== String(draft[field] || "")) {
      contactChanges.push(label);
    }
  });

  const guestChanges = buildGuestEditorChanges(original.guests, draft.guests);
  const changeParts = [];

  if (contactChanges.length) {
    changeParts.push(adminContent.common.changes.contact(contactChanges));
  }

  if (guestChanges.added.length) {
    changeParts.push(adminContent.common.changes.guestsAdded(guestChanges.added));
  }

  if (guestChanges.removed.length) {
    changeParts.push(
      adminContent.common.changes.guestsRemoved(guestChanges.removed),
    );
  }

  if (guestChanges.modified.length) {
    changeParts.push(
      adminContent.common.changes.guestsModified(guestChanges.modified),
    );
  }

  return changeParts.length
    ? changeParts
    : [adminContent.common.changes.noUnsavedChanges];
}

function buildGuestEditorChanges(originalGuests = [], draftGuests = []) {
  const originalGuestsByKey = getGuestsByEditorKey(originalGuests);
  const draftGuestsByKey = getGuestsByEditorKey(draftGuests);
  const changes = {
    added: [],
    modified: [],
    removed: [],
  };

  originalGuestsByKey.forEach((originalGuest, guestKey) => {
    const draftGuest = draftGuestsByKey.get(guestKey);

    if (!draftGuest) {
      changes.removed.push(getGuestChangeLabel(originalGuest, guestKey));
      return;
    }

    if (hasJsonChanged(originalGuest, draftGuest)) {
      changes.modified.push(getGuestChangeLabel(draftGuest, guestKey));
    }
  });

  draftGuestsByKey.forEach((draftGuest, guestKey) => {
    if (!originalGuestsByKey.has(guestKey)) {
      changes.added.push(getGuestChangeLabel(draftGuest, guestKey));
    }
  });

  return changes;
}

function getGuestsByEditorKey(guests = []) {
  const guestKeyCounts = new Map();

  return new Map(
    guests.map((guest, index) => {
      const baseKey = getGuestEditorBaseKey(guest, index);
      const nextCount = (guestKeyCounts.get(baseKey) || 0) + 1;

      guestKeyCounts.set(baseKey, nextCount);

      return [`${baseKey}#${nextCount}`, guest];
    }),
  );
}

function getGuestEditorBaseKey(guest, index) {
  const guestName = Guest.getFullName(guest, "").trim().toLowerCase();

  return guestName || `invitado-${index + 1}`;
}

function getGuestChangeLabel(guest, guestKey) {
  return Guest.getFullName(guest, "") || guestKey.replace(/#\d+$/, "");
}

function getGroupChangeLabel(original, draft) {
  const originalLabel =
    original.confirmationName ||
    original.email ||
    adminContent.common.fallbacks.unnamed;
  const draftLabel =
    draft.confirmationName ||
    draft.email ||
    adminContent.common.fallbacks.unnamed;

  if (originalLabel === draftLabel) return draftLabel;

  return `${originalLabel} -> ${draftLabel}`;
}
