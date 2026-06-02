import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  UserPlus,
  X,
} from "lucide-react";

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
  const [guestPage, setGuestPage] = useState(1);
  const [guestPageDirection, setGuestPageDirection] = useState(1);
  const guestDeleteName = guestDeleteTarget
    ? Guest.getFullName(guestDeleteTarget.guest)
    : "";
  const totalGuestPages = Math.max(guests.length, 1);
  const currentGuestPage = Math.min(guestPage, totalGuestPages);
  const currentGuestIndex = currentGuestPage - 1;
  const currentGuest = guests[currentGuestIndex];
  const hasInvalidGuest = Guest.hasInvalidGuests(guests);
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

  const handleGuestPageChange = (nextPage) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), totalGuestPages);

    if (clampedPage === currentGuestPage) return;

    setGuestPageDirection(clampedPage > currentGuestPage ? 1 : -1);
    setGuestPage(clampedPage);
  };

  const handleAddGuest = () => {
    onAddGuest();
    setGuestPageDirection(1);
    setGuestPage(Math.min(guests.length + 1, MAX_GUESTS));
  };

  const handleConfirmGuestDelete = () => {
    if (!guestDeleteTarget) return;

    onRemoveGuest(guestDeleteTarget.index);
    setGuestPageDirection(-1);
    setGuestPage((current) =>
      Math.min(current, Math.max(guests.length - 1, 1)),
    );
    setGuestDeleteTarget(null);
  };
  const handleRemoveGuest = (guest, index) => {
    if (Guest.isEmpty(guest)) {
      onRemoveGuest(index);
      setGuestPageDirection(-1);
      setGuestPage((current) =>
        Math.min(current, Math.max(guests.length - 1, 1)),
      );
      return;
    }

    setGuestDeleteTarget({ guest, index });
  };
  const handleSubmit = (event) => {
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

        {currentGuest &&
          renderItem(
            2,
            <GuestPager
              canRemove={guests.length > 1}
              currentGuest={currentGuest}
              currentGuestIndex={currentGuestIndex}
              currentGuestPage={currentGuestPage}
              direction={guestPageDirection}
              errors={errors}
              onGuestChange={onGuestChange}
              onGuestPageChange={handleGuestPageChange}
              onRemoveGuest={handleRemoveGuest}
              totalGuestPages={totalGuestPages}
              variant={variant}
            />,
          )}

        {formError && <FieldError>{formError}</FieldError>}

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
                onClick={handleAddGuest}
                showText="always"
                tone="secondary"
                type="button"
              >
                {addText}
              </IconButton>
            )}

            <IconButton
              className="order-2 sm:order-none"
              disabled={loading}
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

function GuestPager({
  canRemove,
  currentGuest,
  currentGuestIndex,
  currentGuestPage,
  direction,
  errors,
  onGuestChange,
  onGuestPageChange,
  onRemoveGuest,
  totalGuestPages,
  variant,
}) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (pageDirection) => ({
          opacity: 0,
          x: pageDirection > 0 ? 72 : -72,
          filter: "blur(6px)",
        }),
        center: {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
        },
        exit: (pageDirection) => ({
          opacity: 0,
          x: pageDirection > 0 ? -72 : 72,
          filter: "blur(6px)",
        }),
      };

  return (
    <div>
      <div className="relative overflow-hidden">
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            animate="center"
            custom={direction}
            exit="exit"
            initial="enter"
            key={`guest-${currentGuestIndex}`}
            transition={{
              duration: reduceMotion ? 0.18 : 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            variants={variants}
          >
            <GuestCard
              canRemove={canRemove}
              errors={errors}
              guest={currentGuest}
              index={currentGuestIndex}
              onGuestChange={onGuestChange}
              onRemoveGuest={() =>
                onRemoveGuest(currentGuest, currentGuestIndex)
              }
              variant={variant}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center">
          Invitado {currentGuestPage} de {totalGuestPages}
        </p>

        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex">
          <IconButton
            className="w-full sm:w-auto"
            disabled={currentGuestPage === 1}
            icon={<ChevronLeft size={16} strokeWidth={1.8} />}
            label="Anterior"
            onClick={() => onGuestPageChange(currentGuestPage - 1)}
            showText="always"
            tone="secondary"
            type="button"
          >
            Anterior
          </IconButton>
          <IconButton
            className="w-full sm:w-auto"
            disabled={currentGuestPage === totalGuestPages}
            icon={<ChevronRight size={16} strokeWidth={1.8} />}
            label="Siguiente"
            onClick={() => onGuestPageChange(currentGuestPage + 1)}
            showText="always"
            tone="secondary"
            type="button"
          >
            Siguiente
          </IconButton>
        </div>
      </div>
    </div>
  );
}
