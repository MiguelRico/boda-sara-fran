import { useState } from "react";
import { ArrowLeft, Check, Save, Trash2, UserPlus, X } from "lucide-react";

import ContactDetailsCard from "../components/rsvp/ContactDetailsCard";
import GuestCard from "../components/rsvp/GuestCard";
import AdminTableSection from "../components/admin/AdminTableSection";
import { FieldError, FormCard } from "../components/rsvp/FormPrimitives";
import DeleteDialog from "../components/ui/DeleteDialog";
import IconButton from "../components/ui/IconButton";
import PaginatedContent from "../components/ui/PaginatedContent";
import Pagination from "../components/ui/Pagination";
import { MAX_GUESTS } from "../constants/rsvp";
import { adminContent } from "../constants/adminContent";
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
              addText={addText}
              canRemove={guests.length > 1}
              currentGuest={currentGuest}
              currentGuestIndex={currentGuestIndex}
              currentGuestPage={currentGuestPage}
              direction={guestPageDirection}
              errors={errors}
              guests={guests}
              hasInvalidGuest={hasInvalidGuest}
              loading={loading}
              onAddGuest={handleAddGuest}
              onGuestChange={onGuestChange}
              onGuestPageChange={handleGuestPageChange}
              onRemoveGuest={handleRemoveGuest}
              submitIcon={submitIcon}
              submitText={submitText}
              totalGuestPages={totalGuestPages}
              variant={variant}
            />,
          )}

        {formError && <FieldError>{formError}</FieldError>}

        {variant !== "admin" &&
          renderItem(
            2 + guests.length,
            <FormCard>
              <p className="section-eyebrow mb-4">
                {rsvpContent.form.actionsEyebrow}
              </p>
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                <IconButton
                  className="w-full"
                  disabled={loading}
                  icon={cancelIcon}
                  label={cancelText}
                  onClick={onCancel}
                  to={cancelTo}
                  tone="terciary"
                >
                  {cancelText}
                </IconButton>

                {guests.length < MAX_GUESTS && (
                  <IconButton
                    className="w-full"
                    disabled={loading || hasInvalidGuest}
                    icon={addIcon}
                    label={addText}
                    onClick={handleAddGuest}
                    tone="secondary"
                  >
                    {addText}
                  </IconButton>
                )}

                <IconButton
                  className="w-full"
                  disabled={loading}
                  icon={submitIcon}
                  label={submitText}
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
  addText,
  canRemove,
  currentGuest,
  currentGuestIndex,
  currentGuestPage,
  direction,
  errors,
  guests,
  hasInvalidGuest,
  loading,
  onAddGuest,
  onGuestChange,
  onGuestPageChange,
  onRemoveGuest,
  submitIcon,
  submitText,
  totalGuestPages,
  variant,
}) {
  const isAdmin = variant === "admin";
  const pageLabel = rsvpContent.form.guestPageLabel({
    page: currentGuestPage,
    total: totalGuestPages,
  });
  const removeButton = canRemove ? (
    <IconButton
      className="w-full"
      icon={<Trash2 size={16} strokeWidth={1.8} />}
      label={rsvpContent.form.removeGuestLabel(currentGuestIndex + 1)}
      onClick={() => onRemoveGuest(currentGuest, currentGuestIndex)}
      tone="danger"
    />
  ) : null;
  const renderGuestPage = (items, pageNumber, { card = false } = {}) => (
    <GuestCard
      canRemove={false}
      card={card}
      errors={errors}
      guest={items[0]}
      index={pageNumber - 1}
      onGuestChange={onGuestChange}
      onRemoveGuest={() => {}}
      showHeader={false}
      variant={variant}
    />
  );
  const renderAdminGuestPage = (items, pageNumber) => (
    <div className="h-full rounded-[2rem] ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]">
      {renderGuestPage(items, pageNumber, { card: true })}
    </div>
  );

  if (isAdmin) {
    return (
      <AdminTableSection
        actions={
          <div
            className={
              canRemove
                ? "grid w-full grid-cols-3 gap-3 sm:grid-cols-3"
                : "grid w-full grid-cols-2 gap-2 sm:grid-cols-2"
            }
          >
            {removeButton}

            {guests.length < MAX_GUESTS && (
              <IconButton
                className="w-full"
                disabled={loading || hasInvalidGuest}
                icon={<UserPlus size={16} strokeWidth={1.8} />}
                label={addText}
                onClick={onAddGuest}
                tone="secondary"
              >
                {addText}
              </IconButton>
            )}

            <IconButton
              className="w-full"
              disabled={loading}
              icon={submitIcon}
              label={submitText}
              tone="primary"
              type="submit"
            >
              {submitText}
            </IconButton>
          </div>
        }
        eyebrow={adminContent.guests.editor.guestListEyebrow}
        getKey={(_guest, { index }) => index}
        items={guests}
        lockPageHeight={false}
        onNextPage={() => onGuestPageChange(currentGuestPage + 1)}
        onPrevPage={() => onGuestPageChange(currentGuestPage - 1)}
        page={currentGuestPage}
        pageDirection={direction}
        paginationLabel={pageLabel}
        pageSize={1}
        renderPage={renderAdminGuestPage}
        title={adminContent.guests.editor.guestListTitle}
        totalPages={totalGuestPages}
      />
    );
  }

  return (
    <>
      <FormCard>
        <div className="flex items-center justify-between gap-4">
          <p className={`section-eyebrow ${canRemove ? "mb-0" : ""}`}>
            {rsvpContent.form.guestLabel(currentGuestIndex + 1)}
          </p>

          {canRemove && removeButton}
        </div>

        <PaginatedContent
          allItems={guests}
          direction={direction}
          getKey={(_guest, { index }) => index}
          page={currentGuestPage}
          pageSize={1}
          totalPages={totalGuestPages}
          renderPage={renderGuestPage}
        />
      </FormCard>

      <Pagination
        className="mt-5"
        label={pageLabel}
        nextLabel={rsvpContent.form.next}
        onNext={() => onGuestPageChange(currentGuestPage + 1)}
        onPrev={() => onGuestPageChange(currentGuestPage - 1)}
        page={currentGuestPage}
        previousLabel={rsvpContent.form.previous}
        totalPages={totalGuestPages}
      />
    </>
  );
}
