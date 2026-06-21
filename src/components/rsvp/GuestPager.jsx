import { Trash2, UserPlus } from "lucide-react";

import { AdminTableSection } from "../admin/common";
import IconButton from "../ui/IconButton";
import PaginatedContent from "../ui/PaginatedContent";
import Pagination from "../ui/Pagination";
import { MAX_GUESTS } from "../../constants/rsvp";
import { adminContent } from "../../constants/adminContent";
import { rsvpContent } from "../../constants/rsvpContent";
import { Guest } from "../../models";
import GuestCard from "./GuestCard";
import { FormCard } from "./FormPrimitives";

export default function GuestPager({
  addText,
  canAddGuests,
  canRemove,
  currentGuest,
  currentGuestIndex,
  currentGuestPage,
  direction,
  errors,
  guests,
  hasInvalidGuest,
  isMobileView,
  loading,
  onAddGuest,
  onGuestChange,
  onGuestPageChange,
  onRemoveGuest,
  showHeader = true,
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
      guest={items[0] || Guest.create()}
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
    const actionItems = [
      removeButton,
      canAddGuests && guests.length < MAX_GUESTS ? (
        <IconButton
          className="w-full"
          disabled={loading || hasInvalidGuest}
          icon={<UserPlus size={16} strokeWidth={1.8} />}
          key="add"
          label={addText}
          onClick={onAddGuest}
          tone="secondary"
        >
          {addText}
        </IconButton>
      ) : null,
    ].filter(Boolean);

    return (
      <AdminTableSection
        actions={
          actionItems.length ? (
            <div
              className={`grid w-full gap-3 ${
                actionItems.length > 1 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {actionItems}
            </div>
          ) : null
        }
        eyebrow={showHeader ? adminContent.guests.editor.guestListEyebrow : null}
        getKey={(_guest, { index }) => index}
        isMobileView={isMobileView}
        items={guests}
        lockPageHeight={false}
        onNextPage={() => onGuestPageChange(currentGuestPage + 1)}
        onPrevPage={() => onGuestPageChange(currentGuestPage - 1)}
        page={currentGuestPage}
        pageDirection={direction}
        paginationLabel={pageLabel}
        pageSize={1}
        renderPage={renderAdminGuestPage}
        title={showHeader ? adminContent.guests.editor.guestListTitle : null}
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
          renderPage={renderGuestPage}
          totalPages={totalGuestPages}
        />
      </FormCard>

      <Pagination
        className="mt-4"
        isMobileView={isMobileView}
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
