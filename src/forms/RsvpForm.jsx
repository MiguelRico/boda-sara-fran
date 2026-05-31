import { useState } from "react";
import { ArrowLeft, Check, Plus, Save, UserPlus, X } from "lucide-react";

import ContactDetailsCard from "../components/rsvp/ContactDetailsCard";
import GuestCard from "../components/rsvp/GuestCard";
import { FieldError } from "../components/rsvp/FormPrimitives";
import DeleteDialog from "../components/ui/DeleteDialog";
import IconButton from "../components/ui/IconButton";
import { MAX_GUESTS } from "../constants/rsvp";

const defaultRenderItem = (_index, children) => children;
const isBlankValue = (value) => {
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "boolean") return value === false;
  if (value == null) return true;

  return String(value).trim() === "";
};
const isEmptyGuest = (guest) =>
  Object.entries(guest).every(([field, value]) => {
    if (field === "outboundBus" || field === "returnBus") return true;

    return isBlankValue(value);
  });
const isValidGuest = (guest) =>
  Boolean(guest.name?.trim() && guest.lastname?.trim()) &&
  (guest.comments || "").length <= 300;

export default function RsvpForm({
  addText = "Añadir",
  cancelText = "Volver",
  cancelTo,
  contact,
  deleteContextText = "formulario",
  disableContactFields = false,
  errors = {},
  formError = "",
  guests,
  loading = false,
  onAddGuest,
  onCancel,
  onContactChange,
  onGuestChange,
  onRemoveGuest,
  onSubmit,
  renderItem = defaultRenderItem,
  submitText = "Confirmar",
  variant = "public",
}) {
  const [guestDeleteTarget, setGuestDeleteTarget] = useState(null);
  const guestDeleteName = guestDeleteTarget
    ? [guestDeleteTarget.guest.name, guestDeleteTarget.guest.lastname]
        .filter(Boolean)
        .join(" ")
    : "";
  const hasInvalidGuest = guests.some((guest) => !isValidGuest(guest));
  const shouldShowIncompleteGuestMessage =
    hasInvalidGuest &&
    (guests.length > 1 ||
      guests.some((guest) => !isValidGuest(guest) && !isEmptyGuest(guest)));
  const incompleteGuestMessage =
    "Completa nombre y apellidos de todos los invitados antes de añadir otro o enviar el formulario.";
  const addIcon =
    variant === "admin" ? (
      <Plus size={16} strokeWidth={1.8} />
    ) : (
      <UserPlus size={16} strokeWidth={1.8} />
    );
  const submitIcon =
    variant === "admin" ? (
      <Save size={16} strokeWidth={1.8} />
    ) : (
      <Check size={16} strokeWidth={1.8} />
    );
  const cancelIcon =
    variant === "admin" ? (
      <X size={16} strokeWidth={1.8} />
    ) : (
      <ArrowLeft size={16} strokeWidth={1.8} />
    );

  const handleConfirmGuestDelete = () => {
    if (!guestDeleteTarget) return;

    onRemoveGuest(guestDeleteTarget.index);
    setGuestDeleteTarget(null);
  };
  const handleRemoveGuest = (guest, index) => {
    if (isEmptyGuest(guest)) {
      onRemoveGuest(index);
      return;
    }

    setGuestDeleteTarget({ guest, index });
  };
  const handleSubmit = (event) => {
    if (hasInvalidGuest) {
      event.preventDefault();
      return;
    }

    onSubmit(event);
  };

  return (
    <>
      <form className="mt-4 space-y-6" noValidate onSubmit={handleSubmit}>
        {renderItem(
          1,
          <ContactDetailsCard
            contact={contact}
            disableFilledFields={disableContactFields}
            errors={errors}
            onContactChange={onContactChange}
          />,
        )}

        {guests.map((guest, index) =>
          renderItem(
            2 + index,
            <GuestCard
              canRemove={guests.length > 1}
              errors={errors}
              guest={guest}
              index={index}
              key={index}
              onGuestChange={onGuestChange}
              onRemoveGuest={() => handleRemoveGuest(guest, index)}
            />,
          ),
        )}

        {formError && <FieldError>{formError}</FieldError>}
        {shouldShowIncompleteGuestMessage && (
          <FieldError>{incompleteGuestMessage}</FieldError>
        )}

        {renderItem(
          2 + guests.length,
          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-3">
            {guests.length < MAX_GUESTS && (
              <IconButton
                disabled={loading || hasInvalidGuest}
                icon={addIcon}
                label={addText}
                onClick={onAddGuest}
                showText="always"
                tone="secondary"
                type="button"
              >
                {addText}
              </IconButton>
            )}

            <IconButton
              disabled={loading || hasInvalidGuest}
              icon={submitIcon}
              label={submitText}
              showText="always"
              tone="primary"
              type="submit"
            >
              {submitText}
            </IconButton>

            <IconButton
              disabled={loading}
              icon={cancelIcon}
              label={cancelText}
              onClick={onCancel}
              showText="always"
              to={cancelTo}
              tone="secondary"
              type="button"
            >
              {cancelText}
            </IconButton>
          </div>,
        )}
      </form>

      {guestDeleteTarget && (
        <DeleteDialog
          message={
            <>
              Se eliminará{" "}
              {guestDeleteName
                ? `a ${guestDeleteName}`
                : `el invitado ${guestDeleteTarget.index + 1}`}
              . Esta acción no se puede deshacer desde el {deleteContextText}.
            </>
          }
          onCancel={() => setGuestDeleteTarget(null)}
          onConfirm={handleConfirmGuestDelete}
          title="Eliminar invitado"
        />
      )}
    </>
  );
}
