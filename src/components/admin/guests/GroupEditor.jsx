import { useMemo, useState } from "react";

import { EditorDialog as AdminEditorDialog } from "../common";
import CinematicStaggeredRevealItem from "../../cinematic/CinematicStaggeredRevealItem";
import DeleteDialog from "../../ui/DeleteDialog";
import StatusDialog from "../../ui/StatusDialog";
import RsvpForm from "../../../forms/RsvpForm";
import { MAX_GUESTS } from "../../../constants/rsvp";
import { adminContent } from "../../../constants/adminContent";
import { rsvpContent } from "../../../constants/rsvpContent";
import { Confirmation, Guest } from "../../../models";
import { buildGroupEditorChanges } from "../../../services/guestsService";
import { normalizeAdminGroupBeforeSave } from "../../../utils/drafts";
import { getStableJson } from "../../../utils/objectSnapshot";
import { mergeSingleGuestIntoGroup } from "../../../utils/guestPageUtils";
import {
  validateRsvpContact,
  validateRsvpForm,
} from "../../../utils/rsvpValidation";

export default function GroupEditor({
  group,
  guestIndex = null,
  isCreation,
  mode = "full",
  onClose,
  onSave,
  validateUniqueContact = () => ({}),
}) {
  const isNewGuestMode = mode === "newGuest";
  const isSingleGuestMode = mode === "guest" || isNewGuestMode;
  const initialDraft = useMemo(
    () =>
      isSingleGuestMode
        ? {
            ...group,
            guests: [group.guests?.[guestIndex] || Guest.create()],
          }
        : group,
    [group, guestIndex, isSingleGuestMode],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState({});
  const [validationPopupOpen, setValidationPopupOpen] = useState(false);
  const [unsavedChangesOpen, setUnsavedChangesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedDraftSnapshot = useMemo(
    () =>
      getStableJson(
        normalizeAdminGroupBeforeSave(initialDraft, { isCreation }),
      ),
    [initialDraft, isCreation],
  );
  const currentDraftSnapshot = useMemo(
    () => getStableJson(normalizeAdminGroupBeforeSave(draft, { isCreation })),
    [draft, isCreation],
  );
  const hasUnsavedChanges = savedDraftSnapshot !== currentDraftSnapshot;
  const pendingChanges = useMemo(
    () => buildGroupEditorChanges(group, draft, { isCreation }),
    [draft, group, isCreation],
  );
  const renderFormItem = (index, children) => (
    <CinematicStaggeredRevealItem index={index} isVisible key={index}>
      {children}
    </CinematicStaggeredRevealItem>
  );
  const isGuestListMode = mode === "guests" || isSingleGuestMode;
  const isGroupMode = mode === "group";
  const dialogTitle = isSingleGuestMode
    ? isNewGuestMode
      ? adminContent.guests.dialogs.guestCreateTitle
      : adminContent.guests.dialogs.guestEditorTitle
    : isGuestListMode
      ? adminContent.guests.dialogs.guestListEditorTitle
      : isCreation
        ? adminContent.guests.dialogs.groupCreateTitle
        : adminContent.guests.dialogs.groupEditorTitle;

  const handleRequestClose = () => {
    if (saving) return;

    if (hasUnsavedChanges) {
      setUnsavedChangesOpen(true);
      return;
    }

    onClose();
  };

  const handleDiscardChanges = () => {
    setUnsavedChangesOpen(false);
    onClose();
  };

  const updateContact = (field, value) => {
    setDraft((current) =>
      Confirmation.withUpdatedContact(current, field, value),
    );
  };

  const updateGuest = (index, field, value) => {
    setDraft((current) =>
      Confirmation.withUpdatedGuest(current, index, field, value),
    );
  };

  const addGuest = () => {
    setDraft((current) =>
      Confirmation.withAddedGuest(current, { maxGuests: MAX_GUESTS }),
    );
  };

  const removeGuest = (index) => {
    setDraft((current) => Confirmation.withRemovedGuest(current, index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasUnsavedChanges) return;

    const groupDraft = isGroupMode
      ? {
          ...draft,
          guests: isCreation
            ? []
            : Guest.normalizeList(group.guests, { ensureOne: false }),
        }
      : draft;
    const groupToSave = normalizeAdminGroupBeforeSave(groupDraft, {
      isCreation,
    });
    const validationErrors = isGroupMode
      ? validateRsvpContact(groupToSave)
      : validateRsvpForm({
          contact: groupToSave,
          guests: groupToSave.guests,
        });
    const duplicateErrors = validateUniqueContact(groupToSave);
    const allValidationErrors = {
      ...validationErrors,
      ...duplicateErrors,
    };

    if (Object.keys(allValidationErrors).length) {
      setErrors(allValidationErrors);
      setValidationPopupOpen(true);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      await onSave(
        isSingleGuestMode
          ? mergeSingleGuestIntoGroup(group, groupToSave.guests[0], guestIndex)
          : groupToSave,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminEditorDialog
      onClose={handleRequestClose}
      title={dialogTitle}
      titleId="group-editor-title"
    >
      <RsvpForm
        addText={rsvpContent.form.addGuestText}
        canAddGuests={!isSingleGuestMode}
        cancelText={rsvpContent.form.defaultCancelText}
        contact={draft}
        deleteContextText="editor"
        disableContactFields={{ confirmationName: !isCreation }}
        errors={errors}
        guests={draft.guests}
        loading={saving}
        onAddGuest={addGuest}
        onCancel={handleRequestClose}
        onContactChange={updateContact}
        onGuestChange={updateGuest}
        onRemoveGuest={removeGuest}
        onSubmit={handleSubmit}
        renderItem={renderFormItem}
        showEntityHeader={false}
        showContactDetails={!isGuestListMode}
        showGuestList={!isGroupMode}
        submitDisabled={!hasUnsavedChanges}
        submitText={rsvpContent.form.reviewAdminSubmitText}
        variant="admin"
      />

      <StatusDialog
        closeText={adminContent.guests.dialogs.close}
        eyebrow={adminContent.guests.dialogs.warningEyebrow}
        message={adminContent.guests.dialogs.validationMessage}
        onClose={() => setValidationPopupOpen(false)}
        open={validationPopupOpen}
        title={adminContent.guests.dialogs.validationTitle}
        type="error"
      />

      {unsavedChangesOpen && (
        <DeleteDialog
          confirmText={adminContent.guests.dialogs.discardChanges}
          message={adminContent.guests.dialogs.unsavedMessage}
          onCancel={() => setUnsavedChangesOpen(false)}
          onConfirm={handleDiscardChanges}
          title={adminContent.guests.dialogs.unsavedTitle}
        >
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-left text-sm text-[var(--color-muted)]">
            {pendingChanges.map((change, index) => (
              <li
                className="rounded-2xl border border-[var(--color-border)] bg-white/45 px-4 py-3"
                key={`${change}-${index}`}
              >
                {change}
              </li>
            ))}
          </ul>
        </DeleteDialog>
      )}
    </AdminEditorDialog>
  );
}
