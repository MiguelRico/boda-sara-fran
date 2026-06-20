import { Pencil } from "lucide-react";

import { AdminTableSection } from "../admin/common";
import Chip from "../ui/Chip";
import IconButton from "../ui/IconButton";
import { FormCard } from "./FormPrimitives";
import GuestCard from "./GuestCard";
import { adminContent } from "../../constants/adminContent";
import { rsvpContent } from "../../constants/rsvpContent";
import { Guest } from "../../models";
import {
  getGroupSummaryChips,
  getGuestSummaryChips,
} from "../../utils/rsvpSummaryChips";

export function ContactSummaryCard({ contact, guests, onEdit }) {
  const chips = getGroupSummaryChips(contact, guests);

  return (
    <FormCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow mb-2">
            {rsvpContent.review.contactEyebrow}
          </p>
          <h2 className="font-serif text-3xl text-[var(--color-accent-dark)]">
            {contact.confirmationName || adminContent.common.fallbacks.group}
          </h2>
        </div>
        <IconButton
          icon={<Pencil size={16} strokeWidth={1.8} />}
          label={rsvpContent.review.editContact}
          onClick={onEdit}
          tone="secondary"
          type="button"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {chips.map((chip) => (
          <Chip
            className={chip.className}
            href={chip.href}
            icon={chip.icon}
            key={chip.key}
            strong={chip.strong}
            tone={chip.tone}
            value={chip.value}
            valueClassName={chip.valueClassName}
          />
        ))}
      </div>
    </FormCard>
  );
}

export function MobileActionsPanel({ children, className = "" }) {
  return (
    <div
      className={`mt-0 mb-4 rounded-[1.5rem] border border-[var(--color-border)] bg-white/35 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function MobileRsvpReview({
  contact,
  guests,
  loading,
  onEditContact,
  onEditGuests,
  submitIcon,
  submitText,
}) {
  return (
    <div className="space-y-5">
      <MobileActionsPanel>
        <div className="relative items-center justify-center text-center">
          <p className="section-text mt-0">{rsvpContent.review.intro}</p>
        </div>
        <IconButton
          className="w-full"
          disabled={loading}
          icon={submitIcon}
          label={submitText}
          showText="always"
          tone="primary"
          type="submit"
        >
          {submitText}
        </IconButton>
      </MobileActionsPanel>

      <ContactSummaryCard
        contact={contact}
        guests={guests}
        onEdit={onEditContact}
      />

      <FormCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">
              {rsvpContent.review.guestsEyebrow}
            </p>
            <h2 className="font-serif text-3xl text-[var(--color-accent-dark)]">
              {rsvpContent.review.guestCount(guests.length)}
            </h2>
          </div>
          <IconButton
            icon={<Pencil size={16} strokeWidth={1.8} />}
            label={rsvpContent.review.editGuests}
            onClick={onEditGuests}
            tone="secondary"
            type="button"
          />
        </div>

        <div className="mt-4 grid gap-3">
          {guests.map((guest, index) => (
            <GuestSummaryCard guest={guest} index={index} key={index} />
          ))}
        </div>
      </FormCard>
    </div>
  );
}

export function GuestSummaryCard({ guest, index }) {
  const normalizedGuest = Guest.normalize(guest);
  const fullName = Guest.getDisplayName(normalizedGuest, index);
  const chips = getGuestSummaryChips(normalizedGuest);

  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/45 p-4">
      <p className="section-eyebrow mb-2">
        {rsvpContent.guest.fallbackName(index + 1)}
      </p>
      <h3 className="font-serif text-2xl leading-none text-[var(--color-accent-dark)]">
        {fullName}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {chips.map((chip) => (
          <Chip
            className={chip.className}
            icon={chip.icon}
            key={chip.key}
            strong={chip.strong}
            value={chip.value}
            valueClassName={chip.valueClassName}
          />
        ))}
      </div>
    </div>
  );
}

export function MobileGuestList({
  currentGuestPage,
  errors,
  guestPageDirection,
  guests,
  headerActions,
  isMobileView,
  onGuestChange,
  onGuestPageChange,
  totalPages,
}) {
  const safeTotalPages = Math.max(totalPages || 1, 1);

  return (
    <AdminTableSection
      eyebrow={null}
      getKey={(_guest, { index }) => index}
      headerActions={headerActions}
      isMobileView={isMobileView}
      items={guests}
      lockPageHeight={false}
      mobilePageLabel={adminContent.guests.editor.guestListTitle}
      onNextPage={() => onGuestPageChange(currentGuestPage + 1)}
      onPrevPage={() => onGuestPageChange(currentGuestPage - 1)}
      page={currentGuestPage}
      pageDirection={guestPageDirection}
      paginationInlineWithTitle={!isMobileView}
      paginationLabel={rsvpContent.form.guestPageLabel({
        page: currentGuestPage,
        total: safeTotalPages,
      })}
      pageSize={1}
      renderPage={(items, pageNumber) => (
        <div className="h-full rounded-[2rem] ring-2 ring-[var(--color-accent-dark)] ring-offset-2 ring-offset-[var(--color-bg)]">
          <GuestCard
            canRemove={false}
            card
            errors={errors}
            guest={items[0] || Guest.create()}
            index={pageNumber - 1}
            onGuestChange={onGuestChange}
            onRemoveGuest={() => {}}
            showHeader={false}
            variant="public"
          />
        </div>
      )}
      title={adminContent.guests.editor.guestListTitle}
      totalPages={safeTotalPages}
    />
  );
}
