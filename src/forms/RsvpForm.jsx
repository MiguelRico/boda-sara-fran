import { useState } from "react";
import { ArrowLeft, Check, Save, UserPlus, X } from "lucide-react";

import ContactDetailsCard from "../components/rsvp/ContactDetailsCard";
import GuestCard from "../components/rsvp/GuestCard";
import { FieldError } from "../components/rsvp/FormPrimitives";
import DeleteDialog from "../components/ui/DeleteDialog";
import IconButton from "../components/ui/IconButton";
import { MAX_GUESTS } from "../constants/rsvp";
import { Guest } from "../models";

const defaultRenderItem = (_index, children) => children;

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
    ? Guest.getFullName(guestDeleteTarget.guest)
    : "";
  const hasInvalidGuest = Guest.hasInvalidGuests(guests);
  const shouldShowIncompleteGuestMessage =
    Guest.hasIncompleteVisibleGuests(guests);
  const incompleteGuestMessage =
    "Completa nombre, apellidos y menú de todos los invitados antes de añadir otro o enviar el formulario.";
  const addIcon = <UserPlus size={16} strokeWidth={1.8} />;
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
    if (Guest.isEmpty(guest)) {
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
              variant={variant}
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
            <IconButton
              className="order-3 sm:order-none"
              disabled={loading}
              icon={cancelIcon}
              label={cancelText}
              onClick={onCancel}
              showText="always"
              to={cancelTo}
              tone="terciary"
              type="button"
            >
              {cancelText}
            </IconButton>

            {guests.length < MAX_GUESTS && (
              <IconButton
                className="order-1 sm:order-none"
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
              className="order-2 sm:order-none"
              disabled={loading || hasInvalidGuest}
              icon={submitIcon}
              label={submitText}
              showText="always"
              tone="primary"
              type="submit"
            >
              {submitText}
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
