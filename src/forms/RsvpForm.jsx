import { useState } from "react";
import { ArrowLeft, Check, Save, Trash2, UserPlus, X } from "lucide-react";

import ContactDetailsCard from "../components/rsvp/ContactDetailsCard";
import GuestCard from "../components/rsvp/GuestCard";
import { FieldError, FormCard } from "../components/rsvp/FormPrimitives";
import DeleteDialog from "../components/ui/DeleteDialog";
import IconButton from "../components/ui/IconButton";
import PaginatedContent from "../components/ui/PaginatedContent";
import Pagination from "../components/ui/Pagination";
import { MAX_GUESTS } from "../constants/rsvp";
import { rsvpContent } from "../constants/rsvpContent";
import { Guest } from "../models";

const defaultRenderItem = (_index, children) => children;

export default function RsvpForm({
  addText = rsvpContent.form.defaultAddText,
  cancelText = rsvpContent.form.defaultCancelText,
  cancelTo,
  contact,
  deleteContextText = rsvpContent.form.defaultDeleteContext,
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
  submitText = rsvpContent.form.defaultSubmitText,
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
              guests={guests}
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
          <FormCard>
            <p className="section-eyebrow mb-4">
              {rsvpContent.form.actionsEyebrow}
            </p>
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
            </div>
          </FormCard>,
        )}
      </form>

      {guestDeleteTarget && (
        <DeleteDialog
          message={rsvpContent.form.deleteGuestMessage({
            context: deleteContextText,
            guestName: guestDeleteName,
            guestNumber: guestDeleteTarget.index + 1,
          })}
          onCancel={() => setGuestDeleteTarget(null)}
          onConfirm={handleConfirmGuestDelete}
          title={rsvpContent.form.deleteGuestTitle}
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
  guests,
  onGuestChange,
  onGuestPageChange,
  onRemoveGuest,
  totalGuestPages,
  variant,
}) {
  return (
    <FormCard>
      <div className="flex items-center justify-between gap-4">
        <p className={`section-eyebrow ${canRemove ? "mb-0" : ""}`}>
          {rsvpContent.form.guestLabel(currentGuestIndex + 1)}
        </p>

        {canRemove && (
          <IconButton
            icon={<Trash2 size={16} strokeWidth={1.8} />}
            label={rsvpContent.form.removeGuestLabel(currentGuestIndex + 1)}
            onClick={() => onRemoveGuest(currentGuest, currentGuestIndex)}
            tone="danger"
            type="button"
          />
        )}
      </div>

      <PaginatedContent
        allItems={guests}
        direction={direction}
        getKey={(guest, { index }) => `${index}-${Guest.getFullName(guest)}`}
        page={currentGuestPage}
        pageSize={1}
        totalPages={totalGuestPages}
        renderPage={(items, pageNumber) => (
          <GuestCard
            canRemove={false}
            card={false}
            errors={errors}
            guest={items[0]}
            index={pageNumber - 1}
            onGuestChange={onGuestChange}
            onRemoveGuest={() => {}}
            showHeader={false}
            variant={variant}
          />
        )}
      />

      <Pagination
        className="mt-4"
        label={rsvpContent.form.guestPageLabel({
          page: currentGuestPage,
          total: totalGuestPages,
        })}
        nextLabel={rsvpContent.form.next}
        onNext={() => onGuestPageChange(currentGuestPage + 1)}
        onPrev={() => onGuestPageChange(currentGuestPage - 1)}
        page={currentGuestPage}
        previousLabel={rsvpContent.form.previous}
        totalPages={totalGuestPages}
      />
    </FormCard>
  );
}
